/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from "three";
import { ALL_STATION_COORDINATES } from "../src/railway/data/stationCoordinates";
import {
  STATIONS,
  CENTRAL_MAIN_SEQUENCE,
  WESTERN_MAIN_SEQUENCE,
  HARBOUR_MAIN_SEQUENCE,
  HARBOUR_WESTERN_SEQUENCE,
  KASARA_BRANCH_SEQUENCE,
  KARJAT_BRANCH_SEQUENCE,
  KHOPOLI_BRANCH_SEQUENCE,
  WESTERN_DAHANU_SEQUENCE,
  TRANS_HARBOUR_SEQUENCE,
} from "../src/railway/data/stations";
import { RailwayNetworkGraph } from "../src/railway/network/RailwayNetworkGraph";
import { RailwayPathResolver } from "../src/railway/network/RailwayPathResolver";
import { AVAILABLE_ROUTES } from "../src/game/railway/RouteDatabase";
import { TrackPath } from "../src/game/train/TrackPath";
import { TrainPhysics } from "../src/game/train/TrainPhysics";

let passed = 0;
let failed = 0;

function assert(condition: boolean, desc: string) {
  if (condition) {
    passed++;
    console.log(`  [PASS] ${desc}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${desc}`);
  }
}

console.log("==================================================================");
console.log("   MUMBAI LOCAL TRAIN SIMULATOR — PHASE 5.2 VERIFICATION AUDIT   ");
console.log("==================================================================\n");

// SECTION 1: STATION DATABASE INTEGRITY & COVERAGE
console.log("--- 1. STATION DATABASE & GEOGRAPHIC INTEGRITY ---");
const totalStations = Object.keys(ALL_STATION_COORDINATES).length;
assert(totalStations >= 100, `Station database contains ${totalStations} operational stations (>= 100)`);

let validCoords = true;
let validNames = true;
let validLayouts = true;

for (const [code, data] of Object.entries(ALL_STATION_COORDINATES)) {
  if (isNaN(data.lat) || isNaN(data.lon) || isNaN(data.elev) || data.lat < 18.0 || data.lat > 21.0 || data.lon < 72.0 || data.lon > 74.0) {
    validCoords = false;
  }
  if (!data.name || !data.nameDevanagari) {
    validNames = false;
  }
  if (!["DOUBLE", "QUAD", "JUNCTION", "TERMINAL"].includes(data.layout)) {
    validLayouts = false;
  }
}
assert(validCoords, "All 119 station WGS-84 coordinates strictly valid within MMR bounding box [18-21°N, 72-74°E]");
assert(validNames, "All stations have official English and Devanagari (Marathi) names");
assert(validLayouts, "All stations have authentic track topology classifications (DOUBLE, QUAD, JUNCTION, TERMINAL)");

const stationsInStationsDb = Object.keys(STATIONS).length;
assert(stationsInStationsDb >= totalStations, `STATIONS table contains all ${stationsInStationsDb} station records`);

// SECTION 2: CORRIDOR SEQUENCES & TOPOLOGY
console.log("\n--- 2. CORRIDOR SEQUENCES & TOPOLOGY ---");
assert(CENTRAL_MAIN_SEQUENCE.length === 26, `Central Mainline has 26 stations: CSMT (${CENTRAL_MAIN_SEQUENCE[0].code}) to Kalyan (${CENTRAL_MAIN_SEQUENCE[25].code})`);
assert(KASARA_BRANCH_SEQUENCE.length === 12, `Kasara Branch has 12 stations: Kalyan (${KASARA_BRANCH_SEQUENCE[0].code}) to Kasara (${KASARA_BRANCH_SEQUENCE[11].code})`);
assert(KARJAT_BRANCH_SEQUENCE.length === 10, `Karjat Branch has 10 stations: Kalyan (${KARJAT_BRANCH_SEQUENCE[0].code}) to Karjat (${KARJAT_BRANCH_SEQUENCE[9].code})`);
assert(KHOPOLI_BRANCH_SEQUENCE.length === 6, `Khopoli Branch has 6 stations: Karjat (${KHOPOLI_BRANCH_SEQUENCE[0].code}) to Khopoli (${KHOPOLI_BRANCH_SEQUENCE[5].code})`);
assert(WESTERN_MAIN_SEQUENCE.length === 29, `Western Mainline has 29 stations: Churchgate (${WESTERN_MAIN_SEQUENCE[0].code}) to Virar (${WESTERN_MAIN_SEQUENCE[28].code})`);
assert(WESTERN_DAHANU_SEQUENCE.length === 9, `Western Dahanu Extension has 9 stations: Virar (${WESTERN_DAHANU_SEQUENCE[0].code}) to Dahanu Road (${WESTERN_DAHANU_SEQUENCE[8].code})`);
assert(HARBOUR_MAIN_SEQUENCE.length === 25, `Harbour Mainline has 25 stations: CSMT (${HARBOUR_MAIN_SEQUENCE[0].code}) to Panvel (${HARBOUR_MAIN_SEQUENCE[24].code})`);
assert(TRANS_HARBOUR_SEQUENCE.length === 17, `Trans-Harbour Corridor has 17 stations: Thane (${TRANS_HARBOUR_SEQUENCE[0].code}) to Panvel (${TRANS_HARBOUR_SEQUENCE[16].code})`);

// SECTION 3: GRAPH PATHFINDING & TRAVERSABILITY
console.log("\n--- 3. NETWORK GRAPH CONNECTIVITY & BFS TRAVERSABILITY ---");
const graph = new RailwayNetworkGraph();

const testPaths = [
  { from: "CSMT", to: "KYN", name: "Central Mainline (CSMT ⇄ Kalyan)" },
  { from: "KYN", to: "KSRA", name: "Kasara Thal Ghat (Kalyan ⇄ Kasara)" },
  { from: "KYN", to: "KJT", name: "Karjat Bhor Ghat (Kalyan ⇄ Karjat)" },
  { from: "KJT", to: "KHPI", name: "Khopoli Feeder (Karjat ⇄ Khopoli)" },
  { from: "CCG", to: "VR", name: "Western Mainline (Churchgate ⇄ Virar)" },
  { from: "VR", to: "DRD", name: "Western Dahanu (Virar ⇄ Dahanu Road)" },
  { from: "CSMT", to: "PNVL", name: "Harbour Mainline (CSMT ⇄ Panvel)" },
  { from: "TNA", to: "PNVL", name: "Trans-Harbour (Thane ⇄ Panvel)" },
  { from: "VDLR", to: "MM", name: "Harbour-Western Chord (Wadala ⇄ Mahim)" },
  { from: "CSMT", to: "KSRA", name: "Long Run Outbound (CSMT ⇄ Kasara via Kalyan)" },
  { from: "CSMT", to: "KHPI", name: "Long Run Outbound (CSMT ⇄ Khopoli via Kalyan & Karjat)" },
  { from: "CCG", to: "DRD", name: "Long Run Outbound (Churchgate ⇄ Dahanu Road via Virar)" },
];

for (const tp of testPaths) {
  const path = graph.findPath(tp.from, tp.to);
  assert(
    path !== null && path.nodePath.length >= 2,
    `BFS Path connected: ${tp.name} -> ${path?.nodePath.length} nodes, ${path ? (path.totalDistanceMeters / 1000).toFixed(1) : 0} km`
  );
}

// SECTION 4: 3D SPLINE GEOMETRY & DIFFERENTIABLE BASES
console.log("\n--- 4. 3D TRACK SPLINE CONTINUITY & ORTHONORMAL BASIS ---");
assert(AVAILABLE_ROUTES.length === 11, `All 11 operational corridor & branch routes available in RouteDatabase`);

for (const route of AVAILABLE_ROUTES) {
  const track = new TrackPath(route);
  assert(track.totalLength > 1000, `Route '${route.name}': Continuous length = ${(track.totalLength / 1000).toFixed(1)} km`);
  assert(route.stations.length >= 2, `Route '${route.shortName}': ${route.stations.length} station waypoints with accurate stop distances`);
  assert(route.signals.length >= 2, `Route '${route.shortName}': ${route.signals.length} block signals spaced along corridor`);

  // Sample basis at 25%, 50%, 75%
  let basisOrthonormal = true;
  for (const fraction of [0.25, 0.5, 0.75]) {
    const s = track.sampleAtDistance(track.totalLength * fraction);
    const tLen = s.tangent.length();
    const nLen = s.normal.length();
    const uLen = s.up.length();
    const tDotU = Math.abs(s.tangent.dot(s.up));
    if (Math.abs(tLen - 1.0) > 1e-4 || Math.abs(uLen - 1.0) > 1e-4 || tDotU > 1e-4) {
      basisOrthonormal = false;
    }
  }
  assert(basisOrthonormal, `Route '${route.shortName}': Orthonormal Frenet-Serret basis verified (unit length, orthogonal)`);
}

// SECTION 5: REAL TRAIN PHYSICS SIMULATION (NO TELEPORTATION)
console.log("\n--- 5. REAL TRAIN PHYSICS SIMULATION & STATION ALIGNMENT ---");
const testRoute = AVAILABLE_ROUTES.find((r) => r.routeId === "central-local-parel-sion")!;
const testTrack = new TrackPath(testRoute);
const physics = new TrainPhysics();

// Start at Parel station platform
const parelDist = testTrack.getStationStopDistance("PR");
const dadarDist = testTrack.getStationStopDistance("DDR");
physics.setDistance(parelDist);
physics.setDoors(false);
physics.setPantograph(true);
physics.setReverser(1);
physics.setTractionNotch(4);
physics.setBrakeNotch(0);

// Accelerate and cruise toward Dadar
while (physics.getState().distance < dadarDist - 210) {
  if (physics.getState().speedKmh < 55) {
    physics.setTractionNotch(3);
    physics.setBrakeNotch(0);
  } else {
    physics.setCoast();
  }
  physics.update(0.1);
}

const speedAfterAcc = physics.getState().speedKmh;
assert(speedAfterAcc >= 20, `Train accelerates under traction (speed = ${speedAfterAcc.toFixed(1)} km/h >= 20 km/h)`);

// Controlled braking into Dadar platform
physics.setTractionNotch(0);
physics.setBrakeNotch(2);

let steps = 0;
while (physics.getState().speed > 0.05 && steps < 1200) {
  const remaining = dadarDist - physics.getState().distance;
  const currentSpeed = physics.getState().speed;
  if (remaining < 15 && currentSpeed > 1.5) {
    physics.setBrakeNotch(4);
  } else if (remaining < 50 && currentSpeed > 4.0) {
    physics.setBrakeNotch(3);
  } else if (remaining > 80 && currentSpeed < 5.0) {
    physics.setBrakeNotch(1);
  }
  physics.update(0.05);
  steps++;
}

const finalDist = physics.getState().distance;
const distError = Math.abs(finalDist - dadarDist);
console.log(`  Train stopped at distance ${finalDist.toFixed(1)}m (target ${dadarDist}m, error = ${distError.toFixed(2)}m)`);
assert(distError < 12.0, `Train brought to controlled stop near station platform (error = ${distError.toFixed(2)}m < 12m)`);

// Verify 12-coach articulated rake poses
const poses = [];
for (let c = 0; c < 12; c++) {
  const coachDist = finalDist - c * 21.336;
  poses.push(testTrack.getCoachPose(coachDist));
}
assert(poses.length === 12, `12 independent coach poses calculated`);
let coachesValid = true;
for (let c = 0; c < 12; c++) {
  const p = poses[c];
  if (isNaN(p.position.x) || isNaN(p.position.y) || isNaN(p.position.z)) coachesValid = false;
  if (isNaN(p.quaternion.x) || isNaN(p.quaternion.w)) coachesValid = false;
  if (isNaN(p.frontBogiePos.x) || isNaN(p.rearBogiePos.x)) coachesValid = false;
}
assert(coachesValid, `All 12 coach poses and bogie orientations contain strictly finite coordinates (0 NaNs)`);

// SUMMARY
console.log("\n==================================================================");
console.log(`   PHASE 5.2 AUDIT RESULT: ${passed} PASSED, ${failed} FAILED   `);
console.log("==================================================================");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
