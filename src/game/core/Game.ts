import * as THREE from "three";
import { AssetManager, INITIAL_PROGRESS, LoadCancelledError, type LoadProgress } from "./AssetManager";
import { AudioManager } from "./AudioManager";
import { CameraSystem } from "./Camera";
import { Lighting } from "./Lighting";
import { Observable } from "./Observable";
import { Renderer } from "./Renderer";
import { World } from "./World";
import type { VirtualMove } from "../camera/FreeCameraMode";
import { BootScene } from "../scenes/BootScene";
import { ExploreScene } from "../scenes/ExploreScene";
import { MainMenuScene } from "../scenes/MainMenuScene";
import { SceneManager, type SceneName } from "../scenes/SceneManager";
import { QUALITY_PROFILES, type QualityProfile, type SettingsStore } from "../settings/settings";

export interface GameError {
  message: string;
  /** Fatal errors stop the game; others are shown and may recover. */
  fatal: boolean;
}

export interface FrameStats {
  fps: number;
  pixelRatio: number;
  position: [number, number, number];
}

/** Everything a scene may use. Scenes never reach into Game directly. */
export interface GameContext {
  renderer: Renderer;
  cameras: CameraSystem;
  world: World;
  lighting: Lighting;
  assets: AssetManager;
  audio: AudioManager;
  settings: SettingsStore;
  profile: () => QualityProfile;
  reportLoading: (progress: LoadProgress) => void;
}

const MAX_DT = 0.05;
const STATS_INTERVAL = 0.5;

/**
 * Engine entry point: owns the render loop, scene manager and subsystems.
 * The UI talks to it only through the observables and public methods below.
 */
export class Game {
  readonly loading = new Observable<LoadProgress>(INITIAL_PROGRESS);
  readonly scene = new Observable<SceneName | null>(null);
  readonly error = new Observable<GameError | null>(null);
  readonly stats = new Observable<FrameStats>({ fps: 0, pixelRatio: 1, position: [0, 0, 0] });
  readonly activeStationId = new Observable<string>("DDR");
  readonly audio = new AudioManager();

  private ctx: GameContext | null = null;
  private scenes: SceneManager | null = null;
  private explore: ExploreScene | null = null;
  private rafId = 0;
  private lastTime = 0;
  private statsTime = 0;
  private statsFrames = 0;
  private disposed = false;
  private readonly cleanups: (() => void)[] = [];

  constructor(
    private readonly container: HTMLElement,
    readonly settings: SettingsStore,
  ) {}

  async start(): Promise<void> {
    try {
      const renderer = new Renderer(this.container);
      const assets = new AssetManager();
      const world = new World(assets);
      const cameras = new CameraSystem();
      const lighting = new Lighting(world.scene);
      const ctx: GameContext = {
        renderer,
        cameras,
        world,
        lighting,
        assets,
        audio: this.audio,
        settings: this.settings,
        profile: () => QUALITY_PROFILES[this.settings.get().quality],
        reportLoading: (progress) => this.loading.set(progress),
      };
      this.ctx = ctx;

      this.cleanups.push(renderer.onResize((w, h) => cameras.setAspect(w / h)));
      this.cleanups.push(this.settings.subscribe(this.applySettings));
      this.applySettings();
      this.watchContextLoss(renderer.canvas);

      this.scenes = new SceneManager((name) => {
        this.scene.set(name);
        if (name === "menu") this.container.dataset["sceneReady"] = "true";
      });
      this.explore = new ExploreScene(ctx);
      this.scenes.register(new BootScene(ctx));
      this.scenes.register(new MainMenuScene(ctx));
      this.scenes.register(this.explore);

      this.lastTime = performance.now();
      this.rafId = requestAnimationFrame(this.frame);

      await this.scenes.switchTo("boot");
      if (this.disposed) return;
      await this.scenes.switchTo("menu");
    } catch (error) {
      if (error instanceof LoadCancelledError || this.disposed) return;
      this.fail(error, true);
    }
  }

  goTo(name: Exclude<SceneName, "boot">): void {
    if (!this.scenes || this.scene.get() === "boot") return;
    this.scenes.switchTo(name).catch((error) => this.fail(error, false));
  }

  setVirtualMove(move: VirtualMove): void {
    this.explore?.setVirtualMove(move);
  }

  setTrainRake(options: import("../train/TrainBuilder").TrainBuilderOptions): void {
    this.ctx?.world.setTrain(options);
  }

  switchStation(stationId: string): void {
    if (!this.ctx) return;
    this.ctx.world.switchStation(stationId);
    this.activeStationId.set(stationId);
    // Position free camera to view platform and train
    const station = this.ctx.world.network.stations[stationId];
    const isSixPlatform = station?.passengerPlatformCount === 6;
    const camX = isSixPlatform ? 18.0 : 12.0;
    this.explore?.teleport(new THREE.Vector3(camX, 4.5, 35.0), new THREE.Vector3(camX - 6.0, 2.5, 10.0));
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.rafId);
    this.cleanups.forEach((cleanup) => cleanup());
    this.cleanups.length = 0;
    this.scenes?.dispose();
    if (this.ctx) {
      const { cameras, lighting, world, assets, renderer } = this.ctx;
      cameras.dispose();
      lighting.dispose();
      world.dispose();
      assets.dispose();
      renderer.dispose();
    }
    this.audio.dispose();
    delete this.container.dataset["sceneReady"];
    this.ctx = null;
    this.scenes = null;
    [this.loading, this.scene, this.error, this.stats].forEach((o) => o.clearListeners());
  }

  private frame = (time: number) => {
    if (this.disposed || !this.ctx || !this.scenes) return;
    this.rafId = requestAnimationFrame(this.frame);
    const rawDt = Math.max(0, (time - this.lastTime) / 1000);
    this.lastTime = time;
    const dt = Math.min(rawDt, MAX_DT);
    const { renderer, cameras, lighting, world } = this.ctx;
    try {
      this.scenes.update(dt);
      const active = this.scenes.active;
      if (!active?.rendersWorld) return;
      cameras.update(dt);
      lighting.update(cameras.camera);
      renderer.render(world.scene, cameras.camera);
      renderer.samplePerformance(rawDt);
      this.trackStats(rawDt);
    } catch (error) {
      cancelAnimationFrame(this.rafId);
      this.fail(error, true);
    }
  };

  private trackStats(dt: number): void {
    if (!this.ctx) return;
    this.statsTime += dt;
    this.statsFrames += 1;
    if (this.statsTime < STATS_INTERVAL) return;
    const p = this.ctx.cameras.pose.position;
    this.stats.set({
      fps: Math.round(this.statsFrames / this.statsTime),
      pixelRatio: this.ctx.renderer.currentPixelRatio,
      position: [Math.round(p.x * 10) / 10, Math.round(p.y * 10) / 10, Math.round(p.z * 10) / 10],
    });
    this.statsTime = 0;
    this.statsFrames = 0;
  }

  private applySettings = () => {
    if (!this.ctx) return;
    const settings = this.settings.get();
    const profile = QUALITY_PROFILES[settings.quality];
    const { renderer, lighting, cameras, world } = this.ctx;
    renderer.applyQuality(profile);
    lighting.applySettings(profile, settings.shadows);
    cameras.setFar(profile.drawDistance * 1.25);
    world.setAnisotropy(Math.min(profile.anisotropy, renderer.maxAnisotropy));
    this.audio.setEnabled(settings.sound);
  };

  private watchContextLoss(canvas: HTMLCanvasElement): void {
    const lost = (event: Event) => {
      event.preventDefault();
      this.error.set({ message: "The graphics context was lost. Restoring…", fatal: false });
    };
    const restored = () => this.error.set(null);
    canvas.addEventListener("webglcontextlost", lost);
    canvas.addEventListener("webglcontextrestored", restored);
    this.cleanups.push(() => {
      canvas.removeEventListener("webglcontextlost", lost);
      canvas.removeEventListener("webglcontextrestored", restored);
    });
  }

  private fail(error: unknown, fatal: boolean): void {
    console.error(error);
    const raw = error instanceof Error ? error.message : String(error);
    const message = /webgl/i.test(raw)
      ? "Your browser or device could not start 3D graphics (WebGL). Try another browser or enable hardware acceleration."
      : raw;
    this.error.set({ message, fatal });
  }
}
