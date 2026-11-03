import type { LoadTask } from "../core/AssetManager";
import type { GameContext } from "../core/Game";
import type { GameScene } from "./SceneManager";

const SIGNAGE_FONT = `700 64px "Noto Sans Devanagari"`;
const UI_FONT = `700 64px "IBM Plex Sans"`;

/** Loads fonts, textures and the world, then compiles shaders. */
export class BootScene implements GameScene {
  readonly name = "boot" as const;
  readonly rendersWorld = false;
  private hasDevanagari = false;

  constructor(private readonly ctx: GameContext) {}

  async enter(): Promise<void> {
    const { assets, world, lighting, renderer, cameras } = this.ctx;
    const tasks: LoadTask[] = [
      {
        id: "fonts",
        label: "Loading station signage fonts",
        optional: true,
        timeoutMs: 5000,
        run: async () => {
          await document.fonts.load(UI_FONT, "DADAR");
          const faces = await document.fonts.load(SIGNAGE_FONT, "दादर");
          if (faces.length === 0) throw new Error("Devanagari font unavailable");
          this.hasDevanagari = true;
        },
      },
      ...world.createLoadTasks({
        anisotropy: () => Math.min(this.ctx.profile().anisotropy, renderer.maxAnisotropy),
        hasDevanagari: () => this.hasDevanagari,
      }),
      { id: "sky", label: "Baking sky reflections", run: () => lighting.bakeEnvironment(renderer.gl) },
      {
        id: "compile",
        label: "Compiling shaders",
        weight: 3,
        run: async () => {
          await renderer.gl.compileAsync(world.scene, cameras.camera);
        },
      },
      {
        id: "warmup",
        label: "Warming up the renderer",
        run: () => {
          lighting.update(cameras.camera);
          renderer.render(world.scene, cameras.camera);
        },
      },
    ];
    await assets.runTasks(tasks, (progress) => this.ctx.reportLoading(progress));
  }

  update(): void {}

  exit(): void {}

  dispose(): void {}
}
