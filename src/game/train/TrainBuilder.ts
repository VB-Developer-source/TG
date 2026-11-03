import * as THREE from "three";
import { PartBuilder, type V3 } from "./PartBuilder";
import {
  BOGIE_OFFSET,
  CAB_DEPTH,
  COACH_LENGTH,
  DOOR_Z,
  PANTOGRAPH_Z,
  RAIL_HALF_GAUGE,
  WHEEL_RADIUS,
  WINDOW_Z,
  type CoachSpec,
  type LiveryId,
  type Livery,
  LIVERIES,
  buildTrainLayout,
  coachZ,
  FRONT_FACE_Z,
  REAR_FACE_Z,
} from "./TrainConfig";
import { WINDSHIELD, getGeometries, geometryByKey } from "./geometries";
import {
  createMaterials,
  materialByKey,
  applyLivery,
  applyLights,
  disposeMaterials,
  type MaterialSet,
} from "./materials";
import { coachLabelTexture, routeLettersTexture } from "./textures";
import { RAIL_TOP_Y } from "../world/layout";
import { trainRuntime, useTrainStore, type LightState } from "./store";
import type { TrackPath } from "./TrackPath";

const HL = COACH_LENGTH / 2;
const SIDES = [1, -1] as const;
const NO_SHADOW = new Set(["glass", "winIn", "tube", "dest", "pis", "partition"]);

export interface DoorLeafSlot {
  coachIndex: number;
  coach: THREE.Matrix4;
  side: number;
  z: number;
  dir: number;
}

export interface AxleSlot {
  coachIndex: number;
  bogieType: "front" | "rear";
  axleZ: number;
  matrix: THREE.Matrix4;
}

export interface TrainParts {
  builder: PartBuilder;
  leaves: DoorLeafSlot[];
  axles: AxleSlot[];
  coachMatrices: THREE.Matrix4[];
}

export interface TrainBuilderOptions {
  cars?: number;
  liveryId?: LiveryId;
  trackX?: number;
  startZ?: number;
  trackY?: number;
}

export function coachMatrix(c: CoachSpec): THREE.Matrix4 {
  const m = new THREE.Matrix4().makeTranslation(0, 0, c.z);
  if (c.flipped) m.multiply(new THREE.Matrix4().makeRotationY(Math.PI));
  return m;
}

/** Build every static part of the EMU rake into shared instanced batches with coach/bogie attachments. */
export function buildTrain(layout: CoachSpec[]): TrainParts {
  const b = new PartBuilder();
  const leaves: DoorLeafSlot[] = [];
  const axles: AxleSlot[] = [];
  const coachMatrices: THREE.Matrix4[] = [];

  for (const c of layout) {
    const cm = coachMatrix(c);
    coachMatrices.push(cm);

    // 1. Coach Car Body (shell, sides, interior, roof, underframe, cab)
    const coachStraightOffset = new THREE.Matrix4().makeTranslation(0, 0, c.z);
    if (c.flipped) coachStraightOffset.multiply(new THREE.Matrix4().makeRotationY(Math.PI));

    b.withinAttachment({ type: "coach", coachIndex: c.index }, coachStraightOffset, () => {
      buildShell(b, c);
      buildSides(b, c);
      buildInterior(b, c);
      buildRoof(b, c);
      buildUnderframe(b, c);
      if (c.cab) buildCab(b, c.role === "cab-front");
      buildEnd(b, -1);
      if (!c.cab) buildEnd(b, 1);
    });

    // Door leaves slots
    for (const side of SIDES) {
      for (const z of DOOR_Z) {
        for (const dir of [1, -1]) {
          leaves.push({ coachIndex: c.index, coach: cm, side, z, dir });
        }
      }
    }

    // 2. Bogies and Axles (Swiveling independent bogies along track)
    // Front Bogie (positioned +BOGIE_OFFSET ahead along track)
    const fbZ = c.z + BOGIE_OFFSET;
    const fbOffset = new THREE.Matrix4().makeTranslation(0, 0, fbZ);
    b.withinAttachment({ type: "frontBogie", coachIndex: c.index }, fbOffset, () => {
      buildBogie(b, c.motor);
    });
    for (const az of [1.3, -1.3]) {
      axles.push({
        coachIndex: c.index,
        bogieType: "front",
        axleZ: az,
        matrix: fbOffset.clone().multiply(new THREE.Matrix4().makeTranslation(0, WHEEL_RADIUS, az)),
      });
    }

    // Rear Bogie (positioned -BOGIE_OFFSET behind along track)
    const rbZ = c.z - BOGIE_OFFSET;
    const rbOffset = new THREE.Matrix4().makeTranslation(0, 0, rbZ);
    b.withinAttachment({ type: "rearBogie", coachIndex: c.index }, rbOffset, () => {
      buildBogie(b, c.motor);
    });
    for (const az of [1.3, -1.3]) {
      axles.push({
        coachIndex: c.index,
        bogieType: "rear",
        axleZ: az,
        matrix: rbOffset.clone().multiply(new THREE.Matrix4().makeTranslation(0, WHEEL_RADIUS, az)),
      });
    }
  }

  return { builder: b, leaves, axles, coachMatrices };
}

function buildShell(b: PartBuilder, c: CoachSpec) {
  b.add("body", "body", [0, 0, 0]);
  b.add("endplate", "body", [0, 0, -HL], [1, 1, 1], [0, Math.PI, 0]);
  if (c.cab) b.add("endplateCab", "front", [0, 0, HL]);
  else b.add("endplateGangway", "body", [0, 0, HL]);

  // body-side belt lines
  for (const s of SIDES) {
    b.box("band", [s * 1.836, 1.74, 0], [0.012, 0.52, COACH_LENGTH - 0.02]);
    b.box("bandThin", [s * 1.836, 3.33, 0], [0.012, 0.16, COACH_LENGTH - 0.02]);

    // rain gutter
    b.cyl("frame", [s * 1.7, 3.84, 0], 0.025, COACH_LENGTH, [Math.PI / 2, 0, 0], "cylLow");
  }

  // cab front colour wraps onto the sides
  if (c.cab) {
    for (const s of SIDES) b.box("front", [s * 1.834, 2.5, HL - 0.6], [0.012, 2.8, 1.2]);
  }
}

function buildSides(b: PartBuilder, c: CoachSpec) {
  const windows = c.cab ? WINDOW_Z.filter((z) => z < HL - CAB_DEPTH) : WINDOW_Z;

  for (const s of SIDES) {
    for (const z of windows) {
      b.box("frame", [s * 1.838, 2.55, z], [0.012, 1.06, 1.22]);
      b.box("winOut", [s * 1.844, 2.55, z], [0.01, 0.95, 1.1]);
      b.box("winIn", [s * 1.728, 2.55, z], [0.01, 0.95, 1.1]);
    }

    for (const z of DOOR_Z) {
      b.box("doorway", [s * 1.846, 2.225, z], [0.01, 2.05, 1.36]);
      for (const e of [1, -1]) {
        b.box("yellow", [s * 1.852, 2.225, z + e * 0.74], [0.014, 2.12, 0.07]);
        b.cyl("stainless", [s * 1.9, 2.3, z + e * 0.86], 0.016, 1.1, undefined, "cylLow");
        b.box("stainless", [s * 1.88, 2.85, z + e * 0.86], [0.04, 0.03, 0.03]);
        b.box("stainless", [s * 1.88, 1.75, z + e * 0.86], [0.04, 0.03, 0.03]);
      }
      b.box("hazard", [s * 1.79, 1.205, z], [0.14, 0.02, 1.36]);
      // iconic centre pole in the doorway
      b.cyl("stainless", [s * 1.6, 2.2, z], 0.02, 2.1, undefined, "cylLow");
      // footstep under the door
      b.box("underframe", [s * 1.8, 0.95, z], [0.18, 0.05, 1.3]);
    }

    if (c.cab) {
      // driver side door + window
      b.box("black", [s * 1.84, 2.25, HL - 1.55], [0.012, 2.0, 0.72]);
      b.box("winOut", [s * 1.846, 2.75, HL - 1.55], [0.01, 0.7, 0.55]);
      b.box("winOut", [s * 1.846, 2.75, HL - 0.55], [0.01, 0.7, 0.6]);
      b.cyl("stainless", [s * 1.9, 2.1, HL - 1.98], 0.016, 1.2, undefined, "cylLow");
      for (const y of [0.55, 0.85]) b.box("stainless", [s * 1.85, y, HL - 1.55], [0.2, 0.03, 0.5]);
    }
  }
}

function buildInterior(b: PartBuilder, c: CoachSpec) {
  const inner = c.cab ? HL - CAB_DEPTH : HL;

  b.box("floor", [0, 1.15, (inner - HL) / 2], [3.5, 0.04, inner + HL - 0.05]);
  b.box("interior", [0, 3.82, (inner - HL) / 2], [2.9, 0.03, inner + HL - 0.05]);
  for (const s of SIDES) b.box("interior", [s * 1.735, 3.05, 0], [0.015, 1.4, COACH_LENGTH - 0.1]);

  const segments: [number, number][] = [
    [-HL + 0.4, DOOR_Z[0]! - 0.8],
    [DOOR_Z[0]! + 0.8, DOOR_Z[1]! - 0.8],
    [DOOR_Z[1]! + 0.8, DOOR_Z[2]! - 0.8],
    [DOOR_Z[2]! + 0.8, inner - 0.3],
  ];

  for (const [z0, z1] of segments) {
    const len = z1 - z0;
    const zc = (z0 + z1) / 2;
    for (const s of SIDES) {
      b.box("seat", [s * 1.47, 1.66, zc], [0.5, 0.08, len]);
      b.box("seat", [s * 1.68, 2.02, zc], [0.07, 0.62, len], [0, 0, s * 0.08]);
      b.box("seatFrame", [s * 1.48, 1.4, zc], [0.42, 0.44, len - 0.05]);
      b.cyl("stainless", [s * 1.66, 2.36, zc], 0.025, len, [Math.PI / 2, 0, 0], "cylLow");
      // luggage rack
      b.box("seatFrame", [s * 1.5, 3.3, zc], [0.4, 0.025, len]);
    }
  }

  for (let z = -HL + 1.2; z < inner - 0.6; z += 2.2) {
    for (const s of SIDES) b.box("tube", [s * 0.95, 3.79, z], [0.09, 0.04, 1.25]);
  }

  if (!c.detailedInterior) return;

  // detailed fittings for the inspectable coaches
  for (const s of SIDES) {
    b.cyl("stainless", [s * 0.72, 3.45, (inner - HL) / 2], 0.018, inner + HL - 0.4, [Math.PI / 2, 0, 0], "cylLow");
    for (const [z0, z1] of segments) {
      for (let z = z0 + 0.3; z < z1; z += 0.45) {
        b.cyl("strap", [s * 0.72, 3.3, z], 0.012, 0.3, undefined, "cylLow");
        b.add("ring", "strap", [s * 0.72, 3.08, z], [0.075, 0.075, 0.075], [0, Math.PI / 2, 0]);
      }
      for (const z of [z0, z1]) {
        b.cyl("stainless", [s * 1.2, 2.45, z], 0.02, 2.7, undefined, "cylLow");
        b.box("partition", [s * 1.45, 2.25, z], [0.55, 1.1, 0.02]);
      }
    }
    for (const z of DOOR_Z) {
      b.box("pis", [s * 1.71, 3.5, z], [0.02, 0.16, 0.85]);
    }
  }

  for (const z of [-8.2, -3.2, 3.2, c.cab ? -100 : 8.2]) {
    if (z < -50) continue;
    for (const x of [-0.6, 0.6]) {
      b.cyl("fan", [x, 3.74, z], 0.07, 0.1);
      b.add("ring", "stainless", [x, 3.68, z], [0.3, 0.3, 0.3], [Math.PI / 2, 0, 0]);
      b.add("ring", "stainless", [x, 3.64, z], [0.2, 0.2, 0.2], [Math.PI / 2, 0, 0]);
      for (let k = 0; k < 3; k++) {
        const a = (k / 3) * Math.PI * 2 + 0.4;
        b.box("fan", [x + Math.cos(a) * 0.22, 3.69, z + Math.sin(a) * 0.22], [0.38, 0.008, 0.09], [0.1, -a, 0]);
      }
    }
  }
}

function buildRoof(b: PartBuilder, c: CoachSpec) {
  const vents = c.motor ? [-1.5, 3.5, 7.5] : [-7.5, -2.5, 2.5, 7.5];
  for (const z of vents) {
    b.box("roof", [0, 4.13, z], [0.75, 0.13, 1.0]);
    b.box("black", [0, 4.13, z], [0.6, 0.135, 0.85]);
    b.box("roof", [0, 4.21, z], [0.85, 0.04, 1.1]);
  }

  if (c.cab) {
    for (const x of [-0.25, 0.25]) b.cyl("steel", [x, 4.12, HL - 0.6], 0.05, 0.3, [Math.PI / 2, 0, 0]);
  }

  if (c.motor) buildPantograph(b, PANTOGRAPH_Z);
}

export function buildPantograph(b: PartBuilder, pz: number) {
  // insulators with ceramic sheds
  for (const x of [-0.6, 0.6])
    for (const dz of [-0.65, 0.65]) {
      b.cyl("insulator", [x, 4.2, pz + dz], 0.05, 0.22);
      for (const y of [4.14, 4.2, 4.26]) b.cyl("insulator", [x, y, pz + dz], 0.09, 0.025);
    }

  b.box("bogie", [0, 4.34, pz], [1.4, 0.06, 1.45]);
  b.box("bogie", [0, 4.4, pz - 0.5], [0.9, 0.1, 0.18]);

  // single-arm pantograph, raised
  const hinge: V3 = [0, 4.42, pz - 0.5];
  const knee: V3 = [0, 5.05, pz + 0.75];
  const head: V3 = [0, 5.72, pz - 0.15];

  for (const x of [-0.18, 0.18]) b.rod("steel", [x, hinge[1], hinge[2]], [x * 0.4, knee[1], knee[2]], 0.035);
  b.rod("steel", knee, head, 0.03);
  b.rod("steel", [0, 4.42, pz - 0.2], [0, 5.05, pz + 0.7], 0.015);
  b.rod("spring", [0.25, 4.4, pz - 0.6], [0.1, 4.7, pz + 0.1], 0.04);

  b.box("carbon", [0, head[1] + 0.03, head[2]], [1.6, 0.05, 0.08]);
  b.box("copper", [0, head[1] + 0.06, head[2]], [1.5, 0.015, 0.06]);
  for (const s of SIDES) b.rod("steel", [s * 0.8, head[1] + 0.03, head[2]], [s * 1.0, head[1] - 0.12, head[2]], 0.012);
  b.rod("steel", [-0.6, head[1] - 0.02, head[2]], [0.6, head[1] - 0.02, head[2]], 0.012);

  // roof busbar and arrester
  b.cyl("copper", [0.3, 4.2, pz + 4], 0.03, 7, [Math.PI / 2, 0, 0], "cylLow");
  b.cyl("insulator", [-0.6, 4.25, pz + 1.6], 0.07, 0.3);
}

function buildUnderframe(b: PartBuilder, c: CoachSpec) {
  for (const s of SIDES) b.box("underframe", [s * 1.55, 0.98, 0], [0.12, 0.16, COACH_LENGTH - 0.2]);
  b.box("underframe", [0, 1.0, 0], [3.0, 0.08, COACH_LENGTH - 0.4]);

  if (c.motor) {
    b.box("underframe", [0.2, 0.68, -1.2], [2.5, 0.55, 4.6]);
    for (let z = -3.2; z <= 0.8; z += 0.5) b.box("black", [1.46, 0.68, z], [0.02, 0.45, 0.3]);
    b.box("bogie", [-0.6, 0.72, 2.8], [1.6, 0.45, 1.8]);
  } else {
    b.box("underframe", [0.4, 0.74, 0], [1.8, 0.42, 2.4]);
    b.box("bogie", [-0.8, 0.76, -2.6], [1.2, 0.36, 1.4]);
  }

  for (const x of [0.95, -0.95]) b.cyl("steel", [x, 0.72, 4.0], 0.2, 2.2, [Math.PI / 2, 0, 0]);
  b.rod("black", [-1.2, 0.86, -BOGIE_OFFSET], [-1.2, 0.86, BOGIE_OFFSET], 0.03);
  b.rod("copper", [1.2, 0.86, -BOGIE_OFFSET], [1.2, 0.86, BOGIE_OFFSET], 0.025);
}

export function buildBogie(b: PartBuilder, motor: boolean) {
  for (const s of SIDES) {
    const x = s * 1.02;
    b.box("bogie", [x, 0.62, 0], [0.16, 0.3, 3.3]);
    b.box("bogie", [x, 0.5, 0], [0.16, 0.18, 1.4]);
    for (const az of [1.3, -1.3]) {
      b.box("bogie", [x, WHEEL_RADIUS, az], [0.26, 0.24, 0.32]);
      b.cyl("spring", [x, 0.68, az], 0.11, 0.2);
      b.box("brake", [s * 0.86, 0.5, az - Math.sign(az) * 0.52], [0.09, 0.26, 0.14]);
      b.cyl("bogie", [s * 0.72, 0.62, az - Math.sign(az) * 0.7], 0.07, 0.22, [0, 0, Math.PI / 2]);
    }
    b.cyl("rubber", [x, 0.87, 0], 0.22, 0.18);
    b.rod("black", [s * 1.15, 0.6, 0.35], [s * 1.15, 0.95, 0.65], 0.04);
    b.box("yellow", [s * 1.1, 0.62, 1.66], [0.02, 0.1, 0.04]);
  }
  b.box("bogie", [0, 0.62, 0], [2.0, 0.22, 0.42]);
  for (const az of [0.55, -0.55]) b.box("bogie", [0, 0.6, az], [1.8, 0.1, 0.12]);

  if (motor)
    for (const az of [0.72, -0.72]) {
      b.box("underframe", [0, 0.5, az], [0.9, 0.42, 0.5]);
      b.cyl("bogie", [0.48, 0.5, az], 0.18, 0.12, [0, 0, Math.PI / 2]);
    }
}

function buildCab(b: PartBuilder, leading: boolean) {
  const f = HL;
  const w = WINDSHIELD;

  // windscreen glass + frames
  for (const s of SIDES) {
    const cx = (s * (w.x0 + w.x1)) / 2;
    b.box("glass", [cx, (w.y0 + w.y1) / 2, f + 0.01], [w.x1 - w.x0, w.y1 - w.y0, 0.015]);
    b.box("black", [cx, w.y1 + 0.03, f + 0.02], [w.x1 - w.x0 + 0.1, 0.06, 0.03]);
    b.box("black", [cx, w.y0 - 0.03, f + 0.02], [w.x1 - w.x0 + 0.1, 0.06, 0.03]);
    b.box("black", [s * (w.x1 + 0.03), (w.y0 + w.y1) / 2, f + 0.02], [0.06, w.y1 - w.y0 + 0.1, 0.03]);
    // wipers
    b.box("black", [cx + s * 0.1, w.y0 + 0.35, f + 0.04], [0.85, 0.022, 0.02], [0, 0, s * 0.75]);
    b.cyl("black", [cx + s * 0.4, w.y0 + 0.05, f + 0.04], 0.03, 0.04, [Math.PI / 2, 0, 0]);
    // small upper windows (ICF front)
    b.box("black", [s * 0.62, 3.62, f + 0.02], [0.95, 0.32, 0.03]);
    b.box("winOut", [s * 0.62, 3.62, f + 0.03], [0.85, 0.24, 0.01]);
    // rectangular headlamps in the black lamp band
    b.box("headOff", [s * 0.95, 1.82, f + 0.06], [0.42, 0.26, 0.04]);
    b.box(leading ? "headLead" : "headOff", [s * 0.95, 1.82, f + 0.085], [0.34, 0.18, 0.01]);
    for (const dx of [0.35, 0.5])
      b.cyl(leading ? "tailOff" : "tailOn", [s * dx, dx === 0.35 ? 1.92 : 1.72, f + 0.065], 0.04, 0.02, [Math.PI / 2, 0, 0], "cylLow");
    // roof horns
    b.cyl("band", [s * 0.4, 4.15, f - 0.3], 0.04, 0.25, [Math.PI / 2, 0, 0], "cylLow");
    b.cyl("band", [s * 0.4, 4.15, f - 0.16], 0.09, 0.06, [Math.PI / 2, 0, 0]);
    // white lower surround
    b.box("body", [s * 1.4, 1.35, f + 0.015], [0.86, 0.5, 0.02]);
  }

  b.box("black", [0, 1.82, f + 0.04], [2.9, 0.42, 0.04]);
  b.box("body", [0, 1.18, f + 0.015], [3.4, 0.25, 0.02]);
  b.box("band", [0, 1.42, f + 0.017], [3.5, 0.12, 0.02]);
  b.box("front", [0, (w.y0 + w.y1) / 2, f + 0.02], [0.2, w.y1 - w.y0 + 0.1, 0.04]);

  // destination board between the upper windows
  b.box("dest", [0, 3.88, f + 0.03], [0.9, 0.16, 0.01]);

  // lower front: hazard stripe, buffer beam, coupler, pilot
  b.box("underframe", [0, 1.05, f + 0.12], [3.3, 0.3, 0.26]);
  b.cyl("bogie", [0, 0.95, f + 0.42], 0.1, 0.5, [Math.PI / 2, 0, 0]);
  b.box("black", [0, 0.95, f + 0.7], [0.32, 0.26, 0.12]);
  b.box("underframe", [0, 0.42, f + 0.3], [2.6, 0.5, 0.06], [-0.35, 0, 0]);

  for (const s of SIDES) {
    b.rod("black", [s * 0.5, 0.75, f + 0.15], [s * 0.9, 0.3, f + 0.36], 0.03);
    b.cyl("rubber", [s * 0.7, 0.85, f + 0.28], 0.05, 0.25, [Math.PI / 2, 0, 0]);
    b.cyl("stainless", [s * 0.4, 1.95, f + 0.07], 0.015, 0.4, [0, 0, Math.PI / 2], "cylLow");
  }

  // driver cabin interior
  const pz = f - CAB_DEPTH;
  b.box("interior", [0, 2.45, pz], [3.48, 2.6, 0.05]);
  b.box("black", [-0.9, 2.15, pz + 0.03], [0.7, 1.95, 0.02]);
  b.box("floor", [0, 1.15, f - CAB_DEPTH / 2], [3.5, 0.04, CAB_DEPTH]);
  b.box("interior", [0, 3.82, f - CAB_DEPTH / 2], [3.4, 0.03, CAB_DEPTH]);

  // desk
  b.box("desk", [0, 1.65, f - 0.45], [3.4, 1.0, 0.7]);
  b.box("panel", [0, 2.22, f - 0.6], [3.2, 0.06, 0.62], [-0.32, 0, 0]);

  // instruments in front of the motorman (left side, +x)
  b.box("speedo", [0.75, 2.27, f - 0.5], [0.26, 0.26, 0.01], [-1.25, 0, 0]);
  for (const x of [1.08, 0.42]) b.box("gauge", [x, 2.25, f - 0.47], [0.18, 0.18, 0.01], [-1.25, 0, 0]);
  b.box("panel", [-0.6, 2.26, f - 0.5], [0.8, 0.3, 0.02], [-1.25, 0, 0]);
  for (let i = 0; i < 6; i++)
    b.cyl(i % 3 === 0 ? "green" : i % 3 === 1 ? "amber" : "red", [-0.9 + i * 0.12, 2.3, f - 0.47], 0.025, 0.02, [0.3, 0, 0], "cylLow");

  // master controller (traction)
  b.box("black", [0.25, 2.3, f - 0.75], [0.16, 0.1, 0.25]);
  b.rod("steel", [0.25, 2.33, f - 0.72], [0.25, 2.52, f - 0.8], 0.018);
  b.add("sphere", "black", [0.25, 2.54, f - 0.81], [0.04, 0.04, 0.04]);

  // reverser key
  b.box("panel", [0.45, 2.3, f - 0.85], [0.12, 0.06, 0.12]);
  b.box("yellow", [0.45, 2.36, f - 0.85], [0.03, 0.08, 0.06]);

  // brake handle
  b.box("black", [1.2, 2.32, f - 0.78], [0.18, 0.1, 0.18]);
  b.rod("steel", [1.2, 2.36, f - 0.78], [1.32, 2.46, f - 0.9], 0.02);
  b.add("sphere", "red", [1.33, 2.47, f - 0.91], [0.045, 0.045, 0.045]);

  // horn push buttons
  for (const x of [1.42, -1.3]) b.cyl("yellow", [x, 2.3, f - 0.82], 0.035, 0.03, [0.3, 0, 0], "cylLow");

  // driver seat
  b.cyl("steel", [0.75, 1.4, f - 1.45], 0.05, 0.5);
  b.box("cabSeat", [0.75, 1.72, f - 1.45], [0.52, 0.1, 0.5]);
  b.box("cabSeat", [0.75, 2.1, f - 1.72], [0.5, 0.7, 0.08], [-0.12, 0, 0]);
  b.box("cabSeat", [-0.75, 1.72, f - 1.45], [0.45, 0.1, 0.45]);
  b.box("tube", [0, 3.79, f - 1.2], [0.6, 0.04, 0.1]);
}

function buildEnd(b: PartBuilder, end: number) {
  const z = end * HL;
  b.box("rubber", [0, 2.2, z + end * 0.18], [1.2, 2.25, 0.36]);
  for (const dy of [-0.9, -0.45, 0, 0.45, 0.9]) b.box("black", [0, 2.2 + dy, z + end * 0.18], [1.24, 0.04, 0.37]);
  b.box("doorway", [0, 2.2, z], [0.9, 2.05, 0.02]);
  b.cyl("bogie", [0, 0.95, z + end * 0.18], 0.09, 0.36, [Math.PI / 2, 0, 0]);
  b.box("black", [0, 0.95, z + end * 0.35], [0.24, 0.2, 0.04]);
  for (const s of SIDES) b.rod("rubber", [s * 0.8, 1.0, z], [s * 0.6, 0.9, z + end * 0.35], 0.03);
}

export class TrainBuilder {
  /**
   * Builds an authentic, high-fidelity Mumbai Suburban EMU rake with complete geometry,
   * modular coaches, sliding doors, rotating wheelsets, decals, and lighting rigs.
   */
  static buildRake(options: TrainBuilderOptions = {}): THREE.Group {
    const rake = new THREE.Group();
    rake.name = "mumbai-emu-rake";

    const cars = options.cars ?? 12;
    const liveryId = options.liveryId ?? "western";
    const livery = LIVERIES[liveryId] ?? LIVERIES.western;
    const trackX = options.trackX ?? 6.0;
    const trackY = options.trackY ?? RAIL_TOP_Y;
    const startZ = options.startZ ?? 20;

    const layout = buildTrainLayout(livery, cars);
    const parts = buildTrain(layout);
    const mats = createMaterials(livery);
    const geos = getGeometries();

    // 1. Static Instanced Batches
    const staticMeshes: THREE.InstancedMesh[] = [];
    const staticMeshEntries: { mesh: THREE.InstancedMesh; batchKey: string }[] = [];
    for (const [key, b] of parts.builder.batches.entries()) {
      const geo = geometryByKey(b.geo);
      const mat = materialByKey(mats, b.mat);
      const mesh = new THREE.InstancedMesh(geo, mat, b.matrices.length);
      mesh.name = `train-batch-${key}`;
      b.matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
      mesh.instanceMatrix.needsUpdate = true;
      mesh.castShadow = !NO_SHADOW.has(b.mat);
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;
      rake.add(mesh);
      staticMeshes.push(mesh);
      staticMeshEntries.push({ mesh, batchKey: key });
    }

    // 2. Sliding Door Leaves (Instanced, animated)
    const doorMesh = new THREE.InstancedMesh(geos.box, mats.leaf, parts.leaves.length);
    doorMesh.name = "train-door-leaves";
    doorMesh.castShadow = true;
    doorMesh.receiveShadow = true;
    doorMesh.frustumCulled = false;
    rake.add(doorMesh);

    const tmpDoor = {
      m: new THREE.Matrix4(),
      q: new THREE.Quaternion(),
      p: new THREE.Vector3(),
      s: new THREE.Vector3(0.03, 2.05, 0.68),
    };

    // Preallocated transforms for zero-allocation per-frame articulation
    const rotYPi = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
    const scaleOne = new THREE.Vector3(1, 1, 1);
    const identityQuat = new THREE.Quaternion();

    const activeCoachPos: THREE.Vector3[] = Array.from({ length: cars }, () => new THREE.Vector3());
    const activeCoachQuat: THREE.Quaternion[] = Array.from({ length: cars }, () => new THREE.Quaternion());
    const activeCoachMatrices: THREE.Matrix4[] = Array.from({ length: cars }, () => new THREE.Matrix4());
    const activeFrontBogieMatrices: THREE.Matrix4[] = Array.from({ length: cars }, () => new THREE.Matrix4());
    const activeRearBogieMatrices: THREE.Matrix4[] = Array.from({ length: cars }, () => new THREE.Matrix4());

    let isArticulated = false;

    const writeDoors = (p: number) => {
      parts.leaves.forEach((l, i) => {
        tmpDoor.p.set(l.side * 1.874, 2.225, l.z + l.dir * (0.34 + p * 0.66));
        tmpDoor.m.compose(tmpDoor.p, tmpDoor.q, tmpDoor.s);
        if (isArticulated) {
          tmpDoor.m.premultiply(activeCoachMatrices[l.coachIndex]);
        } else {
          tmpDoor.m.premultiply(l.coach);
        }
        doorMesh.setMatrixAt(i, tmpDoor.m);
      });
      doorMesh.instanceMatrix.needsUpdate = true;
    };
    writeDoors(0);

    // 3. Wheelsets (Wheels and Axles, instanced and rotating)
    const wheelsMesh = new THREE.InstancedMesh(geos.wheel, mats.steel, parts.axles.length * 2);
    wheelsMesh.name = "train-wheels";
    wheelsMesh.castShadow = true;
    wheelsMesh.frustumCulled = false;

    const axlesMesh = new THREE.InstancedMesh(geos.cyl, mats.bogie, parts.axles.length);
    axlesMesh.name = "train-axles";
    axlesMesh.castShadow = true;
    axlesMesh.frustumCulled = false;

    rake.add(wheelsMesh);
    rake.add(axlesMesh);

    const mkLocal = (x: number, rz: number) =>
      new THREE.Matrix4().compose(
        new THREE.Vector3(x, 0, 0),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, rz)),
        new THREE.Vector3(1, 1, 1),
      );

    const localWheelData = {
      wheels: [mkLocal(RAIL_HALF_GAUGE, Math.PI / 2), mkLocal(-RAIL_HALF_GAUGE, -Math.PI / 2)],
      axle: new THREE.Matrix4().compose(
        new THREE.Vector3(),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 2)),
        new THREE.Vector3(0.075, 2.05, 0.075),
      ),
    };

    const tmpRot = new THREE.Matrix4();
    const tmpMat = new THREE.Matrix4();
    const tmpAxlePos = new THREE.Vector3();
    const tmpAxleBase = new THREE.Matrix4();

    const writeWheels = (angle: number) => {
      tmpRot.makeRotationX(angle);
      parts.axles.forEach((a, i) => {
        if (isArticulated) {
          const bMat = a.bogieType === "front"
            ? activeFrontBogieMatrices[a.coachIndex]
            : activeRearBogieMatrices[a.coachIndex];
          tmpAxlePos.set(0, WHEEL_RADIUS, a.axleZ);
          tmpAxleBase.compose(tmpAxlePos, identityQuat, scaleOne).premultiply(bMat);

          localWheelData.wheels.forEach((w, k) => {
            tmpMat.copy(tmpAxleBase).multiply(tmpRot).multiply(w);
            wheelsMesh.setMatrixAt(i * 2 + k, tmpMat);
          });
          tmpMat.copy(tmpAxleBase).multiply(tmpRot).multiply(localWheelData.axle);
          axlesMesh.setMatrixAt(i, tmpMat);
        } else {
          localWheelData.wheels.forEach((w, k) => {
            tmpMat.copy(a.matrix).multiply(tmpRot).multiply(w);
            wheelsMesh.setMatrixAt(i * 2 + k, tmpMat);
          });
          tmpMat.copy(a.matrix).multiply(tmpRot).multiply(localWheelData.axle);
          axlesMesh.setMatrixAt(i, tmpMat);
        }
      });
      wheelsMesh.instanceMatrix.needsUpdate = true;
      axlesMesh.instanceMatrix.needsUpdate = true;
    };
    writeWheels(0);

    // 4. Coach Decals and Labels (Numbering, Route Letters "WR"/"CR", Class markings)
    const labelsGroup = new THREE.Group();
    labelsGroup.name = "train-decals";

    const routeLettersMat = new THREE.MeshStandardMaterial({
      map: routeLettersTexture(livery.short),
      transparent: true,
      roughness: 0.4,
    });

    const decalGroups: THREE.Group[] = [];
    const boxGeo = geos.box;
    for (const c of layout) {
      const coachLabelMat = new THREE.MeshStandardMaterial({
        map: coachLabelTexture(c),
        transparent: true,
        roughness: 0.5,
      });

      const cGroup = new THREE.Group();
      cGroup.position.set(0, 0, c.z);
      if (c.flipped) cGroup.rotation.y = Math.PI;

      // Class markings and car numbers
      for (const s of SIDES) {
        const labelMesh = new THREE.Mesh(boxGeo, coachLabelMat);
        labelMesh.position.set(s * 1.79, 1.27, -COACH_LENGTH / 2 + 1.7);
        labelMesh.rotation.set(0, 0, -s * 0.31);
        labelMesh.scale.set(0.004, 0.22, 0.88);
        cGroup.add(labelMesh);

        // Big Route letters (e.g. "WR", "CR") on side belt
        const letterMesh = new THREE.Mesh(boxGeo, routeLettersMat);
        letterMesh.position.set(s * 1.843, 1.74, 2.6);
        letterMesh.scale.set(0.004, 0.46, 0.95);
        cGroup.add(letterMesh);
      }
      labelsGroup.add(cGroup);
      decalGroups.push(cGroup);
    }
    rake.add(labelsGroup);

    // 5. Lighting Rig (Lead Headlights, Tail Lights, Interior Illumination)
    const lightsGroup = new THREE.Group();
    lightsGroup.name = "train-lights";

    const spotLight = new THREE.SpotLight(0xfff4d6, 250, 70, 0.42, 0.6);
    spotLight.position.set(0, 2.9, FRONT_FACE_Z + 0.4);
    const spotTarget = new THREE.Object3D();
    spotTarget.position.set(0, 0.5, FRONT_FACE_Z + 40);
    spotLight.target = spotTarget;
    lightsGroup.add(spotLight);
    lightsGroup.add(spotTarget);

    const tailLight = new THREE.PointLight(0xff2a1a, 6, 8);
    tailLight.position.set(0, 1.8, REAR_FACE_Z - 0.6);
    lightsGroup.add(tailLight);

    // Interior lights for leading coaches
    const interiorPositions = [
      coachZ(0, cars) - 6,
      coachZ(0, cars) + 1,
      coachZ(1, cars) - 5,
      coachZ(1, cars) + 4,
    ];
    for (const z of interiorPositions) {
      const intLight = new THREE.PointLight(0xf2f5ff, 8, 9, 1.6);
      intLight.position.set(0, 3.5, z);
      lightsGroup.add(intLight);
    }

    // Cab interior light
    const cabLight = new THREE.PointLight(0xf2f5ff, 2.5, 4);
    cabLight.position.set(0.3, 3.6, FRONT_FACE_Z - 1.2);
    lightsGroup.add(cabLight);

    rake.add(lightsGroup);

    // Initial position on track (sitting atop rails)
    rake.position.set(trackX, trackY, startZ);

    // 6. Runtime Controller and API on rake.userData
    let wheelAngle = 0;
    let doorProgress = 0;
    let targetDoorProgress = 0;
    let currentLivery = livery;

    rake.userData = {
      isTrain: true,
      options,
      layout,
      parts,
      materials: mats,
      getLivery: () => currentLivery,
      setLivery: (newLId: LiveryId) => {
        const next = LIVERIES[newLId];
        if (!next) return;
        currentLivery = next;
        applyLivery(mats, next);
      },
      setDoors: (open: boolean) => {
        targetDoorProgress = open ? 1 : 0;
      },
      toggleDoors: () => {
        targetDoorProgress = targetDoorProgress > 0.5 ? 0 : 1;
        return targetDoorProgress > 0.5;
      },
      setLights: (s: Partial<LightState>) => {
        const cur = useTrainStore.getState().lights;
        const next = { ...cur, ...s };
        applyLights(mats, next);
        spotLight.intensity = next.headlights ? 250 : 0;
        tailLight.intensity = next.tail ? 6 : 0;
      },
      getLeadCabPose: () => {
        if (isArticulated) {
          const leadCenter = activeCoachPos[0];
          const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(activeCoachQuat[0]);
          const up = new THREE.Vector3(0, 1, 0);
          const right = new THREE.Vector3().crossVectors(forward, up).normalize();
          // Lead cab motorman eye position: right side (+0.75m), height (+2.45m), behind windshield (+8.55m from center)
          const driverPos = leadCenter.clone()
            .addScaledVector(forward, HL - 1.45)
            .addScaledVector(right, 0.75)
            .addScaledVector(up, 2.45);
          return { position: driverPos, heading: forward };
        }
        const leadLocal = new THREE.Vector3(0.75, 2.45, FRONT_FACE_Z - 1.45);
        const worldPos = leadLocal.applyMatrix4(rake.matrixWorld);
        const forward = new THREE.Vector3(0, 0, 1).transformDirection(rake.matrixWorld);
        return { position: worldPos, heading: forward };
      },
      getPassengerPose: () => {
        if (isArticulated) {
          const coachIdx = Math.min(1, cars - 1);
          const cPos = activeCoachPos[coachIdx].clone();
          const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(activeCoachQuat[coachIdx]);
          const up = new THREE.Vector3(0, 1, 0);
          const right = new THREE.Vector3().crossVectors(forward, up).normalize();
          // Window passenger seat in second car: left side (-1.35m), eye level (2.15m), longitudinal position
          const eyePos = cPos
            .addScaledVector(right, -1.35)
            .addScaledVector(up, 2.15)
            .addScaledVector(forward, 2.2);
          const lookDir = forward.clone().multiplyScalar(0.7).addScaledVector(right, -1.0).normalize();
          return { position: eyePos, heading: forward, lookDir };
        }
        const cLocal = new THREE.Vector3(-1.35, 2.15, coachZ(1, cars) + 2.2);
        const eyePos = cLocal.applyMatrix4(rake.matrixWorld);
        const forward = new THREE.Vector3(0, 0, 1).transformDirection(rake.matrixWorld);
        const right = new THREE.Vector3(1, 0, 0).transformDirection(rake.matrixWorld);
        const lookDir = forward.clone().multiplyScalar(0.7).addScaledVector(right, -1.0).normalize();
        return { position: eyePos, heading: forward, lookDir };
      },
      getTrainCenterPose: () => {
        if (isArticulated) {
          const midIdx = Math.floor(cars / 2);
          const centerPos = activeCoachPos[midIdx].clone().add(new THREE.Vector3(0, 1.5, 0));
          const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(activeCoachQuat[midIdx]);
          return { position: centerPos, heading: forward };
        }
        const centerPos = new THREE.Vector3(0, 1.5, 0).applyMatrix4(rake.matrixWorld);
        const forward = new THREE.Vector3(0, 0, 1).transformDirection(rake.matrixWorld);
        return { position: centerPos, heading: forward };
      },
      update: (delta: number, speed: number = 0, distance: number = 0, path?: TrackPath) => {
        // Door animation
        if (Math.abs(doorProgress - targetDoorProgress) > 0.001) {
          const dt = Math.min(delta, 0.05);
          doorProgress += Math.sign(targetDoorProgress - doorProgress) * Math.min(Math.abs(targetDoorProgress - doorProgress), dt / 1.6);
          writeDoors(doorProgress);
          trainRuntime.doorProgress = doorProgress;
        }

        // Wheel rotation
        const effectiveSpeed = speed !== 0 ? speed : trainRuntime.speed;
        if (effectiveSpeed !== 0) {
          wheelAngle += (effectiveSpeed / WHEEL_RADIUS) * Math.min(delta, 0.05);
          writeWheels(wheelAngle);
          trainRuntime.wheelAngle = wheelAngle;
          trainRuntime.speed = effectiveSpeed;
        }

        // Track-following position along distance
        if (path) {
          isArticulated = true;
          const stationOffset = path.getStationStopDistance();
          const trainDist = stationOffset + distance;

          // 1. Calculate poses for every individual coach and bogie along the curve
          for (let k = 0; k < cars; k++) {
            const c = layout[k];
            const coachCenterDist = trainDist + coachZ(k, cars);
            const pose = path.getCoachPose(coachCenterDist);

            const cQuat = c.flipped ? pose.quaternion.clone().multiply(rotYPi) : pose.quaternion;

            activeCoachPos[k].copy(pose.position);
            activeCoachQuat[k].copy(cQuat);

            activeCoachMatrices[k].compose(pose.position, cQuat, scaleOne);
            // Bogies align with their local track tangents directly
            activeFrontBogieMatrices[k].compose(pose.frontBogiePos, pose.frontBogieQuat, scaleOne);
            activeRearBogieMatrices[k].compose(pose.rearBogiePos, pose.rearBogieQuat, scaleOne);

            // Synchronize decal group for this coach
            const decalGroup = decalGroups[k];
            if (decalGroup) {
              decalGroup.position.copy(pose.position);
              decalGroup.quaternion.copy(cQuat);
            }
          }

          // 2. Articulate all instanced static parts (body, roof, seats, cab, underframe)
          for (let m = 0; m < staticMeshEntries.length; m++) {
            const { mesh, batchKey } = staticMeshEntries[m];
            const batch = parts.builder.batches.get(batchKey);
            if (!batch) continue;
            const count = batch.attachments.length;
            for (let i = 0; i < count; i++) {
              const att = batch.attachments[i];
              const pMat =
                att.type === "coach"
                  ? activeCoachMatrices[att.coachIndex]
                  : att.type === "frontBogie"
                  ? activeFrontBogieMatrices[att.coachIndex]
                  : activeRearBogieMatrices[att.coachIndex];
              tmpMat.multiplyMatrices(pMat, att.localMatrix);
              mesh.setMatrixAt(i, tmpMat);
            }
            mesh.instanceMatrix.needsUpdate = true;
          }

          // 3. Update doors and wheels in world track alignment
          writeDoors(doorProgress);
          writeWheels(wheelAngle);

          // 4. Update headlights and taillight
          const leadPos = activeCoachPos[0];
          const leadQuat = activeCoachQuat[0];
          const leadForward = new THREE.Vector3(0, 0, 1).applyQuaternion(leadQuat);
          spotLight.position.copy(leadPos).addScaledVector(new THREE.Vector3(0, 1, 0), 2.9).addScaledVector(leadForward, 10.4);
          spotTarget.position.copy(leadPos).addScaledVector(leadForward, 45).addScaledVector(new THREE.Vector3(0, 1, 0), 0.5);

          const rearPos = activeCoachPos[cars - 1];
          const rearQuat = activeCoachQuat[cars - 1];
          const rearForward = new THREE.Vector3(0, 0, 1).applyQuaternion(rearQuat);
          tailLight.position.copy(rearPos).addScaledVector(new THREE.Vector3(0, 1, 0), 1.8).addScaledVector(rearForward, -10.4);

          // Reset rake root to origin so all instance transforms are exact world coordinates
          rake.position.set(0, 0, 0);
          rake.quaternion.identity();
        } else {
          isArticulated = false;
          rake.position.set(trackX ?? 6.0, trackY ?? RAIL_TOP_Y, (startZ ?? 20) + distance);
          rake.quaternion.identity();
        }
        rake.updateMatrixWorld();
      },
      dispose: () => {
        disposeMaterials(mats);
        routeLettersMat.map?.dispose();
        routeLettersMat.dispose();
        rake.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (mesh.isMesh) {
            mesh.geometry?.dispose();
          }
          if ((obj as THREE.InstancedMesh).isInstancedMesh) {
            (obj as THREE.InstancedMesh).dispose();
          }
        });
      },
    };

    return rake;
  }
}

export { RAIL_HALF_GAUGE };
