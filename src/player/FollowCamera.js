import * as THREE from 'three';
import { clamp, damp } from '../core/MathUtil.js';
import { SEE_THROUGH } from '../core/Collision.js';

// Cámara de exploración en tercera persona: seguimiento suave, colisión con paredes, zoom.
export class FollowCamera {
  constructor(game, camera) {
    this.game = game; this.camera = camera;
    this.yaw = 0; this.pitch = 0.18; this.dist = game.settings.data.cameraDistance; this.curDist = this.dist;
    this.target = new THREE.Vector3(); this.smoothTarget = new THREE.Vector3(); this.shoulder = 0.45;
  }
  snap(player) { this.yaw = player.yaw; this.smoothTarget.copy(player.pos).add(new THREE.Vector3(0, 1.55, 0)); }
  update(dt, input, player, allowLook) {
    if (allowLook) {
      const d = input.lookDelta(dt);
      this.yaw -= d.dx; this.pitch = clamp(this.pitch + d.dy, -0.6, 1.1);
      if (input.mouse.wheel && !player.cameraEquipped) this.dist = clamp(this.dist + input.mouse.wheel * 0.4, 1.6, 7);
    }
    const h = player.crouch ? 1.05 : 1.55;
    this.target.copy(player.pos).add(new THREE.Vector3(0, h, 0));
    this.smoothTarget.x = damp(this.smoothTarget.x, this.target.x, 14, dt);
    this.smoothTarget.y = damp(this.smoothTarget.y, this.target.y, 8, dt);
    this.smoothTarget.z = damp(this.smoothTarget.z, this.target.z, 14, dt);
    const dir = new THREE.Vector3(-Math.sin(this.yaw) * Math.cos(this.pitch), Math.sin(this.pitch), -Math.cos(this.yaw) * Math.cos(this.pitch));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const pivot = this.smoothTarget.clone().addScaledVector(right, -this.shoulder);
    // Colisión de cámara: acortar el brazo si hay una pared en medio
    const hit = this.game.collision.raycast(pivot.x, pivot.y, pivot.z, dir.x, dir.y, dir.z, this.dist + 0.3, SEE_THROUGH);
    const want = Math.max(0.6, Math.min(this.dist, hit - 0.3));
    this.curDist = want < this.curDist ? want : damp(this.curDist, want, 4, dt);
    const pos = pivot.clone().addScaledVector(dir, this.curDist);
    pos.y = Math.max(pos.y, 0.3);
    this.camera.position.copy(pos);
    this.camera.lookAt(pivot.x, pivot.y + 0.1, pivot.z);
    const fov = this.game.settings.data.fov + (player.speed > 5 ? 6 : 0);
    if (Math.abs(this.camera.fov - fov) > 0.05) { this.camera.fov = damp(this.camera.fov, fov, 5, dt); this.camera.updateProjectionMatrix(); }
  }
  // Yaw de "hacia dónde mira la cámara" para que W avance en esa dirección.
  get moveYaw() { return this.yaw; }
}
