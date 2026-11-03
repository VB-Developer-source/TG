import type * as THREE from "three";

export interface LoadTask {
  id: string;
  /** Shown on the loading screen while this task runs. */
  label: string;
  /** Relative share of the progress bar. Defaults to 1. */
  weight?: number;
  /** Optional tasks may fail or time out without stopping the load. */
  optional?: boolean;
  timeoutMs?: number;
  run: () => Promise<void> | void;
}

export interface LoadProgress {
  /** 0..1, completed task weight over total weight. */
  progress: number;
  message: string;
  completed: number;
  total: number;
  failures: string[];
  done: boolean;
}

export const INITIAL_PROGRESS: LoadProgress = {
  progress: 0,
  message: "Starting engine",
  completed: 0,
  total: 0,
  failures: [],
  done: false,
};

export class LoadCancelledError extends Error {
  constructor() {
    super("Loading was cancelled");
    this.name = "LoadCancelledError";
  }
}

const nextFrame = () =>
  new Promise<void>((resolve) => {
    // rAF lets the loading screen paint; the timeout keeps loading moving in background tabs.
    const timer = setTimeout(resolve, 60);
    requestAnimationFrame(() => {
      clearTimeout(timer);
      resolve();
    });
  });

function withTimeout(promise: Promise<void>, ms: number | undefined): Promise<void> {
  if (!ms) return promise;
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms);
    promise.then(
      () => {
        clearTimeout(timer);
        resolve();
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/**
 * Runs load tasks with real, weight-based progress and keeps a registry of
 * shared GPU resources (textures, materials) so they can be disposed once.
 */
export class AssetManager {
  private readonly textures = new Map<string, THREE.Texture>();
  private readonly disposables = new Set<{ dispose(): void }>();
  private cancelled = false;

  setTexture(key: string, texture: THREE.Texture): THREE.Texture {
    this.textures.get(key)?.dispose();
    this.textures.set(key, texture);
    return texture;
  }

  getTexture(key: string): THREE.Texture {
    const texture = this.textures.get(key);
    if (!texture) throw new Error(`Texture "${key}" has not been loaded`);
    return texture;
  }

  track<T extends { dispose(): void }>(resource: T): T {
    this.disposables.add(resource);
    return resource;
  }

  async runTasks(tasks: LoadTask[], onProgress: (progress: LoadProgress) => void): Promise<LoadProgress> {
    const totalWeight = tasks.reduce((sum, task) => sum + (task.weight ?? 1), 0) || 1;
    let doneWeight = 0;
    const failures: string[] = [];
    const report = (message: string, completed: number, done = false) =>
      onProgress({
        progress: doneWeight / totalWeight,
        message,
        completed,
        total: tasks.length,
        failures: [...failures],
        done,
      });

    for (const [i, task] of tasks.entries()) {
      if (this.cancelled) throw new LoadCancelledError();
      report(task.label, i);
      await nextFrame();
      if (this.cancelled) throw new LoadCancelledError();
      try {
        await withTimeout(Promise.resolve().then(task.run), task.timeoutMs);
      } catch (error) {
        if (this.cancelled) throw new LoadCancelledError();
        if (!task.optional) {
          const reason = error instanceof Error ? error.message : String(error);
          throw new Error(`${task.label} failed: ${reason}`);
        }
        failures.push(task.label);
      }
      doneWeight += task.weight ?? 1;
    }
    const final: LoadProgress = {
      progress: 1,
      message: "Ready",
      completed: tasks.length,
      total: tasks.length,
      failures,
      done: true,
    };
    onProgress(final);
    return final;
  }

  dispose(): void {
    this.cancelled = true;
    this.textures.forEach((texture) => texture.dispose());
    this.textures.clear();
    this.disposables.forEach((resource) => resource.dispose());
    this.disposables.clear();
  }
}
