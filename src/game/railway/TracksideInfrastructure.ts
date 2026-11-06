/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from "three";
import { RAIL_TOP_Y } from "../world/layout";
import type { TrackPath } from "../train/TrackPath";

export interface InfrastructureItem {
  type: "KM_POST" | "SPEED_BOARD" | "WHISTLE_BOARD" | "RELAY_CABINET";
  distanceM: number;
  label: string;
  side: "LEFT" | "RIGHT";
}

/**
 * Procedural Indian Railways Trackside Infrastructure Generator.
 * Places kilometre posts, speed boards, whistle boards ("W/L"), and relay cabinets along track.
 */
export class TracksideInfrastructure {
  readonly group = new THREE.Group();

  constructor(path: TrackPath) {
    this.group.name = "trackside-infrastructure";
    this.buildInfrastructure(path);
  }

  private buildInfrastructure(path: TrackPath): void {
    const totalLength = path.totalLength;
    if (totalLength <= 0) return;

    // Materials
    const concreteMat = new THREE.MeshStandardMaterial({
      color: 0xeeeeee,
      roughness: 0.8,
      metalness: 0.05,
    });
    const yellowMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.6,
      metalness: 0.2,
    });
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.5,
      metalness: 0.7,
    });
    const cabinetMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8, // Galvanised silver/grey
      roughness: 0.4,
      metalness: 0.8,
    });

    // 1. Kilometre Posts every 500m
    for (let d = 250; d < totalLength - 100; d += 500) {
      const sample = path.sampleAtDistance(d);
      const km = (d / 1000).toFixed(1);

      const kmPost = new THREE.Group();
      // Concrete obelisk post
      const postMesh = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.1, 0.2), concreteMat);
      postMesh.position.set(0, 0.55, 0);
      kmPost.add(postMesh);

      // Top yellow curved crown
      const crownMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.2, 12, 1, false, 0, Math.PI), yellowMat);
      crownMesh.rotation.z = Math.PI / 2;
      crownMesh.position.set(0, 1.1, 0);
      kmPost.add(crownMesh);

      // Position 3.2m to left of track center
      const pos = sample.position.clone().addScaledVector(sample.normal, -3.2);
      kmPost.position.copy(pos);
      kmPost.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), sample.tangent);
      this.group.add(kmPost);
    }

    // 2. Speed Boards & Whistle Boards ("W/L")
    for (let d = 400; d < totalLength - 200; d += 750) {
      const sample = path.sampleAtDistance(d);

      const boardGroup = new THREE.Group();
      // Steel post
      const postMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 8), metalMat);
      postMesh.position.set(0, 1.2, 0);
      boardGroup.add(postMesh);

      // Circular caution disc (Whistle board or Speed limit)
      const isWhistle = (Math.floor(d / 750) % 2) === 0;
      const discMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 0.04, 16),
        isWhistle ? yellowMat : concreteMat
      );
      discMesh.rotation.x = Math.PI / 2;
      discMesh.position.set(0, 2.2, 0);
      boardGroup.add(discMesh);

      const pos = sample.position.clone().addScaledVector(sample.normal, 3.2);
      boardGroup.position.copy(pos);
      boardGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), sample.tangent);
      this.group.add(boardGroup);
    }

    // 3. Trackside Battery / Relay Signalling Enclosures
    for (let d = 300; d < totalLength - 150; d += 600) {
      const sample = path.sampleAtDistance(d);

      const cabGroup = new THREE.Group();
      // Concrete plinth foundation
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 0.8), concreteMat);
      plinth.position.set(0, 0.2, 0);
      cabGroup.add(plinth);

      // Sheet metal apparatus case
      const cabinet = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.4, 0.6), cabinetMat);
      cabinet.position.set(0, 1.1, 0);
      cabGroup.add(cabinet);

      // Position 3.6m to right of track
      const pos = sample.position.clone().addScaledVector(sample.normal, 3.6);
      cabGroup.position.copy(pos);
      cabGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), sample.tangent);
      this.group.add(cabGroup);
    }
  }

  dispose(): void {
    this.group.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.geometry?.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material?.dispose();
        }
      }
    });
  }
}
