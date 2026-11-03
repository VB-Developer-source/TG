/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FreeCameraMode, type VirtualMove } from "../camera/FreeCameraMode";
import {
  CabCameraMode,
  DroneCameraMode,
  FollowCameraMode,
  PassengerCameraMode,
  RailfanCameraMode,
} from "../camera/TrainCameraModes";
import type { GameContext } from "../core/Game";
import type { GameScene } from "./SceneManager";
import { trainPhysics } from "../train/TrainPhysics";
import { defaultTrackPath } from "../train/TrackPath";

export type ActiveCameraModeId = "free" | "cab" | "passenger" | "follow" | "railfan" | "drone";

/**
 * ExploreScene manages the main 3D simulation:
 * - Free camera exploration and train driving modes (Cab, Passenger, Follow, Railfan, Drone)
 * - Real-time train physics integration (12-car Broad Gauge EMU)
 * - Track path following and coach kinematics
 * - Authentic Indian Railways sound synchronization
 */
export class ExploreScene implements GameScene {
  readonly name = "explore" as const;
  readonly rendersWorld = true;

  private freeCamera: FreeCameraMode | null = null;
  private cabCamera: CabCameraMode | null = null;
  private passengerCamera: PassengerCameraMode | null = null;
  private followCamera: FollowCameraMode | null = null;
  private railfanCamera: RailfanCameraMode | null = null;
  private droneCamera: DroneCameraMode | null = null;

  private cameraModes: ActiveCameraModeId[] = ["free", "cab", "passenger", "follow", "railfan", "drone"];
  private currentModeIndex = 0;

  constructor(private readonly ctx: GameContext) {}

  private onDoors = (e: Event) => {
    const rake = this.ctx.world.scene.getObjectByName("mumbai-emu-rake");
    const open = (e as CustomEvent).detail?.open;
    const next = open !== undefined ? open : !trainPhysics.getState().doorsOpen;
    rake?.userData?.setDoors?.(next);
    trainPhysics.setDoors(next);
    if (!next) {
      this.ctx.audio.playDoorBuzzer();
    }
    this.ctx.audio.playDoorMovement(next);
  };

  private onLivery = (e: Event) => {
    const rake = this.ctx.world.scene.getObjectByName("mumbai-emu-rake");
    rake?.userData?.setLivery?.((e as CustomEvent).detail.livery);
  };

  private onLights = (e: Event) => {
    const rake = this.ctx.world.scene.getObjectByName("mumbai-emu-rake");
    rake?.userData?.setLights?.((e as CustomEvent).detail.lights);
  };

  private onThrottleUp = () => {
    trainPhysics.increaseThrottle();
  };

  private onThrottleDown = () => {
    trainPhysics.decreaseThrottle();
  };

  private onEmergencyBrake = () => {
    const wasActive = trainPhysics.getState().emergencyBrakeActive;
    trainPhysics.toggleEmergencyBrake();
    if (!wasActive) {
      this.ctx.audio.playBrakeApply();
    } else {
      this.ctx.audio.playBrakeRelease();
    }
  };

  private onHorn = () => {
    this.ctx.audio.playHorn();
  };

  private onCameraModeChange = (e: Event) => {
    const mode = (e as CustomEvent).detail?.mode as ActiveCameraModeId;
    if (mode && this.cameraModes.includes(mode)) {
      this.setCameraMode(mode);
    }
  };

  private onKeyDown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === "INPUT" || target.isContentEditable)) return;

    const currentMode = this.cameraModes[this.currentModeIndex];
    const key = e.key.toLowerCase();
    const code = e.code;

    // Camera Mode Switching
    if (code === "KeyV") {
      e.preventDefault();
      this.cycleCamera();
      return;
    }

    // Horn Trigger (H key)
    if (code === "KeyH") {
      e.preventDefault();
      this.ctx.audio.playHorn();
      return;
    }

    // Emergency Brake (Space)
    if (code === "Space") {
      e.preventDefault();
      this.onEmergencyBrake();
      return;
    }

    // Headlights (L key)
    if (code === "KeyL") {
      e.preventDefault();
      const rake = this.ctx.world.scene.getObjectByName("mumbai-emu-rake");
      const cur = rake?.userData?.materials?.headlights?.emissiveIntensity > 0.5;
      rake?.userData?.setLights?.({ headlights: !cur });
      return;
    }

    // Door Control (D key when in cab/follow/railfan, or Alt+D / Shift+D)
    if ((currentMode !== "free" && code === "KeyD") || (e.shiftKey && code === "KeyD")) {
      e.preventDefault();
      this.onDoors(new CustomEvent("mls:train:doors"));
      return;
    }

    // Driving Controls: W/S or ArrowUp/ArrowDown
    if (currentMode !== "free") {
      if (code === "KeyW" || code === "ArrowUp") {
        e.preventDefault();
        trainPhysics.increaseThrottle();
      } else if (code === "KeyS" || code === "ArrowDown") {
        e.preventDefault();
        trainPhysics.decreaseThrottle();
      }
    } else {
      // In free camera, Arrow keys control train driving without conflicting with WASD flight
      if (code === "ArrowUp") {
        e.preventDefault();
        trainPhysics.increaseThrottle();
      } else if (code === "ArrowDown") {
        e.preventDefault();
        trainPhysics.decreaseThrottle();
      }
    }

    // Reverser toggle (R key)
    if (code === "KeyR") {
      e.preventDefault();
      const curRev = trainPhysics.getState().reverser;
      trainPhysics.setReverser(curRev === 1 ? -1 : 1);
    }
  };

  init(): void {
    const canvas = this.ctx.renderer.canvas;

    // 1. Free Camera Mode
    this.freeCamera = new FreeCameraMode(
      canvas,
      () => this.ctx.settings.get().cameraSensitivity,
      this.ctx.cameras.limits,
    );
    this.ctx.cameras.register(this.freeCamera);

    // 2. Cab Camera Mode (Motorman's seat in lead DMC)
    this.cabCamera = new CabCameraMode(canvas, () => {
      const rake = this.ctx.world.scene.getObjectByName("mumbai-emu-rake");
      return rake?.userData?.getLeadCabPose?.() ?? null;
    });
    this.ctx.cameras.register(this.cabCamera);

    // 3. Passenger Window Camera Mode (Passenger seat in second car)
    this.passengerCamera = new PassengerCameraMode(canvas, () => {
      const rake = this.ctx.world.scene.getObjectByName("mumbai-emu-rake");
      return rake?.userData?.getPassengerPose?.() ?? null;
    });
    this.ctx.cameras.register(this.passengerCamera);

    // 4. Follow Camera Mode (Third-person chase)
    this.followCamera = new FollowCameraMode(() => {
      const rake = this.ctx.world.scene.getObjectByName("mumbai-emu-rake");
      return rake?.userData?.getTrainCenterPose?.() ?? null;
    });
    this.ctx.cameras.register(this.followCamera);

    // 5. Railfan Platform Camera Mode (Fixed platform tracking)
    this.railfanCamera = new RailfanCameraMode(() => {
      const rake = this.ctx.world.scene.getObjectByName("mumbai-emu-rake");
      return rake?.userData?.getTrainCenterPose?.() ?? null;
    });
    this.ctx.cameras.register(this.railfanCamera);

    // 6. Drone Camera Mode (High-altitude cinematic tracking)
    this.droneCamera = new DroneCameraMode(() => {
      const rake = this.ctx.world.scene.getObjectByName("mumbai-emu-rake");
      return rake?.userData?.getTrainCenterPose?.() ?? null;
    });
    this.ctx.cameras.register(this.droneCamera);

    // Event listeners
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("mls:train:doors", this.onDoors);
    window.addEventListener("mls:train:livery", this.onLivery);
    window.addEventListener("mls:train:lights", this.onLights);
    window.addEventListener("mls:train:throttle_up", this.onThrottleUp);
    window.addEventListener("mls:train:throttle_down", this.onThrottleDown);
    window.addEventListener("mls:train:emergency", this.onEmergencyBrake);
    window.addEventListener("mls:train:horn", this.onHorn);
    window.addEventListener("mls:train:cameramode", this.onCameraModeChange);
  }

  enter(): void {
    this.setCameraMode("free");
  }

  public setCameraMode(mode: ActiveCameraModeId): void {
    const idx = this.cameraModes.indexOf(mode);
    if (idx !== -1) {
      this.currentModeIndex = idx;
      this.ctx.cameras.setMode(mode);
      window.dispatchEvent(
        new CustomEvent("mls:camera:active", { detail: { mode } })
      );
    }
  }

  public cycleCamera(): void {
    this.currentModeIndex = (this.currentModeIndex + 1) % this.cameraModes.length;
    const nextMode = this.cameraModes[this.currentModeIndex];
    this.setCameraMode(nextMode);
  }

  setVirtualMove(move: VirtualMove): void {
    this.freeCamera?.setVirtualMove(move);
  }

  teleport(pos: import("three").Vector3, target?: import("three").Vector3): void {
    this.freeCamera?.teleport(pos, target);
  }

  update(dt: number): void {
    // 1. Step train physics simulation
    trainPhysics.update(dt);
    const pState = trainPhysics.getState();

    // 2. Update 3D train position, wheelsets, and doors
    const rake = this.ctx.world.scene.getObjectByName("mumbai-emu-rake");
    if (rake?.userData?.update) {
      rake.userData.update(dt, pState.speed, pState.distance, defaultTrackPath);
    }

    // 3. Update authentic traction and wheel rolling audio
    this.ctx.audio.updateTrainSound(pState.speedKmh, pState.motorLoad);
  }

  exit(): void {
    this.freeCamera?.setVirtualMove({ forward: 0, right: 0, up: 0 });
  }

  dispose(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("mls:train:doors", this.onDoors);
    window.removeEventListener("mls:train:livery", this.onLivery);
    window.removeEventListener("mls:train:lights", this.onLights);
    window.removeEventListener("mls:train:throttle_up", this.onThrottleUp);
    window.removeEventListener("mls:train:throttle_down", this.onThrottleDown);
    window.removeEventListener("mls:train:emergency", this.onEmergencyBrake);
    window.removeEventListener("mls:train:horn", this.onHorn);
    window.removeEventListener("mls:train:cameramode", this.onCameraModeChange);

    this.freeCamera = null;
    this.cabCamera = null;
    this.passengerCamera = null;
    this.followCamera = null;
    this.railfanCamera = null;
    this.droneCamera = null;
  }
}
