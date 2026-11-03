/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export type TimeOfDay = 'afternoon' | 'golden_hour' | 'night';

export class Lighting {
  public scene: THREE.Scene;
  public dirLight: THREE.DirectionalLight;
  public hemiLight: THREE.HemisphereLight;
  public rimLight: THREE.DirectionalLight;
  public platformLights: THREE.PointLight[] = [];
  public timeOfDay: TimeOfDay = 'afternoon';
  private shadowsEnabled: boolean = true;

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
    this.scene = scene;

    // Atmospheric Indian Tropical Horizon Dust & Sunset Fog
    this.scene.background = new THREE.Color(0xd2aa82);
    this.scene.fog = new THREE.FogExp2(0xd2aa82, 0.0072);

    // Procedural Studio Environment Reflection Map for realistic PBR metallic sheen
    try {
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envScene = new RoomEnvironment();
      this.scene.environment = pmrem.fromScene(envScene, 0.04).texture;
      pmrem.dispose();
    } catch (e) {
      console.warn('RoomEnvironment initialization fallback:', e);
    }

    // Sky & Ground Hemisphere Light
    this.hemiLight = new THREE.HemisphereLight(0xffecd2, 0x6b4f3b, 1.4);
    this.hemiLight.position.set(0, 50, 0);
    this.scene.add(this.hemiLight);

    // Directional Mumbai Sunlight (Warm late afternoon golden sun)
    this.dirLight = new THREE.DirectionalLight(0xfff1dc, 2.6);
    this.dirLight.position.set(45, 38, 20);
    this.dirLight.castShadow = true;

    // Shadow configuration
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 1.0;
    this.dirLight.shadow.camera.far = 160.0;
    this.dirLight.shadow.camera.left = -45;
    this.dirLight.shadow.camera.right = 45;
    this.dirLight.shadow.camera.top = 45;
    this.dirLight.shadow.camera.bottom = -45;
    this.dirLight.shadow.bias = -0.0004;
    this.dirLight.shadow.normalBias = 0.02;

    this.scene.add(this.dirLight);

    // Secondary subtle rim light for rail and catenary highlights
    this.rimLight = new THREE.DirectionalLight(0x93c5fd, 0.8);
    this.rimLight.position.set(-30, 20, -30);
    this.scene.add(this.rimLight);

    // Platform downlights under the canopy
    this.createPlatformLights();

    // Check saved shadows setting
    const savedShadows = localStorage.getItem('mumbai_sim_shadows');
    if (savedShadows === 'false') {
      this.setShadowsEnabled(false);
    }
  }

  private createPlatformLights() {
    // Array of warm station canopy lanterns
    const lightPositions = [-30, -15, 0, 15, 30];
    lightPositions.forEach((z) => {
      const pLight = new THREE.PointLight(0xffedd5, 1.5, 14, 1.8);
      pLight.position.set(6.5, 4.2, z);
      this.scene.add(pLight);
      this.platformLights.push(pLight);
    });
  }

  public setShadowsEnabled(enabled: boolean) {
    this.shadowsEnabled = enabled;
    this.dirLight.castShadow = enabled;
    localStorage.setItem('mumbai_sim_shadows', enabled ? 'true' : 'false');
  }

  public getShadowsEnabled(): boolean {
    return this.shadowsEnabled;
  }

  public setTimeOfDay(time: TimeOfDay) {
    this.timeOfDay = time;
    if (time === 'golden_hour') {
      this.dirLight.color.setHex(0xfb923c);
      this.dirLight.intensity = 3.2;
      this.dirLight.position.set(40, 20, 35);
      this.hemiLight.color.setHex(0xfde047);
      this.hemiLight.groundColor.setHex(0x78350f);
      if (this.scene.fog instanceof THREE.FogExp2) {
        this.scene.fog.color.setHex(0x451a03);
      }
    } else if (time === 'night') {
      this.dirLight.color.setHex(0x38bdf8);
      this.dirLight.intensity = 0.4;
      this.dirLight.position.set(-20, 35, -20);
      this.hemiLight.color.setHex(0x1e293b);
      this.hemiLight.groundColor.setHex(0x020617);
      if (this.scene.fog instanceof THREE.FogExp2) {
        this.scene.fog.color.setHex(0x020617);
      }
      this.platformLights.forEach((l) => (l.intensity = 2.5));
    } else {
      // Afternoon
      this.dirLight.color.setHex(0xffedd5);
      this.dirLight.intensity = 2.8;
      this.dirLight.position.set(35, 45, 25);
      this.hemiLight.color.setHex(0xdbeafe);
      this.hemiLight.groundColor.setHex(0x574838);
      if (this.scene.fog instanceof THREE.FogExp2) {
        this.scene.fog.color.setHex(0x1a2638);
      }
      this.platformLights.forEach((l) => (l.intensity = 1.5));
    }
  }

  public dispose() {
    this.scene.remove(this.dirLight);
    this.scene.remove(this.hemiLight);
    this.scene.remove(this.rimLight);
    this.platformLights.forEach((l) => this.scene.remove(l));
    this.platformLights = [];
  }
}
