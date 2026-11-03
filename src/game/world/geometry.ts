import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const KEEP = new Set(["position", "normal", "uv", "color"]);

/** Merges geometries into one draw call, normalising index and attributes. */
export function mergeAll(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  if (geometries.length === 0) throw new Error("Nothing to merge");
  const nonIndexed = geometries.some((g) => !g.index);
  const withColor = geometries.some((g) => g.getAttribute("color"));
  const prepared = geometries.map((source) => {
    const geo = nonIndexed && source.index ? source.toNonIndexed() : source;
    for (const name of Object.keys(geo.attributes)) if (!KEEP.has(name)) geo.deleteAttribute(name);
    if (withColor && !geo.getAttribute("color")) paint(geo, 0xffffff);
    if (!geo.getAttribute("uv")) {
      geo.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(geo.getAttribute("position").count * 2), 2));
    }
    return geo;
  });
  const merged = mergeGeometries(prepared, false);
  if (!merged) throw new Error("Geometry merge failed");
  new Set([...geometries, ...prepared]).forEach((g) => g.dispose());
  merged.computeBoundingSphere();
  return merged;
}

/** Adds (or overwrites) a flat vertex colour. */
export function paint(geo: THREE.BufferGeometry, color: THREE.ColorRepresentation): THREE.BufferGeometry {
  const c = new THREE.Color(color);
  const count = geo.getAttribute("position").count;
  const data = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    data[i * 3] = c.r;
    data[i * 3 + 1] = c.g;
    data[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.Float32BufferAttribute(data, 3));
  return geo;
}

/** Box positioned in world space. */
export function box(w: number, h: number, d: number, x: number, y: number, z: number): THREE.BufferGeometry {
  return new THREE.BoxGeometry(w, h, d).translate(x, y, z);
}

/** Rectangle cross-section shape (x0,y0 bottom-left). */
export function rectShape(x0: number, y0: number, w: number, h: number): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(x0, y0);
  s.lineTo(x0 + w, y0);
  s.lineTo(x0 + w, y0 + h);
  s.lineTo(x0, y0 + h);
  s.closePath();
  return s;
}

/**
 * Extrudes a cross-section along Z, centred on z = 0. ExtrudeGeometry's world
 * UVs are in metres, so tiling textures stay at true scale.
 */
export function extrudeZ(shape: THREE.Shape, length: number, centerZ = 0): THREE.BufferGeometry {
  const geo = new THREE.ExtrudeGeometry(shape, { depth: length, bevelEnabled: false, steps: 1, curveSegments: 1 });
  geo.translate(0, 0, centerZ - length / 2);
  return geo;
}

/**
 * Projects UVs from world-space position by dominant normal axis, in units
 * of `tile` metres. Use after positioning so patterns stay continuous.
 */
export function projectUV(geo: THREE.BufferGeometry, tile: number): THREE.BufferGeometry {
  const pos = geo.getAttribute("position");
  const nor = geo.getAttribute("normal");
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const ax = Math.abs(nor.getX(i));
    const ay = Math.abs(nor.getY(i));
    const az = Math.abs(nor.getZ(i));
    let u: number;
    let v: number;
    if (ax >= ay && ax >= az) {
      u = pos.getZ(i);
      v = pos.getY(i);
    } else if (ay >= az) {
      u = pos.getX(i);
      v = pos.getZ(i);
    } else {
      u = pos.getX(i);
      v = pos.getY(i);
    }
    uv[i * 2] = u / tile;
    uv[i * 2 + 1] = v / tile;
  }
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  return geo;
}

/** A cylinder between two points. */
export function strut(
  a: THREE.Vector3,
  b: THREE.Vector3,
  radius: number,
  radialSegments = 6,
): THREE.BufferGeometry {
  const dir = new THREE.Vector3().subVectors(b, a);
  const length = dir.length();
  const geo = new THREE.CylinderGeometry(radius, radius, length, radialSegments, 1, true);
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  geo.applyQuaternion(quat);
  const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
  geo.translate(mid.x, mid.y, mid.z);
  return geo;
}

export function staticMesh(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  options: { cast?: boolean; receive?: boolean; name?: string } = {},
): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = options.cast ?? true;
  mesh.receiveShadow = options.receive ?? true;
  mesh.matrixAutoUpdate = false;
  mesh.updateMatrix();
  if (options.name) mesh.name = options.name;
  return mesh;
}
