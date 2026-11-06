import * as THREE from "three";
import { mulberry32, pick, range, type Rng } from "../core/random";
import { mergeAll, paint, staticMesh } from "./geometry";
import { BUILDINGS_START_X, SHANTY_STRIP, TREE_STRIP, TRACK_HALF, nearFootbridge } from "./layout";
import type { WorldMaterials } from "./materials";

/** Facade texture covers 16 m x 12 m. */
const FACADE_TILE = { u: 16, v: 12 } as const;
const ROOF_UV = [0.01, 0.99] as const;

const PAINTS = [
  "#e8dcc4", "#d9b8a0", "#c9d4d6", "#d8c9a8", "#b8c4b0",
  "#e0cfc2", "#c4b8a8", "#a9b7c0", "#d6a98f", "#efe6d4", "#cfd8c4",
];
const SHANTY_WALLS = ["#9c6b4f", "#b8a99a", "#7f8c8d", "#c9b79c", "#8e5a43", "#a7b4a0", "#c2a28a"];
const SHANTY_ROOFS = ["#2f5f9e", "#3b6fb3", "#7a4b32", "#6f7377", "#2c4f7c", "#8a5a3c", "#4a7fc0"];
const LEAVES = ["#4f6b2f", "#5d7a35", "#3f5e2a", "#6b8040", "#47662f"];

interface Building {
  x: number;
  z: number;
  sx: number;
  sz: number;
  h: number;
}

/** Box with facade UVs in metres and a darker roof. */
function buildingGeometry(b: Building, color: THREE.Color): THREE.BufferGeometry {
  const geo = new THREE.BoxGeometry(b.sx, b.h, b.sz);
  const uv = geo.getAttribute("uv");
  const colors = new Float32Array(uv.count * 3);
  // BoxGeometry face order: +x, -x, +y, -y, +z, -z (4 vertices each).
  for (let i = 0; i < uv.count; i++) {
    const face = Math.floor(i / 4);
    let shade = 1;
    if (face === 2 || face === 3) {
      uv.setXY(i, ROOF_UV[0], ROOF_UV[1]);
      shade = 0.62;
    } else if (face < 2) {
      uv.setXY(i, (uv.getX(i) * b.sz) / FACADE_TILE.u, (uv.getY(i) * b.h) / FACADE_TILE.v);
    } else {
      uv.setXY(i, (uv.getX(i) * b.sx) / FACADE_TILE.u, (uv.getY(i) * b.h) / FACADE_TILE.v);
      shade = 0.94;
    }
    colors[i * 3] = color.r * shade;
    colors[i * 3 + 1] = color.g * shade;
    colors[i * 3 + 2] = color.b * shade;
  }
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  return geo.translate(b.x, b.h / 2, b.z);
}

function rowOfBuildings(rng: Rng, side: number, xStart: number, depth: [number, number], height: [number, number], width: [number, number]): Building[] {
  const list: Building[] = [];
  let z = -1200;
  while (z < 1200) {
    const sz = range(rng, width[0], width[1]);
    const sx = range(rng, depth[0], depth[1]);
    const h = range(rng, height[0], height[1]);
    list.push({ x: side * (xStart + sx / 2 + range(rng, 0, 3)), z: z + sz / 2, sx, sz, h });
    z += sz + range(rng, 1, 5);
  }
  return list;
}

export function buildBuildings(m: WorldMaterials): THREE.Object3D[] {
  const rng = mulberry32(400001); // Mumbai PIN code prefix
  const near: Building[] = [];
  const mid: Building[] = [];
  const far: Building[] = [];
  for (const side of [-1, 1]) {
    near.push(...rowOfBuildings(rng, side, BUILDINGS_START_X, [9, 15], [9, 24], [10, 22]));
    mid.push(...rowOfBuildings(rng, side, BUILDINGS_START_X + 20, [12, 20], [15, 48], [14, 28]));
    for (let i = 0; i < 90; i++) {
      const sx = range(rng, 16, 36);
      far.push({
        x: side * range(rng, 75, 400),
        z: range(rng, -1350, 1350),
        sx,
        sz: range(rng, 16, 36),
        h: range(rng, 30, 110),
      });
    }
  }

  const color = new THREE.Color();
  const geometries = [...near, ...mid, ...far].map((b) => {
    color.set(pick(rng, PAINTS)).multiplyScalar(range(rng, 0.78, 1));
    return buildingGeometry(b, color);
  });

  const tanks: THREE.BufferGeometry[] = [];
  for (const b of [...near, ...mid]) {
    if (rng() < 0.4) continue;
    const count = 1 + Math.floor(rng() * 3);
    for (let i = 0; i < count; i++) {
      const r = range(rng, 0.6, 0.95);
      const h = range(rng, 1.1, 1.6);
      tanks.push(
        new THREE.CylinderGeometry(r, r, h, 12).translate(
          b.x + range(rng, -b.sx / 2 + r, b.sx / 2 - r),
          b.h + h / 2,
          b.z + range(rng, -b.sz / 2 + r, b.sz / 2 - r),
        ),
      );
    }
  }

  return [
    staticMesh(mergeAll(geometries), m.building, { name: "buildings" }),
    staticMesh(mergeAll(tanks), m.tank, { name: "water-tanks" }),
  ];
}

/** Line-side settlements with blue tarpaulin roofs. */
export function buildShanties(m: WorldMaterials): THREE.Object3D {
  const rng = mulberry32(1992);
  const parts: THREE.BufferGeometry[] = [];
  for (const side of [-1, 1]) {
    let z = -TRACK_HALF + 5;
    while (z < TRACK_HALF - 5) {
      const w = range(rng, 2.4, 4.2);
      const zc = z + w / 2;
      z += w + range(rng, 0.1, 0.8);
      if (nearFootbridge(zc) || rng() < 0.12) continue;
      const d = range(rng, 2.5, SHANTY_STRIP.outer - SHANTY_STRIP.inner - 0.6);
      const h = range(rng, 2.2, 3.3);
      const x = side * (SHANTY_STRIP.inner + d / 2 + range(rng, 0, 0.5));
      parts.push(paint(new THREE.BoxGeometry(d, h, w).translate(x, h / 2, zc), pick(rng, SHANTY_WALLS)));
      const roof = new THREE.BoxGeometry(d + 0.4, 0.1, w + 0.3);
      roof.rotateZ(side * range(rng, 0.03, 0.12));
      parts.push(paint(roof.translate(x, h + 0.06, zc), pick(rng, SHANTY_ROOFS)));
    }
  }
  return staticMesh(mergeAll(parts), m.shanty, { name: "shanties" });
}

function palmTemplate(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const height = 8;
  parts.push(paint(new THREE.CylinderGeometry(0.15, 0.24, height, 7, 1).translate(0, height / 2, 0), "#6e5a45"));
  const fronds = 9;
  for (let i = 0; i < fronds; i++) {
    const frond = new THREE.PlaneGeometry(0.7, 3.4, 1, 6);
    const pos = frond.getAttribute("position");
    for (let k = 0; k < pos.count; k++) {
      const along = pos.getY(k) + 1.7; // 0..3.4 outward
      const t = along / 3.4;
      const across = pos.getX(k) * (1 - t * 0.75);
      pos.setXYZ(k, along, t * 0.5 - t * t * 1.7, across);
    }
    frond.computeVertexNormals();
    frond.rotateZ(0.15);
    frond.rotateY((i / fronds) * Math.PI * 2 + i * 0.3);
    parts.push(paint(frond.translate(0, height, 0), i % 2 ? "#4f7a2f" : "#5f8a35"));
  }
  return mergeAll(parts);
}

/** Rain trees and coconut palms along the line. */
export function buildTrees(m: WorldMaterials): THREE.Object3D[] {
  const rng = mulberry32(2611);
  const trees: THREE.BufferGeometry[] = [];
  const palms: THREE.BufferGeometry[] = [];
  const palm = palmTemplate();
  const matrix = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const euler = new THREE.Euler();
  const scale = new THREE.Vector3();
  const position = new THREE.Vector3();

  for (const side of [-1, 1]) {
    for (let z = -TRACK_HALF; z < TRACK_HALF; z += range(rng, 9, 22)) {
      if (nearFootbridge(z)) continue;
      const x = side * range(rng, TREE_STRIP.inner, TREE_STRIP.outer);
      if (rng() < 0.3) {
        euler.set(range(rng, -0.08, 0.08), rng() * Math.PI * 2, range(rng, -0.08, 0.08));
        const s = range(rng, 0.8, 1.2);
        matrix.compose(position.set(x, 0, z), quat.setFromEuler(euler), scale.set(s, s, s));
        palms.push(palm.clone().applyMatrix4(matrix));
        continue;
      }
      const trunkH = range(rng, 2.6, 4);
      const r = range(rng, 2.4, 4.4);
      trees.push(paint(new THREE.CylinderGeometry(0.2, 0.32, trunkH + 1, 6).translate(x, (trunkH + 1) / 2, z), "#5b4636"));
      const crown = new THREE.IcosahedronGeometry(1, 1);
      crown.scale(r, r * range(rng, 0.6, 0.8), r * range(rng, 0.85, 1.1));
      crown.translate(x, trunkH + r * 0.5, z);
      trees.push(paint(crown, pick(rng, LEAVES)));
    }
  }
  palm.dispose();

  return [
    staticMesh(mergeAll(trees), m.foliage, { name: "trees" }),
    staticMesh(mergeAll(palms), m.palm, { name: "palms" }),
  ];
}
