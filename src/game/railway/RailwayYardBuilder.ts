/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from "three";
import { RAIL_TOP_Y, GAUGE } from "../world/layout";

export interface YardConfig {
  stationCode: string;
  pitLines: number;
  stablingLines: number;
  sickLines?: number;
  trackLength?: number;
  offsetX?: number;
}

/**
 * Procedural Maintenance Yard Builder for Mumbai EMU Car Sheds & Siding Yards.
 * Generates inspection pit lines with drop trenches, stabling sidings, and buffer stops.
 */
export class RailwayYardBuilder {
  static buildYard(config: YardConfig): THREE.Group {
    const group = new THREE.Group();
    group.name = `railway-yard-${config.stationCode}`;

    const length = config.trackLength ?? 280;
    const halfLength = length / 2;
    const startX = config.offsetX ?? 18.0;
    const trackSpacing = 4.8;

    const concreteMat = new THREE.MeshStandardMaterial({
      color: 0x52525b,
      roughness: 0.9,
      metalness: 0.1,
    });
    const railMat = new THREE.MeshStandardMaterial({
      color: 0x71717a,
      roughness: 0.4,
      metalness: 0.8,
    });
    const bufferStopMat = new THREE.MeshStandardMaterial({
      color: 0xef4444, // Red buffer stop warning beam
      roughness: 0.6,
      metalness: 0.3,
    });
    const bufferSteelMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.7,
      metalness: 0.7,
    });

    let currentTrackIdx = 0;

    // 1. Maintenance Pit Lines (Inspection pits underneath rails)
    for (let p = 0; p < config.pitLines; p++) {
      const trackX = startX + currentTrackIdx * trackSpacing;
      currentTrackIdx++;

      const pitGroup = new THREE.Group();
      pitGroup.position.set(trackX, 0, 0);

      // Sunken inspection pit trench (-1.2m depth beneath rails)
      const pitWidth = 1.2;
      const pitDepth = 1.3;
      const wallThickness = 0.25;

      // Concrete trench bed
      const bed = new THREE.Mesh(new THREE.BoxGeometry(pitWidth, 0.2, length), concreteMat);
      bed.position.set(0, RAIL_TOP_Y - pitDepth, 0);
      pitGroup.add(bed);

      // Left & right trench side retaining walls
      for (const side of [-1, 1]) {
        const wall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, pitDepth, length), concreteMat);
        wall.position.set(side * (pitWidth / 2 + wallThickness / 2), RAIL_TOP_Y - pitDepth / 2, 0);
        pitGroup.add(wall);
      }

      // Broad-gauge rails mounted on concrete plinth pillars
      for (const side of [-1, 1]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.15, length), railMat);
        rail.position.set(side * (GAUGE / 2), RAIL_TOP_Y - 0.075, 0);
        pitGroup.add(rail);

        // Supporting stanchions every 3m
        for (let z = -halfLength + 5; z <= halfLength - 5; z += 3.0) {
          const stanchion = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.06, pitDepth, 8),
            concreteMat
          );
          stanchion.position.set(side * (GAUGE / 2), RAIL_TOP_Y - pitDepth / 2, z);
          pitGroup.add(stanchion);
        }
      }

      // Red buffer stop at the terminal end of the pit line
      const buffer = RailwayYardBuilder.buildBufferStop(bufferStopMat, bufferSteelMat);
      buffer.position.set(0, RAIL_TOP_Y, halfLength - 4);
      pitGroup.add(buffer);

      group.add(pitGroup);
    }

    // 2. Stabling Sidings (Flat ballasted tracks for parking idle rakes)
    for (let s = 0; s < config.stablingLines; s++) {
      const trackX = startX + currentTrackIdx * trackSpacing;
      currentTrackIdx++;

      const sidingGroup = new THREE.Group();
      sidingGroup.position.set(trackX, 0, 0);

      // Ballast bed
      const ballast = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.3, length), concreteMat);
      ballast.position.set(0, RAIL_TOP_Y - 0.2, 0);
      sidingGroup.add(ballast);

      // Rails
      for (const side of [-1, 1]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.15, length), railMat);
        rail.position.set(side * (GAUGE / 2), RAIL_TOP_Y, 0);
        sidingGroup.add(rail);
      }

      // Buffer stop at end
      const buffer = RailwayYardBuilder.buildBufferStop(bufferStopMat, bufferSteelMat);
      buffer.position.set(0, RAIL_TOP_Y, halfLength - 4);
      sidingGroup.add(buffer);

      group.add(sidingGroup);
    }

    return group;
  }

  /**
   * Builds an authentic Indian Railways hydraulic / fixed steel buffer stop (bumping post).
   */
  private static buildBufferStop(redMat: THREE.Material, steelMat: THREE.Material): THREE.Group {
    const buffer = new THREE.Group();

    // Red horizontal beam at coupler / buffer height (1.05m above rail)
    const beam = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.45, 0.3), redMat);
    beam.position.set(0, 1.05, 0);
    buffer.add(beam);

    // Buffers / rubber pads
    for (const bx of [-0.85, 0.85]) {
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.25, 12), steelMat);
      pad.rotation.x = Math.PI / 2;
      pad.position.set(bx, 1.05, -0.2);
      buffer.add(pad);
    }

    // Triangular steel frame struts
    for (const sx of [-0.9, 0.9]) {
      const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.6, 8), steelMat);
      strut.position.set(sx, 0.55, 0.6);
      strut.rotation.x = Math.PI / 4;
      buffer.add(strut);
    }

    return buffer;
  }
}
