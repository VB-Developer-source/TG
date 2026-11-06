import * as THREE from "three";

export interface CameraPose {
  position: THREE.Vector3;
  target: THREE.Vector3;
}

export interface CameraLimits {
  min: THREE.Vector3;
  max: THREE.Vector3;
}

/**
 * A camera behaviour (menu cinematic, free dev camera, and later the cab and
 * third-person train views). A mode only writes the pose it wants; the
 * CameraSystem smooths, limits and applies it.
 */
export interface CameraMode {
  readonly id: string;
  /** Damping rate (1/s) used to chase this mode's desired pose. */
  readonly smoothing: number;
  enter(current: Readonly<CameraPose>): void;
  update(dt: number, desired: CameraPose): void;
  exit(): void;
  dispose(): void;
}

export class CameraSystem {
  readonly camera = new THREE.PerspectiveCamera(55, 1, 0.1, 4000);
  readonly limits: CameraLimits = {
    min: new THREE.Vector3(-100000, 0.5, -100000),
    max: new THREE.Vector3(100000, 600, 100000),
  };

  private readonly modes = new Map<string, CameraMode>();
  private active: CameraMode | null = null;
  private readonly current: CameraPose = {
    position: new THREE.Vector3(6, 2, 150),
    target: new THREE.Vector3(5, 1.8, 0),
  };
  private readonly desired: CameraPose = {
    position: this.current.position.clone(),
    target: this.current.target.clone(),
  };
  private snapNext = false;

  constructor() {
    this.apply();
  }

  get activeModeId(): string | null {
    return this.active?.id ?? null;
  }

  get pose(): Readonly<CameraPose> {
    return this.current;
  }

  register(mode: CameraMode): void {
    this.modes.set(mode.id, mode);
  }

  setMode(id: string, options: { snap?: boolean } = {}): void {
    const mode = this.modes.get(id);
    if (!mode) throw new Error(`Unknown camera mode "${id}"`);
    if (mode === this.active) return;
    this.active?.exit();
    this.active = mode;
    mode.enter(this.current);
    this.snapNext = options.snap ?? false;
  }

  setAspect(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  setFar(far: number): void {
    this.camera.far = far;
    this.camera.updateProjectionMatrix();
  }

  clamp(position: THREE.Vector3): THREE.Vector3 {
    return position.clamp(this.limits.min, this.limits.max);
  }

  update(dt: number): void {
    if (!this.active) return;
    this.active.update(dt, this.desired);
    this.clamp(this.desired.position);
    if (this.snapNext) {
      this.current.position.copy(this.desired.position);
      this.current.target.copy(this.desired.target);
      this.snapNext = false;
    } else {
      const k = 1 - Math.exp(-this.active.smoothing * dt);
      this.current.position.lerp(this.desired.position, k);
      this.current.target.lerp(this.desired.target, k);
    }
    this.apply();
  }

  dispose(): void {
    this.active?.exit();
    this.active = null;
    this.modes.forEach((mode) => mode.dispose());
    this.modes.clear();
  }

  private apply(): void {
    this.camera.position.copy(this.current.position);
    this.camera.lookAt(this.current.target);
  }
}
