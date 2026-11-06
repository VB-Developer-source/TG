/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from "three";
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
} from "../data/stations";
import { TRACK_SECTIONS, type RailwayTrackSection } from "../data/trackSections";
import { MUMBAI_RAILWAY_CORRIDORS } from "../data/corridors";
import type { CorridorId, InfrastructureStatus, StationRecord } from "../data/types";
import { GeographicConverter } from "../GeographicConverter";

export interface NetworkGraphNode {
  id: string;
  stationCode: string;
  name: string;
  nameDevanagari: string;
  corridors: CorridorId[];
  position: THREE.Vector3;
  elevation: number;
  isJunction: boolean;
  isTerminal: boolean;
  passengerPlatformCount: number | null;
  pitLineCount: number | null;
  stablingLineCount: number | null;
  connectedEdgeIds: string[];
}

export interface NetworkGraphEdge {
  id: string;
  corridor: CorridorId;
  lineCode: string;
  fromNodeId: string;
  toNodeId: string;
  distanceMeters: number;
  gradientRatio: number | null;
  maxSpeedKmh: number;
  gaugeMeters: number;
  catenaryVoltageKv: number;
  status: InfrastructureStatus;
}

/**
 * Topologically verified Railway Network Graph engine for Mumbai Suburban Railway.
 * Connects over 70 stations across Central, Western, Harbour, Kasara, and Karjat corridors.
 */
export class RailwayNetworkGraph {
  readonly nodes = new Map<string, NetworkGraphNode>();
  readonly edges = new Map<string, NetworkGraphEdge>();
  readonly adjacency = new Map<string, string[]>(); // nodeId -> connected edge IDs

  constructor() {
    this.buildGraph();
  }

  private buildGraph(): void {
    // 1. Populate Detailed Stations from Database
    Object.values(STATIONS).forEach((station: StationRecord) => {
      let pos: THREE.Vector3;
      if (station.latitude !== null && station.longitude !== null) {
        pos = GeographicConverter.geoToWorld(
          station.latitude,
          station.longitude,
          station.elevation ?? 7
        );
      } else {
        pos = new THREE.Vector3(0, 0, 0);
      }

      const isJunction =
        station.trackLayout === "JUNCTION" ||
        (station.junctionConnections && station.junctionConnections.length > 0) ||
        station.corridors.length > 1;

      const isTerminal = station.trackLayout === "TERMINAL";

      const node: NetworkGraphNode = {
        id: station.stationCode,
        stationCode: station.stationCode,
        name: station.stationName,
        nameDevanagari: station.stationNameDevanagari,
        corridors: station.corridors,
        position: pos,
        elevation: station.elevation ?? 7,
        isJunction: Boolean(isJunction),
        isTerminal: Boolean(isTerminal),
        passengerPlatformCount: station.passengerPlatformCount,
        pitLineCount: station.pitLineCount,
        stablingLineCount: station.stablingLineCount,
        connectedEdgeIds: [],
      };

      this.nodes.set(station.stationCode, node);
      this.adjacency.set(station.stationCode, []);
    });

    // 2. Populate All Remaining Sequence Stations
    const addSequenceStations = (
      seq: { code: string; name: string; nameDevanagari: string }[],
      corridor: CorridorId
    ) => {
      seq.forEach((st) => {
        if (!this.nodes.has(st.code)) {
          const isJct = ["DDR", "CLA", "KYN", "MM", "VDLR", "BSR", "TNA", "DIVA"].includes(st.code);
          const isTerm = ["CSMT", "CCG", "VR", "PNVL", "KSRA", "KJT", "PR"].includes(st.code);

          const node: NetworkGraphNode = {
            id: st.code,
            stationCode: st.code,
            name: st.name,
            nameDevanagari: st.nameDevanagari,
            corridors: [corridor],
            position: new THREE.Vector3(0, 0, 0),
            elevation: 7,
            isJunction: isJct,
            isTerminal: isTerm,
            passengerPlatformCount: null,
            pitLineCount: null,
            stablingLineCount: null,
            connectedEdgeIds: [],
          };
          this.nodes.set(st.code, node);
          this.adjacency.set(st.code, []);
        } else {
          // Add corridor if multiple corridors share this station
          const existing = this.nodes.get(st.code)!;
          if (!existing.corridors.includes(corridor)) {
            existing.corridors.push(corridor);
          }
        }
      });
    };

    addSequenceStations(CENTRAL_MAIN_SEQUENCE, "CENTRAL");
    addSequenceStations(WESTERN_MAIN_SEQUENCE, "WESTERN");
    addSequenceStations(HARBOUR_MAIN_SEQUENCE, "HARBOUR");
    addSequenceStations(HARBOUR_WESTERN_SEQUENCE, "HARBOUR_WESTERN_CHORD");
    addSequenceStations(KASARA_BRANCH_SEQUENCE, "KASARA_BRANCH");
    addSequenceStations(KARJAT_BRANCH_SEQUENCE, "KARJAT_BRANCH");
    addSequenceStations(KHOPOLI_BRANCH_SEQUENCE, "KHOPOLI_BRANCH");
    addSequenceStations(WESTERN_DAHANU_SEQUENCE, "WESTERN_DAHANU");
    addSequenceStations(TRANS_HARBOUR_SEQUENCE, "TRANS_HARBOUR");

    // 3. Connect Authoritative Track Sections
    TRACK_SECTIONS.forEach((sec: RailwayTrackSection) => {
      const edge: NetworkGraphEdge = {
        id: sec.sectionId,
        corridor: sec.corridor,
        lineCode: sec.lineCode,
        fromNodeId: sec.startStationCode,
        toNodeId: sec.endStationCode,
        distanceMeters: sec.distanceMeters,
        gradientRatio: sec.gradientRatio,
        maxSpeedKmh: sec.maxSpeedKmh,
        gaugeMeters: sec.gaugeMeters,
        catenaryVoltageKv: sec.catenaryVoltageKv,
        status: sec.status,
      };

      this.edges.set(sec.sectionId, edge);

      const fromNode = this.nodes.get(sec.startStationCode);
      const toNode = this.nodes.get(sec.endStationCode);

      if (fromNode) {
        fromNode.connectedEdgeIds.push(sec.sectionId);
        this.adjacency.get(sec.startStationCode)?.push(sec.sectionId);
      }
      if (toNode) {
        toNode.connectedEdgeIds.push(sec.sectionId);
        this.adjacency.get(sec.endStationCode)?.push(sec.sectionId);
      }
    });

    // 4. Connect Consecutive Sequence Stations along Corridors (Double Track Topology)
    const connectSequence = (
      seq: { code: string; name: string }[],
      corridor: CorridorId,
      lineCode: string,
      defaultDistanceM: number = 1800
    ) => {
      for (let i = 0; i < seq.length - 1; i++) {
        const from = seq[i].code;
        const to = seq[i + 1].code;
        const edgeId = `CORR-${corridor}-${from}-${to}`;

        // If not already covered by authoritative track section
        if (!this.edges.has(edgeId)) {
          const fromNode = this.nodes.get(from);
          const toNode = this.nodes.get(to);
          let dist = defaultDistanceM;
          if (fromNode && toNode && fromNode.position.lengthSq() > 0 && toNode.position.lengthSq() > 0) {
            dist = Math.round(fromNode.position.distanceTo(toNode.position));
            if (dist < 500) dist = defaultDistanceM;
          }

          const edge: NetworkGraphEdge = {
            id: edgeId,
            corridor,
            lineCode,
            fromNodeId: from,
            toNodeId: to,
            distanceMeters: dist,
            gradientRatio: 0,
            maxSpeedKmh: corridor === "WESTERN_DAHANU" || corridor === "KASARA_BRANCH" ? 100 : 80,
            gaugeMeters: 1.676,
            catenaryVoltageKv: 25,
            status: "EXISTING_COMMISSIONED",
          };

          this.edges.set(edgeId, edge);
          this.adjacency.get(from)?.push(edgeId);
          this.adjacency.get(to)?.push(edgeId);

          if (fromNode) fromNode.connectedEdgeIds.push(edgeId);
          if (toNode) toNode.connectedEdgeIds.push(edgeId);
        }
      }
    };

    connectSequence(CENTRAL_MAIN_SEQUENCE, "CENTRAL", "CR_SL_DN", 1850);
    connectSequence(WESTERN_MAIN_SEQUENCE, "WESTERN", "WR_SL_DN", 1950);
    connectSequence(HARBOUR_MAIN_SEQUENCE, "HARBOUR", "HB_DN", 1920);
    connectSequence(HARBOUR_WESTERN_SEQUENCE, "HARBOUR_WESTERN_CHORD", "HWC_DN", 1700);
    connectSequence(KASARA_BRANCH_SEQUENCE, "KASARA_BRANCH", "KAS_DN", 6700);
    connectSequence(KARJAT_BRANCH_SEQUENCE, "KARJAT_BRANCH", "KAR_DN", 4500);
    connectSequence(KHOPOLI_BRANCH_SEQUENCE, "KHOPOLI_BRANCH", "KHP_DN", 3000);
    connectSequence(WESTERN_DAHANU_SEQUENCE, "WESTERN_DAHANU", "WDD_DN", 7800);
    connectSequence(TRANS_HARBOUR_SEQUENCE, "TRANS_HARBOUR", "TH_DN", 2200);
  }

  public getNode(idOrCode: string): NetworkGraphNode | undefined {
    return this.nodes.get(idOrCode);
  }

  public getEdge(id: string): NetworkGraphEdge | undefined {
    return this.edges.get(id);
  }

  public getAllNodes(): NetworkGraphNode[] {
    return Array.from(this.nodes.values());
  }

  public getAllEdges(): NetworkGraphEdge[] {
    return Array.from(this.edges.values());
  }

  public getJunctionNodes(): NetworkGraphNode[] {
    return Array.from(this.nodes.values()).filter((n) => n.isJunction);
  }

  public getTerminalNodes(): NetworkGraphNode[] {
    return Array.from(this.nodes.values()).filter((n) => n.isTerminal);
  }

  public getCorridorEdges(corridor: CorridorId): NetworkGraphEdge[] {
    return Array.from(this.edges.values()).filter((e) => e.corridor === corridor);
  }

  /**
   * Breadth-First Search (BFS) pathfinder across connected edges between two station codes.
   */
  public findPath(
    startCode: string,
    endCode: string,
    corridorFilter?: CorridorId
  ): { nodePath: string[]; edgePath: string[]; totalDistanceMeters: number } | null {
    if (!this.nodes.has(startCode) || !this.nodes.has(endCode)) {
      return null;
    }

    if (startCode === endCode) {
      return { nodePath: [startCode], edgePath: [], totalDistanceMeters: 0 };
    }

    const queue: { current: string; nodePath: string[]; edgePath: string[]; dist: number }[] = [
      { current: startCode, nodePath: [startCode], edgePath: [], dist: 0 },
    ];
    const visited = new Set<string>([startCode]);

    while (queue.length > 0) {
      const step = queue.shift()!;

      if (step.current === endCode) {
        return {
          nodePath: step.nodePath,
          edgePath: step.edgePath,
          totalDistanceMeters: step.dist,
        };
      }

      const edgeIds = this.adjacency.get(step.current) ?? [];
      for (const edgeId of edgeIds) {
        const edge = this.edges.get(edgeId);
        if (!edge) continue;

        if (corridorFilter && edge.corridor !== corridorFilter) {
          continue;
        }

        const nextNodeId =
          edge.fromNodeId === step.current ? edge.toNodeId : edge.fromNodeId;

        if (!visited.has(nextNodeId)) {
          visited.add(nextNodeId);
          queue.push({
            current: nextNodeId,
            nodePath: [...step.nodePath, nextNodeId],
            edgePath: [...step.edgePath, edge.id],
            dist: step.dist + edge.distanceMeters,
          });
        }
      }
    }

    return null;
  }
}
