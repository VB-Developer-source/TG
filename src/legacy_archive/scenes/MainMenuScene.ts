/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Game } from '../core/Game';
import { Scene } from './BootScene';

export class MainMenuScene implements Scene {
  public name = 'main_menu';
  private game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  public async init(): Promise<void> {
    // Show Main Menu UI
    this.game.ui.showMainMenu();

    // Set cinematic camera default
    this.game.camera.setMode('cinematic');

    // Optionally start atmospheric track ambience
    this.game.assetManager.startTrackAmbience();
  }

  public update(delta: number): void {
    // Update camera motion (cinematic orbit or active preset / free cam)
    this.game.camera.update(delta);
    // Update world objects (including stationed train)
    this.game.world?.update(delta);
    // Update UI telemetry and FPS counters
    this.game.ui.mainMenu.update(delta);
  }

  public render(): void {
    this.game.renderer.render(this.game.scene, this.game.camera.camera);
  }

  public destroy(): void {
    this.game.assetManager.stopTrackAmbience();
  }
}
