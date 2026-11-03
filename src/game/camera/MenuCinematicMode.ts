import * as THREE from "three";
import type { CameraMode, CameraPose } from "../core/Camera";

interface Shot {
  from: THREE.Vector3;
  to: THREE.Vector3;
  target: THREE.Vector3;
  duration: number;
}

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/**
 * Slow drifting shots for the main menu. Shot order is chosen so the glide
 * between shots never passes through the canopy roof or the footbridge.
 */
const SHOTS: Shot[] = [
  { from: v(6, 2.0, 150), to: v(6, 2.1, 124), target: v(4.6, 1.9, 0), duration: 11 },
  { from: v(12.0, 1.9, -36), to: v(12.0, 2.1, -68), target: v(3.5, 2.6, 12), duration: 10 },
  { from: v(19, 17, -168), to: v(16, 14, -142), target: v(0, 3, -60), duration: 10 },
  { from: v(-16, 12, 62), to: v(-16, 11, 32), target: v(1, 2, -24), duration: 10 },
];

const shotAt = (index: number): Shot => SHOTS[index % SHOTS.length] as Shot;

export class MenuCinematicMode implements CameraMode {
  readonly id = "menu";
  readonly smoothing = 0.85;
  private index = 0;
  private elapsed = 0;

  enter(): void {
    this.elapsed = 0;
  }

  update(dt: number, desired: CameraPose): void {
    this.elapsed += dt;
    let shot = shotAt(this.index);
    if (this.elapsed > shot.duration) {
      this.elapsed = 0;
      this.index = (this.index + 1) % SHOTS.length;
      shot = shotAt(this.index);
    }
    const t = this.elapsed / shot.duration;
    const eased = t * t * (3 - 2 * t);
    desired.position.lerpVectors(shot.from, shot.to, eased);
    desired.target.copy(shot.target);
  }

  exit(): void {}

  dispose(): void {}
}
