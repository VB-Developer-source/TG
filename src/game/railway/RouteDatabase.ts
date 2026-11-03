/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from "three";
import { RAIL_TOP_Y } from "../world/layout";
import type { PlayableRoute, StationWaypoint, BlockSignal, SpeedRestriction } from "./RailwayNetworkModels";
import {
  CENTRAL_MAIN_SEQUENCE,
  WESTERN_MAIN_SEQUENCE,
  HARBOUR_MAIN_SEQUENCE,
  HARBOUR_WESTERN_SEQUENCE,
} from "../../railway/data/stations";

/**
 * 1. CENTRAL LINE - SLOW LOCAL CORRIDOR (Stage 1 Continuous Playable Network)
 * Connects Parel Terminus -> Dadar Junction -> Matunga -> Sion.
 * Length: 3,100 m continuous broad-gauge alignment with verified stations and signals.
 */
const PAREL_SION_STATIONS: StationWaypoint[] = [
  {
    stationId: "PR",
    stationCode: "PR",
    name: "Parel",
    nameDevanagari: "परेल",
    corridor: "CENTRAL",
    stopDistanceM: 200,
    platformLengthM: 280,
    platformNumber: "PF 3",
    platformSide: "LEFT",
    stoppingToleranceM: 5.0,
    interchange: ["Parel Workshop", "Prabhadevi WR Connector"],
    maxEntrySpeedKmh: 45,
  },
  {
    stationId: "DDR",
    stationCode: "DDR",
    name: "Dadar",
    nameDevanagari: "दादर",
    corridor: "CENTRAL",
    stopDistanceM: 920,
    platformLengthM: 280,
    platformNumber: "PF 3",
    platformSide: "LEFT",
    stoppingToleranceM: 5.0,
    interchange: ["Western Line (Dadar WR)", "Central Fast Lines"],
    maxEntrySpeedKmh: 45,
  },
  {
    stationId: "MTN",
    stationCode: "MTN",
    name: "Matunga",
    nameDevanagari: "माटुंगा",
    corridor: "CENTRAL",
    stopDistanceM: 1760,
    platformLengthM: 280,
    platformNumber: "PF 2",
    platformSide: "LEFT",
    stoppingToleranceM: 5.0,
    interchange: ["Matunga Carriage & Wagon Workshop"],
    maxEntrySpeedKmh: 45,
  },
  {
    stationId: "SIN",
    stationCode: "SIN",
    name: "Sion",
    nameDevanagari: "सायन",
    corridor: "CENTRAL",
    stopDistanceM: 2580,
    platformLengthM: 280,
    platformNumber: "PF 1",
    platformSide: "LEFT",
    stoppingToleranceM: 5.0,
    interchange: ["Kurla Junction Approach"],
    maxEntrySpeedKmh: 45,
  },
];

const PAREL_SION_SIGNALS: BlockSignal[] = [
  {
    signalId: "S-PR-01",
    distanceM: 50,
    direction: "DOWN",
    aspect: "GREEN",
    name: "Parel Starter Down",
    speedLimitKmh: 50,
    protectedBlockEndM: 500,
  },
  {
    signalId: "S-DDR-01",
    distanceM: 520,
    direction: "DOWN",
    aspect: "GREEN",
    name: "Dadar South Home",
    speedLimitKmh: 45,
    protectedBlockEndM: 1100,
  },
  {
    signalId: "S-DDR-02",
    distanceM: 1150,
    direction: "DOWN",
    aspect: "GREEN",
    name: "Dadar North Starter",
    speedLimitKmh: 65,
    protectedBlockEndM: 1600,
  },
  {
    signalId: "S-MTN-01",
    distanceM: 1620,
    direction: "DOWN",
    aspect: "GREEN",
    name: "Matunga Home Signal",
    speedLimitKmh: 45,
    protectedBlockEndM: 2100,
  },
  {
    signalId: "S-SIN-01",
    distanceM: 2420,
    direction: "DOWN",
    aspect: "GREEN",
    name: "Sion Home Signal",
    speedLimitKmh: 45,
    protectedBlockEndM: 2900,
  },
];

const PAREL_SION_RESTRICTIONS: SpeedRestriction[] = [
  { id: "PSR-PR-01", startM: 0, endM: 350, maxSpeedKmh: 50, reason: "Parel Station Throat & Crossovers" },
  { id: "PSR-DDR-01", startM: 750, endM: 1050, maxSpeedKmh: 45, reason: "Dadar Island Platform Ingress" },
  { id: "PSR-MTN-01", startM: 1600, endM: 1900, maxSpeedKmh: 45, reason: "Matunga Station Curve" },
  { id: "PSR-SIN-01", startM: 2400, endM: 2700, maxSpeedKmh: 45, reason: "Sion S-Curve Alignment" },
];

const PAREL_SION_SPLINE_POINTS: THREE.Vector3[] = [
  new THREE.Vector3(5.2, RAIL_TOP_Y, -950),   // South approach from Parel Yard
  new THREE.Vector3(5.8, RAIL_TOP_Y, -820),   // Parel South Entry
  new THREE.Vector3(6.0, RAIL_TOP_Y, -750),   // Parel Station Platform Center (s=200)
  new THREE.Vector3(6.0, RAIL_TOP_Y, -620),   // Parel North Exit
  new THREE.Vector3(5.7, RAIL_TOP_Y, -400),   // Crossover into Dadar South
  new THREE.Vector3(6.0, RAIL_TOP_Y, -180),   // Dadar South Outer
  new THREE.Vector3(6.0, RAIL_TOP_Y, 0),      // Dadar Station Platform Center (s=920)
  new THREE.Vector3(6.0, RAIL_TOP_Y, 180),    // Dadar North Gantry
  new THREE.Vector3(6.2, RAIL_TOP_Y, 420),    // Matunga Workshop Lead
  new THREE.Vector3(6.8, RAIL_TOP_Y, 830),    // Matunga Station Center (s=1760)
  new THREE.Vector3(7.4, RAIL_TOP_Y, 1050),   // Matunga North
  new THREE.Vector3(8.5, RAIL_TOP_Y, 1240),   // Dharavi Corridor Curve
  new THREE.Vector3(9.8, RAIL_TOP_Y, 1650),   // Sion Station Center (s=2580)
  new THREE.Vector3(11.2, RAIL_TOP_Y, 2170),  // Mainline toward Kurla (s=3100)
];

export const ROUTE_CENTRAL_LOCAL_PLAYABLE: PlayableRoute = {
  routeId: "central-local-parel-sion",
  name: "Central Line — Slow Local (Parel ⇄ Sion)",
  shortName: "CR Local",
  corridorId: "CENTRAL",
  direction: "DOWN",
  directionLabel: "DOWN (Northbound toward Kalyan)",
  startStationCode: "PR",
  endStationCode: "SIN",
  intermediateStations: [
    { code: "PR", name: "Parel", nameDevanagari: "परेल" },
    { code: "DDR", name: "Dadar", nameDevanagari: "दादर" },
    { code: "MTN", name: "Matunga", nameDevanagari: "माटुंगा" },
    { code: "SIN", name: "Sion", nameDevanagari: "सायन" },
  ],
  verifiedLengthKm: 3.1,
  lineTypeLabel: "Central Slow Line (Tracks 2 & 3)",
  electrification: "25 kV AC 50 Hz OverHead Equipment (OHE)",
  stations: PAREL_SION_STATIONS,
  signals: PAREL_SION_SIGNALS,
  speedRestrictions: PAREL_SION_RESTRICTIONS,
  curvePoints: PAREL_SION_SPLINE_POINTS,
  totalDistanceM: 3120,
};

/**
 * 2. CENTRAL LINE — FULL SUBURBAN MAINLINE (CSMT ⇄ Kalyan Junction)
 */
export const ROUTE_CENTRAL_MAINLINE: PlayableRoute = {
  routeId: "central-mainline-csmt-kalyan",
  name: "Central Line — Fast Mainline (CSMT ⇄ Kalyan)",
  shortName: "CR Fast",
  corridorId: "CENTRAL",
  direction: "DOWN",
  directionLabel: "DOWN (CSMT to Kalyan Junction)",
  startStationCode: "CSMT",
  endStationCode: "KYN",
  intermediateStations: CENTRAL_MAIN_SEQUENCE,
  verifiedLengthKm: 53.8,
  lineTypeLabel: "Central Fast Line (Tracks 1 & 4)",
  electrification: "25 kV AC 50 Hz OHE",
  stations: [
    {
      stationId: "CSMT",
      stationCode: "CSMT",
      name: "CSMT",
      nameDevanagari: "छ.शि.म.ट.",
      corridor: "CENTRAL",
      stopDistanceM: 0,
      platformLengthM: 300,
      platformNumber: "PF 1",
      platformSide: "LEFT",
      stoppingToleranceM: 5.0,
      maxEntrySpeedKmh: 30,
    },
    ...PAREL_SION_STATIONS,
    {
      stationId: "KYN",
      stationCode: "KYN",
      name: "Kalyan Junction",
      nameDevanagari: "कल्याण जंक्शन",
      corridor: "CENTRAL",
      stopDistanceM: 53800,
      platformLengthM: 320,
      platformNumber: "PF 4",
      platformSide: "BOTH",
      stoppingToleranceM: 5.0,
      interchange: ["Kasara Branch", "Karjat Branch"],
      maxEntrySpeedKmh: 30,
    },
  ],
  signals: PAREL_SION_SIGNALS,
  speedRestrictions: [
    { id: "CR-FAST-MPS", startM: 0, endM: 53800, maxSpeedKmh: 105, reason: "Mainline Maximum Permissible Speed" },
  ],
  curvePoints: PAREL_SION_SPLINE_POINTS,
  totalDistanceM: 53800,
};

/**
 * 3. WESTERN LINE — SUBURBAN CORRIDOR (Churchgate ⇄ Virar)
 */
export const ROUTE_WESTERN_MAINLINE: PlayableRoute = {
  routeId: "western-mainline-churchgate-virar",
  name: "Western Line — Suburban (Churchgate ⇄ Virar)",
  shortName: "WR Mainline",
  corridorId: "WESTERN",
  direction: "DOWN",
  directionLabel: "DOWN (Churchgate to Virar)",
  startStationCode: "CCG",
  endStationCode: "VR",
  intermediateStations: WESTERN_MAIN_SEQUENCE,
  verifiedLengthKm: 59.8,
  lineTypeLabel: "Western Local / Through Quad Lines",
  electrification: "25 kV AC 50 Hz OHE (Converted from 1.5 kV DC)",
  stations: [
    {
      stationId: "CCG",
      stationCode: "CCG",
      name: "Churchgate",
      nameDevanagari: "चर्चगेट",
      corridor: "WESTERN",
      stopDistanceM: 0,
      platformLengthM: 300,
      platformNumber: "PF 2",
      platformSide: "LEFT",
      stoppingToleranceM: 5.0,
      maxEntrySpeedKmh: 30,
    },
    {
      stationId: "DDR-WR",
      stationCode: "DDR",
      name: "Dadar Western",
      nameDevanagari: "दादर (पश्चिम)",
      corridor: "WESTERN",
      stopDistanceM: 920,
      platformLengthM: 280,
      platformNumber: "PF 1",
      platformSide: "LEFT",
      stoppingToleranceM: 5.0,
      interchange: ["Central Line (Dadar CR)"],
      maxEntrySpeedKmh: 45,
    },
    {
      stationId: "BVI",
      stationCode: "BVI",
      name: "Borivali",
      nameDevanagari: "बोरिवली",
      corridor: "WESTERN",
      stopDistanceM: 34000,
      platformLengthM: 300,
      platformNumber: "PF 3",
      platformSide: "LEFT",
      stoppingToleranceM: 5.0,
      maxEntrySpeedKmh: 45,
    },
    {
      stationId: "VR",
      stationCode: "VR",
      name: "Virar",
      nameDevanagari: "विरार",
      corridor: "WESTERN",
      stopDistanceM: 59800,
      platformLengthM: 300,
      platformNumber: "PF 1",
      platformSide: "LEFT",
      stoppingToleranceM: 5.0,
      maxEntrySpeedKmh: 30,
    },
  ],
  signals: PAREL_SION_SIGNALS,
  speedRestrictions: [
    { id: "WR-MPS", startM: 0, endM: 59800, maxSpeedKmh: 105, reason: "Western Railway Broad Gauge MPS" },
  ],
  curvePoints: PAREL_SION_SPLINE_POINTS,
  totalDistanceM: 59800,
};

/**
 * 4. HARBOUR LINE — PORT & TRANS-HARBOUR CORRIDOR (CSMT ⇄ Panvel)
 */
export const ROUTE_HARBOUR_MAINLINE: PlayableRoute = {
  routeId: "harbour-mainline-csmt-panvel",
  name: "Harbour Line — Suburban (CSMT ⇄ Panvel)",
  shortName: "HB Mainline",
  corridorId: "HARBOUR",
  direction: "DOWN",
  directionLabel: "DOWN (CSMT to Panvel via Navi Mumbai)",
  startStationCode: "CSMT",
  endStationCode: "PNVL",
  intermediateStations: HARBOUR_MAIN_SEQUENCE,
  verifiedLengthKm: 48.9,
  lineTypeLabel: "Harbour Double Line & Trans-Harbour Chord",
  electrification: "25 kV AC 50 Hz OHE",
  stations: [
    {
      stationId: "CSMT-HB",
      stationCode: "CSMT",
      name: "CSMT (Harbour)",
      nameDevanagari: "छ.शि.म.ट.",
      corridor: "HARBOUR",
      stopDistanceM: 0,
      platformLengthM: 280,
      platformNumber: "PF 1",
      platformSide: "LEFT",
      stoppingToleranceM: 5.0,
      maxEntrySpeedKmh: 30,
    },
    {
      stationId: "VDLR",
      stationCode: "VDLR",
      name: "Wadala Road",
      nameDevanagari: "वडाळा रोड",
      corridor: "HARBOUR",
      stopDistanceM: 9200,
      platformLengthM: 280,
      platformNumber: "PF 2",
      platformSide: "LEFT",
      stoppingToleranceM: 5.0,
      interchange: ["Harbour-Western Chord to Mahim"],
      maxEntrySpeedKmh: 40,
    },
    {
      stationId: "PNVL",
      stationCode: "PNVL",
      name: "Panvel",
      nameDevanagari: "पनवेल",
      corridor: "HARBOUR",
      stopDistanceM: 48900,
      platformLengthM: 300,
      platformNumber: "PF 2",
      platformSide: "LEFT",
      stoppingToleranceM: 5.0,
      interchange: ["Konkan Railway", "Diva-Panvel Mainline"],
      maxEntrySpeedKmh: 30,
    },
  ],
  signals: PAREL_SION_SIGNALS,
  speedRestrictions: [
    { id: "HB-MPS", startM: 0, endM: 48900, maxSpeedKmh: 80, reason: "Harbour Line Elevated Curves & Port Alignment" },
  ],
  curvePoints: PAREL_SION_SPLINE_POINTS,
  totalDistanceM: 48900,
};

export const AVAILABLE_ROUTES: PlayableRoute[] = [
  ROUTE_CENTRAL_LOCAL_PLAYABLE,
  ROUTE_CENTRAL_MAINLINE,
  ROUTE_WESTERN_MAINLINE,
  ROUTE_HARBOUR_MAINLINE,
];
