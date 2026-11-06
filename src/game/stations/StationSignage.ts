/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from "three";
import { RAIL_TOP_Y } from "../world/layout";

export interface StationSignageSpec {
  stationCode: string;
  nameEnglish: string;
  nameMarathi: string;
  nameHindi?: string;
  elevationMslMeters?: number;
  isTerminal?: boolean;
  platformNumber?: string;
}

/**
 * Procedural Indian Railways Station Signage System.
 * Generates trilingual station nameboards (Marathi, English, Hindi) and platform indicators.
 */
export class StationSignage {
  /**
   * Generates a 2D canvas texture for the standard IR Sunflower Yellow station board.
   */
  static createNameboardTexture(spec: StationSignageSpec): THREE.CanvasTexture {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 360;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      // 1. Background: Indian Railways Sunflower Yellow (#FFCC00)
      ctx.fillStyle = "#ffcc00";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Heavy black border
      ctx.strokeStyle = "#111111";
      ctx.lineWidth = 14;
      ctx.strokeRect(7, 7, canvas.width - 14, canvas.height - 14);
      ctx.lineWidth = 4;
      ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);

      // 3. Text styling
      ctx.fillStyle = "#111111";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Top line: Marathi (Devanagari script)
      ctx.font = "bold 60px 'Noto Sans Devanagari', 'Mukta', sans-serif";
      ctx.fillText(spec.nameMarathi, canvas.width / 2, 75);

      // Middle line: English (Uppercase)
      ctx.font = "bold 78px 'Big Shoulders Display', 'IBM Plex Sans', sans-serif";
      ctx.fillText(spec.nameEnglish.toUpperCase(), canvas.width / 2, 175);

      // Bottom line: Hindi (or elevation & station code)
      const elev = spec.elevationMslMeters ?? 7;
      ctx.font = "600 32px 'IBM Plex Mono', monospace";
      ctx.fillText(`[ ${spec.stationCode} ]  ·  ELEV. MSL +${elev}M`, canvas.width / 2, 270);

      // Footer line: Division badge
      ctx.font = "bold 22px 'IBM Plex Mono', monospace";
      ctx.fillStyle = "#333333";
      ctx.fillText("INDIAN RAILWAYS · MUMBAI DIVISION", canvas.width / 2, 320);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  /**
   * Builds double-sided 3D station nameboard mounted on steel I-beam posts.
   */
  static buildStationBoard(spec: StationSignageSpec, position: THREE.Vector3, orientationY: number = 0): THREE.Group {
    const group = new THREE.Group();
    group.name = `station-board-${spec.stationCode}`;
    group.position.copy(position);
    group.rotation.y = orientationY;

    const texture = StationSignage.createNameboardTexture(spec);

    const boardWidth = 4.2;
    const boardHeight = 1.45;
    const boardThickness = 0.08;

    const boardMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.5,
      metalness: 0.1,
    });
    const steelPostMat = new THREE.MeshStandardMaterial({
      color: 0x222222, // Black cast iron / steel
      roughness: 0.7,
      metalness: 0.6,
    });

    // Signboard panel
    const signMesh = new THREE.Mesh(new THREE.BoxGeometry(boardWidth, boardHeight, boardThickness), boardMat);
    signMesh.position.set(0, 2.5, 0);
    signMesh.castShadow = true;
    group.add(signMesh);

    // Two supporting vertical posts
    const postHeight = 3.2;
    const postGeo = new THREE.CylinderGeometry(0.06, 0.06, postHeight, 8);

    const post1 = new THREE.Mesh(postGeo, steelPostMat);
    post1.position.set(-boardWidth * 0.38, postHeight / 2, 0);
    post1.castShadow = true;
    group.add(post1);

    const post2 = new THREE.Mesh(postGeo, steelPostMat);
    post2.position.set(boardWidth * 0.38, postHeight / 2, 0);
    post2.castShadow = true;
    group.add(post2);

    return group;
  }
}
