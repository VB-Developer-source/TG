/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { Coach } from './Coach';
import { CoachType, LIVERY_THEMES, LiveryTheme, TRAIN_SPECS, TrainLiveryType } from './TrainConfig';

export interface TrainOptions {
  coachCount?: number;          // 3 or 12 coaches
  livery?: TrainLiveryType;
  position?: THREE.Vector3;
}

export class Train {
  public group: THREE.Group;
  public coaches: Coach[] = [];
  public livery: LiveryTheme;
  public coachCount: number;

  // Door Animation State
  public areDoorsOpen: boolean = false;
  private currentDoorRatio: number = 0;
  private targetDoorRatio: number = 0;

  // Wheel Rotation & Movement State (Ready for future driving physics)
  public currentSpeedKmh: number = 0;

  constructor(options: TrainOptions = {}) {
    this.group = new THREE.Group();
    this.coachCount = options.coachCount || 3;
    const liveryKey = options.livery || 'western';
    this.livery = LIVERY_THEMES[liveryKey] || LIVERY_THEMES.western;

    if (options.position) {
      this.group.position.copy(options.position);
    }

    this.buildTrain();
  }

  private buildTrain() {
    // Clear existing
    this.coaches.forEach((c) => {
      this.group.remove(c.group);
      c.dispose();
    });
    this.coaches = [];

    // Calculate coach types:
    // Front: DMC (Driving Motor Coach)
    // Middle coaches: TC and MC alternating
    // Rear: DTC (Driving Trailer Coach with rear cab)
    const pitch = TRAIN_SPECS.coachLength + TRAIN_SPECS.couplerLength; // ~22.2m
    const totalTrainLength = (this.coachCount - 1) * pitch;

    for (let i = 0; i < this.coachCount; i++) {
      let type: CoachType = 'TC';
      if (i === 0) {
        type = 'DMC'; // Leading cab
      } else if (i === this.coachCount - 1) {
        type = 'DTC'; // Trailing cab
      } else if (i % 2 === 1) {
        type = 'MC';  // Intermediate motor coach with pantograph
      }

      const coach = new Coach(i, type, this.livery);
      // Position each coach along Z axis
      // Coach 0 is at +totalTrainLength / 2, Coach N-1 is at -totalTrainLength / 2
      const cz = totalTrainLength / 2 - i * pitch;
      coach.group.position.set(0, 0, cz);

      this.group.add(coach.group);
      this.coaches.push(coach);
    }
  }

  public setCoachCount(count: number) {
    if (this.coachCount === count) return;
    this.coachCount = Math.max(1, Math.min(12, count));
    this.buildTrain();
  }

  public setLivery(liveryKey: TrainLiveryType) {
    this.livery = LIVERY_THEMES[liveryKey] || LIVERY_THEMES.western;
    this.coaches.forEach((c) => c.updateLivery(this.livery));
  }

  public setDoors(open: boolean) {
    this.areDoorsOpen = open;
    this.targetDoorRatio = open ? 1.0 : 0.0;
  }

  public toggleDoors(): boolean {
    this.setDoors(!this.areDoorsOpen);
    return this.areDoorsOpen;
  }

  public setHeadlights(on: boolean) {
    if (this.coaches.length > 0) {
      this.coaches[0].lights.setHeadlights(on);
    }
  }

  public setInteriorLights(on: boolean) {
    this.coaches.forEach((c) => c.lights.setInteriorLights(on));
  }

  public toggleLights(): boolean {
    const isHeadlightsOn = this.coaches[0]?.lights.headlightsOn;
    const next = !isHeadlightsOn;
    this.setHeadlights(next);
    this.setInteriorLights(next);
    return next;
  }

  public rotateWheels(distance: number) {
    this.coaches.forEach((c) => c.rotateWheels(distance));
  }

  public update(delta: number) {
    const dt = Math.min(delta, 0.1);

    // Smooth door slide interpolation
    if (Math.abs(this.currentDoorRatio - this.targetDoorRatio) > 0.005) {
      this.currentDoorRatio = THREE.MathUtils.damp(
        this.currentDoorRatio,
        this.targetDoorRatio,
        4.5,
        dt
      );
      this.coaches.forEach((c) => c.setDoorsOpenRatio(this.currentDoorRatio));
    }

    // Wheel rotation if moving
    if (Math.abs(this.currentSpeedKmh) > 0.1) {
      const distance = (this.currentSpeedKmh * (1000 / 3600)) * dt;
      this.rotateWheels(distance);
    }
  }

  public dispose() {
    this.coaches.forEach((c) => c.dispose());
    this.coaches = [];
  }
}
