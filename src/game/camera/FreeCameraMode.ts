import * as THREE from "three";
import type { CameraLimits, CameraMode, CameraPose } from "../core/Camera";

/** Free-fly development camera feel. */
export const FREE_CAMERA = {
  moveSpeed: 12,
  fastMultiplier: 3.5,
  lookSpeed: 0.0032,
  pitchLimit: 1.45,
  wheelStep: 0.02,
  pinchStep: 0.06,
} as const;

export interface VirtualMove {
  forward: number;
  right: number;
  up: number;
}

const KEY_BINDINGS: Record<string, keyof VirtualMove | "-forward" | "-right" | "-up"> = {
  KeyW: "forward",
  ArrowUp: "forward",
  KeyS: "-forward",
  ArrowDown: "-forward",
  KeyD: "right",
  ArrowRight: "right",
  KeyA: "-right",
  ArrowLeft: "-right",
  KeyE: "up",
  KeyQ: "-up",
};

/**
 * WASD / arrows to fly, drag to look, wheel or pinch to dolly, Q/E for
 * height, Shift for speed. Movement is relative to where the camera looks.
 */
export class FreeCameraMode implements CameraMode {
  readonly id = "free";
  readonly smoothing = 14;

  private yaw = 0;
  private pitch = 0;
  private readonly position = new THREE.Vector3();
  private readonly forward = new THREE.Vector3();
  private readonly right = new THREE.Vector3();
  private readonly move = new THREE.Vector3();
  private readonly keys = new Set<string>();
  private readonly pointers = new Map<number, { x: number; y: number }>();
  private pinchDistance = 0;
  private dolly = 0;
  private virtual: VirtualMove = { forward: 0, right: 0, up: 0 };
  private active = false;

  constructor(
    private readonly element: HTMLElement,
    private readonly getSensitivity: () => number,
    private readonly limits: CameraLimits,
  ) {}

  setVirtualMove(move: VirtualMove): void {
    this.virtual = move;
  }

  teleport(pos: THREE.Vector3, target?: THREE.Vector3): void {
    this.position.copy(pos);
    if (target) {
      this.forward.subVectors(target, pos).normalize();
      this.yaw = Math.atan2(this.forward.x, this.forward.z);
      this.pitch = Math.asin(THREE.MathUtils.clamp(this.forward.y, -1, 1));
    }
  }

  enter(current: Readonly<CameraPose>): void {
    this.position.copy(current.position);
    this.forward.subVectors(current.target, current.position).normalize();
    this.yaw = Math.atan2(this.forward.x, this.forward.z);
    this.pitch = Math.asin(THREE.MathUtils.clamp(this.forward.y, -1, 1));
    this.active = true;
    this.element.style.cursor = "grab";
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);
    this.element.addEventListener("pointerdown", this.onPointerDown);
    window.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("pointerup", this.onPointerUp);
    window.addEventListener("pointercancel", this.onPointerUp);
    window.addEventListener("wheel", this.onWheel, { passive: false });
  }

  update(dt: number, desired: CameraPose): void {
    const cp = Math.cos(this.pitch);
    this.forward.set(Math.sin(this.yaw) * cp, Math.sin(this.pitch), Math.cos(this.yaw) * cp);
    this.right.set(-Math.cos(this.yaw), 0, Math.sin(this.yaw));

    let f = this.virtual.forward;
    let r = this.virtual.right;
    let u = this.virtual.up;
    for (const code of this.keys) {
      const binding = KEY_BINDINGS[code];
      if (binding === "forward") f += 1;
      else if (binding === "-forward") f -= 1;
      else if (binding === "right") r += 1;
      else if (binding === "-right") r -= 1;
      else if (binding === "up") u += 1;
      else if (binding === "-up") u -= 1;
    }
    this.move.set(0, 0, 0).addScaledVector(this.forward, f).addScaledVector(this.right, r);
    this.move.y += u;
    if (this.move.lengthSq() > 1) this.move.normalize();

    const fast = this.keys.has("ShiftLeft") || this.keys.has("ShiftRight") || this.keys.has("Shift");
    const speed = FREE_CAMERA.moveSpeed * (fast ? FREE_CAMERA.fastMultiplier : 1);
    this.position.addScaledVector(this.move, speed * dt);
    if (this.dolly !== 0) {
      this.position.addScaledVector(this.forward, this.dolly);
      this.dolly = 0;
    }
    this.position.clamp(this.limits.min, this.limits.max);

    desired.position.copy(this.position);
    desired.target.copy(this.position).add(this.forward);
  }

  exit(): void {
    if (!this.active) return;
    this.active = false;
    this.keys.clear();
    this.pointers.clear();
    this.virtual = { forward: 0, right: 0, up: 0 };
    this.element.style.cursor = "";
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onBlur);
    this.element.removeEventListener("pointerdown", this.onPointerDown);
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerup", this.onPointerUp);
    window.removeEventListener("pointercancel", this.onPointerUp);
    window.removeEventListener("wheel", this.onWheel);
  }

  dispose(): void {
    this.exit();
  }

  private look(dx: number, dy: number): void {
    const speed = FREE_CAMERA.lookSpeed * this.getSensitivity();
    this.yaw -= dx * speed;
    this.pitch = THREE.MathUtils.clamp(this.pitch - dy * speed, -FREE_CAMERA.pitchLimit, FREE_CAMERA.pitchLimit);
  }

  private onKeyDown = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    if (target && (target.tagName === "INPUT" || target.isContentEditable)) return;

    // Check code or key
    const code = event.code;
    const key = event.key.toLowerCase();
    if (KEY_BINDINGS[code]) {
      this.keys.add(code);
    } else if (key === "w") this.keys.add("KeyW");
    else if (key === "s") this.keys.add("KeyS");
    else if (key === "a") this.keys.add("KeyA");
    else if (key === "d") this.keys.add("KeyD");
    else if (key === "q") this.keys.add("KeyQ");
    else if (key === "e") this.keys.add("KeyE");
    else if (key === " " || key === "spacebar") this.keys.add("KeyE");

    if (code.startsWith("Shift") || key === "shift") {
      this.keys.add("Shift");
    }

    if (code.startsWith("Arrow") || event.key.startsWith("Arrow")) {
      event.preventDefault();
    }
  };

  private onKeyUp = (event: KeyboardEvent) => {
    const code = event.code;
    const key = event.key.toLowerCase();
    this.keys.delete(code);
    if (key === "w") this.keys.delete("KeyW");
    if (key === "s") this.keys.delete("KeyS");
    if (key === "a") this.keys.delete("KeyA");
    if (key === "d") this.keys.delete("KeyD");
    if (key === "q") this.keys.delete("KeyQ");
    if (key === "e") this.keys.delete("KeyE");
    if (key === " " || key === "spacebar") this.keys.delete("KeyE");
    if (code.startsWith("Shift") || key === "shift") {
      this.keys.delete("Shift");
      this.keys.delete("ShiftLeft");
      this.keys.delete("ShiftRight");
    }
  };

  private onBlur = () => {
    this.keys.clear();
    this.pointers.clear();
  };

  private onPointerDown = (event: PointerEvent) => {
    try {
      this.element.setPointerCapture(event.pointerId);
    } catch {
      // ignore
    }
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    this.element.style.cursor = "grabbing";
    if (this.pointers.size === 2) this.pinchDistance = this.currentPinch();
  };

  private onPointerMove = (event: PointerEvent) => {
    const previous = this.pointers.get(event.pointerId);
    if (!previous) return;
    const dx = event.clientX - previous.x;
    const dy = event.clientY - previous.y;
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (this.pointers.size === 1) {
      this.look(dx, dy);
    } else if (this.pointers.size === 2) {
      const distance = this.currentPinch();
      this.dolly += (distance - this.pinchDistance) * FREE_CAMERA.pinchStep;
      this.pinchDistance = distance;
    }
  };

  private onPointerUp = (event: PointerEvent) => {
    this.pointers.delete(event.pointerId);
    try {
      if (this.element.hasPointerCapture(event.pointerId)) {
        this.element.releasePointerCapture(event.pointerId);
      }
    } catch {
      // ignore
    }
    if (this.pointers.size === 0) this.element.style.cursor = "grab";
  };

  private onWheel = (event: WheelEvent) => {
    event.preventDefault();
    const sign = Math.sign(event.deltaY);
    const amount = Math.min(Math.abs(event.deltaY) * FREE_CAMERA.wheelStep, 6);
    this.dolly += -sign * amount;
  };

  private currentPinch(): number {
    const [a, b] = [...this.pointers.values()];
    if (!a || !b) return 0;
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
}
