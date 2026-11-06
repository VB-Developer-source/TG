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
  KASARA_BRANCH_SEQUENCE,
  KARJAT_BRANCH_SEQUENCE,
  KHOPOLI_BRANCH_SEQUENCE,
  WESTERN_DAHANU_SEQUENCE,
  TRANS_HARBOUR_SEQUENCE,
} from "../../railway/data/stations";
import { RailwayPathResolver } from "../../railway/network/RailwayPathResolver";

// =========================================================================
// 1. CENTRAL LINE — SLOW LOCAL CORRIDOR (Parel ⇄ Dadar ⇄ Matunga ⇄ Sion)
// =========================================================================
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
  new THREE.Vector3(5.2, RAIL_TOP_Y, -950),
  new THREE.Vector3(5.8, RAIL_TOP_Y, -820),
  new THREE.Vector3(6.0, RAIL_TOP_Y, -750),
  new THREE.Vector3(6.0, RAIL_TOP_Y, -620),
  new THREE.Vector3(5.7, RAIL_TOP_Y, -400),
  new THREE.Vector3(6.0, RAIL_TOP_Y, -180),
  new THREE.Vector3(6.0, RAIL_TOP_Y, 0),
  new THREE.Vector3(6.0, RAIL_TOP_Y, 180),
  new THREE.Vector3(6.2, RAIL_TOP_Y, 420),
  new THREE.Vector3(6.8, RAIL_TOP_Y, 830),
  new THREE.Vector3(7.4, RAIL_TOP_Y, 1050),
  new THREE.Vector3(8.5, RAIL_TOP_Y, 1240),
  new THREE.Vector3(9.8, RAIL_TOP_Y, 1650),
  new THREE.Vector3(11.2, RAIL_TOP_Y, 2170),
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

// =========================================================================
// 2. WESTERN LINE — SUBURBAN CORRIDOR (Churchgate ⇄ Dadar WR ⇄ Bandra)
// =========================================================================
const WESTERN_SUBURBAN_SPLINE_POINTS: THREE.Vector3[] = [
  new THREE.Vector3(-1724, RAIL_TOP_Y, 9475),   // Churchgate (CCG)
  new THREE.Vector3(-2018, RAIL_TOP_Y, 8213),   // Marine Lines (MEL)
  new THREE.Vector3(-2523, RAIL_TOP_Y, 7338),   // Charni Road (CYR)
  new THREE.Vector3(-2850, RAIL_TOP_Y, 6040),   // Grant Road (GTR)
  new THREE.Vector3(-2471, RAIL_TOP_Y, 5313),   // Mumbai Central (MMCT)
  new THREE.Vector3(-2029, RAIL_TOP_Y, 3889),   // Mahalaxmi (MX)
  new THREE.Vector3(-1324, RAIL_TOP_Y, 2490),   // Lower Parel (PL)
  new THREE.Vector3(-778, RAIL_TOP_Y, 1284),    // Prabhadevi (PBHD)
  new THREE.Vector3(-10.5, RAIL_TOP_Y, 0),      // Dadar WR (DDR)
  new THREE.Vector3(241, RAIL_TOP_Y, -1118),    // Matunga Road (MRU)
  new THREE.Vector3(200, RAIL_TOP_Y, -2557),    // Mahim Junction (MM)
  new THREE.Vector3(-273, RAIL_TOP_Y, -4151),   // Bandra (BA)
];

const WESTERN_SUBURBAN_STATIONS: StationWaypoint[] = [
  {
    stationId: "CCG",
    stationCode: "CCG",
    name: "Churchgate",
    nameDevanagari: "चर्चगेट",
    corridor: "WESTERN",
    stopDistanceM: 100,
    platformLengthM: 300,
    platformNumber: "PF 2",
    platformSide: "LEFT",
    stoppingToleranceM: 5.0,
    maxEntrySpeedKmh: 30,
  },
  {
    stationId: "MEL",
    stationCode: "MEL",
    name: "Marine Lines",
    nameDevanagari: "मरीन लाइन्स",
    corridor: "WESTERN",
    stopDistanceM: 1350,
    platformLengthM: 280,
    platformNumber: "PF 1",
    platformSide: "LEFT",
    stoppingToleranceM: 5.0,
    maxEntrySpeedKmh: 45,
  },
  {
    stationId: "CYR",
    stationCode: "CYR",
    name: "Charni Road",
    nameDevanagari: "चर्नी रोड",
    corridor: "WESTERN",
    stopDistanceM: 2320,
    platformLengthM: 280,
    platformNumber: "PF 1",
    platformSide: "LEFT",
    stoppingToleranceM: 5.0,
    maxEntrySpeedKmh: 45,
  },
  {
    stationId: "GTR",
    stationCode: "GTR",
    name: "Grant Road",
    nameDevanagari: "ग्रँट रोड",
    corridor: "WESTERN",
    stopDistanceM: 3680,
    platformLengthM: 280,
    platformNumber: "PF 1",
    platformSide: "LEFT",
    stoppingToleranceM: 5.0,
    maxEntrySpeedKmh: 45,
  },
  {
    stationId: "BCL",
    stationCode: "BCL",
    name: "Mumbai Central",
    nameDevanagari: "मुंबई सेंट्रल",
    corridor: "WESTERN",
    stopDistanceM: 4520,
    platformLengthM: 300,
    platformNumber: "PF 3",
    platformSide: "LEFT",
    stoppingToleranceM: 5.0,
    interchange: ["Mumbai Central Mainline Terminus (MMCT)"],
    maxEntrySpeedKmh: 40,
  },
  {
    stationId: "MX",
    stationCode: "MX",
    name: "Mahalaxmi",
    nameDevanagari: "महालक्ष्मी",
    corridor: "WESTERN",
    stopDistanceM: 6050,
    platformLengthM: 280,
    platformNumber: "PF 2",
    platformSide: "LEFT",
    stoppingToleranceM: 5.0,
    maxEntrySpeedKmh: 45,
  },
  {
    stationId: "PL",
    stationCode: "PL",
    name: "Lower Parel",
    nameDevanagari: "लोअर परेल",
    corridor: "WESTERN",
    stopDistanceM: 7580,
    platformLengthM: 280,
    platformNumber: "PF 2",
    platformSide: "LEFT",
    stoppingToleranceM: 5.0,
    interchange: ["Lower Parel Carriage Workshop"],
    maxEntrySpeedKmh: 45,
  },
  {
    stationId: "PBHD",
    stationCode: "PBHD",
    name: "Prabhadevi",
    nameDevanagari: "प्रभादेवी",
    corridor: "WESTERN",
    stopDistanceM: 8850,
    platformLengthM: 280,
    platformNumber: "PF 1",
    platformSide: "LEFT",
    stoppingToleranceM: 5.0,
    interchange: ["Parel Central Line Footbridge Connection"],
    maxEntrySpeedKmh: 45,
  },
  {
    stationId: "DDR-WR",
    stationCode: "DDR",
    name: "Dadar Western",
    nameDevanagari: "दादर (पश्चिम)",
    corridor: "WESTERN",
    stopDistanceM: 10200,
    platformLengthM: 280,
    platformNumber: "PF 1",
    platformSide: "LEFT",
    stoppingToleranceM: 5.0,
    interchange: ["Central Railway Inter-Platform Connectors"],
    maxEntrySpeedKmh: 45,
  },
  {
    stationId: "MRU",
    stationCode: "MRU",
    name: "Matunga Road",
    nameDevanagari: "माटुंगा रोड",
    corridor: "WESTERN",
    stopDistanceM: 11450,
    platformLengthM: 280,
    platformNumber: "PF 1",
    platformSide: "LEFT",
    stoppingToleranceM: 5.0,
    maxEntrySpeedKmh: 45,
  },
  {
    stationId: "MM",
    stationCode: "MM",
    name: "Mahim Junction",
    nameDevanagari: "माहिम जंक्शन",
    corridor: "WESTERN",
    stopDistanceM: 12920,
    platformLengthM: 280,
    platformNumber: "PF 2",
    platformSide: "LEFT",
    stoppingToleranceM: 5.0,
    interchange: ["Harbour Line Chord to Wadala Road"],
    maxEntrySpeedKmh: 45,
  },
  {
    stationId: "BA",
    stationCode: "BA",
    name: "Bandra",
    nameDevanagari: "वांद्रे",
    corridor: "WESTERN",
    stopDistanceM: 14750,
    platformLengthM: 300,
    platformNumber: "PF 3",
    platformSide: "LEFT",
    stoppingToleranceM: 5.0,
    interchange: ["Bandra Terminus Long Distance Lines"],
    maxEntrySpeedKmh: 40,
  },
];

const WESTERN_SUBURBAN_SIGNALS: BlockSignal[] = [
  { signalId: "S-WR-01", distanceM: 50, direction: "DOWN", aspect: "GREEN", name: "CCG Starter 1", speedLimitKmh: 40, protectedBlockEndM: 1200 },
  { signalId: "S-WR-02", distanceM: 1250, direction: "DOWN", aspect: "GREEN", name: "MEL Starter", speedLimitKmh: 65, protectedBlockEndM: 2200 },
  { signalId: "S-WR-03", distanceM: 2250, direction: "DOWN", aspect: "GREEN", name: "CYR Starter", speedLimitKmh: 65, protectedBlockEndM: 3500 },
  { signalId: "S-WR-04", distanceM: 3550, direction: "DOWN", aspect: "GREEN", name: "GTR Starter", speedLimitKmh: 65, protectedBlockEndM: 4400 },
  { signalId: "S-WR-05", distanceM: 4420, direction: "DOWN", aspect: "GREEN", name: "MMCT South Home", speedLimitKmh: 50, protectedBlockEndM: 5900 },
  { signalId: "S-WR-06", distanceM: 5950, direction: "DOWN", aspect: "GREEN", name: "MX Starter", speedLimitKmh: 75, protectedBlockEndM: 7400 },
  { signalId: "S-WR-07", distanceM: 7450, direction: "DOWN", aspect: "GREEN", name: "PL Starter", speedLimitKmh: 75, protectedBlockEndM: 8700 },
  { signalId: "S-WR-08", distanceM: 8750, direction: "DOWN", aspect: "GREEN", name: "PBHD Starter", speedLimitKmh: 65, protectedBlockEndM: 10000 },
  { signalId: "S-WR-09", distanceM: 10050, direction: "DOWN", aspect: "GREEN", name: "DDR WR Home", speedLimitKmh: 45, protectedBlockEndM: 11300 },
  { signalId: "S-WR-10", distanceM: 11350, direction: "DOWN", aspect: "GREEN", name: "MRU Starter", speedLimitKmh: 75, protectedBlockEndM: 12700 },
  { signalId: "S-WR-11", distanceM: 12750, direction: "DOWN", aspect: "GREEN", name: "MM Junction Home", speedLimitKmh: 50, protectedBlockEndM: 14500 },
  { signalId: "S-WR-12", distanceM: 14600, direction: "DOWN", aspect: "GREEN", name: "BA Home", speedLimitKmh: 40, protectedBlockEndM: 15200 },
];

export const ROUTE_WESTERN_SUBURBAN_PLAYABLE: PlayableRoute = {
  routeId: "western-suburban-churchgate-bandra",
  name: "Western Line — Suburban (Churchgate ⇄ Bandra)",
  shortName: "WR Suburban",
  corridorId: "WESTERN",
  direction: "DOWN",
  directionLabel: "DOWN (Northbound toward Borivali/Virar)",
  startStationCode: "CCG",
  endStationCode: "BA",
  intermediateStations: [
    { code: "CCG", name: "Churchgate", nameDevanagari: "चर्चगेट" },
    { code: "MEL", name: "Marine Lines", nameDevanagari: "मरीन लाइन्स" },
    { code: "CYR", name: "Charni Road", nameDevanagari: "चर्नी रोड" },
    { code: "GTR", name: "Grant Road", nameDevanagari: "ग्रँट रोड" },
    { code: "MMCT", name: "Mumbai Central", nameDevanagari: "मुंबई सेंट्रल" },
    { code: "MX", name: "Mahalaxmi", nameDevanagari: "महालक्ष्मी" },
    { code: "PL", name: "Lower Parel", nameDevanagari: "लोअर परेल" },
    { code: "PBHD", name: "Prabhadevi", nameDevanagari: "प्रभादेवी" },
    { code: "DDR", name: "Dadar (WR)", nameDevanagari: "दादर (पश्चिम)" },
    { code: "MRU", name: "Matunga Road", nameDevanagari: "माटुंगा रोड" },
    { code: "MM", name: "Mahim Junction", nameDevanagari: "माहिम जंक्शन" },
    { code: "BA", name: "Bandra", nameDevanagari: "वांद्रे" },
  ],
  verifiedLengthKm: 15.2,
  lineTypeLabel: "Western Slow Line (Tracks 1 & 2)",
  electrification: "25 kV AC 50 Hz OHE",
  stations: WESTERN_SUBURBAN_STATIONS,
  signals: WESTERN_SUBURBAN_SIGNALS,
  speedRestrictions: [
    { id: "WR-MPS", startM: 0, endM: 15200, maxSpeedKmh: 90, reason: "Western Railway Suburban Track Speed" },
    { id: "WR-DDR-CAUTION", startM: 9800, endM: 10400, maxSpeedKmh: 45, reason: "Dadar Curvature & Platform Approach" },
  ],
  curvePoints: WESTERN_SUBURBAN_SPLINE_POINTS,
  totalDistanceM: 15200,
};

// =========================================================================
// 3. HARBOUR LINE — PORT & CHORD (CSMT ⇄ Wadala Road ⇄ Mahim Junction)
// =========================================================================
const HARBOUR_CHORD_SPLINE_POINTS: THREE.Vector3[] = [
  new THREE.Vector3(-767, RAIL_TOP_Y, 8601),    // CSMT Harbour (CSMT)
  new THREE.Vector3(-452, RAIL_TOP_Y, 7231),    // Masjid (MSD)
  new THREE.Vector3(-315, RAIL_TOP_Y, 6232),    // Sandhurst Road (SNRD - Elevated)
  new THREE.Vector3(126, RAIL_TOP_Y, 5567),     // Dockyard Road (DKRD)
  new THREE.Vector3(231, RAIL_TOP_Y, 4627),     // Reay Road (RRD)
  new THREE.Vector3(441, RAIL_TOP_Y, 3519),     // Cotton Green (CTGN)
  new THREE.Vector3(1072, RAIL_TOP_Y, 2026),    // Sewri (SVE)
  new THREE.Vector3(1598, RAIL_TOP_Y, 143),     // Wadala Road (VDLR - Junction)
  new THREE.Vector3(1440, RAIL_TOP_Y, -1516),   // King's Circle (KCE)
  new THREE.Vector3(200, RAIL_TOP_Y, -2557),    // Mahim Junction (MM Chord)
];

const HARBOUR_CHORD_STATIONS: StationWaypoint[] = [
  {
    stationId: "CSMT-HB",
    stationCode: "CSMT",
    name: "CSMT (Harbour)",
    nameDevanagari: "छ.शि.म.ट. (हार्बर)",
    corridor: "HARBOUR",
    stopDistanceM: 100,
    platformLengthM: 280,
    platformNumber: "PF 1",
    platformSide: "LEFT",
    stoppingToleranceM: 5.0,
    maxEntrySpeedKmh: 30,
  },
  {
    stationId: "MSD",
    stationCode: "MSD",
    name: "Masjid",
    nameDevanagari: "मशीद",
    corridor: "HARBOUR",
    stopDistanceM: 1450,
    platformLengthM: 280,
    platformNumber: "PF 1",
    platformSide: "LEFT",
    stoppingToleranceM: 5.0,
    maxEntrySpeedKmh: 45,
  },
  {
    stationId: "SNRD",
    stationCode: "SNRD",
    name: "Sandhurst Road",
    nameDevanagari: "सँडहर्स्ट रोड",
    corridor: "HARBOUR",
    stopDistanceM: 2520,
    platformLengthM: 280,
    platformNumber: "PF 3",
    platformSide: "LEFT",
    stoppingToleranceM: 5.0,
    interchange: ["Central Main Line Lower Level"],
    maxEntrySpeedKmh: 40,
  },
  {
    stationId: "DKRD",
    stationCode: "DKRD",
    name: "Dockyard Road",
    nameDevanagari: "डॉकयार्ड रोड",
    corridor: "HARBOUR",
    stopDistanceM: 3350,
    platformLengthM: 280,
    platformNumber: "PF 1",
    platformSide: "LEFT",
    stoppingToleranceM: 5.0,
    maxEntrySpeedKmh: 45,
  },
  {
    stationId: "RRD",
    stationCode: "RRD",
    name: "Reay Road",
    nameDevanagari: "रे रोड",
    corridor: "HARBOUR",
    stopDistanceM: 4420,
    platformLengthM: 280,
    platformNumber: "PF 1",
    platformSide: "LEFT",
    stoppingToleranceM: 5.0,
    maxEntrySpeedKmh: 45,
  },
  {
    stationId: "CTGN",
    stationCode: "CTGN",
    name: "Cotton Green",
    nameDevanagari: "कॉटन ग्रीन",
    corridor: "HARBOUR",
    stopDistanceM: 5650,
    platformLengthM: 280,
    platformNumber: "PF 1",
    platformSide: "LEFT",
    stoppingToleranceM: 5.0,
    maxEntrySpeedKmh: 45,
  },
  {
    stationId: "SVE",
    stationCode: "SVE",
    name: "Sewri",
    nameDevanagari: "शिवडी",
    corridor: "HARBOUR",
    stopDistanceM: 7300,
    platformLengthM: 280,
    platformNumber: "PF 1",
    platformSide: "LEFT",
    stoppingToleranceM: 5.0,
    maxEntrySpeedKmh: 45,
  },
  {
    stationId: "VDLR",
    stationCode: "VDLR",
    name: "Wadala Road",
    nameDevanagari: "वडाळा रोड",
    corridor: "HARBOUR",
    stopDistanceM: 9280,
    platformLengthM: 280,
    platformNumber: "PF 2",
    platformSide: "LEFT",
    stoppingToleranceM: 5.0,
    interchange: ["Harbour Mainline to Panvel", "Wadala EMU Stabling Siding"],
    maxEntrySpeedKmh: 40,
  },
  {
    stationId: "KCE",
    stationCode: "KCE",
    name: "King's Circle",
    nameDevanagari: "किंग्ज सर्कल",
    corridor: "HARBOUR_WESTERN_CHORD",
    stopDistanceM: 11020,
    platformLengthM: 280,
    platformNumber: "PF 1",
    platformSide: "LEFT",
    stoppingToleranceM: 5.0,
    maxEntrySpeedKmh: 45,
  },
  {
    stationId: "MM-HB",
    stationCode: "MM",
    name: "Mahim Junction Chord",
    nameDevanagari: "माहिम जंक्शन",
    corridor: "HARBOUR_WESTERN_CHORD",
    stopDistanceM: 12650,
    platformLengthM: 280,
    platformNumber: "PF 5",
    platformSide: "LEFT",
    stoppingToleranceM: 5.0,
    interchange: ["Western Railway Mainline to Bandra/Andheri"],
    maxEntrySpeedKmh: 35,
  },
];

const HARBOUR_CHORD_SIGNALS: BlockSignal[] = [
  { signalId: "S-HB-01", distanceM: 50, direction: "DOWN", aspect: "GREEN", name: "CSMT HB Starter", speedLimitKmh: 40, protectedBlockEndM: 1300 },
  { signalId: "S-HB-02", distanceM: 1380, direction: "DOWN", aspect: "GREEN", name: "MSD Starter", speedLimitKmh: 65, protectedBlockEndM: 2400 },
  { signalId: "S-HB-03", distanceM: 2450, direction: "DOWN", aspect: "GREEN", name: "SNRD Starter", speedLimitKmh: 50, protectedBlockEndM: 3200 },
  { signalId: "S-HB-04", distanceM: 3280, direction: "DOWN", aspect: "GREEN", name: "DKRD Starter", speedLimitKmh: 65, protectedBlockEndM: 4300 },
  { signalId: "S-HB-05", distanceM: 4350, direction: "DOWN", aspect: "GREEN", name: "RRD Starter", speedLimitKmh: 65, protectedBlockEndM: 5500 },
  { signalId: "S-HB-06", distanceM: 5580, direction: "DOWN", aspect: "GREEN", name: "CTGN Starter", speedLimitKmh: 65, protectedBlockEndM: 7100 },
  { signalId: "S-HB-07", distanceM: 7200, direction: "DOWN", aspect: "GREEN", name: "SVE Starter", speedLimitKmh: 65, protectedBlockEndM: 9000 },
  { signalId: "S-HB-08", distanceM: 9100, direction: "DOWN", aspect: "GREEN", name: "VDLR Home", speedLimitKmh: 40, protectedBlockEndM: 10800 },
  { signalId: "S-HB-09", distanceM: 10900, direction: "DOWN", aspect: "GREEN", name: "KCE Starter", speedLimitKmh: 50, protectedBlockEndM: 12400 },
  { signalId: "S-HB-10", distanceM: 12500, direction: "DOWN", aspect: "GREEN", name: "MM Chord Home", speedLimitKmh: 35, protectedBlockEndM: 12800 },
];

export const ROUTE_HARBOUR_CHORD_PLAYABLE: PlayableRoute = {
  routeId: "harbour-chord-csmt-mahim",
  name: "Harbour Line — Port & Chord (CSMT ⇄ Mahim Junction)",
  shortName: "HB Chord",
  corridorId: "HARBOUR",
  direction: "DOWN",
  directionLabel: "DOWN (CSMT to Mahim via Wadala)",
  startStationCode: "CSMT",
  endStationCode: "MM",
  intermediateStations: [
    { code: "CSMT", name: "CSMT", nameDevanagari: "छ.शि.म.ट." },
    { code: "MSD", name: "Masjid", nameDevanagari: "मशीद" },
    { code: "SNRD", name: "Sandhurst Road", nameDevanagari: "सँडहर्स्ट रोड" },
    { code: "DKRD", name: "Dockyard Road", nameDevanagari: "डॉकयार्ड रोड" },
    { code: "RRD", name: "Reay Road", nameDevanagari: "रे रोड" },
    { code: "CTGN", name: "Cotton Green", nameDevanagari: "कॉटन ग्रीन" },
    { code: "SVE", name: "Sewri", nameDevanagari: "शिवडी" },
    { code: "VDLR", name: "Wadala Road", nameDevanagari: "वडाळा रोड" },
    { code: "KCE", name: "King's Circle", nameDevanagari: "किंग्ज सर्कल" },
    { code: "MM", name: "Mahim Junction", nameDevanagari: "माहिम जंक्शन" },
  ],
  verifiedLengthKm: 12.8,
  lineTypeLabel: "Harbour Line & Western Chord",
  electrification: "25 kV AC 50 Hz OHE",
  stations: HARBOUR_CHORD_STATIONS,
  signals: HARBOUR_CHORD_SIGNALS,
  speedRestrictions: [
    { id: "HB-MPS", startM: 0, endM: 12800, maxSpeedKmh: 80, reason: "Harbour Line Maximum Permissible Speed" },
    { id: "HB-SNRD-CURVE", startM: 2300, endM: 2700, maxSpeedKmh: 40, reason: "Sandhurst Road Elevated Sharp Curve" },
    { id: "HB-CHORD-SPEED", startM: 10000, endM: 12800, maxSpeedKmh: 50, reason: "King's Circle - Mahim Junction Chord" },
  ],
  curvePoints: HARBOUR_CHORD_SPLINE_POINTS,
  totalDistanceM: 12800,
};

// =========================================================================
// CONTINUOUS RAILWAY PATH RESOLVER FOR ALL OPERATIONAL CORRIDORS
// =========================================================================
const pathResolver = new RailwayPathResolver();

// 4. CENTRAL LINE — FULL SUBURBAN MAINLINE (CSMT ⇄ Kalyan Junction, 26 Stations, 53.8 km)
export const ROUTE_CENTRAL_MAINLINE: PlayableRoute = pathResolver.resolveRoute(
  "central-mainline-csmt-kalyan",
  "Central Line — Suburban Mainline (CSMT ⇄ Kalyan)",
  "CR Mainline",
  "CENTRAL",
  CENTRAL_MAIN_SEQUENCE.map((s) => s.code)
)!.route;

// 5. KASARA BRANCH — THAL GHAT SECTION (Kalyan ⇄ Kasara, 12 Stations, 67.2 km)
export const ROUTE_KASARA_BRANCH: PlayableRoute = pathResolver.resolveRoute(
  "kasara-branch-kalyan-kasara",
  "Kasara Branch — Thal Ghat Section (Kalyan ⇄ Kasara)",
  "Kasara Branch",
  "KASARA_BRANCH",
  KASARA_BRANCH_SEQUENCE.map((s) => s.code)
)!.route;

// 6. KARJAT BRANCH — BHOR GHAT SECTION (Kalyan ⇄ Karjat Junction, 10 Stations, 45.4 km)
export const ROUTE_KARJAT_BRANCH: PlayableRoute = pathResolver.resolveRoute(
  "karjat-branch-kalyan-karjat",
  "Karjat Branch — Bhor Ghat Section (Kalyan ⇄ Karjat)",
  "Karjat Branch",
  "KARJAT_BRANCH",
  KARJAT_BRANCH_SEQUENCE.map((s) => s.code)
)!.route;

// 7. KHOPOLI BRANCH — FEEDER SHUTTLE (Karjat Junction ⇄ Khopoli, 6 Stations, 15.0 km)
export const ROUTE_KHOPOLI_BRANCH: PlayableRoute = pathResolver.resolveRoute(
  "khopoli-branch-karjat-khopoli",
  "Khopoli Branch — Feeder Shuttle (Karjat ⇄ Khopoli)",
  "Khopoli Branch",
  "KHOPOLI_BRANCH",
  KHOPOLI_BRANCH_SEQUENCE.map((s) => s.code)
)!.route;

// 8. WESTERN RAILWAY — FULL SUBURBAN MAINLINE (Churchgate ⇄ Virar, 29 Stations, 59.8 km)
export const ROUTE_WESTERN_MAINLINE: PlayableRoute = pathResolver.resolveRoute(
  "western-mainline-churchgate-virar",
  "Western Line — Suburban Mainline (Churchgate ⇄ Virar)",
  "WR Mainline",
  "WESTERN",
  WESTERN_MAIN_SEQUENCE.map((s) => s.code)
)!.route;

// 9. WESTERN RAILWAY — DAHANU ROAD EXTENSION (Virar ⇄ Dahanu Road, 9 Stations, 64.0 km)
export const ROUTE_WESTERN_DAHANU: PlayableRoute = pathResolver.resolveRoute(
  "western-dahanu-virar-dahanu",
  "Western Line — Dahanu Road Extension (Virar ⇄ Dahanu Road)",
  "WR Dahanu",
  "WESTERN_DAHANU",
  WESTERN_DAHANU_SEQUENCE.map((s) => s.code)
)!.route;

// 10. HARBOUR LINE — FULL SUBURBAN MAINLINE (CSMT ⇄ Panvel Junction, 25 Stations, 48.9 km)
export const ROUTE_HARBOUR_MAINLINE: PlayableRoute = pathResolver.resolveRoute(
  "harbour-mainline-csmt-panvel",
  "Harbour Line — Suburban Mainline (CSMT ⇄ Panvel)",
  "HB Mainline",
  "HARBOUR",
  HARBOUR_MAIN_SEQUENCE.map((s) => s.code)
)!.route;

// 11. TRANS-HARBOUR CORRIDOR (Thane ⇄ Panvel Junction, 17 Stations, 38.5 km)
export const ROUTE_TRANS_HARBOUR: PlayableRoute = pathResolver.resolveRoute(
  "trans-harbour-thane-panvel",
  "Trans-Harbour Line (Thane ⇄ Vashi / Panvel)",
  "Trans-Harbour",
  "TRANS_HARBOUR",
  TRANS_HARBOUR_SEQUENCE.map((s) => s.code)
)!.route;

export const AVAILABLE_ROUTES: PlayableRoute[] = [
  ROUTE_CENTRAL_LOCAL_PLAYABLE,
  ROUTE_CENTRAL_MAINLINE,
  ROUTE_KASARA_BRANCH,
  ROUTE_KARJAT_BRANCH,
  ROUTE_KHOPOLI_BRANCH,
  ROUTE_WESTERN_SUBURBAN_PLAYABLE,
  ROUTE_WESTERN_MAINLINE,
  ROUTE_WESTERN_DAHANU,
  ROUTE_HARBOUR_CHORD_PLAYABLE,
  ROUTE_HARBOUR_MAINLINE,
  ROUTE_TRANS_HARBOUR,
];
