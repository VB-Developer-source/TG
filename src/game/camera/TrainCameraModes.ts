/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from "three";
import type { CameraMode, CameraPose } from "../core/Camera";

export interface TrainPose {
  position: THREE.Vector3;
  heading: THREE.Vector3;
  lookDir?: THREE.Vector3;
}

/**
 * First-person Driver Cab camera inside the leading DMC driving coach.
 * Positioned in the motorman's seat on the right side behind the front windshield,
 * with full free-look pan and pitch across gauges, windshield, and tracks.
 */
export class CabCameraMode implements CameraMode {
  readonly id = "cab";
  readonly smoothing = 20;

  private lookYaw = 0;
  private lookPitch = -0.04;
  private isPointerDown = false;
  private lastPointer = { x: 0, y: 0 };

  constructor(
    private readonly canvas: HTMLElement,
    private readonly getTrainCabPose: () => TrainPose | null
  ) {}

  enter(current: Readonly<CameraPose>): void {
    this.lookYaw = 0;
    this.lookPitch = -0.04;
    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    window.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("pointerup", this.onPointerUp);
  }

  update(dt: number, desired: CameraPose): void {
    const cab = this.getTrainCabPose();
    if (!cab) return;

    const eyePos = cab.position.clone();
    const forward = cab.heading.clone().normalize();
    const up = new THREE.Vector3(0, 1, 0);

    // Apply motorman head rotation
    const lookDir = forward.clone();
    lookDir.applyAxisAngle(up, this.lookYaw);
    const rightAxis = new THREE.Vector3().crossVectors(lookDir, up).normalize();
    lookDir.applyAxisAngle(rightAxis, this.lookPitch);

    desired.position.copy(eyePos);
    desired.target.copy(eyePos).addScaledVector(lookDir, 25);
  }

  exit(): void {
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerup", this.onPointerUp);
  }

  dispose(): void {
    this.exit();
  }

  private onPointerDown = (e: PointerEvent) => {
    this.isPointerDown = true;
    this.lastPointer = { x: e.clientX, y: e.clientY };
  };

  private onPointerMove = (e: PointerEvent) => {
    if (!this.isPointerDown) return;
    const dx = e.clientX - this.lastPointer.x;
    const dy = e.clientY - this.lastPointer.y;
    this.lastPointer = { x: e.clientX, y: e.clientY };

    this.lookYaw -= dx * 0.0025;
    this.lookPitch = THREE.MathUtils.clamp(this.lookPitch - dy * 0.0025, -0.6, 0.6);
  };

  private onPointerUp = () => {
    this.isPointerDown = false;
  };
}

/**
 * Passenger Window Seat camera inside the coach saloon.
 * Sits next to the barred window, looking outside at passing platforms,
 * overhead catenary masts, and suburban scenery with realistic coach vibration.
 */
export class PassengerCameraMode implements CameraMode {
  readonly id = "passenger";
  readonly smoothing = 14;

  private lookYaw = 0;
  private lookPitch = -0.05;
  private isPointerDown = false;
  private lastPointer = { x: 0, y: 0 };

  constructor(
    private readonly canvas: HTMLElement,
    private readonly getPassengerPose: () => TrainPose | null
  ) {}

  enter(current: Readonly<CameraPose>): void {
    this.lookYaw = 0;
    this.lookPitch = -0.05;
    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    window.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("pointerup", this.onPointerUp);
  }

  update(dt: number, desired: CameraPose): void {
    const pose = this.getPassengerPose();
    if (!pose) return;

    const eyePos = pose.position.clone();
    const forward = pose.heading.clone().normalize();
    const up = new THREE.Vector3(0, 1, 0);

    const baseLook = pose.lookDir
      ? pose.lookDir.clone().normalize()
      : forward.clone().multiplyScalar(0.7).addScaledVector(new THREE.Vector3().crossVectors(forward, up), -1.0).normalize();

    const lookDir = baseLook.clone();
    lookDir.applyAxisAngle(up, this.lookYaw);
    const rightAxis = new THREE.Vector3().crossVectors(lookDir, up).normalize();
    lookDir.applyAxisAngle(rightAxis, this.lookPitch);

    desired.position.copy(eyePos);
    desired.target.copy(eyePos).addScaledVector(lookDir, 20);
  }

  exit(): void {
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerup", this.onPointerUp);
  }

  dispose(): void {
    this.exit();
  }

  private onPointerDown = (e: PointerEvent) => {
    this.isPointerDown = true;
    this.lastPointer = { x: e.clientX, y: e.clientY };
  };

  private onPointerMove = (e: PointerEvent) => {
    if (!this.isPointerDown) return;
    const dx = e.clientX - this.lastPointer.x;
    const dy = e.clientY - this.lastPointer.y;
    this.lastPointer = { x: e.clientX, y: e.clientY };

    this.lookYaw -= dx * 0.0025;
    this.lookPitch = THREE.MathUtils.clamp(this.lookPitch - dy * 0.0025, -0.6, 0.6);
  };

  private onPointerUp = () => {
    this.isPointerDown = false;
  };
}

/**
 * Third-person Follow camera chasing behind the EMU train.
 */
export class FollowCameraMode implements CameraMode {
  readonly id = "follow";
  readonly smoothing = 8;

  constructor(
    private readonly getTrainPose: () => TrainPose | null
  ) {}

  enter(): void {}

  update(dt: number, desired: CameraPose): void {
    const train = this.getTrainPose();
    if (!train) return;

    const forward = train.heading.clone().normalize();
    const up = new THREE.Vector3(0, 1, 0);

    // Third-person chase: 26m behind, 6.2m elevated, looking ahead
    const followOffset = forward
      .clone()
      .multiplyScalar(-26)
      .addScaledVector(up, 6.2);

    desired.position.copy(train.position).add(followOffset);
    desired.target.copy(train.position).addScaledVector(forward, 15).addScaledVector(up, 2.5);
  }

  exit(): void {}
  dispose(): void {}
}

/**
 * Platform Railfan camera looking at the tracks as the train enters Dadar station.
 */
export class RailfanCameraMode implements CameraMode {
  readonly id = "railfan";
  readonly smoothing = 6;

  private fixedPlatformPos = new THREE.Vector3(3.8, 1.8, 15);

  constructor(
    private readonly getTrainPose: () => TrainPose | null
  ) {}

  enter(): void {}

  update(dt: number, desired: CameraPose): void {
    const train = this.getTrainPose();
    desired.position.copy(this.fixedPlatformPos);

    if (train) {
      desired.target.copy(train.position).add(new THREE.Vector3(0, 2.0, 0));
    } else {
      desired.target.set(6.0, 1.5, 0);
    }
  }

  exit(): void {}
  dispose(): void {}
}

/**
 * High-altitude Drone Overview camera providing a cinematic tracking shot
 * of the articulated 12-coach rake navigating the Mumbai suburban tracks.
 */
export class DroneCameraMode implements CameraMode {
  readonly id = "drone";
  readonly smoothing = 5;

  constructor(
    private readonly getTrainPose: () => TrainPose | null
  ) {}

  enter(): void {}

  update(dt: number, desired: CameraPose): void {
    const train = this.getTrainPose();
    if (!train) return;

    const forward = train.heading.clone().normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(forward, up).normalize();

    // High altitude cinematic diagonal angle
    const droneOffset = forward
      .clone()
      .multiplyScalar(-24)
      .addScaledVector(right, 26)
      .addScaledVector(up, 28);

    desired.position.copy(train.position).add(droneOffset);
    desired.target.copy(train.position).addScaledVector(up, 2.0);
  }

  exit(): void {}
  dispose(): void {}
}
