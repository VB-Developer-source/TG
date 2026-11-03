/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { TRAIN_SPECS } from './TrainConfig';

export class WheelAssembly {
  public group: THREE.Group;
  public rotatingAxle: THREE.Group; // Rotates around X axis during motion
  private static sharedSteelMat: THREE.MeshStandardMaterial | null = null;
  private static sharedTreadMat: THREE.MeshStandardMaterial | null = null;

  constructor() {
    this.group = new THREE.Group();
    this.rotatingAxle = new THREE.Group();
    this.group.add(this.rotatingAxle);

    if (!WheelAssembly.sharedSteelMat) {
      WheelAssembly.sharedSteelMat = new THREE.MeshStandardMaterial({
        color: 0x334155, // Dark cast steel wheel hub & disc
        metalness: 0.85,
        roughness: 0.35,
      });
      WheelAssembly.sharedTreadMat = new THREE.MeshStandardMaterial({
        color: 0xd1d5db, // Mirror polished steel running tread and flange
        metalness: 0.95,
        roughness: 0.18,
      });
    }

    this.buildAxleAndWheels();
  }

  private buildAxleAndWheels() {
    const steelMat = WheelAssembly.sharedSteelMat!;
    const treadMat = WheelAssembly.sharedTreadMat!;
    const r = TRAIN_SPECS.wheelDiameter / 2; // ~0.476m
    const gauge = TRAIN_SPECS.gauge;         // 1.676m

    // 1. Solid Central Axle Shaft
    const axleGeo = new THREE.CylinderGeometry(0.09, 0.09, gauge + 0.5, 16);
    axleGeo.rotateZ(Math.PI / 2);
    const axleMesh = new THREE.Mesh(axleGeo, steelMat);
    axleMesh.castShadow = true;
    this.rotatingAxle.add(axleMesh);

    // 2. Dual Flanged Railway Wheels
    const halfGauge = gauge / 2;
    [-halfGauge, halfGauge].forEach((xOffset, idx) => {
      const wheelGroup = new THREE.Group();
      wheelGroup.position.x = xOffset;

      // Tread running surface (cylinder of width 0.12m)
      const treadGeo = new THREE.CylinderGeometry(r, r, 0.12, 24);
      treadGeo.rotateZ(Math.PI / 2);
      const treadMesh = new THREE.Mesh(treadGeo, treadMat);
      treadMesh.castShadow = true;
      wheelGroup.add(treadMesh);

      // Wheel Flange (slightly larger diameter on inner side)
      // Inner side is toward center (idx === 0 means left, so inner is +X; idx === 1 means right, inner is -X)
      const flangeSign = idx === 0 ? 1 : -1;
      const flangeGeo = new THREE.CylinderGeometry(r + 0.035, r + 0.035, 0.035, 24);
      flangeGeo.rotateZ(Math.PI / 2);
      const flangeMesh = new THREE.Mesh(flangeGeo, treadMat);
      flangeMesh.position.x = flangeSign * 0.065;
      flangeMesh.castShadow = true;
      wheelGroup.add(flangeMesh);

      // Wheel Center Web / Conical Disc
      const webGeo = new THREE.CylinderGeometry(r * 0.75, r * 0.75, 0.05, 24);
      webGeo.rotateZ(Math.PI / 2);
      const webMesh = new THREE.Mesh(webGeo, steelMat);
      wheelGroup.add(webMesh);

      // Axle Hub Boss with center bolt pattern
      const hubGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.16, 16);
      hubGeo.rotateZ(Math.PI / 2);
      const hubMesh = new THREE.Mesh(hubGeo, steelMat);
      wheelGroup.add(hubMesh);

      this.rotatingAxle.add(wheelGroup);
    });

    // 3. Static Axle Boxes & Roller Bearing End Covers (Non-rotating, mounts to bogie frame)
    [-halfGauge - 0.22, halfGauge + 0.22].forEach((boxX) => {
      const boxGroup = new THREE.Group();
      boxGroup.position.x = boxX;

      // Heavy Axle Box Housing
      const boxGeo = new THREE.BoxGeometry(0.18, 0.32, 0.28);
      const boxMesh = new THREE.Mesh(boxGeo, steelMat);
      boxMesh.castShadow = true;
      boxGroup.add(boxMesh);

      // Cylindrical Bearing Cap
      const capGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.06, 12);
      capGeo.rotateZ(Math.PI / 2);
      const capMesh = new THREE.Mesh(capGeo, steelMat);
      boxGroup.add(capMesh);

      this.group.add(boxGroup);
    });
  }

  /**
   * Rotate wheel assembly according to train linear displacement
   */
  public rotate(distance: number) {
    const r = TRAIN_SPECS.wheelDiameter / 2;
    this.rotatingAxle.rotation.x += distance / r;
  }
}
