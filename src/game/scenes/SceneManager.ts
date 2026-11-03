export type SceneName = "boot" | "menu" | "explore";

/**
 * Lifecycle every game scene follows. Scenes share the persistent world and
 * decide which camera mode and systems run while they are active.
 */
export interface GameScene {
  readonly name: SceneName;
  /** Whether the 3D world should be drawn while this scene is active. */
  readonly rendersWorld: boolean;
  /** Runs once, the first time the scene is entered. */
  init?(): void | Promise<void>;
  enter(): void | Promise<void>;
  update(dt: number): void;
  exit(): void;
  dispose(): void;
}

export class SceneManager {
  private readonly scenes = new Map<SceneName, GameScene>();
  private readonly initialized = new Set<SceneName>();
  private current: GameScene | null = null;

  constructor(private readonly onChange: (name: SceneName) => void) {}

  register(scene: GameScene): void {
    this.scenes.set(scene.name, scene);
  }

  get active(): GameScene | null {
    return this.current;
  }

  async switchTo(name: SceneName): Promise<void> {
    const next = this.scenes.get(name);
    if (!next) throw new Error(`Scene "${name}" is not registered`);
    if (next === this.current) return;
    if (!this.initialized.has(name)) {
      await next.init?.();
      this.initialized.add(name);
    }
    this.current?.exit();
    this.current = next;
    this.onChange(name);
    await next.enter();
  }

  update(dt: number): void {
    this.current?.update(dt);
  }

  dispose(): void {
    this.current?.exit();
    this.current = null;
    this.scenes.forEach((scene) => scene.dispose());
    this.scenes.clear();
    this.initialized.clear();
  }
}
