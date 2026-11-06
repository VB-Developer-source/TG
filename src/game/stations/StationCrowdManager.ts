/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from "three";
import { RAIL_TOP_Y } from "../world/layout";
import { DOOR_Z, COACH_LENGTH } from "../train/TrainConfig";

export interface CrowdDensityProfile {
  name: "RUSH_HOUR" | "REGULAR" | "OFF_PEAK";
  passengerCount: number;
}

const SHIRT_COLORS = [
  0xf8fafc, // White shirt
  0x3b82f6, // Blue shirt
  0xef4444, // Red / maroon kurta
  0x10b981, // Green
  0xf59e0b, // Amber / yellow
  0x8b5cf6, // Violet
  0x64748b, // Grey
  0x1e293b, // Dark navy
];

/**
 * High-performance Instanced Crowd Simulator for Mumbai Suburban Platforms.
 * Simulates thousands of passengers clustered at coach doors, waiting, boarding, and alighting.
 */
export class StationCrowdManager {
  readonly group = new THREE.Group();
  private bodyMesh: THREE.InstancedMesh | null = null;
  private headMesh: THREE.InstancedMesh | null = null;
  private readonly maxPassengers: number = 300;
  private passengerOffsets: { x: number; z: number; targetX: number; targetZ: number; isBoarding: boolean }[] = [];
  private platformY: number = RAIL_TOP_Y + 0.84;
  private isDoorsOpen: boolean = false;
  private platformSide: "LEFT" | "RIGHT" | "BOTH" = "LEFT";

  constructor(platformCenterZ: number = 0, platformWidth: number = 8.5) {
    this.group.name = "station-crowd-system";
    this.initCrowd(platformCenterZ, platformWidth);
  }

  private initCrowd(platformCenterZ: number, platformWidth: number): void {
    const halfWidth = platformWidth / 2;
    // Composite passenger figure: Capsule / Cylinder body + Sphere head
    const bodyGeo = new THREE.CylinderGeometry(0.22, 0.22, 1.35, 8);
    bodyGeo.translate(0, 0.675, 0); // Ground pivot at feet

    const headGeo = new THREE.SphereGeometry(0.14, 8, 8);
    headGeo.translate(0, 1.5, 0);

    const bodyMat = new THREE.MeshStandardMaterial({
      roughness: 0.8,
      metalness: 0.1,
    });
    const headMat = new THREE.MeshStandardMaterial({
      color: 0x8d5524, // Varied South Asian skin tones
      roughness: 0.7,
      metalness: 0.05,
    });

    this.bodyMesh = new THREE.InstancedMesh(bodyGeo, bodyMat, this.maxPassengers);
    this.headMesh = new THREE.InstancedMesh(headGeo, headMat, this.maxPassengers);

    this.bodyMesh.castShadow = true;
    this.bodyMesh.receiveShadow = true;
    this.headMesh.castShadow = true;

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const count = this.maxPassengers;

    // Distribute passengers along 12-coach door clusters
    const doorClusterZs: number[] = [];
    for (let car = 0; car < 12; car++) {
      const carCenterZ = platformCenterZ + (car - 5.5) * (COACH_LENGTH + 0.5);
      for (const dz of DOOR_Z) {
        doorClusterZs.push(carCenterZ + dz);
      }
    }

    this.passengerOffsets = [];

    for (let i = 0; i < count; i++) {
      // Pick a door cluster
      const clusterZ = doorClusterZs[i % doorClusterZs.length];
      const spreadZ = (Math.random() - 0.5) * 3.2;
      const initialZ = clusterZ + spreadZ;

      // Platform lateral position (standing between yellow line and center)
      const sideMultiplier = Math.random() > 0.3 ? -1 : 1;
      const initialX = sideMultiplier * (halfWidth * 0.45 + Math.random() * (halfWidth * 0.4));

      this.passengerOffsets.push({
        x: initialX,
        z: initialZ,
        targetX: initialX,
        targetZ: initialZ,
        isBoarding: Math.random() > 0.5,
      });

      dummy.position.set(initialX, this.platformY, initialZ);
      dummy.rotation.y = (Math.random() - 0.5) * Math.PI;
      const scale = 0.92 + Math.random() * 0.16; // Varied heights (1.6m to 1.85m)
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();

      this.bodyMesh.setMatrixAt(i, dummy.matrix);
      this.headMesh.setMatrixAt(i, dummy.matrix);

      // Random shirt color
      color.setHex(SHIRT_COLORS[i % SHIRT_COLORS.length]);
      this.bodyMesh.setColorAt(i, color);
    }

    this.bodyMesh.instanceMatrix.needsUpdate = true;
    this.headMesh.instanceMatrix.needsUpdate = true;
    if (this.bodyMesh.instanceColor) this.bodyMesh.instanceColor.needsUpdate = true;

    this.group.add(this.bodyMesh);
    this.group.add(this.headMesh);
  }

  /**
   * Updates crowd animation: reacts when train doors open/close.
   */
  public update(dt: number, trainDoorsOpen: boolean, trainAligned: boolean): void {
    if (!this.bodyMesh || !this.headMesh) return;

    if (trainDoorsOpen !== this.isDoorsOpen) {
      this.isDoorsOpen = trainDoorsOpen;
      // Set new target positions
      for (let i = 0; i < this.passengerOffsets.length; i++) {
        const p = this.passengerOffsets[i];
        if (trainDoorsOpen && trainAligned) {
          // Surge toward doors (platform edge)
          const doorEdgeX = this.platformSide === "RIGHT" ? 3.6 : -3.6;
          p.targetX = doorEdgeX + (Math.random() - 0.5) * 0.8;
        } else {
          // Disperse safely back behind yellow caution line
          p.targetX = (p.x < 0 ? -1 : 1) * (1.5 + Math.random() * 1.5);
        }
      }
    }

    // Smooth position interpolation
    const dummy = new THREE.Object3D();
    const lerpSpeed = Math.min(1, dt * 2.5);
    let changed = false;

    for (let i = 0; i < this.passengerOffsets.length; i++) {
      const p = this.passengerOffsets[i];
      const dx = p.targetX - p.x;
      const dz = p.targetZ - p.z;
      if (Math.abs(dx) > 0.01 || Math.abs(dz) > 0.01) {
        p.x += dx * lerpSpeed;
        p.z += dz * lerpSpeed;
        changed = true;

        dummy.position.set(p.x, this.platformY, p.z);
        // Turn facing target
        dummy.rotation.y = Math.atan2(dx, dz);
        dummy.updateMatrix();

        this.bodyMesh.setMatrixAt(i, dummy.matrix);
        this.headMesh.setMatrixAt(i, dummy.matrix);
      }
    }

    if (changed) {
      this.bodyMesh.instanceMatrix.needsUpdate = true;
      this.headMesh.instanceMatrix.needsUpdate = true;
    }
  }

  public setPlatformSide(side: "LEFT" | "RIGHT" | "BOTH"): void {
    this.platformSide = side;
  }

  public dispose(): void {
    this.bodyMesh?.geometry.dispose();
    this.headMesh?.geometry.dispose();
    if (this.bodyMesh?.material) {
      (this.bodyMesh.material as THREE.Material).dispose();
    }
    if (this.headMesh?.material) {
      (this.headMesh.material as THREE.Material).dispose();
    }
  }
}
