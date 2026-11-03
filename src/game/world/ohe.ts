import * as THREE from "three";
import { box, mergeAll, projectUV, staticMesh, strut } from "./geometry";
import { OHE, TRACK_HALF, TRACK_X, messengerHeightAt, ohePortalZs } from "./layout";
import type { WorldMaterials } from "./materials";

/** Overhead equipment: lattice portal gantries spanning all four tracks. */
export function buildOheStructures(m: WorldMaterials): THREE.Object3D[] {
  const lattice: THREE.BufferGeometry[] = [];
  const fittings: THREE.BufferGeometry[] = [];
  const mastSize = 0.36;
  const beamSize = 0.5;
  const span = OHE.mastX * 2 + mastSize;

  for (const z of ohePortalZs()) {
    for (const side of [-1, 1]) {
      lattice.push(projectUV(box(mastSize, OHE.mastHeight, mastSize, side * OHE.mastX, OHE.mastHeight / 2, z), mastSize));
      fittings.push(box(0.7, 0.3, 0.7, side * OHE.mastX, 0.15, z));
    }
    lattice.push(projectUV(box(span, beamSize, mastSize, 0, OHE.beamY, z), beamSize));

    for (const x of TRACK_X) {
      const top = new THREE.Vector3(x, OHE.beamY - beamSize / 2, z);
      const bottom = new THREE.Vector3(x, OHE.contactY + 0.25, z);
      fittings.push(strut(top, bottom, 0.045, 6));
      fittings.push(
        strut(new THREE.Vector3(x, OHE.contactY + 0.25, z), new THREE.Vector3(x + 0.9, OHE.contactY + 0.05, z), 0.025, 5),
      );
      fittings.push(new THREE.CylinderGeometry(0.07, 0.07, 0.35, 8).translate(x, OHE.messengerSupportY + 0.25, z));
    }
  }

  return [
    staticMesh(mergeAll(lattice), m.lattice, { name: "ohe-portals" }),
    staticMesh(mergeAll(fittings), m.steel, { name: "ohe-fittings" }),
  ];
}

/** Catenary: sagging messenger wire, level contact wire and droppers per track. */
export function buildOheWires(m: WorldMaterials): THREE.Object3D {
  const wires: THREE.BufferGeometry[] = [];
  const step = OHE.spacing / 20;

  for (const x of TRACK_X) {
    const points: THREE.Vector3[] = [];
    for (let z = -TRACK_HALF; z <= TRACK_HALF + 1e-6; z += step) points.push(new THREE.Vector3(x, messengerHeightAt(z), z));
    wires.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), points.length, 0.011, 4, false));

    wires.push(
      new THREE.CylinderGeometry(0.013, 0.013, TRACK_HALF * 2, 5, 1, true)
        .rotateX(Math.PI / 2)
        .translate(x, OHE.contactY, 0),
    );

    for (let z = -TRACK_HALF + OHE.dropperSpacing / 2; z < TRACK_HALF; z += OHE.dropperSpacing) {
      wires.push(
        strut(new THREE.Vector3(x, OHE.contactY, z), new THREE.Vector3(x, messengerHeightAt(z), z), 0.005, 3),
      );
    }
  }
  return staticMesh(mergeAll(wires), m.wire, { cast: false, receive: false, name: "ohe-wires" });
}
