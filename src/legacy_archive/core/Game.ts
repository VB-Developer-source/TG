/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { Renderer, QualityPreset } from './Renderer';
import { Camera } from './Camera';
import { Lighting } from './Lighting';
import { World } from './World';
import { AssetManager } from './AssetManager';
import { Scene, BootScene } from '../scenes/BootScene';
import { MainMenuScene } from '../scenes/MainMenuScene';
import { TrainPreviewScene } from '../scenes/TrainPreviewScene';
import { LoadingScreen } from '../ui/LoadingScreen';
import { MainMenu } from '../ui/MainMenu';
import { SettingsMenu } from '../ui/SettingsMenu';
import { AudioManager } from '../audio/AudioManager';

export class Game {
  public container: HTMLElement;
  public scene: THREE.Scene;
  public renderer: Renderer;
  public camera: Camera;
  public lighting: Lighting;
  public world: World | null = null;
  public assetManager: AssetManager;
  public audio: AudioManager;

  // Scene & Lifecycle
  private scenes: Map<string, Scene> = new Map();
  private currentScene: Scene | null = null;
  private isRunning: boolean = false;
  private animationFrameId: number = 0;
  private lastTime: number = 0;

  // UI System
  public ui: {
    loading: LoadingScreen;
    mainMenu: MainMenu;
    settings: SettingsMenu;
    showLoading: () => void;
    updateLoading: (pct: number, msg: string) => void;
    hideLoading: (cb?: () => void) => void;
    showMainMenu: () => void;
    openSettings: () => void;
  };

  private boundOnResize: () => void;

  constructor(container: HTMLElement) {
    this.container = container;

    // 1. Create Three.js Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a2638);

    // 2. Initialize Asset Manager & Audio Manager
    this.assetManager = new AssetManager();
    this.audio = AudioManager.getInstance();

    // 3. Initialize WebGL Renderer
    this.renderer = new Renderer(this.container);

    // 4. Initialize Camera System
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera = new Camera(width, height);
    this.camera.attachControls(this.container);

    // 5. Initialize Lighting Rig
    this.lighting = new Lighting(this.scene, this.renderer.renderer);

    // 6. Initialize UI Overlay Elements
    const loadingScreen = new LoadingScreen();
    const mainMenu = new MainMenu(this);
    const settingsMenu = new SettingsMenu(this);

    this.container.appendChild(loadingScreen.element);
    this.container.appendChild(mainMenu.element);
    this.container.appendChild(settingsMenu.element);

    this.ui = {
      loading: loadingScreen,
      mainMenu: mainMenu,
      settings: settingsMenu,
      showLoading: () => {
        // already mounted
      },
      updateLoading: (pct: number, msg: string) => {
        loadingScreen.update(pct, msg);
      },
      hideLoading: (cb?: () => void) => {
        loadingScreen.hide(cb);
      },
      showMainMenu: () => {
        mainMenu.show();
      },
      openSettings: () => {
        settingsMenu.open();
      },
    };

    // 7. Register Scenes
    this.scenes.set('boot', new BootScene(this));
    this.scenes.set('main_menu', new MainMenuScene(this));
    this.scenes.set('train_preview', new TrainPreviewScene(this));

    // 8. Event Listeners
    this.boundOnResize = this.onResize.bind(this);
    window.addEventListener('resize', this.boundOnResize);

    // 9. Start Game Loop & Boot Scene
    this.switchScene('boot');
    this.start();
  }

  public initWorld() {
    if (!this.world) {
      this.world = new World(this.assetManager);
      this.scene.add(this.world.group);
    }
  }

  public async switchScene(sceneName: string): Promise<void> {
    const nextScene = this.scenes.get(sceneName);
    if (!nextScene) {
      console.warn(`Scene ${sceneName} not found`);
      return;
    }

    if (this.currentScene) {
      this.currentScene.destroy();
    }

    this.currentScene = nextScene;
    await nextScene.init();
  }

  public setQuality(quality: QualityPreset) {
    this.renderer.applyQuality(quality);
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop();
  }

  public stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = 0;
    }
  }

  private loop = (time: number = performance.now()) => {
    if (!this.isRunning) return;

    const delta = (time - this.lastTime) / 1000;
    this.lastTime = time;

    // Update current active scene
    if (this.currentScene) {
      this.currentScene.update(delta);
    }

    // Render 3D view
    this.renderer.render(this.scene, this.camera.camera);

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private onResize() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.resize(width, height);
    this.renderer.resize(width, height);
  }

  public dispose() {
    this.stop();
    window.removeEventListener('resize', this.boundOnResize);

    if (this.currentScene) {
      this.currentScene.destroy();
    }

    this.camera.dispose();
    this.lighting.dispose();
    this.world?.dispose();
    this.assetManager.dispose();
    this.renderer.dispose();
  }
}
