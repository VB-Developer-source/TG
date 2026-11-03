/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from "three";
import { RAIL_TOP_Y } from "./layout";
import type { TrackPath } from "../train/TrackPath";
import type { SignalAspect } from "../railway/RailwayNetworkModels";

interface SignalUnit {
  signalId: string;
  distanceM: number;
  group: THREE.Group;
  aspect: SignalAspect;
  lampMeshes: {
    green: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
    yellowTop: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
    yellowBottom: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
    red: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
  };
}

export class SignalSystem3D {
  readonly group = new THREE.Group();
  private signals: SignalUnit[] = [];

  constructor(private readonly trackPath: TrackPath) {
    this.group.name = "macls-signals-group";
    this.buildSignals();
  }

  private buildSignals(): void {
    const route = this.trackPath.getActiveRoute();
    const mastMat = new THREE.MeshStandardMaterial({
      color: 0x8892b0,
      metalness: 0.6,
      roughness: 0.4,
    });
    const boardMat = new THREE.MeshStandardMaterial({
      color: 0x0a0f1d,
      roughness: 0.8,
    });

    const lampOffMat = () =>
      new THREE.MeshBasicMaterial({ color: 0x1e293b });

    for (const sig of route.signals) {
      const sample = this.trackPath.sampleAtDistance(sig.distanceM);
      const forward = sample.tangent.clone().normalize();
      const right = sample.normal.clone().normalize();
      const up = new THREE.Vector3(0, 1, 0);

      const sigGroup = new THREE.Group();

      // Place mast 3.8m to the right side of the track centre line
      const mastPos = sample.position
        .clone()
        .addScaledVector(right, 3.8);
      sigGroup.position.copy(mastPos);

      // Rotate signal face toward oncoming train (looking along -forward)
      const lookTarget = mastPos.clone().addScaledVector(forward, -10);
      sigGroup.lookAt(lookTarget);

      // 1. Steel Mast
      const mastHeight = 4.8;
      const mastGeo = new THREE.CylinderGeometry(0.09, 0.11, mastHeight, 10);
      const mastMesh = new THREE.Mesh(mastGeo, mastMat);
      mastMesh.position.y = mastHeight / 2;
      sigGroup.add(mastMesh);

      // 2. Concrete Base
      const baseGeo = new THREE.BoxGeometry(0.5, 0.4, 0.5);
      const baseMesh = new THREE.Mesh(baseGeo, mastMat);
      baseMesh.position.y = 0.2;
      sigGroup.add(baseMesh);

      // 3. Black Background Circular Board (IR Standard MACLS Head)
      const headHeight = 1.3;
      const headWidth = 0.52;
      const boardGeo = new THREE.BoxGeometry(headWidth, headHeight, 0.12);
      const boardMesh = new THREE.Mesh(boardGeo, boardMat);
      boardMesh.position.y = 4.0;
      sigGroup.add(boardMesh);

      // 4. Signal Lamps (Top Yellow, Green, Lower Yellow, Bottom Red)
      const lampGeo = new THREE.CircleGeometry(0.08, 16);

      const yTopMat = lampOffMat();
      const greenMat = lampOffMat();
      const yBotMat = lampOffMat();
      const redMat = lampOffMat();

      const yTopMesh = new THREE.Mesh(lampGeo, yTopMat);
      yTopMesh.position.set(0, 4.42, 0.065);
      sigGroup.add(yTopMesh);

      const greenMesh = new THREE.Mesh(lampGeo, greenMat);
      greenMesh.position.set(0, 4.14, 0.065);
      sigGroup.add(greenMesh);

      const yBotMesh = new THREE.Mesh(lampGeo, yBotMat);
      yBotMesh.position.set(0, 3.86, 0.065);
      sigGroup.add(yBotMesh);

      const redMesh = new THREE.Mesh(lampGeo, redMat);
      redMesh.position.set(0, 3.58, 0.065);
      sigGroup.add(redMesh);

      // Hoods over each lamp (sun visors)
      for (const y of [4.42, 4.14, 3.86, 3.58]) {
        const hoodGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.14, 8, 1, true, 0, Math.PI);
        hoodGeo.rotateX(Math.PI / 2);
        const hoodMesh = new THREE.Mesh(hoodGeo, boardMat);
        hoodMesh.position.set(0, y + 0.04, 0.12);
        sigGroup.add(hoodMesh);
      }

      this.group.add(sigGroup);
      this.signals.push({
        signalId: sig.signalId,
        distanceM: sig.distanceM,
        group: sigGroup,
        aspect: sig.aspect,
        lampMeshes: {
          green: greenMesh,
          yellowTop: yTopMesh,
          yellowBottom: yBotMesh,
          red: redMesh,
        },
      });
    }

    this.updateAspects();
  }

  public updateAspects(): void {
    const route = this.trackPath.getActiveRoute();
    for (const unit of this.signals) {
      const activeSig = route.signals.find((s) => s.signalId === unit.signalId);
      if (!activeSig) continue;

      const aspect = activeSig.aspect;
      unit.aspect = aspect;

      // Color palette for high-visibility signal illumination
      const COLOR_OFF = 0x1e293b;
      const COLOR_GREEN = 0x10b981;
      const COLOR_YELLOW = 0xf59e0b;
      const COLOR_RED = 0xef4444;

      unit.lampMeshes.green.material.color.setHex(aspect === "GREEN" ? COLOR_GREEN : COLOR_OFF);
      unit.lampMeshes.yellowTop.material.color.setHex(
        aspect === "YELLOW" || aspect === "DOUBLE_YELLOW" ? COLOR_YELLOW : COLOR_OFF
      );
      unit.lampMeshes.yellowBottom.material.color.setHex(
        aspect === "DOUBLE_YELLOW" ? COLOR_YELLOW : COLOR_OFF
      );
      unit.lampMeshes.red.material.color.setHex(aspect === "RED" ? COLOR_RED : COLOR_OFF);
    }
  }

  public dispose(): void {
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
    this.group.clear();
    this.signals = [];
  }
}
