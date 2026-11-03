/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { Game } from '../core/Game';
import { Scene } from './BootScene';
import { Train } from '../train/Train';
import { TrainBuilder } from '../train/TrainBuilder';
import { TrainLiveryType, TRAIN_SPECS } from '../train/TrainConfig';
import { TrainCameraView, TrainPreviewUI } from '../ui/TrainPreviewUI';
import { AudioSettings } from '../ui/AudioSettings';

export class TrainPreviewScene implements Scene {
  public name = 'train_preview';
  private game: Game;

  public train!: Train;
  public showroomGroup: THREE.Group;
  private previewUI!: TrainPreviewUI;
  private audioSettingsModal!: AudioSettings;

  // Camera Orbit & View State
  private currentView: TrainCameraView = 'front';
  private targetCamPos = new THREE.Vector3(5, 3.2, 18);
  private currentCamPos = new THREE.Vector3(5, 3.2, 18);
  private targetLookAt = new THREE.Vector3(0, 2.2, 10);
  private currentLookAt = new THREE.Vector3(0, 2.2, 10);

  // Free Orbit State
  private orbitYaw = 0.35;
  private orbitPitch = 0.22;
  private orbitDistance = 22;
  private isPointerDown = false;
  private prevPointerX = 0;
  private prevPointerY = 0;

  // Listeners
  private boundOnPointerDown!: (e: PointerEvent) => void;
  private boundOnPointerMove!: (e: PointerEvent) => void;
  private boundOnPointerUp!: () => void;
  private boundOnWheel!: (e: WheelEvent) => void;

  constructor(game: Game) {
    this.game = game;
    this.showroomGroup = new THREE.Group();
  }

  public async init(): Promise<void> {
    // Hide standard main menu
    this.game.ui.mainMenu.hide();

    // 1. Build Showroom 3D Track & Environment
    this.buildShowroomEnvironment();
    this.game.scene.add(this.showroomGroup);

    // 2. Build 3D Train Rake
    this.train = TrainBuilder.buildPreviewRake('western', new THREE.Vector3(0, 0, 0));
    this.showroomGroup.add(this.train.group);

    // 3. Build Showroom UI
    this.audioSettingsModal = new AudioSettings();
    this.game.container.appendChild(this.audioSettingsModal.element);

    this.previewUI = new TrainPreviewUI({
      onBackToMenu: () => {
        this.game.switchScene('main_menu');
      },
      onSelectLivery: (livery: TrainLiveryType) => {
        this.train.setLivery(livery);
      },
      onSelectCoachCount: (count: number) => {
        this.train.setCoachCount(count);
        this.setCameraView(this.currentView);
      },
      onSetCameraView: (view: TrainCameraView) => {
        this.setCameraView(view);
      },
      onToggleHeadlights: () => {
        const next = !this.train.coaches[0]?.lights.headlightsOn;
        this.train.setHeadlights(next);
        return next;
      },
      onToggleInteriorLights: () => {
        const next = !this.train.coaches[0]?.lights.interiorLightsOn;
        this.train.setInteriorLights(next);
        return next;
      },
      onToggleDoors: () => {
        return this.train.toggleDoors();
      },
      onOpenAudioSettings: () => {
        this.audioSettingsModal.open();
      },
    });
    this.game.container.appendChild(this.previewUI.element);

    // 4. Attach Camera Controls
    this.setupCameraListeners();

    // Set initial camera view
    this.setCameraView('front');
  }

  private buildShowroomEnvironment() {
    // Reflective circular showroom turntable base / track bed
    const floorGeo = new THREE.CylinderGeometry(55, 55, 0.4, 48);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.25,
      metalness: 0.85,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.2;
    floor.receiveShadow = true;
    this.showroomGroup.add(floor);

    // Track Rails inside showroom
    const railGeo = new THREE.BoxGeometry(0.08, 0.17, 180);
    const railMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.95,
      roughness: 0.18,
    });
    [-TRAIN_SPECS.gauge / 2, TRAIN_SPECS.gauge / 2].forEach((rx) => {
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(rx, 0.085, 0);
      rail.receiveShadow = true;
      this.showroomGroup.add(rail);
    });

    // Overhead Catenary Cable
    const wireGeo = new THREE.CylinderGeometry(0.012, 0.012, 180);
    wireGeo.rotateX(Math.PI / 2);
    const wireMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.9 });
    const wire = new THREE.Mesh(wireGeo, wireMat);
    wire.position.set(0, 5.65, 0);
    this.showroomGroup.add(wire);
  }

  public setCameraView(view: TrainCameraView) {
    this.currentView = view;
    const pitch = TRAIN_SPECS.coachLength + TRAIN_SPECS.couplerLength;
    const halfTrainL = ((this.train.coachCount - 1) * pitch) / 2;
    const halfPivot = TRAIN_SPECS.bogieCenterDist / 2;

    switch (view) {
      case 'front':
        // Front cab nose, windshield, and destination LED
        this.targetLookAt.set(0, 2.4, halfTrainL + 4);
        this.targetCamPos.set(4.5, 2.6, halfTrainL + 12);
        break;
      case 'side':
        // Full side profile
        this.targetLookAt.set(0, 2.2, halfTrainL - 8);
        this.targetCamPos.set(13.5, 2.5, halfTrainL - 8);
        break;
      case 'rear':
        // Rear cab and marker lights
        this.targetLookAt.set(0, 2.4, -halfTrainL - 4);
        this.targetCamPos.set(-4.5, 2.6, -halfTrainL - 12);
        break;
      case 'bogie':
        // Bogie, wheels, springs, brake cylinders close-up
        this.targetLookAt.set(0, 0.65, halfTrainL - halfPivot);
        this.targetCamPos.set(3.4, 0.8, halfTrainL - halfPivot + 1.2);
        break;
      case 'interior':
        // Inside passenger saloon looking down the aisle
        this.targetLookAt.set(0, 2.2, halfTrainL - 2);
        this.targetCamPos.set(0, 2.2, halfTrainL - 8);
        break;
      case 'cab':
        // Inside driver cabin looking at dashboard & throttle
        this.targetLookAt.set(0, 2.3, halfTrainL + 8.5);
        this.targetCamPos.set(0, 2.25, halfTrainL + 7.2);
        break;
      case 'orbit':
        // 360 free orbit around center
        this.targetLookAt.set(0, 2.2, 0);
        this.updateOrbitPosition();
        break;
    }
  }

  private updateOrbitPosition() {
    const x = Math.sin(this.orbitYaw) * Math.cos(this.orbitPitch) * this.orbitDistance;
    const y = Math.max(0.8, Math.sin(this.orbitPitch) * this.orbitDistance + 2.2);
    const z = Math.cos(this.orbitYaw) * Math.cos(this.orbitPitch) * this.orbitDistance;
    this.targetCamPos.set(x, y, z);
  }

  private setupCameraListeners() {
    this.boundOnPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.button !== 2) return;
      this.isPointerDown = true;
      this.prevPointerX = e.clientX;
      this.prevPointerY = e.clientY;
    };

    this.boundOnPointerMove = (e: PointerEvent) => {
      if (!this.isPointerDown) return;
      const dx = (e.clientX - this.prevPointerX) * 0.005;
      const dy = (e.clientY - this.prevPointerY) * 0.005;

      this.orbitYaw -= dx;
      this.orbitPitch = Math.max(-0.2, Math.min(Math.PI / 2.3, this.orbitPitch + dy));

      if (this.currentView === 'orbit') {
        this.updateOrbitPosition();
      } else {
        // Allow orbital pan around the active preset
        this.targetCamPos.x += dx * 6;
        this.targetCamPos.y = Math.max(0.8, this.targetCamPos.y + dy * 6);
      }

      this.prevPointerX = e.clientX;
      this.prevPointerY = e.clientY;
    };

    this.boundOnPointerUp = () => {
      this.isPointerDown = false;
    };

    this.boundOnWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomDelta = e.deltaY * 0.02;
      this.orbitDistance = Math.max(3.5, Math.min(85, this.orbitDistance + zoomDelta));
      if (this.currentView === 'orbit') {
        this.updateOrbitPosition();
      } else {
        // Zoom along camera ray
        const dir = new THREE.Vector3().subVectors(this.targetCamPos, this.targetLookAt).normalize();
        this.targetCamPos.addScaledVector(dir, zoomDelta);
      }
    };

    const container = this.game.container;
    container.addEventListener('pointerdown', this.boundOnPointerDown);
    window.addEventListener('pointermove', this.boundOnPointerMove);
    window.addEventListener('pointerup', this.boundOnPointerUp);
    container.addEventListener('wheel', this.boundOnWheel, { passive: false });
  }

  public update(delta: number): void {
    const dt = Math.min(delta, 0.1);

    // Update train state (door sliding animations, wheel rotation)
    if (this.train) {
      this.train.update(dt);
    }

    // Smooth exponential damping on camera position and lookAt target
    this.currentCamPos.x = THREE.MathUtils.damp(this.currentCamPos.x, this.targetCamPos.x, 5.0, dt);
    this.currentCamPos.y = THREE.MathUtils.damp(this.currentCamPos.y, this.targetCamPos.y, 5.0, dt);
    this.currentCamPos.z = THREE.MathUtils.damp(this.currentCamPos.z, this.targetCamPos.z, 5.0, dt);

    this.currentLookAt.x = THREE.MathUtils.damp(this.currentLookAt.x, this.targetLookAt.x, 5.5, dt);
    this.currentLookAt.y = THREE.MathUtils.damp(this.currentLookAt.y, this.targetLookAt.y, 5.5, dt);
    this.currentLookAt.z = THREE.MathUtils.damp(this.currentLookAt.z, this.targetLookAt.z, 5.5, dt);

    this.game.camera.camera.position.copy(this.currentCamPos);
    this.game.camera.camera.lookAt(this.currentLookAt);
  }

  public render(): void {
    this.game.renderer.render(this.game.scene, this.game.camera.camera);
  }

  public destroy(): void {
    const container = this.game.container;
    container.removeEventListener('pointerdown', this.boundOnPointerDown);
    window.removeEventListener('pointermove', this.boundOnPointerMove);
    window.removeEventListener('pointerup', this.boundOnPointerUp);
    container.removeEventListener('wheel', this.boundOnWheel);

    // Remove UI
    if (this.previewUI?.element?.parentElement) {
      this.previewUI.element.parentElement.removeChild(this.previewUI.element);
    }
    if (this.audioSettingsModal?.element?.parentElement) {
      this.audioSettingsModal.element.parentElement.removeChild(this.audioSettingsModal.element);
    }

    // Remove train and showroom objects
    if (this.train) {
      this.showroomGroup.remove(this.train.group);
      this.train.dispose();
    }
    this.game.scene.remove(this.showroomGroup);

    // Restore Main Menu UI
    this.game.ui.mainMenu.show();
  }
}
