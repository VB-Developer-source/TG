/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

export type CameraMode = 'cinematic' | 'platform' | 'track' | 'flyover' | 'free';

export interface CameraPreset {
  position: THREE.Vector3;
  target: THREE.Vector3;
}

export class Camera {
  public camera: THREE.PerspectiveCamera;
  public mode: CameraMode = 'cinematic';
  
  // Target vectors for smooth exponential damping
  private currentPosition = new THREE.Vector3(12, 6, 25);
  private targetPosition = new THREE.Vector3(12, 6, 25);
  private currentLookAt = new THREE.Vector3(0, 2, 0);
  private targetLookAt = new THREE.Vector3(0, 2, 0);

  // Cinematic orbit angle
  private orbitAngle = 0;
  private orbitRadius = 28;
  private orbitSpeed = 0.08;

  // Free cam controls state
  private isPointerDown = false;
  private previousPointerX = 0;
  private previousPointerY = 0;
  private freeYaw = -Math.PI / 4;
  private freePitch = -0.2;
  private keysPressed: { [key: string]: boolean } = {};
  private sensitivity = 1.0;

  // Predefined camera angles
  private presets: Record<Exclude<CameraMode, 'free'>, CameraPreset> = {
    cinematic: {
      // Track-level view straight down Track 1 rails (Matches Screenshot 1)
      position: new THREE.Vector3(0, 0.82, 14),
      target: new THREE.Vector3(0, 1.2, -60),
    },
    platform: {
      // Standing on Platform 2/3 near the yellow edge line
      position: new THREE.Vector3(-3.2, 2.2, 10),
      target: new THREE.Vector3(0, 1.8, -40),
    },
    track: {
      // Low angle next to the broad gauge rail
      position: new THREE.Vector3(0.0, 0.55, 16),
      target: new THREE.Vector3(0.0, 1.2, -60),
    },
    flyover: {
      // Elevated aerial overview (Matches Screenshot 2)
      position: new THREE.Vector3(-26.9, 21.3, 110.7),
      target: new THREE.Vector3(0, 2.0, 0),
    },
  };

  private domElement: HTMLElement | null = null;
  private boundOnPointerDown: (e: PointerEvent) => void;
  private boundOnPointerMove: (e: PointerEvent) => void;
  private boundOnPointerUp: () => void;
  private boundOnKeyDown: (e: KeyboardEvent) => void;
  private boundOnKeyUp: (e: KeyboardEvent) => void;

  constructor(width: number, height: number) {
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1500);
    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.currentLookAt);

    this.boundOnPointerDown = this.onPointerDown.bind(this);
    this.boundOnPointerMove = this.onPointerMove.bind(this);
    this.boundOnPointerUp = this.onPointerUp.bind(this);
    this.boundOnKeyDown = this.onKeyDown.bind(this);
    this.boundOnKeyUp = this.onKeyUp.bind(this);

    // Read saved sensitivity
    const savedSens = localStorage.getItem('mumbai_sim_sensitivity');
    if (savedSens) {
      this.sensitivity = parseFloat(savedSens) || 1.0;
    }
  }

  public setSensitivity(val: number) {
    this.sensitivity = Math.max(0.2, Math.min(3.0, val));
    localStorage.setItem('mumbai_sim_sensitivity', this.sensitivity.toString());
  }

  public getSensitivity(): number {
    return this.sensitivity;
  }

  public attachControls(domElement: HTMLElement) {
    this.domElement = domElement;
    domElement.addEventListener('pointerdown', this.boundOnPointerDown);
    window.addEventListener('pointermove', this.boundOnPointerMove);
    window.addEventListener('pointerup', this.boundOnPointerUp);
    window.addEventListener('keydown', this.boundOnKeyDown);
    window.addEventListener('keyup', this.boundOnKeyUp);
  }

  public setMode(mode: CameraMode) {
    this.mode = mode;
    if (mode !== 'free') {
      const preset = this.presets[mode];
      this.targetPosition.copy(preset.position);
      this.targetLookAt.copy(preset.target);
    } else {
      // Free camera: initialize at elevated aerial overview matching Screenshot 2
      this.targetPosition.set(-26.9, 21.3, 110.7);
      this.currentPosition.copy(this.targetPosition);
      this.targetLookAt.set(0, 3, 0);
      const forward = new THREE.Vector3().subVectors(this.targetLookAt, this.currentPosition).normalize();
      this.freeYaw = Math.atan2(forward.x, forward.z);
      this.freePitch = Math.asin(forward.y);
    }
  }

  public getTelemetry(): { x: string; y: string; z: string } {
    return {
      x: this.camera.position.x.toFixed(1),
      y: this.camera.position.y.toFixed(1),
      z: this.camera.position.z.toFixed(1),
    };
  }

  public update(delta: number) {
    const dt = Math.min(delta, 0.1);

    if (this.mode === 'cinematic') {
      // Track-level view straight down Track 1 rails (Matches Screenshot 1)
      const preset = this.presets.cinematic;
      this.orbitAngle += 0.25 * dt;
      const swayX = Math.sin(this.orbitAngle) * 0.04;
      const swayY = Math.cos(this.orbitAngle * 0.7) * 0.02;

      this.targetPosition.set(preset.position.x + swayX, preset.position.y + swayY, preset.position.z);
      this.targetLookAt.copy(preset.target);

      // Smooth exponential damping
      this.currentPosition.x = THREE.MathUtils.damp(this.currentPosition.x, this.targetPosition.x, 3.0, dt);
      this.currentPosition.y = THREE.MathUtils.damp(this.currentPosition.y, this.targetPosition.y, 3.0, dt);
      this.currentPosition.z = THREE.MathUtils.damp(this.currentPosition.z, this.targetPosition.z, 3.0, dt);

      this.currentLookAt.x = THREE.MathUtils.damp(this.currentLookAt.x, this.targetLookAt.x, 4.0, dt);
      this.currentLookAt.y = THREE.MathUtils.damp(this.currentLookAt.y, this.targetLookAt.y, 4.0, dt);
      this.currentLookAt.z = THREE.MathUtils.damp(this.currentLookAt.z, this.targetLookAt.z, 4.0, dt);
    } else if (this.mode === 'free') {
      // Free Developer & Inspection Camera with keyboard & mouse
      const moveSpeed = (this.keysPressed['ShiftLeft'] || this.keysPressed['ShiftRight'] ? 24 : 10) * dt;
      const forward = new THREE.Vector3(
        Math.sin(this.freeYaw) * Math.cos(this.freePitch),
        Math.sin(this.freePitch),
        Math.cos(this.freeYaw) * Math.cos(this.freePitch)
      ).normalize();

      const right = new THREE.Vector3(
        Math.sin(this.freeYaw - Math.PI / 2),
        0,
        Math.cos(this.freeYaw - Math.PI / 2)
      ).normalize();

      if (this.keysPressed['KeyW'] || this.keysPressed['ArrowUp']) {
        this.targetPosition.addScaledVector(forward, moveSpeed);
      }
      if (this.keysPressed['KeyS'] || this.keysPressed['ArrowDown']) {
        this.targetPosition.addScaledVector(forward, -moveSpeed);
      }
      if (this.keysPressed['KeyA'] || this.keysPressed['ArrowLeft']) {
        this.targetPosition.addScaledVector(right, -moveSpeed);
      }
      if (this.keysPressed['KeyD'] || this.keysPressed['ArrowRight']) {
        this.targetPosition.addScaledVector(right, moveSpeed);
      }
      if (this.keysPressed['KeyE'] || this.keysPressed['Space']) {
        this.targetPosition.y += moveSpeed;
      }
      if (this.keysPressed['KeyQ'] || this.keysPressed['ControlLeft']) {
        this.targetPosition.y = Math.max(0.3, this.targetPosition.y - moveSpeed);
      }

      this.currentPosition.copy(this.targetPosition);
      this.currentLookAt.copy(this.currentPosition).add(forward);
    } else {
      // Preset smooth transition
      this.currentPosition.x = THREE.MathUtils.damp(this.currentPosition.x, this.targetPosition.x, 4.0, dt);
      this.currentPosition.y = THREE.MathUtils.damp(this.currentPosition.y, this.targetPosition.y, 4.0, dt);
      this.currentPosition.z = THREE.MathUtils.damp(this.currentPosition.z, this.targetPosition.z, 4.0, dt);

      this.currentLookAt.x = THREE.MathUtils.damp(this.currentLookAt.x, this.targetLookAt.x, 5.0, dt);
      this.currentLookAt.y = THREE.MathUtils.damp(this.currentLookAt.y, this.targetLookAt.y, 5.0, dt);
      this.currentLookAt.z = THREE.MathUtils.damp(this.currentLookAt.z, this.targetLookAt.z, 5.0, dt);
    }

    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.currentLookAt);
  }

  public resize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  // --- Input Handlers for Free Mode & Camera Drag ---

  private onPointerDown(e: PointerEvent) {
    if (e.button !== 0 && e.button !== 2) return;
    this.isPointerDown = true;
    this.previousPointerX = e.clientX;
    this.previousPointerY = e.clientY;
  }

  private onPointerMove(e: PointerEvent) {
    if (!this.isPointerDown) return;
    const deltaX = (e.clientX - this.previousPointerX) * 0.003 * this.sensitivity;
    const deltaY = (e.clientY - this.previousPointerY) * 0.003 * this.sensitivity;

    if (this.mode === 'free') {
      this.freeYaw -= deltaX;
      this.freePitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.freePitch - deltaY));
    } else if (this.mode === 'cinematic') {
      this.orbitAngle -= deltaX;
    } else {
      // Pan angle offset for preset views
      this.targetLookAt.x -= deltaX * 10;
      this.targetLookAt.y = Math.max(0.5, this.targetLookAt.y - deltaY * 10);
    }

    this.previousPointerX = e.clientX;
    this.previousPointerY = e.clientY;
  }

  private onPointerUp() {
    this.isPointerDown = false;
  }

  private onKeyDown(e: KeyboardEvent) {
    this.keysPressed[e.code] = true;
  }

  private onKeyUp(e: KeyboardEvent) {
    this.keysPressed[e.code] = false;
  }

  public dispose() {
    if (this.domElement) {
      this.domElement.removeEventListener('pointerdown', this.boundOnPointerDown);
    }
    window.removeEventListener('pointermove', this.boundOnPointerMove);
    window.removeEventListener('pointerup', this.boundOnPointerUp);
    window.removeEventListener('keydown', this.boundOnKeyDown);
    window.removeEventListener('keyup', this.boundOnKeyUp);
  }
}
