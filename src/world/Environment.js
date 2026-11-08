import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { kelvinToRGB } from '../core/MathUtil.js';

/*
 * Ambiente: hora del día, clima, iluminación y lluvia.
 * Además expone parámetros físicos que usa la simulación fotográfica:
 *  - sceneEV: valor de exposición (EV100) correcto para la escena.
 *  - lightK: temperatura de color de la luz dominante.
 */
export const TIME_PRESETS = {
  day: { label: 'Tarde soleada', sunElev: 48, sunAz: 205, sunK: 5600, sunI: 3.2, hemiI: 1.25, ev: 14.6, exposure: 0.62, fog: 0xbfd3e6, turbidity: 6, rayleigh: 1.2 },
  sunset: { label: 'Atardecer', sunElev: 7, sunAz: 255, sunK: 3600, sunI: 2.4, hemiI: 0.8, ev: 11.6, exposure: 0.85, fog: 0xe0b38f, turbidity: 9, rayleigh: 2.6 },
  night: { label: 'Noche', sunElev: -20, sunAz: 240, sunK: 5200, sunI: 0, hemiI: 0.12, ev: 9.4, exposure: 1.05, fog: 0x101622, turbidity: 2, rayleigh: 0.3 },
};
export const WEATHER_PRESETS = {
  clear: { label: 'Despejado', evShift: 0, cloud: 0, rain: 0 },
  cloudy: { label: 'Nublado', evShift: -1.6, cloud: 0.7, rain: 0 },
  rain: { label: 'Lluvia', evShift: -2.4, cloud: 1, rain: 1 },
};

export class Environment {
  constructor(game) {
    this.game = game; this.scene = game.scene;
    this.group = new THREE.Group(); this.scene.add(this.group);
    this.sky = new Sky(); this.sky.scale.setScalar(4000); this.group.add(this.sky);
    this.sun = new THREE.DirectionalLight(0xffffff, 3);
    this.sun.castShadow = true; this.sun.shadow.bias = -0.0004; this.sun.shadow.normalBias = 0.03;
    this.group.add(this.sun); this.group.add(this.sun.target);
    this.hemi = new THREE.HemisphereLight(0xbfd8ff, 0x5a5040, 0.8); this.group.add(this.hemi);
    this.flood = []; this.floodGroup = new THREE.Group(); this.group.add(this.floodGroup);
    this.rain = null; this.time = 'day'; this.weather = 'clear';
    this.shadowCenter = new THREE.Vector3();
  }
  configure(time, weather, stadiumLights = []) {
    this.time = time; this.weather = weather;
    const T = TIME_PRESETS[time], W = WEATHER_PRESETS[weather];
    const q = this.game.settings.q;
    // Cielo físico
    const u = this.sky.material.uniforms;
    u.turbidity.value = T.turbidity + W.cloud * 8; u.rayleigh.value = T.rayleigh * (1 - W.cloud * 0.6);
    u.mieCoefficient.value = 0.005 + W.cloud * 0.02; u.mieDirectionalG.value = 0.8;
    const phi = THREE.MathUtils.degToRad(90 - T.sunElev), theta = THREE.MathUtils.degToRad(T.sunAz);
    this.sunDir = new THREE.Vector3().setFromSphericalCoords(1, phi, theta);
    u.sunPosition.value.copy(this.sunDir);
    this.sky.visible = time !== 'night';
    this.scene.background = time === 'night' ? new THREE.Color(0x05080f) : null;
    // Sol
    const sunRGB = kelvinToRGB(T.sunK);
    const cloudDim = 1 - W.cloud * 0.75;
    this.sun.color.setRGB(sunRGB[0], sunRGB[1], sunRGB[2]).multiplyScalar(1 / Math.max(...sunRGB));
    this.sun.intensity = T.sunI * cloudDim;
    this.hemi.intensity = T.hemiI * (1 + W.cloud * 0.25);
    this.hemi.color.set(time === 'sunset' ? 0xffc9a0 : time === 'night' ? 0x4a5a80 : 0xbfd8ff);
    if (W.cloud > 0.5) this.hemi.color.lerp(new THREE.Color(0xc8ccd2), 0.6);
    // Luces de estadio (noche, o encendidas parcialmente al atardecer/lluvia)
    this.floodGroup.clear(); this.flood = [];
    const floodOn = time === 'night' || (time === 'sunset') || weather === 'rain';
    this.lightK = time === 'night' ? 5200 : weather !== 'clear' ? 6200 : T.sunK;
    if (floodOn && stadiumLights.length) {
      const fK = kelvinToRGB(5200), fc = new THREE.Color(fK[0], fK[1], fK[2]).multiplyScalar(1 / Math.max(...fK));
      const per = time === 'night' ? 2.4 : 0.8;
      for (const p of stadiumLights) {
        const s = new THREE.SpotLight(fc, per * 900, 260, 0.62, 0.6, 1.6);
        s.position.copy(p); s.target.position.set(p.x * 0.1, 0, p.z * 0.1);
        s.castShadow = false;
        this.floodGroup.add(s); this.floodGroup.add(s.target); this.flood.push(s);
      }
      if (time === 'night') {
        // La "luna" de sombras: una direccional que simula la suma de los focos.
        this.sun.color.copy(fc); this.sun.intensity = 1.6;
        this.sunDir = new THREE.Vector3(0.35, 1, 0.45).normalize();
      }
    }
    this.sceneEV = T.ev + W.evShift * (time === 'night' ? 0.25 : 1);
    if (time === 'night') this.sceneEV = (stadiumLights.length > 6 ? 9.8 : 9.2) + (weather === 'rain' ? -0.4 : 0);
    this.exposure = T.exposure * Math.pow(2, -W.evShift * (time === 'night' ? 0.05 : 0.18));
    this.scene.fog = new THREE.Fog(W.cloud > 0.5 ? (time === 'night' ? 0x0d1118 : 0x9aa3ab) : T.fog, weather === 'rain' ? 60 : 160, weather === 'rain' ? 420 : 900);
    // Sombras
    this.sun.castShadow = q.shadows > 0;
    this.sun.shadow.mapSize.set(q.shadowSize, q.shadowSize);
    const cam = this.sun.shadow.camera; const ext = 90;
    cam.left = -ext; cam.right = ext; cam.top = ext; cam.bottom = -ext; cam.near = 1; cam.far = 500; cam.updateProjectionMatrix();
    if (this.sun.shadow.map) { this.sun.shadow.map.dispose(); this.sun.shadow.map = null; }
    // Lluvia
    if (this.rain) { this.group.remove(this.rain); this.rain.geometry.dispose(); this.rain = null; }
    if (W.rain > 0) this.rain = this.makeRain();
    this.wet = W.rain > 0;
    this.game.renderer.toneMappingExposure = this.exposure;
  }
  makeRain() {
    const N = 9000, pos = new Float32Array(N * 6), seed = new Float32Array(N * 2);
    for (let i = 0; i < N; i++) {
      const x = (Math.random() - 0.5) * 80, y = Math.random() * 40, z = (Math.random() - 0.5) * 80;
      pos.set([x, y, z, x + 0.02, y - 0.55, z + 0.05], i * 6);
      seed[i * 2] = seed[i * 2 + 1] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, fog: false,
      uniforms: { uTime: { value: 0 }, uCenter: { value: new THREE.Vector3() }, uColor: { value: new THREE.Color(0xaabbcc) } },
      vertexShader: `attribute float seed; uniform float uTime; uniform vec3 uCenter; varying float vA;
        void main(){ vec3 p = position; float fall = mod(p.y - uTime * (16.0 + seed*6.0), 40.0);
          p.y = fall; p.x = mod(p.x - uCenter.x + 40.0, 80.0) - 40.0 + uCenter.x; p.z = mod(p.z - uCenter.z + 40.0, 80.0) - 40.0 + uCenter.z;
          p.y += uCenter.y - 10.0; vA = 0.25 + seed*0.35;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
      fragmentShader: `uniform vec3 uColor; varying float vA; void main(){ gl_FragColor = vec4(uColor, vA); }`,
    });
    const rain = new THREE.LineSegments(g, m); rain.frustumCulled = false; this.group.add(rain);
    return rain;
  }
  update(dt, cameraPos, time) {
    // Sombra centrada cerca de la cámara para mantener resolución útil.
    const c = this.shadowCenter.set(Math.round(cameraPos.x / 8) * 8, 0, Math.round(cameraPos.z / 8) * 8);
    this.sun.target.position.copy(c);
    this.sun.position.copy(c).addScaledVector(this.sunDir.y > 0.05 ? this.sunDir : new THREE.Vector3(0.3, 1, 0.4).normalize(), 200);
    if (this.rain) { this.rain.material.uniforms.uTime.value = time; this.rain.material.uniforms.uCenter.value.copy(cameraPos); }
  }
}
