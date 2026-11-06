import * as THREE from "three";
import type { TrackPath } from "../train/TrackPath";
import { StationBuilder } from "../stations/StationBuilder";
import { StationCrowdManager } from "../stations/StationCrowdManager";
import { TracksideInfrastructure } from "../railway/TracksideInfrastructure";
import { RailwayYardBuilder } from "../railway/RailwayYardBuilder";
import { ContinuousTrackBuilder } from "./ContinuousTrackBuilder";
import type { WorldMaterials } from "./materials";

export interface StreamChunk {
  id: string;
  index: number;
  startDistanceM: number;
  endDistanceM: number;
  centerPos: THREE.Vector3;
  group: THREE.Group | null;
  isLoaded: boolean;
}

/**
 * Dynamic Spatial Streaming and LOD Manager for continuous Mumbai suburban corridors.
 * Manages on-demand distance-based loading, rendering, and GPU memory disposal of
 * continuous 3D tracks, ballast, sleepers, 25kV OHE, stations, trackside equipment,
 * crowds, yards, and Mumbai city environments across the entire metropolitan network.
 */
export class WorldStreamingManager {
  readonly root = new THREE.Group();
  private chunks: StreamChunk[] = [];
  private activePath: TrackPath;
  private materials: WorldMaterials | null = null;
  private crowdManager: StationCrowdManager | null = null;
  private currentCrowdStationCode: string | null = null;
  private tracksideInfra: TracksideInfrastructure | null = null;
  private readonly chunkSizeM = 300;
  private readonly visibilityDistanceM = 2400; // 2.4 km visibility horizon
  private readonly unloadDistanceM = 3600;     // 3.6 km cleanup threshold

  constructor(path: TrackPath, materials?: WorldMaterials | null) {
    this.root.name = "world-streaming-manager";
    this.activePath = path;
    this.materials = materials ?? null;
    this.rebuildChunks();
  }

  public setPath(path: TrackPath, materials?: WorldMaterials | null): void {
    this.dispose();
    this.activePath = path;
    if (materials !== undefined) {
      this.materials = materials;
    }
    this.rebuildChunks();
  }

  private rebuildChunks(): void {
    this.dispose();

    const route = this.activePath.getActiveRoute();
    const totalLen = Math.max(500, this.activePath.totalLength);

    // 1. Build trackside infrastructure (km posts, speed boards, relay boxes)
    this.tracksideInfra = new TracksideInfrastructure(this.activePath);
    this.root.add(this.tracksideInfra.group);

    // 2. Initialize chunk metadata slots along the entire corridor length
    const numChunks = Math.max(1, Math.ceil(totalLen / this.chunkSizeM));

    for (let c = 0; c < numChunks; c++) {
      const dStart = c * this.chunkSizeM;
      const dEnd = Math.min(totalLen, (c + 1) * this.chunkSizeM);
      const dMid = (dStart + dEnd) / 2;
      const midSample = this.activePath.sampleAtDistance(dMid);

      const chunk: StreamChunk = {
        id: `stream-chunk-${c}`,
        index: c,
        startDistanceM: dStart,
        endDistanceM: dEnd,
        centerPos: midSample.position.clone(),
        group: null,
        isLoaded: false,
      };

      this.chunks.push(chunk);
    }

    // 3. Immediately load chunks in the initial visibility window (around origin)
    const initialDist = route.stations[0]?.stopDistanceM ?? 0;
    for (const chunk of this.chunks) {
      const distFromTrain = Math.abs(initialDist - (chunk.startDistanceM + chunk.endDistanceM) / 2);
      if (distFromTrain <= this.visibilityDistanceM) {
        this.loadChunk(chunk);
      }
    }

    // 4. Initialize Passenger Crowd Simulation on starting station
    const primaryStation = route.stations[0] ?? route.stations.find((s) => s.stationCode === "DDR");
    if (primaryStation) {
      this.attachCrowdToStation(primaryStation.stationCode);
    }
  }

  private loadChunk(chunk: StreamChunk): void {
    if (chunk.isLoaded || chunk.group) return;

    const route = this.activePath.getActiveRoute();
    const dStart = chunk.startDistanceM;
    const dEnd = chunk.endDistanceM;

    const chunkGroup = new THREE.Group();
    chunkGroup.name = `chunk-${chunk.index}-${Math.round(dStart)}`;

    // A. Build Continuous 3D Rails, Ballast, Sleepers, OHE & City Scenery
    const trackGeometry = ContinuousTrackBuilder.buildTrackChunk(
      this.activePath,
      dStart,
      dEnd,
      this.materials
    );
    chunkGroup.add(trackGeometry);

    // B. Attach Stations falling within this chunk's distance window
    for (const station of route.stations) {
      if (station.stopDistanceM >= dStart && station.stopDistanceM < dEnd) {
        const sample = this.activePath.sampleAtDistance(station.stopDistanceM);
        const pSide = station.platformSide === "BOTH" ? "ISLAND" : station.platformSide;
        const stationEnv = StationBuilder.buildStationEnvironment({
          stationCode: station.stationCode,
          stationName: station.name,
          stationNameDevanagari: station.nameDevanagari,
          platformSide: pSide,
          hasFootbridge: true,
        });

        stationEnv.position.copy(sample.position);
        stationEnv.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), sample.tangent);
        chunkGroup.add(stationEnv);
      }
    }

    // C. Attach Maintenance Yards for verified depot stations
    for (const station of route.stations) {
      if (station.stopDistanceM >= dStart && station.stopDistanceM < dEnd) {
        if (["PR", "KYN", "CLA", "SNCR", "VR", "KSRA", "KJT", "DRD"].includes(station.stationCode)) {
          const sample = this.activePath.sampleAtDistance(station.stopDistanceM);
          const yard = RailwayYardBuilder.buildYard({
            stationCode: station.stationCode,
            pitLines: 3,
            stablingLines: 3,
            offsetX: 16.0,
          });
          yard.position.copy(sample.position);
          yard.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), sample.tangent);
          chunkGroup.add(yard);
        }
      }
    }

    chunk.group = chunkGroup;
    chunk.isLoaded = true;
    this.root.add(chunkGroup);
  }

  private unloadChunk(chunk: StreamChunk): void {
    if (!chunk.isLoaded || !chunk.group) return;

    this.root.remove(chunk.group);
    chunk.group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }
      }
    });

    chunk.group = null;
    chunk.isLoaded = false;
  }

  private attachCrowdToStation(stationCode: string): void {
    const route = this.activePath.getActiveRoute();
    const station = route.stations.find((s) => s.stationCode === stationCode);
    if (!station) return;

    if (!this.crowdManager) {
      this.crowdManager = new StationCrowdManager(0, 8.5);
      this.root.add(this.crowdManager.group);
    }

    const pSample = this.activePath.sampleAtDistance(station.stopDistanceM);
    this.crowdManager.group.position.copy(pSample.position);
    this.crowdManager.group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), pSample.tangent);
    this.crowdManager.setPlatformSide(station.platformSide);
    this.currentCrowdStationCode = stationCode;
  }

  /**
   * Updates streaming chunks and crowd simulation based on current train distance.
   * Dynamically streams in upcoming chunks and disposes distant ones.
   */
  public update(trainDistanceM: number, dt: number, doorsOpen: boolean, isAligned: boolean): void {
    let chunksLoadedThisFrame = 0;
    const maxLoadsPerFrame = 2; // Throttle chunk creation to guarantee stable 60 FPS

    for (const chunk of this.chunks) {
      const midDist = (chunk.startDistanceM + chunk.endDistanceM) / 2;
      const distFromTrain = Math.abs(trainDistanceM - midDist);

      // A. Stream in upcoming chunks within the 2.4 km visibility horizon
      if (distFromTrain <= this.visibilityDistanceM) {
        if (!chunk.isLoaded && chunksLoadedThisFrame < maxLoadsPerFrame) {
          this.loadChunk(chunk);
          chunksLoadedThisFrame++;
        }
      }
      // B. Unload and dispose chunks that have fallen far behind
      else if (distFromTrain > this.unloadDistanceM && chunk.isLoaded) {
        this.unloadChunk(chunk);
      }
    }

    // C. Nearest station crowd tracking
    const route = this.activePath.getActiveRoute();
    let closestStation = null;
    let closestDist = Infinity;
    for (const st of route.stations) {
      const d = Math.abs(trainDistanceM - st.stopDistanceM);
      if (d < closestDist) {
        closestDist = d;
        closestStation = st;
      }
    }

    if (closestStation && closestDist < 400 && closestStation.stationCode !== this.currentCrowdStationCode) {
      this.attachCrowdToStation(closestStation.stationCode);
    }

    // D. Update crowd animation
    this.crowdManager?.update(dt, doorsOpen, isAligned);
  }

  public getActiveChunkCount(): number {
    return this.chunks.filter((c) => c.isLoaded).length;
  }

  public getTotalChunkCount(): number {
    return this.chunks.length;
  }

  public dispose(): void {
    for (const chunk of this.chunks) {
      if (chunk.isLoaded && chunk.group) {
        this.unloadChunk(chunk);
      }
    }
    this.root.clear();
    this.crowdManager?.dispose();
    this.crowdManager = null;
    this.currentCrowdStationCode = null;
    this.tracksideInfra?.dispose();
    this.tracksideInfra = null;
    this.chunks = [];
  }
}
