/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

export class Pantograph {
  public group: THREE.Group;
  private static sharedMetalMat: THREE.MeshStandardMaterial | null = null;
  private static sharedInsulatorMat: THREE.MeshStandardMaterial | null = null;
  private static sharedCarbonMat: THREE.MeshStandardMaterial | null = null;

  constructor() {
    this.group = new THREE.Group();

    if (!Pantograph.sharedMetalMat) {
      Pantograph.sharedMetalMat = new THREE.MeshStandardMaterial({
        color: 0xd97706, // Indian Railways orange/yellow pantograph arm frame
        metalness: 0.8,
        roughness: 0.35,
      });
      Pantograph.sharedInsulatorMat = new THREE.MeshStandardMaterial({
        color: 0x78350f, // Brown glazed porcelain disc insulators
        roughness: 0.3,
        metalness: 0.2,
      });
      Pantograph.sharedCarbonMat = new THREE.MeshStandardMaterial({
        color: 0x1f2937, // Metallized carbon collector strips
        metalness: 0.7,
        roughness: 0.4,
      });
    }

    this.buildPantograph();
  }

  private buildPantograph() {
    const metalMat = Pantograph.sharedMetalMat!;
    const insMat = Pantograph.sharedInsulatorMat!;
    const carbonMat = Pantograph.sharedCarbonMat!;

    // 1. Four High Voltage Roof Insulators (Mounting Base)
    const baseW = 1.4;
    const baseL = 1.6;
    [
      [-baseW / 2, -baseL / 2],
      [baseW / 2, -baseL / 2],
      [-baseW / 2, baseL / 2],
      [baseW / 2, baseL / 2],
    ].forEach(([ix, iz]) => {
      const insGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.25, 8);
      const insMesh = new THREE.Mesh(insGeo, insMat);
      insMesh.position.set(ix, 0.125, iz);
      insMesh.castShadow = true;
      this.group.add(insMesh);
    });

    // 2. Base Mounting Frame
    const baseFrameGeo = new THREE.BoxGeometry(baseW + 0.1, 0.05, baseL + 0.1);
    const baseFrame = new THREE.Mesh(baseFrameGeo, new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 }));
    baseFrame.position.set(0, 0.26, 0);
    this.group.add(baseFrame);

    // Pneumatic Operating Cylinder
    const cylGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.5, 12);
    cylGeo.rotateX(Math.PI / 2);
    const cyl = new THREE.Mesh(cylGeo, new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 }));
    cyl.position.set(0, 0.35, -0.3);
    this.group.add(cyl);

    // 3. Lower Main Arm (Angled upwards and backwards)
    const lowerArmGeo = new THREE.CylinderGeometry(0.035, 0.035, 1.25);
    const lowerArmLeft = new THREE.Mesh(lowerArmGeo, metalMat);
    lowerArmLeft.position.set(-0.35, 0.78, 0.25);
    lowerArmLeft.rotation.x = Math.PI / 4.2;
    lowerArmLeft.castShadow = true;
    this.group.add(lowerArmLeft);

    const lowerArmRight = new THREE.Mesh(lowerArmGeo, metalMat);
    lowerArmRight.position.set(0.35, 0.78, 0.25);
    lowerArmRight.rotation.x = Math.PI / 4.2;
    lowerArmRight.castShadow = true;
    this.group.add(lowerArmRight);

    // Cross brace between lower arms
    const braceGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.7);
    braceGeo.rotateZ(Math.PI / 2);
    const brace = new THREE.Mesh(braceGeo, metalMat);
    brace.position.set(0, 0.85, 0.28);
    this.group.add(brace);

    // 4. Upper Articulated Arm (Angled forwards towards knuckle joint)
    const upperArmGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.35);
    const upperArmLeft = new THREE.Mesh(upperArmGeo, metalMat);
    upperArmLeft.position.set(-0.25, 1.55, 0.2);
    upperArmLeft.rotation.x = -Math.PI / 5.2;
    upperArmLeft.castShadow = true;
    this.group.add(upperArmLeft);

    const upperArmRight = new THREE.Mesh(upperArmGeo, metalMat);
    upperArmRight.position.set(0.25, 1.55, 0.2);
    upperArmRight.rotation.x = -Math.PI / 5.2;
    upperArmRight.castShadow = true;
    this.group.add(upperArmRight);

    // 5. Collector Head Pan (Touches 25kV OHE Contact Wire)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 2.05, -0.15);

    // Main Pan Bar
    const panGeo = new THREE.BoxGeometry(2.1, 0.04, 0.22);
    const panMesh = new THREE.Mesh(panGeo, metalMat);
    panMesh.castShadow = true;
    headGroup.add(panMesh);

    // Twin Carbon Contact Strips
    [-0.05, 0.05].forEach((stripZ) => {
      const stripGeo = new THREE.BoxGeometry(1.8, 0.02, 0.04);
      const stripMesh = new THREE.Mesh(stripGeo, carbonMat);
      stripMesh.position.set(0, 0.03, stripZ);
      headGroup.add(stripMesh);
    });

    // Curved Horn Ends (Down-turned ends to guide wire safely onto pan)
    [-1.05, 1.05].forEach((hx, idx) => {
      const hornGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.25);
      hornGeo.rotateZ(idx === 0 ? Math.PI / 4 : -Math.PI / 4);
      const horn = new THREE.Mesh(hornGeo, metalMat);
      horn.position.set(hx + (idx === 0 ? -0.06 : 0.06), -0.06, 0);
      headGroup.add(horn);
    });

    this.group.add(headGroup);
  }
}
