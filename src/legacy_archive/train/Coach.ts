/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { CoachType, LiveryTheme, TRAIN_SPECS } from './TrainConfig';
import { TrainExterior } from './TrainExterior';
import { TrainInterior } from './TrainInterior';
import { Bogie } from './Bogie';
import { Pantograph } from './Pantograph';
import { TrainLights } from './TrainLights';

export class Coach {
  public group: THREE.Group;
  public coachIndex: number;
  public coachType: CoachType;
  public coachNumber: string;
  public livery: LiveryTheme;

  // Subsystems
  public exterior: TrainExterior;
  public interior: TrainInterior;
  public bogieFront: Bogie;
  public bogieRear: Bogie;
  public pantograph: Pantograph | null = null;
  public lights: TrainLights;

  private doorsOpenRatio: number = 0;

  constructor(index: number, type: CoachType, livery: LiveryTheme) {
    this.group = new THREE.Group();
    this.coachIndex = index;
    this.coachType = type;
    this.livery = livery;
    this.coachNumber = `${2000 + index}${String.fromCharCode(65 + (index % 4))}`;

    // 1. Exterior Coach Body
    this.exterior = new TrainExterior(type, livery);
    this.group.add(this.exterior.group);

    // 2. Interior Saloon & Cab
    this.interior = new TrainInterior(type);
    this.group.add(this.interior.group);

    // 3. Two Suburban Bogies (Front and Rear Pivots)
    const halfPivot = TRAIN_SPECS.bogieCenterDist / 2; // ~7.315m

    this.bogieFront = new Bogie();
    this.bogieFront.group.position.set(0, 0, halfPivot);
    this.group.add(this.bogieFront.group);

    this.bogieRear = new Bogie();
    this.bogieRear.group.position.set(0, 0, -halfPivot);
    this.group.add(this.bogieRear.group);

    // 4. Roof Pantograph (Driving Motor Coaches & Motor Coaches)
    if (type === 'DMC' || type === 'MC') {
      this.pantograph = new Pantograph();
      const roofY = TRAIN_SPECS.platformOffset + 0.55 + 2.65;
      const pantZ = type === 'DMC' ? 6.2 : 0;
      this.pantograph.group.position.set(0, roofY + 0.2, pantZ);
      this.group.add(this.pantograph.group);
    }

    // 5. Lighting System
    this.lights = new TrainLights();
    const floorY = TRAIN_SPECS.platformOffset + 0.55;
    const halfL = TRAIN_SPECS.coachLength / 2;

    // Saloon Interior Downlights
    this.lights.addInteriorLights(TRAIN_SPECS.coachLength, floorY + 2.5);

    // Front Cab Spotlights & Lenses
    if (type === 'DMC') {
      this.lights.addFrontHeadlights(0.85, floorY + 1.25, halfL + 1.45);
    }
    // Rear Cab Marker Lights
    if (type === 'DTC') {
      this.lights.addMarkerLights(0.85, floorY + 1.25, -halfL - 1.45);
      this.lights.setMarkerLights(true);
    }

    this.group.add(this.lights.group);
  }

  public updateLivery(newLivery: LiveryTheme) {
    this.livery = newLivery;
    this.exterior.updateLivery(newLivery);
  }

  public setDoorsOpenRatio(ratio: number) {
    this.doorsOpenRatio = ratio;
    this.exterior.setDoorsOpenRatio(ratio);
  }

  public getDoorsOpenRatio(): number {
    return this.doorsOpenRatio;
  }

  public rotateWheels(distance: number) {
    this.bogieFront.rotateWheels(distance);
    this.bogieRear.rotateWheels(distance);
  }

  public dispose() {
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry?.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material?.dispose();
        }
      }
    });
  }
}
