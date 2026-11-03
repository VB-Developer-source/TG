/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from "three";
import { COACH_LENGTH, BOGIE_OFFSET } from "./TrainConfig";
import { RAIL_TOP_Y } from "../world/layout";

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

/**
 * Continuous track path system representing Mumbai suburban railway alignments.
 * Supports distance-based parameterization, smooth Catmull-Rom / Bezier transitions,
 * and stable multi-car train articulation without coach separation or track penetration.
 */
export class TrackPath {
  readonly curve: THREE.CurvePath<THREE.Vector3>;
  readonly totalLength: number;
  private readonly divisions = 800;
  private readonly arcLengths: number[] = [];

  constructor(points?: THREE.Vector3[]) {
    this.curve = new THREE.CurvePath<THREE.Vector3>();

    // Default: Mumbai suburban corridor passing through Dadar platform 2/3 (trackX = 6.0)
    // Runs from South (Parel approach) through Dadar Station into North (Matunga / Sion corridor)
    const defaultControlPoints = points ?? [
      new THREE.Vector3(4.2, RAIL_TOP_Y, -500),   // South approach from Parel
      new THREE.Vector3(5.1, RAIL_TOP_Y, -350),   // Transition into platform alignment
      new THREE.Vector3(6.0, RAIL_TOP_Y, -200),   // Dadar South Platform entry
      new THREE.Vector3(6.0, RAIL_TOP_Y, -100),   // Platform 2/3 Island section
      new THREE.Vector3(6.0, RAIL_TOP_Y, 0),      // Station center (FOB alignment)
      new THREE.Vector3(6.0, RAIL_TOP_Y, 120),    // Platform North exit
      new THREE.Vector3(6.0, RAIL_TOP_Y, 250),    // Matunga South signal gantries
      new THREE.Vector3(6.4, RAIL_TOP_Y, 400),    // Gentle suburban curve North-East
      new THREE.Vector3(7.8, RAIL_TOP_Y, 600),    // Mainline corridor toward Sion
      new THREE.Vector3(9.5, RAIL_TOP_Y, 850),    // Distant horizon curve
    ];

    const spline = new THREE.CatmullRomCurve3(defaultControlPoints, false, "centripetal", 0.5);
    this.curve.add(spline);
    this.totalLength = this.curve.getLength();
  }

  /**
   * Sample track state at a continuous arc distance (in metres) along the railway corridor.
   */
  public sampleAtDistance(distanceM: number): TrackSample {
    // Clamp to path boundaries or loop seamlessly
    const clampedDist = Math.max(0, Math.min(this.totalLength, distanceM));
    const u = this.totalLength > 0 ? clampedDist / this.totalLength : 0;

    const position = this.curve.getPoint(u);
    const tangent = this.curve.getTangent(u).normalize();

    // Indian Railways standard upright normal (no excessive tilt on straight track)
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
   *
   * @param coachCenterDistance - Distance along track path to the coach center
   */
  public getCoachPose(coachCenterDistance: number): CoachPose {
    // 1. Sample Front Bogie and Rear Bogie positions along the actual rail curve
    const frontBogieDist = coachCenterDistance + BOGIE_OFFSET;
    const rearBogieDist = coachCenterDistance - BOGIE_OFFSET;

    const frontSample = this.sampleAtDistance(frontBogieDist);
    const rearSample = this.sampleAtDistance(rearBogieDist);

    // 2. Coach body position is the exact midpoint between the two bogie pivot centers
    const coachPos = new THREE.Vector3()
      .addVectors(frontSample.position, rearSample.position)
      .multiplyScalar(0.5);

    // 3. Coach body orientation points directly from rear bogie to front bogie
    const coachHeading = new THREE.Vector3()
      .subVectors(frontSample.position, rearSample.position)
      .normalize();

    const coachUp = new THREE.Vector3(0, 1, 0);
    const coachRight = new THREE.Vector3().crossVectors(coachUp, coachHeading).normalize();
    const correctedUp = new THREE.Vector3().crossVectors(coachHeading, coachRight).normalize();

    const coachRotMatrix = new THREE.Matrix4().makeBasis(coachRight, correctedUp, coachHeading);
    const coachQuat = new THREE.Quaternion().setFromRotationMatrix(coachRotMatrix);

    // 4. Front & Rear bogies align with their local track tangents (Right-handed orthonormal frame)
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
   * Computes the initial head distance so that the train stops at Dadar Station.
   */
  public getStationStopDistance(): number {
    // Center of Dadar platform is at Z = 0 on path (approx 500m into path)
    return 520;
  }
}

export const defaultTrackPath = new TrackPath();
