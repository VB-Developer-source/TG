/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from "three";
import type { CorridorId, InfrastructureStatus, VerificationStatus } from "../../railway/data/types";

export type SignalAspect = "GREEN" | "DOUBLE_YELLOW" | "YELLOW" | "RED";
export type PlatformSide = "LEFT" | "RIGHT" | "BOTH";
export type RouteDirection = "UP" | "DOWN";

/**
 * Verified station waypoint along a continuous railway route.
 */
export interface StationWaypoint {
  stationId: string;
  stationCode: string;
  name: string;
  nameDevanagari: string;
  corridor: CorridorId;
  stopDistanceM: number;       // Distance along path where front cab should align
  platformLengthM: number;     // Standard 12-coach platform: 280 m
  platformNumber: string;      // e.g. "PF 3"
  platformSide: PlatformSide;  // Platform side relative to DOWN travel direction
  stoppingToleranceM: number;  // Standard stopping window (+/- 5.0 m)
  interchange?: string[];      // Connecting corridors or lines
  maxEntrySpeedKmh: number;    // Station throat caution speed (e.g. 45 km/h)
}

/**
 * Automatic Block Signal (ABS) waypoint along track.
 */
export interface BlockSignal {
  signalId: string;
  distanceM: number;
  direction: RouteDirection;
  aspect: SignalAspect;
  name: string;
  speedLimitKmh: number;
  protectedBlockEndM: number;  // End distance of block section protected by this signal
}

/**
 * Permanent or temporary speed restriction section.
 */
export interface SpeedRestriction {
  id: string;
  startM: number;
  endM: number;
  maxSpeedKmh: number;
  reason: string;
}

/**
 * Graph Node representing a station, junction, crossover, or yard boundary.
 */
export interface RailwayNode {
  id: string;
  name: string;
  code?: string;
  corridors: CorridorId[];
  position: THREE.Vector3;
  type: "STATION" | "JUNCTION" | "CROSSOVER" | "TERMINAL" | "YARD";
  connectedEdgeIds: string[];
}

/**
 * Graph Edge representing a physical running track segment with verified geometry.
 */
export interface TrackSegmentEdge {
  id: string;
  corridor: CorridorId;
  lineName: string;
  startNodeId: string;
  endNodeId: string;
  path: THREE.Curve<THREE.Vector3>;
  lengthMeters: number;
  gaugeMeters: number;         // 1.676 m Indian Broad Gauge
  direction: "UP" | "DOWN" | "BIDIRECTIONAL";
  maxSpeedKmh: number;         // MPS (Maximum Permissible Speed)
  electrified: boolean;        // 25kV AC 50Hz OHE
  infrastructureStatus: InfrastructureStatus;
  verificationStatus: VerificationStatus;
  sourceReference: string;
}

/**
 * Playable or navigatable railway route composed of connected track segments and stations.
 */
export interface PlayableRoute {
  routeId: string;
  name: string;
  shortName: string;
  corridorId: CorridorId;
  direction: RouteDirection;
  directionLabel: string;
  startStationCode: string;
  endStationCode: string;
  intermediateStations: { code: string; name: string; nameDevanagari: string }[];
  verifiedLengthKm: number | null;
  lineTypeLabel: string;
  electrification: string;
  stations: StationWaypoint[];
  signals: BlockSignal[];
  speedRestrictions: SpeedRestriction[];
  curvePoints: THREE.Vector3[];
  totalDistanceM: number;
}
