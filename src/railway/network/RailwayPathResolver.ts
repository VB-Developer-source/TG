/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from "three";
import { RAIL_TOP_Y } from "../../game/world/layout";
import type { PlayableRoute, StationWaypoint, BlockSignal, SpeedRestriction } from "../../game/railway/RailwayNetworkModels";
import { STATIONS } from "../data/stations";
import { RailwayNetworkGraph } from "./RailwayNetworkGraph";
import type { CorridorId } from "../data/types";

export interface ResolvedCorridorPath {
  route: PlayableRoute;
  curve: THREE.CatmullRomCurve3;
  totalLengthM: number;
}

/**
 * Resolves continuous 3D railway track splines from network graph topology and coordinates.
 * Generates verified station stop distances, 4-aspect block signals, and speed restrictions.
 */
export class RailwayPathResolver {
  private readonly graph: RailwayNetworkGraph;

  constructor(graph?: RailwayNetworkGraph) {
    this.graph = graph ?? new RailwayNetworkGraph();
  }

  /**
   * Builds a continuous playable route from a sequence of station codes along a corridor.
   */
  public resolveRoute(
    routeId: string,
    name: string,
    shortName: string,
    corridorId: CorridorId,
    stationCodes: string[],
    customSplinePoints?: THREE.Vector3[]
  ): ResolvedCorridorPath | null {
    if (stationCodes.length < 2) return null;

    const stationWaypoints: StationWaypoint[] = [];
    const points: THREE.Vector3[] = [];
    let cumulativeDistance = 0;

    if (customSplinePoints && customSplinePoints.length >= 2) {
      // Use verified detailed spline points if provided
      points.push(...customSplinePoints);
    } else {
      // Build spline from station geographic nodes
      for (let i = 0; i < stationCodes.length; i++) {
        const code = stationCodes[i];
        const node = this.graph.getNode(code);
        if (node) {
          // Normalize rail top elevation
          const pt = new THREE.Vector3(node.position.x, RAIL_TOP_Y + (node.elevation - 7) * 0.1, node.position.z);
          points.push(pt);
        }
      }
    }

    if (points.length < 2) return null;

    const curve = new THREE.CatmullRomCurve3(points, false, "centripetal", 0.5);
    const totalLengthM = curve.getLength();

    // Compute accurate monotonic arc-length distances for each station along the 3D curve
    const stationDistances: number[] = [0];
    for (let i = 1; i < stationCodes.length; i++) {
      if (i === stationCodes.length - 1) {
        stationDistances.push(Math.round(totalLengthM));
        continue;
      }
      const pt = points[i];
      let minU = Math.max(0, (i - 1) / (stationCodes.length - 1));
      let maxU = Math.min(1, (i + 1) / (stationCodes.length - 1));
      let bestU = i / (stationCodes.length - 1);
      let bestDistSq = Infinity;
      const SAMPLES = 50;
      for (let s = 0; s <= SAMPLES; s++) {
        const u = minU + (s / SAMPLES) * (maxU - minU);
        const curvePt = curve.getPointAt(u);
        const dSq = curvePt.distanceToSquared(pt);
        if (dSq < bestDistSq) {
          bestDistSq = dSq;
          bestU = u;
        }
      }
      const dist = Math.round(bestU * totalLengthM);
      stationDistances.push(Math.max(stationDistances[i - 1] + 150, dist));
    }

    // Map stations onto curve
    for (let i = 0; i < stationCodes.length; i++) {
      const code = stationCodes[i];
      const stationRec = STATIONS[code];
      const nameDev = stationRec?.stationNameDevanagari ?? code;
      const englishName = stationRec?.stationName ?? code;
      const stopDist = stationDistances[i];

      stationWaypoints.push({
        stationId: code,
        stationCode: code,
        name: englishName,
        nameDevanagari: nameDev,
        corridor: corridorId,
        stopDistanceM: stopDist,
        platformLengthM: 280,
        platformNumber: "PF 1",
        platformSide: i % 2 === 0 ? "LEFT" : "RIGHT",
        stoppingToleranceM: 5.0,
        maxEntrySpeedKmh: 45,
      });
    }

    // Generate Automatic Block Signals at regular ~500m intervals along route
    const signals: BlockSignal[] = [];
    const signalInterval = Math.max(450, Math.min(800, totalLengthM / Math.max(4, Math.floor(totalLengthM / 600))));
    let sigIdx = 1;

    for (let d = 50; d < totalLengthM - 100; d += signalInterval) {
      signals.push({
        signalId: `S-${corridorId.substring(0, 2)}-${String(sigIdx).padStart(2, "0")}`,
        distanceM: Math.round(d),
        direction: "DOWN",
        aspect: "GREEN",
        name: `Signal ${corridorId.substring(0, 2)}-${sigIdx}`,
        speedLimitKmh: 80,
        protectedBlockEndM: Math.min(totalLengthM, Math.round(d + signalInterval)),
      });
      sigIdx++;
    }

    // Default speed restrictions
    const speedRestrictions: SpeedRestriction[] = [
      {
        id: `PSR-${corridorId}-MPS`,
        startM: 0,
        endM: totalLengthM,
        maxSpeedKmh: corridorId === "HARBOUR" ? 80 : 100,
        reason: "Corridor Permissible Track Speed",
      },
    ];

    const playableRoute: PlayableRoute = {
      routeId,
      name,
      shortName,
      corridorId,
      direction: "DOWN",
      directionLabel: "DOWN (Outbound)",
      startStationCode: stationCodes[0],
      endStationCode: stationCodes[stationCodes.length - 1],
      intermediateStations: stationCodes.map((code) => {
        const rec = STATIONS[code];
        return {
          code,
          name: rec?.stationName ?? code,
          nameDevanagari: rec?.stationNameDevanagari ?? code,
        };
      }),
      verifiedLengthKm: Number((totalLengthM / 1000).toFixed(1)),
      lineTypeLabel: `${corridorId} Broad Gauge Line`,
      electrification: "25 kV AC 50 Hz OHE",
      stations: stationWaypoints,
      signals,
      speedRestrictions,
      curvePoints: points,
      totalDistanceM: Math.round(totalLengthM),
    };

    return {
      route: playableRoute,
      curve,
      totalLengthM,
    };
  }
}
