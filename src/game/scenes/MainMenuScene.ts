import { MenuCinematicMode } from "../camera/MenuCinematicMode";
import type { GameContext } from "../core/Game";
import type { GameScene } from "./SceneManager";

/** Cinematic railway backdrop behind the main menu. */
export class MainMenuScene implements GameScene {
  readonly name = "menu" as const;
  readonly rendersWorld = true;
  private firstEnter = true;

  constructor(private readonly ctx: GameContext) {}

  init(): void {
    this.ctx.cameras.register(new MenuCinematicMode());
  }

  enter(): void {
    this.ctx.cameras.setMode("menu", { snap: this.firstEnter });
    this.firstEnter = false;
  }

  update(): void {}

  exit(): void {}

  dispose(): void {}
}
