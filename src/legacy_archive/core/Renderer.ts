/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

export type QualityPreset = 'low' | 'medium' | 'high' | 'ultra';

export class Renderer {
  public renderer: THREE.WebGLRenderer;
  public canvas: HTMLCanvasElement;
  public isSoftwareGl: boolean;
  public quality: QualityPreset = 'high';

  constructor(container: HTMLElement) {
    // Software WebGL Guard (SwiftShader, llvmpipe, softpipe, etc.)
    this.isSoftwareGl = (() => {
      try {
        const probeCanvas = document.createElement('canvas');
        const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    // Check saved quality preset
    const savedQuality = localStorage.getItem('mumbai_sim_quality') as QualityPreset;
    if (savedQuality && ['low', 'medium', 'high', 'ultra'].includes(savedQuality)) {
      this.quality = savedQuality;
    }

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl && this.quality !== 'low',
      powerPreference: 'high-performance',
      alpha: false,
    });

    this.canvas = this.renderer.domElement;
    this.canvas.className = 'w-full h-full block absolute inset-0';
    container.appendChild(this.canvas);

    // Color management & tone mapping
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    // Apply settings
    this.applyQuality(this.quality);

    // Initial sizing
    this.resize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
  }

  public applyQuality(quality: QualityPreset) {
    this.quality = quality;
    localStorage.setItem('mumbai_sim_quality', quality);

    if (this.isSoftwareGl || quality === 'low') {
      this.renderer.setPixelRatio(1);
      this.renderer.shadowMap.enabled = false;
    } else if (quality === 'medium') {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFShadowMap;
    } else if (quality === 'high') {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    } else {
      // Ultra
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
  }

  public setShadows(enabled: boolean) {
    this.renderer.shadowMap.enabled = enabled && !this.isSoftwareGl;
  }

  public resize(width: number, height: number) {
    if (width <= 0 || height <= 0) return;
    this.renderer.setSize(width, height, false);
  }

  public render(scene: THREE.Scene, camera: THREE.Camera) {
    this.renderer.render(scene, camera);
  }

  public dispose() {
    this.renderer.dispose();
    if (this.canvas.parentElement) {
      this.canvas.parentElement.removeChild(this.canvas);
    }
  }
}
