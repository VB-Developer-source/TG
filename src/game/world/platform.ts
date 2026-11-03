import * as THREE from "three";
import { box, extrudeZ, mergeAll, rectShape, staticMesh, strut } from "./geometry";
import { PLATFORM } from "./layout";
import type { WorldMaterials } from "./materials";

const COPING = { width: 0.45, height: 0.12, overhang: 0.05 } as const;
const TILE_SIZE = 4;
const BOARD = { width: 3.2, height: 0.9, y: 3.9, x: 3.4 } as const;
const BOARD_ZS = [-57.6, 0, 57.6] as const;
const END_BOARD_ZS = [-133, 125] as const;

export function buildPlatform(m: WorldMaterials): THREE.Object3D[] {
  const length = PLATFORM.halfLength * 2;
  const hw = PLATFORM.halfWidth;
  const top = PLATFORM.height;
  const bodyWidth = hw - COPING.width + COPING.overhang;

  const body = staticMesh(extrudeZ(rectShape(-bodyWidth, 0, bodyWidth * 2, top - 0.02), length), m.wall, {
    name: "platform-body",
  });

  const coping = staticMesh(
    mergeAll(
      [-1, 1].map((side) => {
        const x0 = side > 0 ? hw - COPING.width + COPING.overhang : -hw - COPING.overhang;
        return extrudeZ(rectShape(x0, top - COPING.height, COPING.width, COPING.height), length);
      }),
    ),
    m.coping,
    { name: "platform-coping" },
  );

  const tileWidth = bodyWidth * 2;
  m.platformTop.map?.repeat.set(tileWidth / TILE_SIZE, length / TILE_SIZE);
  const surface = staticMesh(
    new THREE.PlaneGeometry(tileWidth, length).rotateX(-Math.PI / 2).translate(0, top - 0.005, 0),
    m.platformTop,
    { cast: false, name: "platform-surface" },
  );

  const lineX = hw - PLATFORM.safetyLineInset;
  const lines = staticMesh(
    mergeAll(
      [-1, 1].map((side) =>
        new THREE.PlaneGeometry(0.12, length).rotateX(-Math.PI / 2).translate(side * lineX, top - 0.002, 0),
      ),
    ),
    m.safetyLine,
    { cast: false, name: "safety-lines" },
  );

  return [body, coping, surface, lines];
}

function roofHeightAt(x: number): number {
  const t = Math.min(1, Math.abs(x) / PLATFORM.roofHalfWidth);
  return PLATFORM.roofRidgeY - (PLATFORM.roofRidgeY - PLATFORM.roofEaveY) * t;
}

function canopyZs(): number[] {
  const zs: number[] = [];
  const half = PLATFORM.canopyHalfLength - 4;
  for (let z = -half; z <= half + 1e-6; z += PLATFORM.columnSpacing) zs.push(z);
  return zs;
}

export function buildCanopy(m: WorldMaterials): THREE.Object3D[] {
  const zs = canopyZs();
  const roofLength = PLATFORM.canopyHalfLength * 2;
  const slope = Math.atan2(PLATFORM.roofRidgeY - PLATFORM.roofEaveY, PLATFORM.roofHalfWidth);
  const panelWidth = PLATFORM.roofHalfWidth / Math.cos(slope) + 0.05;
  const top = PLATFORM.height;
  const rafterDrop = 0.14;

  const frame: THREE.BufferGeometry[] = [];
  const colTop = roofHeightAt(PLATFORM.columnX) - rafterDrop;
  for (const z of zs) {
    for (const side of [-1, 1]) {
      const x = side * PLATFORM.columnX;
      frame.push(new THREE.CylinderGeometry(0.11, 0.14, colTop - top, 10).translate(x, (colTop + top) / 2, z));
      frame.push(box(0.36, 0.1, 0.36, x, top + 0.05, z));
      const rafter = new THREE.BoxGeometry(panelWidth, 0.2, 0.12);
      rafter.rotateZ(side * -slope);
      rafter.translate(side * (PLATFORM.roofHalfWidth / 2), (PLATFORM.roofRidgeY + PLATFORM.roofEaveY) / 2 - rafterDrop, z);
      frame.push(rafter);
    }
  }
  for (const side of [-1, 1]) frame.push(box(0.12, 0.16, roofLength - 8, side * PLATFORM.columnX, colTop, 0));
  for (const z of [...BOARD_ZS]) {
    for (const side of [-1, 1]) {
      const x = side * BOARD.x;
      for (const dz of [-1.3, 1.3]) {
        frame.push(
          strut(
            new THREE.Vector3(x, BOARD.y + BOARD.height / 2, z + dz),
            new THREE.Vector3(x, roofHeightAt(x) - 0.05, z + dz),
            0.025,
            5,
          ),
        );
      }
    }
  }

  const roofPanels: THREE.BufferGeometry[] = [-1, 1].map((side) => {
    const panel = new THREE.BoxGeometry(panelWidth, 0.05, roofLength);
    panel.rotateZ(side * -slope);
    panel.translate(side * (PLATFORM.roofHalfWidth / 2), (PLATFORM.roofRidgeY + PLATFORM.roofEaveY) / 2, 0);
    return panel;
  });
  m.roof.map?.repeat.set(1, roofLength / 1.2);

  const lamps: THREE.BufferGeometry[] = [];
  for (let i = 0; i < zs.length - 1; i++) {
    const z = (zs[i]! + zs[i + 1]!) / 2;
    for (const side of [-1, 1]) lamps.push(box(0.08, 0.05, 1.2, side * 1.0, roofHeightAt(1.0) - 0.45, z));
  }

  const furniture: THREE.BufferGeometry[] = [];
  for (let i = 0; i < zs.length - 1; i += 2) {
    const z = (zs[i]! + zs[i + 1]!) / 2;
    for (const side of [-1, 1]) {
      const x = side * 0.32;
      furniture.push(box(0.42, 0.05, 1.8, x + side * 0.2, top + 0.45, z));
      furniture.push(box(0.05, 0.42, 1.8, x - side * 0.02, top + 0.7, z));
      furniture.push(box(0.4, 0.45, 0.05, x + side * 0.2, top + 0.22, z - 0.8));
      furniture.push(box(0.4, 0.45, 0.05, x + side * 0.2, top + 0.22, z + 0.8));
    }
  }
  for (const z of BOARD_ZS) {
    for (const side of [-1, 1]) furniture.push(box(0.04, BOARD.height + 0.1, BOARD.width + 0.1, side * BOARD.x, BOARD.y, z));
  }
  for (const z of END_BOARD_ZS) {
    furniture.push(box(BOARD.width + 0.1, BOARD.height + 0.1, 0.04, 0, top + 2.6, z));
    for (const dx of [-1.4, 1.4]) furniture.push(box(0.08, 2.6, 0.08, dx, top + 1.3, z - 0.05));
  }

  return [
    staticMesh(mergeAll(frame), m.canopySteel, { name: "canopy-frame" }),
    staticMesh(mergeAll(roofPanels), m.roof, { name: "canopy-roof" }),
    staticMesh(mergeAll(lamps), m.lamp, { cast: false, name: "canopy-lamps" }),
    staticMesh(mergeAll(furniture), m.darkSteel, { name: "platform-furniture" }),
  ];
}

/** Double-faced yellow name boards under the canopy and at the platform ends. */
export function buildStationBoards(m: WorldMaterials): THREE.Object3D {
  const faces: THREE.BufferGeometry[] = [];
  for (const z of BOARD_ZS) {
    for (const side of [-1, 1]) {
      const x = side * BOARD.x;
      faces.push(new THREE.PlaneGeometry(BOARD.width, BOARD.height).rotateY(Math.PI / 2).translate(x + 0.025, BOARD.y, z));
      faces.push(new THREE.PlaneGeometry(BOARD.width, BOARD.height).rotateY(-Math.PI / 2).translate(x - 0.025, BOARD.y, z));
    }
  }
  const endY = PLATFORM.height + 2.6;
  for (const z of END_BOARD_ZS) {
    faces.push(new THREE.PlaneGeometry(BOARD.width, BOARD.height).translate(0, endY, z + 0.025));
    faces.push(new THREE.PlaneGeometry(BOARD.width, BOARD.height).rotateY(Math.PI).translate(0, endY, z - 0.025));
  }
  return staticMesh(mergeAll(faces), m.board, { cast: false, name: "station-boards" });
}
