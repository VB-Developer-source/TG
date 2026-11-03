import * as THREE from "three";
import { box, mergeAll, projectUV, staticMesh } from "./geometry";
import { FOB, PLATFORM } from "./layout";
import type { WorldMaterials } from "./materials";

const STAIR_WIDTH = 2.4;
const ROOF_HEIGHT = 2.7;
const PIER_XS = [-15.2, -3.4, 3.4, 15.2] as const;

function stairFlight(x: number, topY: number, bottomY: number, startZ: number, dir: 1 | -1): THREE.BufferGeometry[] {
  const steps = Math.round((topY - bottomY) / FOB.stepRise);
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < steps; i++) {
    const tread = topY - (i + 1) * FOB.stepRise;
    const z = startZ + dir * (i + 0.5) * FOB.stepRun;
    parts.push(box(STAIR_WIDTH, FOB.stepRise + 0.15, FOB.stepRun, x, tread + (FOB.stepRise - 0.15) / 2, z));
  }
  return parts;
}

/** The foot over-bridge (FOB): deck over all tracks, stairs to platform and street. */
export function buildFootbridge(m: WorldMaterials): THREE.Object3D[] {
  const concrete: THREE.BufferGeometry[] = [];
  const steel: THREE.BufferGeometry[] = [];
  const span = FOB.halfSpan * 2;
  const z = FOB.z;
  const deckTop = FOB.deckY;

  concrete.push(box(span, 0.5, FOB.width, 0, deckTop - 0.25, z));
  for (const side of [-1, 1]) concrete.push(box(span, 1.1, 0.15, 0, deckTop + 0.55, z + side * (FOB.width / 2 - 0.08)));
  for (const x of PIER_XS) {
    const base = Math.abs(x) < PLATFORM.halfWidth ? PLATFORM.height : 0;
    concrete.push(box(0.7, deckTop - 0.5 - base, 0.7, x, (deckTop - 0.5 + base) / 2, z));
  }

  // Stairs down to the island platform, descending away from the deck.
  const stairStart = z - FOB.width / 2;
  concrete.push(...stairFlight(0, deckTop, PLATFORM.height, stairStart, -1));
  // Street stairs outside the boundary walls.
  for (const side of [-1, 1]) {
    concrete.push(...stairFlight(side * (FOB.halfSpan - STAIR_WIDTH / 2), deckTop, 0, z + FOB.width / 2, 1));
  }

  for (let x = -FOB.halfSpan + 0.2; x <= FOB.halfSpan; x += 3.8) {
    for (const side of [-1, 1]) {
      steel.push(box(0.08, ROOF_HEIGHT, 0.08, x, deckTop + ROOF_HEIGHT / 2, z + side * (FOB.width / 2 - 0.08)));
    }
  }
  steel.push(box(span + 0.6, 0.06, FOB.width + 0.8, 0, deckTop + ROOF_HEIGHT, z));

  return [
    staticMesh(mergeAll(concrete.map((g) => projectUV(g, 1))), m.bridge, { name: "footbridge" }),
    staticMesh(mergeAll(steel), m.canopySteel, { name: "footbridge-roof" }),
  ];
}
