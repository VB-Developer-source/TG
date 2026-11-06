import * as THREE from "three";
import type { AssetManager, LoadTask } from "./AssetManager";
import { createMaterials, type WorldMaterials } from "../world/materials";
import { applyAnisotropy, createTextureTasks, type TextureTaskOptions } from "../world/textures";
import { buildBallast, buildGround, buildRails, buildSleepers } from "../world/track";
import { buildCanopy, buildPlatform, buildStationBoards } from "../world/platform";
import { buildOheStructures, buildOheWires } from "../world/ohe";
import { buildFootbridge } from "../world/footbridge";
import { buildBuildings, buildShanties, buildTrees } from "../world/surroundings";
import { TrainBuilder, type TrainBuilderOptions } from "../train/TrainBuilder";
import { RailwayNetwork } from "../../railway/RailwayNetwork";
import { STATIONS } from "../../railway/data/stations";

type PartBuilder = (m: WorldMaterials) => THREE.Object3D | THREE.Object3D[];

/** Static environment, built piece by piece so loading progress is real. */
const PARTS: { id: string; label: string; weight: number; build: PartBuilder }[] = [
  { id: "ground", label: "Levelling the ground", weight: 1, build: buildGround },
  { id: "ballast", label: "Packing ballast", weight: 1, build: buildBallast },
  { id: "sleepers", label: "Laying sleepers", weight: 2, build: buildSleepers },
  { id: "rails", label: "Fixing broad-gauge rails", weight: 1, build: buildRails },
  { id: "platform", label: "Building the island platform", weight: 1, build: buildPlatform },
  { id: "canopy", label: "Raising the platform canopy", weight: 2, build: buildCanopy },
  { id: "boards", label: "Hanging station boards", weight: 1, build: buildStationBoards },
  { id: "ohe", label: "Erecting overhead masts", weight: 2, build: buildOheStructures },
  { id: "wires", label: "Stringing 25 kV overhead wires", weight: 2, build: buildOheWires },
  { id: "fob", label: "Constructing the foot over-bridge", weight: 1, build: buildFootbridge },
  { id: "buildings", label: "Growing the neighbourhood", weight: 2, build: buildBuildings },
  { id: "shanties", label: "Settling line-side homes", weight: 1, build: buildShanties },
  { id: "trees", label: "Planting rain trees and palms", weight: 1, build: buildTrees },
  {
    id: "train",
    label: "Commissioning Mumbai Local EMU",
    weight: 2,
    build: () => TrainBuilder.buildRake({ cars: 12, liveryId: "western", trackX: 6.0, startZ: 20 }),
  },
];

export class World {
  readonly scene = new THREE.Scene();
  readonly network = new RailwayNetwork();
  private readonly root = new THREE.Group();
  private readonly dynamicStationRoot = new THREE.Group();
  private materials: WorldMaterials | null = null;
  private currentStationId = "DDR";
  private currentTrainOptions: TrainBuilderOptions = {
    cars: 12,
    liveryId: "western",
    trackX: 6.0,
    startZ: 20,
  };

  constructor(private readonly assets: AssetManager) {
    this.root.name = "world";
    this.dynamicStationRoot.name = "dynamic-station-root";
    this.scene.add(this.root);
    this.scene.add(this.dynamicStationRoot);
  }

  public getMaterials(): WorldMaterials | null {
    return this.materials;
  }

  createLoadTasks(textureOptions: TextureTaskOptions): LoadTask[] {
    return [
      ...createTextureTasks(this.assets, textureOptions),
      {
        id: "materials",
        label: "Mixing paints and materials",
        run: () => {
          this.materials = createMaterials(this.assets);
        },
      },
      ...PARTS.map<LoadTask>((part) => ({
        id: `world-${part.id}`,
        label: part.label,
        weight: part.weight,
        run: () => {
          if (!this.materials) throw new Error("Materials are not ready");
          const built = part.build(this.materials);
          (Array.isArray(built) ? built : [built]).forEach((object) => this.root.add(object));
        },
      })),
    ];
  }

  setTrain(options: TrainBuilderOptions): void {
    this.currentTrainOptions = options;
    const existing = this.scene.getObjectByName("mumbai-emu-rake");
    if (existing) {
      existing.parent?.remove(existing);
      if (existing.userData?.dispose) {
        existing.userData.dispose();
      } else {
        existing.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (mesh.isMesh) mesh.geometry.dispose();
        });
      }
    }
    const newRake = TrainBuilder.buildRake(options);
    this.scene.add(newRake);
  }

  switchStation(stationId: string): void {
    const station = STATIONS[stationId];
    if (!station) return;
    this.currentStationId = stationId;

    if (stationId === "DDR") {
      // Show default Dadar detailed environment
      this.root.visible = true;
      this.dynamicStationRoot.clear();
      this.setTrain({
        ...this.currentTrainOptions,
        trackX: 6.0,
        startZ: 20,
      });
    } else {
      // Hide default static tracks/platform and build station-specific network layout
      this.root.visible = false;
      this.dynamicStationRoot.clear();
      const stationGroup = this.network.setActiveStation(stationId);
      this.dynamicStationRoot.add(stationGroup);

      // Place EMU train on Station Track 1/2
      const livery = station.corridors.includes("CENTRAL")
        ? "central"
        : station.corridors.includes("HARBOUR")
        ? "harbour"
        : "western";

      // Calculate track position for this station
      const isSixPlatform = station.passengerPlatformCount === 6;
      const trainTrackX = isSixPlatform ? 8.25 : 6.0;

      this.setTrain({
        cars: this.currentTrainOptions.cars ?? 12,
        liveryId: livery,
        trackX: trainTrackX,
        startZ: 20,
      });
    }
  }

  getCurrentStationId(): string {
    return this.currentStationId;
  }

  setAnisotropy(level: number): void {
    applyAnisotropy(this.assets, level);
  }

  dispose(): void {
    this.root.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (mesh.isMesh) mesh.geometry.dispose();
      if ((object as THREE.InstancedMesh).isInstancedMesh) (object as THREE.InstancedMesh).dispose();
    });
    this.dynamicStationRoot.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (mesh.isMesh) mesh.geometry.dispose();
      if ((object as THREE.InstancedMesh).isInstancedMesh) (object as THREE.InstancedMesh).dispose();
    });
    this.root.clear();
    this.dynamicStationRoot.clear();
    this.scene.remove(this.root);
    this.scene.remove(this.dynamicStationRoot);
    this.network.dispose();
    this.materials = null;
  }
}

