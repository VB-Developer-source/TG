import * as THREE from "three";
import { STATIONS } from "./data/stations";
import type { CorridorId, InfrastructureStatus, TrackLineType, TrackSegment } from "./data/types";
import { GeographicConverter } from "./GeographicConverter";

export interface NetworkNode {
  id: string;
  name: string;
  stationCode?: string;
  corridor: CorridorId[];
  position: THREE.Vector3;
  isJunction: boolean;
  isTerminal: boolean;
  connectedEdgeIds: string[];
}

export interface NetworkEdge {
  id: string;
  corridor: CorridorId;
  lineType: TrackLineType;
  startNodeId: string;
  endNodeId: string;
  path: THREE.Curve<THREE.Vector3>;
  lengthMeters: number;
  gaugeMeters: number;
  status: InfrastructureStatus;
}

/**
 * Graph-based Railway Network Engine for Mumbai Suburban Railway.
 * Connects stations, junctions, branch lines, and crossovers with explicit nodes and edges.
 */
export class RailwayGraph {
  readonly nodes = new Map<string, NetworkNode>();
  readonly edges = new Map<string, NetworkEdge>();

  constructor() {
    this.buildCoreNetwork();
  }

  private buildCoreNetwork(): void {
    // 1. Build Nodes from Stations
    Object.values(STATIONS).forEach((station) => {
      let pos: THREE.Vector3;
      if (station.latitude !== null && station.longitude !== null) {
        pos = GeographicConverter.geoToWorld(station.latitude, station.longitude, station.elevation ?? 7);
      } else {
        pos = new THREE.Vector3(0, 0, 0);
      }

      this.nodes.set(station.stationId, {
        id: station.stationId,
        name: station.stationName,
        stationCode: station.stationCode,
        corridor: station.corridors,
        position: pos,
        isJunction: station.trackLayout === "JUNCTION" || (station.junctionConnections?.length ?? 0) > 0,
        isTerminal: station.trackLayout === "TERMINAL",
        connectedEdgeIds: [],
      });
    });

    // 2. Build Commissioned Corridors

    // A. Central Main Line: CSMT -> PR -> DDR -> LTT -> DI -> KYN
    this.createQuadTrackCorridor("CSMT", "PR", "CENTRAL");
    this.createQuadTrackCorridor("PR", "DDR", "CENTRAL");
    this.createQuadTrackCorridor("DDR", "LTT", "CENTRAL");
    this.createQuadTrackCorridor("LTT", "DI", "CENTRAL");
    this.createQuadTrackCorridor("DI", "KYN", "CENTRAL");

    // B. Kalyan Junction Branches
    // Branch 1: Kalyan -> Kasara (Double line commissioned)
    this.createDoubleTrackCorridor("KYN", "KSRA", "KASARA_BRANCH");

    // Branch 2: Kalyan -> Karjat (Double line commissioned)
    this.createDoubleTrackCorridor("KYN", "KJT", "KARJAT_BRANCH");

    // C. Western Railway: Churchgate -> DDR -> MM -> BSR -> VR
    this.createQuadTrackCorridor("CCG", "DDR", "WESTERN");
    this.createQuadTrackCorridor("DDR", "MM", "WESTERN");
    this.createQuadTrackCorridor("MM", "BSR", "WESTERN");
    this.createQuadTrackCorridor("BSR", "VR", "WESTERN");

    // D. Harbour Main Line: CSMT -> VDLR -> PNVL
    this.createDoubleTrackCorridor("CSMT", "VDLR", "HARBOUR");
    this.createDoubleTrackCorridor("VDLR", "PNVL", "HARBOUR");

    // E. Harbour-Western Chord: Wadala Road -> Mahim Junction
    this.createBranchConnection("VDLR", "MM", "HARBOUR_WESTERN_CHORD");

    // F. Maintenance Pit Lines & Yards at Verified Stations
    this.createYardLines("KYN", 4, "PIT_LINE");
    this.createYardLines("BSR", 3, "PIT_LINE");
    this.createYardLines("BSR", 5, "STABLING_LINE");
    this.createYardLines("PR", 5, "PIT_LINE");
    this.createYardLines("PR", 6, "STABLING_LINE");
    this.createYardLines("PNVL", 4, "PIT_LINE");
    this.createYardLines("PNVL", 2, "SICK_LINE");
    this.createYardLines("LTT", 2, "PIT_LINE");
  }

  private createQuadTrackCorridor(fromId: string, toId: string, corridor: CorridorId): void {
    const fromNode = this.nodes.get(fromId);
    const toNode = this.nodes.get(toId);
    if (!fromNode || !toNode) return;

    const trackTypes: TrackLineType[] = ["LOCAL_UP", "LOCAL_DN", "THROUGH_UP", "THROUGH_DN"];
    const lateralOffsets = [-7.5, -2.5, 2.5, 7.5]; // Metres lateral offset

    trackTypes.forEach((lineType, idx) => {
      const edgeId = `${fromId}-${toId}-${lineType}`;
      const offset = lateralOffsets[idx];

      const startPt = fromNode.position.clone().add(new THREE.Vector3(offset, 0, 0));
      const endPt = toNode.position.clone().add(new THREE.Vector3(offset, 0, 0));
      const curve = new THREE.LineCurve3(startPt, endPt);

      const edge: NetworkEdge = {
        id: edgeId,
        corridor,
        lineType,
        startNodeId: fromId,
        endNodeId: toId,
        path: curve,
        lengthMeters: curve.getLength(),
        gaugeMeters: 1.676,
        status: "EXISTING_COMMISSIONED",
      };

      this.edges.set(edgeId, edge);
      fromNode.connectedEdgeIds.push(edgeId);
      toNode.connectedEdgeIds.push(edgeId);
    });
  }

  private createDoubleTrackCorridor(fromId: string, toId: string, corridor: CorridorId): void {
    const fromNode = this.nodes.get(fromId);
    const toNode = this.nodes.get(toId);
    if (!fromNode || !toNode) return;

    const trackTypes: TrackLineType[] = ["LOCAL_UP", "LOCAL_DN"];
    const lateralOffsets = [-2.5, 2.5];

    trackTypes.forEach((lineType, idx) => {
      const edgeId = `${fromId}-${toId}-${lineType}`;
      const offset = lateralOffsets[idx];

      const startPt = fromNode.position.clone().add(new THREE.Vector3(offset, 0, 0));
      const endPt = toNode.position.clone().add(new THREE.Vector3(offset, 0, 0));
      const curve = new THREE.LineCurve3(startPt, endPt);

      const edge: NetworkEdge = {
        id: edgeId,
        corridor,
        lineType,
        startNodeId: fromId,
        endNodeId: toId,
        path: curve,
        lengthMeters: curve.getLength(),
        gaugeMeters: 1.676,
        status: "EXISTING_COMMISSIONED",
      };

      this.edges.set(edgeId, edge);
      fromNode.connectedEdgeIds.push(edgeId);
      toNode.connectedEdgeIds.push(edgeId);
    });
  }

  private createBranchConnection(fromId: string, toId: string, corridor: CorridorId): void {
    const fromNode = this.nodes.get(fromId);
    const toNode = this.nodes.get(toId);
    if (!fromNode || !toNode) return;

    const edgeId = `${fromId}-${toId}-CHORD`;
    // S-curve junction chord
    const p0 = fromNode.position.clone();
    const p3 = toNode.position.clone();
    const p1 = new THREE.Vector3(p0.x, 0, p0.z + (p3.z - p0.z) * 0.4);
    const p2 = new THREE.Vector3(p3.x, 0, p0.z + (p3.z - p0.z) * 0.7);

    const curve = new THREE.CubicBezierCurve3(p0, p1, p2, p3);

    const edge: NetworkEdge = {
      id: edgeId,
      corridor,
      lineType: "CROSSOVER",
      startNodeId: fromId,
      endNodeId: toId,
      path: curve,
      lengthMeters: curve.getLength(),
      gaugeMeters: 1.676,
      status: "EXISTING_COMMISSIONED",
    };

    this.edges.set(edgeId, edge);
    fromNode.connectedEdgeIds.push(edgeId);
    toNode.connectedEdgeIds.push(edgeId);
  }

  private createYardLines(stationId: string, count: number, type: TrackLineType): void {
    const stationNode = this.nodes.get(stationId);
    if (!stationNode) return;

    for (let i = 0; i < count; i++) {
      const edgeId = `${stationId}-${type}-${i + 1}`;
      const offsetX = 14.0 + i * 4.5;
      const startPt = stationNode.position.clone().add(new THREE.Vector3(offsetX, 0, -200));
      const endPt = stationNode.position.clone().add(new THREE.Vector3(offsetX, 0, 200));

      const edge: NetworkEdge = {
        id: edgeId,
        corridor: stationNode.corridor[0] ?? "CENTRAL",
        lineType: type,
        startNodeId: stationId,
        endNodeId: stationId,
        path: new THREE.LineCurve3(startPt, endPt),
        lengthMeters: 400,
        gaugeMeters: 1.676,
        status: "EXISTING_COMMISSIONED",
      };

      this.edges.set(edgeId, edge);
      stationNode.connectedEdgeIds.push(edgeId);
    }
  }

  /**
   * Filters active commissioned edges for default playable simulation.
   */
  getCommissionedEdges(): NetworkEdge[] {
    return Array.from(this.edges.values()).filter((e) => e.status === "EXISTING_COMMISSIONED");
  }

  /**
   * Gets all edges belonging to a corridor.
   */
  getEdgesByCorridor(corridor: CorridorId): NetworkEdge[] {
    return Array.from(this.edges.values()).filter((e) => e.corridor === corridor);
  }
}
