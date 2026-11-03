/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { WheelAssembly } from './Wheels';
import { TRAIN_SPECS } from './TrainConfig';

export class Bogie {
  public group: THREE.Group;
  public wheelsets: WheelAssembly[] = [];
  private static sharedMat: THREE.MeshStandardMaterial | null = null;
  private static sharedSpringMat: THREE.MeshStandardMaterial | null = null;

  constructor() {
    this.group = new THREE.Group();

    if (!Bogie.sharedMat) {
      Bogie.sharedMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b, // Dark charcoal steel bogie frame
        metalness: 0.8,
        roughness: 0.45,
      });
      Bogie.sharedSpringMat = new THREE.MeshStandardMaterial({
        color: 0x475569, // Heavy helical steel springs
        metalness: 0.9,
        roughness: 0.25,
      });
    }

    this.buildBogie();
  }

  private buildBogie() {
    const frameMat = Bogie.sharedMat!;
    const springMat = Bogie.sharedSpringMat!;
    const halfBase = TRAIN_SPECS.bogieWheelbase / 2; // ~1.445m
    const wheelR = TRAIN_SPECS.wheelDiameter / 2;   // ~0.476m

    // 1. Two Wheelsets (Front and Rear Axles)
    [-halfBase, halfBase].forEach((zOffset) => {
      const wheelset = new WheelAssembly();
      wheelset.group.position.set(0, wheelR, zOffset);
      this.group.add(wheelset.group);
      this.wheelsets.push(wheelset);

      // Primary Coil Springs above each axle box
      [-TRAIN_SPECS.gauge / 2 - 0.22, TRAIN_SPECS.gauge / 2 + 0.22].forEach((xOffset) => {
        const springGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.35, 12);
        const spring = new THREE.Mesh(springGeo, springMat);
        spring.position.set(xOffset, wheelR + 0.24, zOffset);
        spring.castShadow = true;
        this.group.add(spring);
      });
    });

    // 2. Bogie Side Frames (Longitudinal H-Beams)
    const sideFrameGeo = new THREE.BoxGeometry(0.18, 0.26, TRAIN_SPECS.bogieWheelbase + 0.9);
    [-TRAIN_SPECS.gauge / 2 - 0.22, TRAIN_SPECS.gauge / 2 + 0.22].forEach((xOffset) => {
      const sideBeam = new THREE.Mesh(sideFrameGeo, frameMat);
      sideBeam.position.set(xOffset, wheelR + 0.36, 0);
      sideBeam.castShadow = true;
      this.group.add(sideBeam);
    });

    // 3. Transom Cross Beams (Connecting side frames)
    const transomGeo = new THREE.BoxGeometry(TRAIN_SPECS.gauge + 0.6, 0.22, 0.3);
    [-0.55, 0.55].forEach((zOffset) => {
      const transom = new THREE.Mesh(transomGeo, frameMat);
      transom.position.set(0, wheelR + 0.36, zOffset);
      transom.castShadow = true;
      this.group.add(transom);
    });

    // 4. Secondary Air Spring Bellows (Air suspension pods supporting the coach)
    [-TRAIN_SPECS.gauge / 2 - 0.05, TRAIN_SPECS.gauge / 2 + 0.05].forEach((xOffset) => {
      // Rubber air spring bellow
      const bellowGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.28, 16);
      const bellow = new THREE.Mesh(bellowGeo, new THREE.MeshStandardMaterial({
        color: 0x0f172a, // Black reinforced rubber air spring
        roughness: 0.9,
      }));
      bellow.position.set(xOffset, wheelR + 0.54, 0);
      bellow.castShadow = true;
      this.group.add(bellow);
    });

    // 5. Central Bolster Beam & Pivot Pin
    const bolsterGeo = new THREE.BoxGeometry(TRAIN_SPECS.gauge + 0.4, 0.16, 0.45);
    const bolster = new THREE.Mesh(bolsterGeo, frameMat);
    bolster.position.set(0, wheelR + 0.68, 0);
    bolster.castShadow = true;
    this.group.add(bolster);

    // Center pivot plate / kingpin socket
    const pivotGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.12, 16);
    const pivot = new THREE.Mesh(pivotGeo, springMat);
    pivot.position.set(0, wheelR + 0.78, 0);
    this.group.add(pivot);

    // 6. Brake Cylinders & Brake Shoe Assemblies
    [-halfBase, halfBase].forEach((zOffset) => {
      // Position brake shoes near each wheel
      [-0.9, 0.9].forEach((xOffset) => {
        const brakeGeo = new THREE.BoxGeometry(0.08, 0.15, 0.1);
        const brakeShoe = new THREE.Mesh(brakeGeo, frameMat);
        const zSign = zOffset > 0 ? -1 : 1;
        brakeShoe.position.set(xOffset, wheelR, zOffset + zSign * (wheelR + 0.04));
        this.group.add(brakeShoe);
      });
    });
  }

  /**
   * Rotates all wheels on linear motion
   */
  public rotateWheels(distance: number) {
    this.wheelsets.forEach((w) => w.rotate(distance));
  }
}
