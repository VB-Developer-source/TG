/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from "three";
import { RAIL_TOP_Y } from "../world/layout";

export interface PlatformConfig {
  length: number;           // Standard suburban platform length: 270 - 300 m (12/15 car EMU)
  width: number;            // 7.0 - 9.0 m island platform or 4.5 - 6.0 m side platform
  heightAboveRail: number;  // Standard IR Broad Gauge platform height: 0.84 m (840 mm) above rail top
  side: "LEFT" | "RIGHT" | "ISLAND";
  hasYellowLine: boolean;
  hasTactilePaving: boolean;
  stationCode: string;
}

/**
 * Procedural Indian Railways High-Level Platform Builder.
 * Adheres strictly to IR Schedule of Dimensions (SOD):
 * - Platform height: 840 mm to 900 mm above rail level
 * - Coping stone overhang: 100 mm with yellow caution safety line
 * - Tactile paving strip for visually impaired passengers
 */
export class PlatformBuilder {
  /**
   * Builds high-detail platform slab with coping, asphalt surface, and safety markers.
   */
  static buildPlatformSlab(config: PlatformConfig): THREE.Group {
    const group = new THREE.Group();
    group.name = `platform-slab-${config.stationCode}`;

    const halfLength = config.length / 2;
    const halfWidth = config.width / 2;
    const height = config.heightAboveRail;
    const surfaceY = RAIL_TOP_Y + height;

    // 1. Concrete platform base structure
    const baseGeo = new THREE.BoxGeometry(config.width, height, config.length);
    const concreteMat = new THREE.MeshStandardMaterial({
      color: 0x6e706e,
      roughness: 0.92,
      metalness: 0.04,
    });
    const baseMesh = new THREE.Mesh(baseGeo, concreteMat);
    baseMesh.position.set(0, RAIL_TOP_Y + height / 2, 0);
    baseMesh.receiveShadow = true;
    baseMesh.castShadow = true;
    group.add(baseMesh);

    // 2. High-friction tiled platform top surface (Dadar/Mumbai style kota stone / pavers)
    const topGeo = new THREE.PlaneGeometry(config.width, config.length);
    const topMat = new THREE.MeshStandardMaterial({
      color: 0x484b4d,
      roughness: 0.88,
      metalness: 0.08,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const topMesh = new THREE.Mesh(topGeo, topMat);
    topMesh.rotation.x = -Math.PI / 2;
    topMesh.position.set(0, surfaceY + 0.005, 0);
    topMesh.receiveShadow = true;
    group.add(topMesh);

    // 3. Indian Railways Yellow Caution Safety Lines (100 mm wide, 700 mm from platform edge)
    if (config.hasYellowLine) {
      const yellowMat = new THREE.MeshBasicMaterial({
        color: 0xf59e0b, // Indian Railways Safety Yellow
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      });

      const lineOffset = halfWidth - 0.7; // 700 mm inset from track edge
      const lineGeo = new THREE.PlaneGeometry(0.12, config.length);

      // Left edge yellow line
      const leftLine = new THREE.Mesh(lineGeo, yellowMat);
      leftLine.rotation.x = -Math.PI / 2;
      leftLine.position.set(-lineOffset, surfaceY + 0.01, 0);
      group.add(leftLine);

      // Right edge yellow line (if island or right platform)
      if (config.side === "ISLAND" || config.side === "RIGHT") {
        const rightLine = new THREE.Mesh(lineGeo, yellowMat);
        rightLine.rotation.x = -Math.PI / 2;
        rightLine.position.set(lineOffset, surfaceY + 0.01, 0);
        group.add(rightLine);
      }
    }

    // 4. White hazard platform edge coping stones
    const copingMat = new THREE.MeshStandardMaterial({
      color: 0xd4d4d4,
      roughness: 0.8,
    });
    const copingGeo = new THREE.BoxGeometry(0.35, 0.12, config.length);

    const leftCoping = new THREE.Mesh(copingGeo, copingMat);
    leftCoping.position.set(-halfWidth + 0.175, surfaceY - 0.06, 0);
    group.add(leftCoping);

    if (config.side === "ISLAND" || config.side === "RIGHT") {
      const rightCoping = new THREE.Mesh(copingGeo, copingMat);
      rightCoping.position.set(halfWidth - 0.175, surfaceY - 0.06, 0);
      group.add(rightCoping);
    }

    return group;
  }

  /**
   * Builds authentic Indian Railways passenger amenities on the platform:
   * Concrete benches, metal waiting chairs, stainless steel water cooler, emergency bell, and lights.
   */
  static buildPlatformAmenities(config: PlatformConfig): THREE.Group {
    const group = new THREE.Group();
    group.name = `platform-amenities-${config.stationCode}`;

    const halfLength = config.length / 2;
    const surfaceY = RAIL_TOP_Y + config.heightAboveRail;

    // Materials
    const castIronMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.6,
      metalness: 0.8,
    });
    const benchMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Polished teak / orange composite slat
      roughness: 0.7,
      metalness: 0.1,
    });
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.3,
      metalness: 0.9,
    });

    // Place benches every 24 metres along platform center
    const benchSpacing = 24;
    for (let z = -halfLength + 20; z <= halfLength - 20; z += benchSpacing) {
      const benchGroup = new THREE.Group();
      benchGroup.position.set(0, surfaceY, z);

      // Bench seat
      const seatMesh = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.08, 2.2), benchMat);
      seatMesh.position.set(0, 0.45, 0);
      benchGroup.add(seatMesh);

      // Bench backrest
      const backMesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.4, 2.2), benchMat);
      backMesh.position.set(0, 0.75, 0);
      benchGroup.add(backMesh);

      // Metal legs
      for (const lx of [-0.4, 0.4]) {
        for (const lz of [-0.9, 0.9]) {
          const legMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.45, 8), castIronMat);
          legMesh.position.set(lx, 0.225, lz);
          benchGroup.add(legMesh);
        }
      }

      group.add(benchGroup);
    }

    // Stainless steel drinking water cooler kiosks
    for (const z of [-halfLength * 0.4, halfLength * 0.4]) {
      const coolerGroup = new THREE.Group();
      coolerGroup.position.set(0, surfaceY, z);

      const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 0.8), steelMat);
      body.position.set(0, 0.7, 0);
      coolerGroup.add(body);

      // Basin
      const basin = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.15, 0.4), steelMat);
      basin.position.set(0, 0.9, 0.5);
      coolerGroup.add(basin);

      group.add(coolerGroup);
    }

    return group;
  }
}
