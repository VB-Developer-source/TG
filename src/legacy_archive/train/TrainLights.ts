/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

export class TrainLights {
  public group: THREE.Group;
  public headlightsOn: boolean = true;
  public interiorLightsOn: boolean = true;
  public markerLightsOn: boolean = false;

  private spotLights: THREE.SpotLight[] = [];
  private headLensMeshes: THREE.Mesh[] = [];
  private interiorLights: THREE.PointLight[] = [];
  private interiorFixtures: THREE.Mesh[] = [];
  private markerMeshes: THREE.Mesh[] = [];

  constructor() {
    this.group = new THREE.Group();
  }

  /**
   * Adds twin high-intensity front headlights to the cab
   */
  public addFrontHeadlights(xOffset: number, yOffset: number, zOffset: number) {
    [-xOffset, xOffset].forEach((hx) => {
      // SpotLight projecting forward onto tracks
      const spot = new THREE.SpotLight(0xfff7ed, 3.8, 65, Math.PI / 8, 0.45, 1.2);
      spot.position.set(hx, yOffset, zOffset);
      spot.target.position.set(hx, yOffset - 0.8, zOffset + 35);
      spot.castShadow = false; // lightweight for performance

      this.group.add(spot);
      this.group.add(spot.target);
      this.spotLights.push(spot);

      // Emissive glowing glass lens
      const lensGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.04, 16);
      lensGeo.rotateX(Math.PI / 2);
      const lensMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffedd5,
        emissiveIntensity: 2.8,
        roughness: 0.1,
      });
      const lensMesh = new THREE.Mesh(lensGeo, lensMat);
      lensMesh.position.set(hx, yOffset, zOffset);
      this.group.add(lensMesh);
      this.headLensMeshes.push(lensMesh);
    });
  }

  /**
   * Adds red marker / tail lights for driving trailer or rear coach
   */
  public addMarkerLights(xOffset: number, yOffset: number, zOffset: number) {
    [-xOffset, xOffset].forEach((mx) => {
      const redMat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        emissive: 0xef4444,
        emissiveIntensity: 2.5,
        roughness: 0.2,
      });
      const markerGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.03, 12);
      markerGeo.rotateX(Math.PI / 2);
      const markerMesh = new THREE.Mesh(markerGeo, redMat);
      markerMesh.position.set(mx, yOffset, zOffset);
      this.group.add(markerMesh);
      this.markerMeshes.push(markerMesh);
    });
  }

  /**
   * Adds interior passenger coach ceiling lights
   */
  public addInteriorLights(coachLength: number, ceilingY: number) {
    const spacing = 5.0;
    const count = Math.floor(coachLength / spacing);
    const halfL = coachLength / 2;

    for (let i = 0; i < count; i++) {
      const lz = -halfL + 2.5 + i * spacing;

      // Soft point downlight
      const pLight = new THREE.PointLight(0xfffbeb, 1.1, 7.5, 1.8);
      pLight.position.set(0, ceilingY - 0.2, lz);
      this.group.add(pLight);
      this.interiorLights.push(pLight);

      // Fluorescent / LED tube light fixture
      const fixtureGeo = new THREE.BoxGeometry(0.3, 0.04, 1.8);
      const fixtureMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xfef08a,
        emissiveIntensity: 1.8,
        roughness: 0.3,
      });
      const fixture = new THREE.Mesh(fixtureGeo, fixtureMat);
      fixture.position.set(0, ceilingY - 0.03, lz);
      this.group.add(fixture);
      this.interiorFixtures.push(fixture);
    }
  }

  public setHeadlights(on: boolean) {
    this.headlightsOn = on;
    this.spotLights.forEach((s) => (s.intensity = on ? 3.8 : 0));
    this.headLensMeshes.forEach((m) => {
      const mat = m.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = on ? 2.8 : 0.1;
    });
  }

  public setInteriorLights(on: boolean) {
    this.interiorLightsOn = on;
    this.interiorLights.forEach((l) => (l.intensity = on ? 1.1 : 0));
    this.interiorFixtures.forEach((f) => {
      const mat = f.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = on ? 1.8 : 0.05;
    });
  }

  public setMarkerLights(on: boolean) {
    this.markerLightsOn = on;
    this.markerMeshes.forEach((m) => {
      const mat = m.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = on ? 2.5 : 0.05;
    });
  }

  public toggleLights() {
    const next = !this.headlightsOn;
    this.setHeadlights(next);
    this.setInteriorLights(next);
    return next;
  }
}
