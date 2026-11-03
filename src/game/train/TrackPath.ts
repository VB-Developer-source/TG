/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from "three";
import { COACH_LENGTH, BOGIE_OFFSET } from "./TrainConfig";
import { RAIL_TOP_Y } from "../world/layout";
import type { PlayableRoute, StationWaypoint, BlockSignal, SignalAspect } from "../railway/RailwayNetworkModels";
import { ROUTE_CENTRAL_LOCAL_PLAYABLE } from "../railway/RouteDatabase";

export interface TrackSample {
  position: THREE.Vector3;
  tangent: THREE.Vector3;
  normal: THREE.Vector3;
  up: THREE.Vector3;
  curvature: number;
}

export interface CoachPose {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  frontBogiePos: THREE.Vector3;
  frontBogieQuat: THREE.Quaternion;
  rearBogiePos: THREE.Vector3;
  rearBogieQuat: THREE.Quaternion;
}

export type StationApproachStatus =
  | "CRUISING"
  | "APPROACHING"
  | "BRAKING_ZONE"
  | "ALIGNED"
  | "OVERSHOT";

export interface StationApproachTelemetry {
  station: StationWaypoint;
  distanceToStop: number;      // In metres (positive = approaching, negative = overshot)
  status: StationApproachStatus;
  isAligned: boolean;          // Within station stopping tolerance window (+/- 5.0m)
  recommendedSpeedKmh: number;
  correctPlatformSide: "LEFT" | "RIGHT" | "BOTH";
}

/**
 * Continuous track path system representing Mumbai suburban railway alignments.
 * Supports distance-based parameterization, smooth Catmull-Rom transitions,
 * connected route switching, multi-aspect block signals, and station stopping telemetry.
 */
export class TrackPath {
  private activeRoute: PlayableRoute;
  readonly curve: THREE.CurvePath<THREE.Vector3>;
  totalLength: number;

  constructor(route: PlayableRoute = ROUTE_CENTRAL_LOCAL_PLAYABLE) {
    this.activeRoute = route;
    this.curve = new THREE.CurvePath<THREE.Vector3>();

    const spline = new THREE.CatmullRomCurve3(route.curvePoints, false, "centripetal", 0.5);
    this.curve.add(spline);
    this.totalLength = this.curve.getLength();
  }

  /**
   * Set active playable route, rebuilding the continuous track curve.
   */
  public setRoute(route: PlayableRoute): void {
    this.activeRoute = route;
    this.curve.curves = [];
    const spline = new THREE.CatmullRomCurve3(route.curvePoints, false, "centripetal", 0.5);
    this.curve.add(spline);
    this.totalLength = this.curve.getLength();
  }

  public getActiveRoute(): PlayableRoute {
    return this.activeRoute;
  }

  /**
   * Sample track state at a continuous arc distance (in metres) along the railway corridor.
   * Guarantees double-precision right-handed orthonormal coordinate basis.
   */
  public sampleAtDistance(distanceM: number): TrackSample {
    const clampedDist = Math.max(0, Math.min(this.totalLength, distanceM));
    const u = this.totalLength > 0 ? clampedDist / this.totalLength : 0;

    const position = this.curve.getPoint(u);
    const tangent = this.curve.getTangent(u).normalize();

    // Standard Indian Railways upright normal (Right-handed basis: R x N = T)
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(up, tangent).normalize();
    const correctedUp = new THREE.Vector3().crossVectors(tangent, right).normalize();

    // Approximate curvature from nearby sample
    const deltaU = 0.001;
    const nextTangent = this.curve.getTangent(Math.min(1, u + deltaU)).normalize();
    const curvature = tangent.angleTo(nextTangent) / (deltaU * this.totalLength);

    return {
      position,
      tangent,
      normal: right,
      up: correctedUp,
      curvature,
    };
  }

  /**
   * Calculates the exact rigid body pose of an EMU coach and its two supporting bogies
   * at a specific track distance, preserving authentic Broad Gauge wheelset alignment.
   */
  public getCoachPose(coachCenterDistance: number): CoachPose {
    const frontBogieDist = coachCenterDistance + BOGIE_OFFSET;
    const rearBogieDist = coachCenterDistance - BOGIE_OFFSET;

    const frontSample = this.sampleAtDistance(frontBogieDist);
    const rearSample = this.sampleAtDistance(rearBogieDist);

    // Coach body position is the exact midpoint between the two bogie pivot centers
    const coachPos = new THREE.Vector3()
      .addVectors(frontSample.position, rearSample.position)
      .multiplyScalar(0.5);

    // Coach body orientation points directly from rear bogie to front bogie
    const coachHeading = new THREE.Vector3()
      .subVectors(frontSample.position, rearSample.position)
      .normalize();

    const coachUp = new THREE.Vector3(0, 1, 0);
    const coachRight = new THREE.Vector3().crossVectors(coachUp, coachHeading).normalize();
    const correctedUp = new THREE.Vector3().crossVectors(coachHeading, coachRight).normalize();

    const coachRotMatrix = new THREE.Matrix4().makeBasis(coachRight, correctedUp, coachHeading);
    const coachQuat = new THREE.Quaternion().setFromRotationMatrix(coachRotMatrix);

    // Bogies align with their local track tangents (Right-handed orthonormal frame)
    const frontRight = new THREE.Vector3().crossVectors(coachUp, frontSample.tangent).normalize();
    const correctedFrontUp = new THREE.Vector3().crossVectors(frontSample.tangent, frontRight).normalize();
    const frontMat = new THREE.Matrix4().makeBasis(frontRight, correctedFrontUp, frontSample.tangent);
    const frontQuat = new THREE.Quaternion().setFromRotationMatrix(frontMat);

    const rearRight = new THREE.Vector3().crossVectors(coachUp, rearSample.tangent).normalize();
    const correctedRearUp = new THREE.Vector3().crossVectors(rearSample.tangent, rearRight).normalize();
    const rearMat = new THREE.Matrix4().makeBasis(rearRight, correctedRearUp, rearSample.tangent);
    const rearQuat = new THREE.Quaternion().setFromRotationMatrix(rearMat);

    return {
      position: coachPos,
      quaternion: coachQuat,
      frontBogiePos: frontSample.position,
      frontBogieQuat: frontQuat,
      rearBogiePos: rearSample.position,
      rearBogieQuat: rearQuat,
    };
  }

  /**
   * Computes the initial spawn/stop distance for a station (defaults to Dadar Station).
   */
  public getStationStopDistance(stationCode: string = "DDR"): number {
    const found = this.activeRoute.stations.find((s) => s.stationCode === stationCode);
    if (found) return found.stopDistanceM;
    // Fallback: Dadar platform center
    return 920;
  }

  /**
   * Evaluates the upcoming station and stopping telemetry for the driver HUD.
   */
  public getUpcomingStation(trainDist: number, forward: boolean = true): StationApproachTelemetry | null {
    const stations = this.activeRoute.stations;
    if (!stations.length) return null;

    if (forward) {
      // Find the closest station ahead or currently stopped at
      for (let i = 0; i < stations.length; i++) {
        const st = stations[i];
        const distToStop = st.stopDistanceM - trainDist;
        // If we are within 25m past the stop point or ahead of it
        if (distToStop >= -30) {
          const isAligned = Math.abs(distToStop) <= st.stoppingToleranceM;
          let status: StationApproachStatus = "CRUISING";
          let recommendedSpeedKmh = 105;

          if (isAligned) {
            status = "ALIGNED";
            recommendedSpeedKmh = 0;
          } else if (distToStop < -st.stoppingToleranceM) {
            status = "OVERSHOT";
            recommendedSpeedKmh = 0;
          } else if (distToStop <= 100) {
            status = "BRAKING_ZONE";
            recommendedSpeedKmh = 20;
          } else if (distToStop <= 450) {
            status = "APPROACHING";
            recommendedSpeedKmh = 45;
          }

          return {
            station: st,
            distanceToStop: distToStop,
            status,
            isAligned,
            recommendedSpeedKmh,
            correctPlatformSide: st.platformSide,
          };
        }
      }
      // Passed last station
      const last = stations[stations.length - 1];
      return {
        station: last,
        distanceToStop: last.stopDistanceM - trainDist,
        status: "OVERSHOT",
        isAligned: false,
        recommendedSpeedKmh: 0,
        correctPlatformSide: last.platformSide,
      };
    } else {
      // Reverse travel (Southbound toward Parel / CSMT)
      for (let i = stations.length - 1; i >= 0; i--) {
        const st = stations[i];
        const distToStop = trainDist - st.stopDistanceM;
        if (distToStop >= -30) {
          const isAligned = Math.abs(distToStop) <= st.stoppingToleranceM;
          return {
            station: st,
            distanceToStop: distToStop,
            status: isAligned ? "ALIGNED" : distToStop <= 100 ? "BRAKING_ZONE" : "APPROACHING",
            isAligned,
            recommendedSpeedKmh: isAligned ? 0 : 45,
            correctPlatformSide: st.platformSide,
          };
        }
      }
    }

    return null;
  }

  /**
   * Retrieves the nearest upcoming Automatic Block Signal ahead of the train.
   */
  public getSignalAhead(trainDist: number, forward: boolean = true): { signal: BlockSignal; distanceToSignal: number } | null {
    const signals = this.activeRoute.signals;
    if (!signals.length) return null;

    if (forward) {
      for (const sig of signals) {
        if (sig.direction === "DOWN" && sig.distanceM >= trainDist) {
          return { signal: sig, distanceToSignal: sig.distanceM - trainDist };
        }
      }
    } else {
      for (let i = signals.length - 1; i >= 0; i--) {
        const sig = signals[i];
        if (sig.direction === "UP" && sig.distanceM <= trainDist) {
          return { signal: sig, distanceToSignal: trainDist - sig.distanceM };
        }
      }
    }

    return null;
  }

  /**
   * Updates real-time block signal aspects based on train occupancy along the route.
   */
  public updateSignalAspects(trainLeadDist: number, trainTailDist: number): void {
    const minZ = Math.min(trainLeadDist, trainTailDist);
    const maxZ = Math.max(trainLeadDist, trainTailDist);

    for (const sig of this.activeRoute.signals) {
      // If the train is inside the block section protected by this signal:
      if (maxZ >= sig.distanceM && minZ <= sig.protectedBlockEndM) {
        sig.aspect = "RED"; // Danger - Block Occupied
      } else if (sig.distanceM > maxZ && sig.distanceM - maxZ < 500) {
        sig.aspect = "YELLOW"; // Caution
      } else if (sig.distanceM > maxZ && sig.distanceM - maxZ < 1000) {
        sig.aspect = "DOUBLE_YELLOW"; // Attention
      } else {
        sig.aspect = "GREEN"; // Clear / Proceed
      }
    }
  }

  /**
   * Gets active speed restriction at train position (MPS or PSR).
   */
  public getSpeedLimitAt(distanceM: number): number {
    for (const psr of this.activeRoute.speedRestrictions) {
      if (distanceM >= psr.startM && distanceM <= psr.endM) {
        return psr.maxSpeedKmh;
      }
    }
    return 105; // Standard broad-gauge suburban EMU MPS
  }
}

export const defaultTrackPath = new TrackPath(ROUTE_CENTRAL_LOCAL_PLAYABLE);
