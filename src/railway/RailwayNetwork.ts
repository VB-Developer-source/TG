import * as THREE from "three";
import { INFRASTRUCTURE_PROJECTS } from "./data/infrastructureProjects";
import {
  CENTRAL_MAIN_SEQUENCE,
  HARBOUR_MAIN_SEQUENCE,
  HARBOUR_WESTERN_SEQUENCE,
  KARJAT_BRANCH_SEQUENCE,
  KASARA_BRANCH_SEQUENCE,
  STATIONS,
  WESTERN_MAIN_SEQUENCE,
} from "./data/stations";
import type { CorridorId, InfrastructureProjectRecord, StationRecord } from "./data/types";
import { RailwayGraph } from "./RailwayGraph";
import { StationBuilder } from "./stations/StationBuilder";

export class RailwayNetwork {
  readonly graph: RailwayGraph;
  readonly stations = STATIONS;
  readonly projects: InfrastructureProjectRecord[] = INFRASTRUCTURE_PROJECTS;

  private activeStationId: string = "DDR"; // Default to Dadar
  private activeStationGroup: THREE.Group | null = null;
  private readonly rootGroup = new THREE.Group();

  constructor() {
    this.graph = new RailwayGraph();
    this.rootGroup.name = "railway-network-root";
  }

  getRoot(): THREE.Group {
    return this.rootGroup;
  }

  getActiveStation(): StationRecord {
    return this.stations[this.activeStationId] ?? this.stations["DDR"];
  }

  getActiveStationId(): string {
    return this.activeStationId;
  }

  /**
   * Sets the active station being rendered in high-detail 3D simulation.
   */
  setActiveStation(stationId: string): THREE.Group {
    const station = this.stations[stationId];
    if (!station) {
      console.warn(`Station ${stationId} not found in database`);
      return this.rootGroup;
    }

    this.activeStationId = stationId;

    // Dispose old station meshes
    if (this.activeStationGroup) {
      this.rootGroup.remove(this.activeStationGroup);
      this.activeStationGroup.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.geometry.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      });
      this.activeStationGroup = null;
    }

    // Build new station group
    this.activeStationGroup = StationBuilder.buildStation({
      station,
      trackLength: 480,
    });

    this.rootGroup.add(this.activeStationGroup);
    return this.activeStationGroup;
  }

  /**
   * Returns list of stations by corridor.
   */
  getStationsForCorridor(corridor: CorridorId): StationRecord[] {
    return Object.values(this.stations).filter((s) => s.corridors.includes(corridor));
  }

  /**
   * Returns station sequence list for UI navigation.
   */
  static getSequence(corridor: CorridorId): { code: string; name: string; nameDevanagari: string }[] {
    switch (corridor) {
      case "CENTRAL":
        return CENTRAL_MAIN_SEQUENCE;
      case "KASARA_BRANCH":
        return KASARA_BRANCH_SEQUENCE;
      case "KARJAT_BRANCH":
        return KARJAT_BRANCH_SEQUENCE;
      case "WESTERN":
        return WESTERN_MAIN_SEQUENCE;
      case "HARBOUR":
        return HARBOUR_MAIN_SEQUENCE;
      case "HARBOUR_WESTERN_CHORD":
        return HARBOUR_WESTERN_SEQUENCE;
      default:
        return CENTRAL_MAIN_SEQUENCE;
    }
  }

  dispose(): void {
    if (this.activeStationGroup) {
      this.rootGroup.remove(this.activeStationGroup);
      this.activeStationGroup.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.geometry.dispose();
        }
      });
      this.activeStationGroup = null;
    }
    this.rootGroup.clear();
  }
}
