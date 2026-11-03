import * as THREE from "three";
import { COACH_LENGTH } from "./TrainConfig";

// Coach cross-section (x = across, y = up). Slight tumblehome + curved roof.
function outerProfile(path: THREE.Shape | THREE.Path) {
  path.moveTo(-1.7, 1.05);
  path.lineTo(1.7, 1.05);
  path.lineTo(1.83, 1.45);
  path.lineTo(1.83, 3.45);
  path.quadraticCurveTo(1.83, 3.86, 1.35, 3.98);
  path.quadraticCurveTo(0, 4.13, -1.35, 3.98);
  path.quadraticCurveTo(-1.83, 3.86, -1.83, 3.45);
  path.lineTo(-1.83, 1.45);
  path.lineTo(-1.7, 1.05);
}

function innerProfile(path: THREE.Path) {
  path.moveTo(-1.62, 1.12);
  path.lineTo(-1.76, 1.5);
  path.lineTo(-1.76, 3.42);
  path.quadraticCurveTo(-1.76, 3.78, -1.3, 3.9);
  path.quadraticCurveTo(0, 4.04, 1.3, 3.9);
  path.quadraticCurveTo(1.76, 3.78, 1.76, 3.42);
  path.lineTo(1.76, 1.5);
  path.lineTo(1.62, 1.12);
  path.lineTo(-1.62, 1.12);
}

function rectHole(x0: number, x1: number, y0: number, y1: number) {
  const p = new THREE.Path();
  p.moveTo(x0, y0);
  p.lineTo(x0, y1);
  p.lineTo(x1, y1);
  p.lineTo(x1, y0);
  p.lineTo(x0, y0);
  return p;
}

export const WINDSHIELD = { x0: 0.1, x1: 1.45, y0: 2.35, y1: 3.38 };

function makeWheel() {
  const pts = [
    [0, -0.05],
    [0.12, -0.05],
    [0.16, -0.035],
    [0.4, -0.035],
    [0.45, -0.065],
    [0.46, -0.065],
    [0.466, 0.02],
    [0.5, 0.04],
    [0.505, 0.055],
    [0.49, 0.065],
    [0.42, 0.06],
    [0.16, 0.04],
    [0.12, 0.07],
    [0, 0.07],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const g = new THREE.LatheGeometry(pts, 36);
  g.computeVertexNormals();
  return g;
}

let cache: ReturnType<typeof makeGeometries> | null = null;

export function getGeometries() {
  return (cache ??= makeGeometries());
}

export function geometryByKey(key: string): THREE.BufferGeometry {
  return (getGeometries() as Record<string, THREE.BufferGeometry>)[key]!;
}

function makeGeometries() {
  const outer = new THREE.Shape();
  outerProfile(outer);

  const shell = new THREE.Shape();
  outerProfile(shell);
  const hole = new THREE.Path();
  innerProfile(hole);
  shell.holes.push(hole);

  const body = new THREE.ExtrudeGeometry(shell, { depth: COACH_LENGTH, bevelEnabled: false, curveSegments: 14 });
  body.translate(0, 0, -COACH_LENGTH / 2);
  body.computeVertexNormals();

  const endplate = new THREE.ShapeGeometry(outer, 14);

  const cabShape = new THREE.Shape();
  outerProfile(cabShape);
  const w = WINDSHIELD;
  cabShape.holes.push(rectHole(w.x0, w.x1, w.y0, w.y1), rectHole(-w.x1, -w.x0, w.y0, w.y1));
  const endplateCab = new THREE.ShapeGeometry(cabShape, 14);

  const gangDoor = new THREE.Shape();
  outerProfile(gangDoor);
  gangDoor.holes.push(rectHole(-0.45, 0.45, 1.15, 3.2));
  const endplateGangway = new THREE.ShapeGeometry(gangDoor, 14);

  return {
    body,
    endplate,
    endplateCab,
    endplateGangway,
    box: new THREE.BoxGeometry(1, 1, 1),
    cyl: new THREE.CylinderGeometry(1, 1, 1, 24),
    cylLow: new THREE.CylinderGeometry(1, 1, 1, 10),
    sphere: new THREE.SphereGeometry(1, 16, 12),
    ring: new THREE.TorusGeometry(1, 0.14, 6, 18),
    wheel: makeWheel(),
    disc: new THREE.CircleGeometry(1, 28),
  };
}
