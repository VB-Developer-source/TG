/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from "three";
import { RAIL_TOP_Y } from "../world/layout";
import { PlatformBuilder, type PlatformConfig } from "./PlatformBuilder";
import { StationSignage, type StationSignageSpec } from "./StationSignage";
import { FootbridgeBuilder } from "./FootbridgeBuilder";
import type { StationRecord } from "../../railway/data/types";
import { STATIONS } from "../../railway/data/stations";

export interface StationEnvironmentOptions {
  stationCode: string;
  stationName?: string;
  stationNameDevanagari?: string;
  trackLength?: number;
  platformSide?: "LEFT" | "RIGHT" | "ISLAND";
  hasFootbridge?: boolean;
}

/**
 * High-fidelity 3D Station Environment Composer.
 * Assembles complete Indian Railways suburban stations with platforms, canopies, FOBs, and signage.
 */
export class StationBuilder {
  static buildStationEnvironment(options: StationEnvironmentOptions): THREE.Group {
    const {
      stationCode,
      platformSide = "ISLAND",
      hasFootbridge = true,
    } = options;

    const record = STATIONS[stationCode];
    const nameEng = options.stationName ?? record?.stationName ?? stationCode;
    const nameMar = options.stationNameDevanagari ?? record?.stationNameDevanagari ?? stationCode;
    const elev = record?.elevation ?? 7;

    const group = new THREE.Group();
    group.name = `station-env-${stationCode}`;

    const platformLength = 280; // Standard 12-coach length
    const platformWidth = platformSide === "ISLAND" ? 8.5 : 5.5;
    const platformHeight = 0.84; // 840 mm above rail top

    // 1. Platform Structure & Slab
    const platformConfig: PlatformConfig = {
      length: platformLength,
      width: platformWidth,
      heightAboveRail: platformHeight,
      side: platformSide,
      hasYellowLine: true,
      hasTactilePaving: true,
      stationCode,
    };

    const slabGroup = PlatformBuilder.buildPlatformSlab(platformConfig);
    group.add(slabGroup);

    // 2. Amenities (Benches, Coolers)
    const amenitiesGroup = PlatformBuilder.buildPlatformAmenities(platformConfig);
    group.add(amenitiesGroup);

    // 3. Platform Canopies (Pitched corrugated sheet roof with steel tubular columns)
    const canopyGroup = StationBuilder.buildCanopy(platformLength * 0.75, platformWidth, platformHeight);
    group.add(canopyGroup);

    // 4. Trilingual Station Nameboards (North and South ends of platform)
    const signageSpec: StationSignageSpec = {
      stationCode,
      nameEnglish: nameEng,
      nameMarathi: nameMar,
      elevationMslMeters: elev,
    };

    const boardSouth = StationSignage.buildStationBoard(
      signageSpec,
      new THREE.Vector3(0, RAIL_TOP_Y + platformHeight, -platformLength * 0.42),
      0
    );
    group.add(boardSouth);

    const boardNorth = StationSignage.buildStationBoard(
      signageSpec,
      new THREE.Vector3(0, RAIL_TOP_Y + platformHeight, platformLength * 0.42),
      Math.PI
    );
    group.add(boardNorth);

    // 5. Over-Track Pedestrian Foot Over Bridge (FOB)
    if (hasFootbridge) {
      const fobGroup = FootbridgeBuilder.buildFOB({
        spanWidth: 28,
        walkwayWidth: 3.8,
        deckHeight: 7.2,
        hasStaircaseLeft: true,
        hasStaircaseRight: true,
        stairLandingY: RAIL_TOP_Y + platformHeight,
        stationName: stationCode,
      });
      fobGroup.position.set(0, 0, -platformLength * 0.25);
      group.add(fobGroup);
    }

    return group;
  }

  /**
   * Builds the authentic corrugated gabled roof canopy covering the suburban platform.
   */
  private static buildCanopy(length: number, width: number, platformHeight: number): THREE.Group {
    const canopy = new THREE.Group();
    canopy.name = "platform-canopy";

    const roofWidth = width + 1.2;
    const roofHalfWidth = roofWidth / 2;
    const surfaceY = RAIL_TOP_Y + platformHeight;
    const columnHeight = 4.2;
    const eaveY = surfaceY + columnHeight;
    const ridgeY = eaveY + 0.9;

    const columnMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb, // Indian Railways Royal Blue column paint
      roughness: 0.6,
      metalness: 0.6,
    });
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8, // Sky blue corrugated canopy sheet
      roughness: 0.7,
      metalness: 0.2,
    });
    const trussMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.7,
      metalness: 0.8,
    });

    // Support columns every 9.6 metres
    const colSpacing = 9.6;
    const halfLen = length / 2;
    const colGeo = new THREE.CylinderGeometry(0.12, 0.12, columnHeight, 8);

    for (let z = -halfLen + 5; z <= halfLen - 5; z += colSpacing) {
      // Dual columns flanking center walkway
      for (const cx of [-width * 0.25, width * 0.25]) {
        const col = new THREE.Mesh(colGeo, columnMat);
        col.position.set(cx, surfaceY + columnHeight / 2, z);
        col.castShadow = true;
        canopy.add(col);
      }

      // Transverse roof truss beam connecting columns
      const beamGeo = new THREE.BoxGeometry(roofWidth, 0.15, 0.15);
      const beam = new THREE.Mesh(beamGeo, trussMat);
      beam.position.set(0, eaveY, z);
      canopy.add(beam);
    }

    // Sloped roof sheets (Left and Right pitch)
    const pitchSlope = Math.hypot(roofHalfWidth, ridgeY - eaveY);
    const angle = Math.atan2(ridgeY - eaveY, roofHalfWidth);
    const pitchGeo = new THREE.PlaneGeometry(pitchSlope, length);

    // Left pitch
    const leftRoof = new THREE.Mesh(pitchGeo, roofMat);
    leftRoof.position.set(-roofHalfWidth / 2, (eaveY + ridgeY) / 2, 0);
    leftRoof.rotation.z = -angle;
    leftRoof.rotation.x = -Math.PI / 2;
    leftRoof.castShadow = true;
    leftRoof.receiveShadow = true;
    canopy.add(leftRoof);

    // Right pitch
    const rightRoof = new THREE.Mesh(pitchGeo, roofMat);
    rightRoof.position.set(roofHalfWidth / 2, (eaveY + ridgeY) / 2, 0);
    rightRoof.rotation.z = angle;
    rightRoof.rotation.x = -Math.PI / 2;
    rightRoof.castShadow = true;
    rightRoof.receiveShadow = true;
    canopy.add(rightRoof);

    return canopy;
  }
}
