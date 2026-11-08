import * as THREE from 'three';
import { Humanoid, SKIN_TONES, HAIR_COLORS } from '../characters/Humanoid.js';
import { numberTexture } from '../gfx/Textures.js';
import { dampAngle } from '../core/MathUtil.js';

export class Footballer {
  constructor(scene, team, teamIdx, info, role, slot) {
    this.team = teamIdx; this.teamData = team; this.info = info; this.role = role; this.slot = slot;
    this.number = info.number; this.name = info.surname;
    const gk = role === 'GK';
    const shirt = gk ? team.gk.shirt : team.colors.primary;
    const tex = numberTexture(info.number, info.surname, shirt, gk ? '#ffffff' : team.colors.ink);
    this.h = new Humanoid({
      skin: SKIN_TONES[info.skin], hair: HAIR_COLORS[info.hair], shirt, shorts: gk ? team.gk.shorts : team.colors.shorts,
      socks: gk ? team.gk.shorts : team.colors.socks, boots: ['#111111', '#f5f5f5', '#ff5722', '#00b0ff', '#ffeb3b'][info.number % 5],
      numberTex: tex, height: info.height, gloves: gk ? '#e0e0e0' : null, longSleeves: gk, bald: info.hair === 5 && info.skin > 4,
    });
    this.root = this.h.root; scene.add(this.root);
    this.pos = new THREE.Vector3(); this.vel = new THREE.Vector3(); this.yaw = 0;
    this.target = new THREE.Vector3(); this.lock = 0; this.fallenT = 0; this.decisionT = Math.random(); this.tackleCD = 0;
    this.pendingKick = null; this.mode = 'play'; this.stamina = 1; this.sentOff = false; this.yellow = 0;
    this.maxSpeed = (role === 'GK' ? 6.2 : 7.4) * (team.style?.pace || 1) * (0.94 + Math.random() * 0.1);
    this.skill = 0.5 + Math.random() * 0.4; this.anim = 'loco';
    this.root.traverse((o) => { if (o.isMesh) o.userData.footballer = this; });
  }
  place(x, z, yaw) { this.pos.set(x, 0, z); this.vel.set(0, 0, 0); this.yaw = yaw; this.sync(0); }
  moveToward(tx, tz, speed, dt, accel = 8) {
    const dx = tx - this.pos.x, dz = tz - this.pos.z, d = Math.hypot(dx, dz);
    let desired = d > 0.25 ? Math.min(speed, d * 1.6) : 0;
    const vx = d > 1e-3 ? (dx / d) * desired : 0, vz = d > 1e-3 ? (dz / d) * desired : 0;
    const k = 1 - Math.exp(-accel * dt);
    this.vel.x += (vx - this.vel.x) * k; this.vel.z += (vz - this.vel.z) * k;
    return d;
  }
  faceToward(x, z, dt, rate = 8) { this.yaw = dampAngle(this.yaw, Math.atan2(x - this.pos.x, z - this.pos.z), rate, dt); }
  playAnim(name, dur, side = 1) { this.h.play(name, dur, side); this.anim = name; this.lock = dur; }
  integrate(dt) {
    this.pos.x += this.vel.x * dt; this.pos.z += this.vel.z * dt;
    const sp = Math.hypot(this.vel.x, this.vel.z);
    if (sp > 0.6 && this.lock <= 0 && this.mode !== 'fallen') this.yaw = dampAngle(this.yaw, Math.atan2(this.vel.x, this.vel.z), 9, dt);
  }
  sync(dt) {
    this.root.position.copy(this.pos); this.root.rotation.y = this.yaw;
    const sp = Math.hypot(this.vel.x, this.vel.z);
    if (this.lock > 0) { this.lock -= dt; if (this.lock <= 0 && ['kick', 'header', 'slide', 'throw', 'catch'].includes(this.anim)) { this.h.play(this.role === 'GK' ? 'gkReady' : 'loco'); this.anim = 'loco'; } }
    if (this.lock <= 0 && this.mode === 'play' && this.role === 'GK' && this.anim !== 'gkReady' && this.anim !== 'dive') { this.h.play(sp < 1.5 ? 'gkReady' : 'loco'); this.anim = sp < 1.5 ? 'gkReady' : 'loco'; }
    if (this.role === 'GK' && this.anim === 'gkReady' && sp >= 2.5) { this.h.play('loco'); this.anim = 'loco'; }
    this.h.update(dt, sp);
  }
  get isActing() { return this.lock > 0; }
}
