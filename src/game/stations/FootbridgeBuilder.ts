/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from "three";
import { RAIL_TOP_Y } from "../world/layout";

export interface FootbridgeConfig {
  spanWidth: number;         // Cross-track span in metres (e.g. 24 - 36 m)
  walkwayWidth: number;      // 3.6 - 4.5 m wide walkway
  deckHeight: number;        // Clearance: 6.8 m to 7.5 m above rail top (clear of 25kV catenary)
  hasStaircaseLeft: boolean; // Stair landing to west platform
  hasStaircaseRight: boolean;// Stair landing to east platform
  stairLandingY: number;     // Platform surface height (RAIL_TOP_Y + 0.84 m)
  stationName: string;
}

/**
 * Procedural Indian Railways Over-Track Foot Over Bridge (FOB) Builder.
 * Features Warren steel truss structure, protective OHE contact mesh, and staircases.
 */
export class FootbridgeBuilder {
  static buildFOB(config: FootbridgeConfig): THREE.Group {
    const group = new THREE.Group();
    group.name = `footbridge-${config.stationName}`;

    const halfSpan = config.spanWidth / 2;
    const halfWidth = config.walkwayWidth / 2;
    const deckY = RAIL_TOP_Y + config.deckHeight;

    // Materials
    const steelTrussMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // IR Standard Blue/Dark Grey structural steel
      roughness: 0.6,
      metalness: 0.7,
    });
    const concreteDeckMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.9,
      metalness: 0.05,
    });
    const corrugatedRoofMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Mumbai Blue corrugated tin canopy
      roughness: 0.5,
      metalness: 0.3,
    });
    const meshSafetyMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.7,
      metalness: 0.5,
      wireframe: true,
    });

    // 1. Concrete Walkway Deck Slab
    const deckGeo = new THREE.BoxGeometry(config.spanWidth, 0.3, config.walkwayWidth);
    const deckMesh = new THREE.Mesh(deckGeo, concreteDeckMat);
    deckMesh.position.set(0, deckY, 0);
    deckMesh.castShadow = true;
    deckMesh.receiveShadow = true;
    group.add(deckMesh);

    // 2. Warren Truss Sides (North & South parapets)
    for (const zOffset of [-halfWidth, halfWidth]) {
      const trussGroup = new THREE.Group();
      trussGroup.position.set(0, deckY, zOffset);

      // Top and bottom chords
      const chordGeo = new THREE.BoxGeometry(config.spanWidth, 0.15, 0.15);
      const bottomChord = new THREE.Mesh(chordGeo, steelTrussMat);
      bottomChord.position.set(0, 0.15, 0);
      trussGroup.add(bottomChord);

      const topChord = new THREE.Mesh(chordGeo, steelTrussMat);
      topChord.position.set(0, 2.4, 0);
      trussGroup.add(topChord);

      // Diagonal web members every 2.5 metres
      const diagSpacing = 2.5;
      for (let x = -halfSpan + 1.25; x <= halfSpan - 1.25; x += diagSpacing) {
        const diagGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.6, 6);
        const diagMesh1 = new THREE.Mesh(diagGeo, steelTrussMat);
        diagMesh1.position.set(x, 1.275, 0);
        diagMesh1.rotation.z = Math.PI / 6;
        trussGroup.add(diagMesh1);

        const diagMesh2 = new THREE.Mesh(diagGeo, steelTrussMat);
        diagMesh2.position.set(x, 1.275, 0);
        diagMesh2.rotation.z = -Math.PI / 6;
        trussGroup.add(diagMesh2);
      }

      // Protective wire mesh (Anti-OHE touch screens)
      const meshGeo = new THREE.PlaneGeometry(config.spanWidth, 2.1);
      const meshPlane = new THREE.Mesh(meshGeo, meshSafetyMat);
      meshPlane.position.set(0, 1.25, 0);
      trussGroup.add(meshPlane);

      group.add(trussGroup);
    }

    // 3. Arched Corrugated Canopy Roof
    const roofCurve = new THREE.Shape();
    roofCurve.moveTo(-halfWidth - 0.4, 0);
    roofCurve.quadraticCurveTo(0, 1.2, halfWidth + 0.4, 0);
    roofCurve.lineTo(halfWidth + 0.35, 0.05);
    roofCurve.quadraticCurveTo(0, 1.25, -halfWidth - 0.35, 0.05);
    roofCurve.closePath();

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: config.spanWidth,
      bevelEnabled: false,
    };
    const roofGeo = new THREE.ExtrudeGeometry(roofCurve, extrudeSettings);
    roofGeo.center();
    const roofMesh = new THREE.Mesh(roofGeo, corrugatedRoofMat);
    roofMesh.rotation.y = Math.PI / 2;
    roofMesh.position.set(0, deckY + 2.5, 0);
    roofMesh.castShadow = true;
    group.add(roofMesh);

    // 4. Main Steel Support Piers (Trestles)
    const pierGeo = new THREE.CylinderGeometry(0.35, 0.35, config.deckHeight, 8);
    for (const px of [-halfSpan * 0.65, halfSpan * 0.65]) {
      for (const pz of [-halfWidth * 0.7, halfWidth * 0.7]) {
        const pier = new THREE.Mesh(pierGeo, steelTrussMat);
        pier.position.set(px, RAIL_TOP_Y + config.deckHeight / 2, pz);
        pier.castShadow = true;
        group.add(pier);
      }
    }

    // 5. Staircases descending to platforms
    if (config.hasStaircaseLeft) {
      const stairL = FootbridgeBuilder.buildStaircase(
        -halfSpan,
        deckY,
        config.stairLandingY,
        config.walkwayWidth,
        -1, // descend outward
        steelTrussMat,
        concreteDeckMat
      );
      group.add(stairL);
    }

    if (config.hasStaircaseRight) {
      const stairR = FootbridgeBuilder.buildStaircase(
        halfSpan,
        deckY,
        config.stairLandingY,
        config.walkwayWidth,
        1, // descend outward
        steelTrussMat,
        concreteDeckMat
      );
      group.add(stairR);
    }

    return group;
  }

  private static buildStaircase(
    startX: number,
    topY: number,
    bottomY: number,
    width: number,
    directionX: number,
    steelMat: THREE.Material,
    concreteMat: THREE.Material
  ): THREE.Group {
    const stairGroup = new THREE.Group();
    const totalRise = topY - bottomY;
    const stepRise = 0.18;
    const stepRun = 0.28;
    const numSteps = Math.floor(totalRise / stepRise);

    for (let i = 0; i < numSteps; i++) {
      const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(stepRun, stepRise, width), concreteMat);
      stepMesh.position.set(
        startX + directionX * (i * stepRun + stepRun / 2),
        topY - (i * stepRise + stepRise / 2),
        0
      );
      stepMesh.castShadow = true;
      stepMesh.receiveShadow = true;
      stairGroup.add(stepMesh);
    }

    // Handrail stringer
    const stringerLength = Math.hypot(numSteps * stepRun, totalRise);
    const angle = Math.atan2(totalRise, numSteps * stepRun);
    const stringerGeo = new THREE.BoxGeometry(stringerLength, 0.1, 0.05);

    for (const z of [-width / 2, width / 2]) {
      const stringer = new THREE.Mesh(stringerGeo, steelMat);
      stringer.position.set(
        startX + (directionX * numSteps * stepRun) / 2,
        bottomY + totalRise / 2 + 0.9,
        z
      );
      stringer.rotation.z = directionX * -angle;
      stairGroup.add(stringer);
    }

    return stairGroup;
  }
}
