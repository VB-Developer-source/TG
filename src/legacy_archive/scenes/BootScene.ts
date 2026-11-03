/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Game } from '../core/Game';

export interface Scene {
  name: string;
  init(): Promise<void>;
  update(delta: number): void;
  render(): void;
  destroy(): void;
}

export class BootScene implements Scene {
  public name = 'boot';
  private game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  public async init(): Promise<void> {
    // Show Loading UI and stream progress
    this.game.ui.showLoading();

    await this.game.assetManager.loadAll((progress, message) => {
      this.game.ui.updateLoading(progress, message);
    });

    // Create 3D world with generated procedural textures
    this.game.initWorld();

    // Fade out loading screen and transition to Main Menu
    this.game.ui.hideLoading(() => {
      this.game.switchScene('main_menu');
    });
  }

  public update(_delta: number): void {
    // No-op during boot sequence
  }

  public render(): void {
    // Initial render
    this.game.renderer.render(this.game.scene, this.game.camera.camera);
  }

  public destroy(): void {
    // Clean up
  }
}
