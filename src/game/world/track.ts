import * as THREE from "three";
import { mulberry32, range } from "../core/random";
import { extrudeZ, mergeAll, rectShape, staticMesh } from "./geometry";
import {
  BALLAST,
  BOUNDARY_X,
  RAIL,
  RAIL_BASE_Y,
  RAIL_OFFSET,
  RAIL_TOP_Y,
  SLEEPER,
  TRACK_HALF,
  TRACK_LENGTH,
  TRACK_X,
} from "./layout";
import type { WorldMaterials } from "./materials";

const GROUND_SIZE = 2800;
const GROUND_TILE = 75;
const TRACKBED_WIDTH = 34;
const TRACKBED_TILE = 8;
const WALL = { height: 2.4, thickness: 0.25 } as const;

export function buildGround(m: WorldMaterials): THREE.Object3D[] {
  m.ground.map?.repeat.set(GROUND_SIZE / GROUND_TILE, GROUND_SIZE / GROUND_TILE);
  const ground = staticMesh(
    new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE).rotateX(-Math.PI / 2),
    m.ground,
    { cast: false, name: "ground" },
  );

  const bedLength = TRACK_LENGTH + 40;
  m.trackbed.map?.repeat.set(TRACKBED_WIDTH / TRACKBED_TILE, bedLength / TRACKBED_TILE);
  const bed = staticMesh(
    new THREE.PlaneGeometry(TRACKBED_WIDTH, bedLength).rotateX(-Math.PI / 2).translate(0, 0.02, 0),
    m.trackbed,
    { cast: false, name: "trackbed" },
  );

  const walls = staticMesh(
    mergeAll(
      [-1, 1].map((side) =>
        extrudeZ(rectShape(side * BOUNDARY_X - WALL.thickness / 2, 0, WALL.thickness, WALL.height), TRACK_LENGTH),
      ),
    ),
    m.wall,
    { name: "boundary-walls" },
  );
  return [ground, bed, walls];
}

export function buildBallast(m: WorldMaterials): THREE.Object3D {
  const top = BALLAST.topWidth / 2;
  const bottom = BALLAST.bottomWidth / 2;
  const geometries = TRACK_X.map((x) => {
    const s = new THREE.Shape();
    s.moveTo(x - bottom, 0);
    s.lineTo(x + bottom, 0);
    s.lineTo(x + top, BALLAST.height);
    s.lineTo(x - top, BALLAST.height);
    s.closePath();
    return extrudeZ(s, TRACK_LENGTH);
  });
  return staticMesh(mergeAll(geometries), m.ballast, { cast: false, name: "ballast" });
}

export function buildSleepers(m: WorldMaterials): THREE.Object3D {
  const perTrack = Math.floor(TRACK_LENGTH / SLEEPER.spacing);
  const geometry = new THREE.BoxGeometry(SLEEPER.length, SLEEPER.height, SLEEPER.width);
  const mesh = new THREE.InstancedMesh(geometry, m.sleeper, perTrack * TRACK_X.length);
  mesh.name = "sleepers";
  const rng = mulberry32(77);
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  let i = 0;
  for (const x of TRACK_X) {
    for (let k = 0; k < perTrack; k++) {
      dummy.position.set(x + range(rng, -0.02, 0.02), SLEEPER.centerY, -TRACK_HALF + (k + 0.5) * SLEEPER.spacing);
      dummy.rotation.set(0, range(rng, -0.012, 0.012), 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      const shade = range(rng, 0.82, 1.05);
      mesh.setColorAt(i, color.setRGB(shade, shade * 0.98, shade * 0.95));
      i++;
    }
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.computeBoundingSphere();
  return mesh;
}

/** Flat-bottom rail profile (foot, web, head), origin at rail foot centre. */
function railProfile(): THREE.Shape {
  const fw = RAIL.footWidth / 2;
  const ww = RAIL.webWidth / 2;
  const hw = RAIL.headWidth / 2;
  const h = RAIL.height;
  const foot = 0.012;
  const head = 0.045;
  const s = new THREE.Shape();
  s.moveTo(-fw, 0);
  s.lineTo(fw, 0);
  s.lineTo(fw, foot);
  s.lineTo(ww, foot + 0.022);
  s.lineTo(ww, h - head);
  s.lineTo(hw, h - head + 0.01);
  s.lineTo(hw, h);
  s.lineTo(-hw, h);
  s.lineTo(-hw, h - head + 0.01);
  s.lineTo(-ww, h - head);
  s.lineTo(-ww, foot + 0.022);
  s.lineTo(-fw, foot);
  s.closePath();
  return s;
}

export function buildRails(m: WorldMaterials): THREE.Object3D[] {
  const profile = railProfile();
  const rails: THREE.BufferGeometry[] = [];
  const heads: THREE.BufferGeometry[] = [];
  for (const x of TRACK_X) {
    for (const side of [-1, 1]) {
      const rx = x + side * RAIL_OFFSET;
      rails.push(extrudeZ(profile, TRACK_LENGTH).translate(rx, RAIL_BASE_Y, 0));
      heads.push(
        new THREE.PlaneGeometry(RAIL.headWidth * 0.8, TRACK_LENGTH)
          .rotateX(-Math.PI / 2)
          .translate(rx, RAIL_TOP_Y + 0.001, 0),
      );
    }
  }
  return [
    staticMesh(mergeAll(rails), m.rail, { cast: false, name: "rails" }),
    staticMesh(mergeAll(heads), m.railHead, { cast: false, name: "rail-heads" }),
  ];
}
