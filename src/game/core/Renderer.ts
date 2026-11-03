import * as THREE from "three";
import type { QualityProfile } from "../settings/settings";
import { ADAPTIVE_DPR, nextPixelRatio } from "./adaptive";

type ResizeListener = (width: number, height: number) => void;

/**
 * Owns the WebGL renderer and canvas: tone mapping, shadows, responsive
 * resizing and adaptive pixel ratio. Knows nothing about game state.
 */
export class Renderer {
  readonly gl: THREE.WebGLRenderer;
  readonly canvas: HTMLCanvasElement;

  private readonly resizeObserver: ResizeObserver;
  private readonly resizeListeners = new Set<ResizeListener>();
  private width = 1;
  private height = 1;

  private pixelRatio = 1;
  private minPixelRatio = 1;
  private maxPixelRatio = 1;
  private sampleElapsed = 0;
  private sampleMs = 0;
  private sampleFrames = 0;

  constructor(private readonly container: HTMLElement) {
    // Throws when WebGL is unavailable; Game turns that into a readable error.
    this.gl = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      stencil: false,
      powerPreference: "high-performance",
    });
    this.gl.outputColorSpace = THREE.SRGBColorSpace;
    this.gl.toneMapping = THREE.ACESFilmicToneMapping;
    this.gl.toneMappingExposure = 1.05;
    this.gl.shadowMap.enabled = true;
    this.gl.shadowMap.type = THREE.PCFShadowMap;

    this.canvas = this.gl.domElement;
    this.canvas.className = "game-canvas";
    this.canvas.setAttribute("aria-label", "3D railway scene");
    container.appendChild(this.canvas);

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(container);
    this.handleResize();
  }

  get maxAnisotropy(): number {
    return this.gl.capabilities.getMaxAnisotropy();
  }

  get currentPixelRatio(): number {
    return this.pixelRatio;
  }

  applyQuality(profile: QualityProfile): void {
    const device = window.devicePixelRatio || 1;
    this.maxPixelRatio = Math.min(profile.maxPixelRatio, device);
    this.minPixelRatio = Math.min(profile.minPixelRatio, this.maxPixelRatio);
    this.setPixelRatio(this.maxPixelRatio);
  }

  onResize(listener: ResizeListener): () => void {
    this.resizeListeners.add(listener);
    listener(this.width, this.height);
    return () => {
      this.resizeListeners.delete(listener);
    };
  }

  /** Feed real frame time; adjusts resolution every sample window. */
  samplePerformance(frameSeconds: number): void {
    const ms = frameSeconds * 1000;
    if (ms <= 0 || ms > ADAPTIVE_DPR.outlierMs) return;
    this.sampleElapsed += frameSeconds;
    this.sampleMs += ms;
    this.sampleFrames += 1;
    if (this.sampleElapsed < ADAPTIVE_DPR.sampleWindow) return;
    const avg = this.sampleMs / this.sampleFrames;
    this.sampleElapsed = 0;
    this.sampleMs = 0;
    this.sampleFrames = 0;
    const next = nextPixelRatio(this.pixelRatio, avg, this.minPixelRatio, this.maxPixelRatio);
    if (next !== this.pixelRatio) this.setPixelRatio(next);
  }

  render(scene: THREE.Scene, camera: THREE.Camera): void {
    this.gl.render(scene, camera);
  }

  dispose(): void {
    this.resizeObserver.disconnect();
    this.resizeListeners.clear();
    this.gl.dispose();
    this.canvas.remove();
  }

  private setPixelRatio(ratio: number): void {
    this.pixelRatio = ratio;
    this.gl.setPixelRatio(ratio);
    this.gl.setSize(this.width, this.height, false);
  }

  private handleResize(): void {
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    if (width === this.width && height === this.height) return;
    this.width = width;
    this.height = height;
    this.gl.setSize(width, height, false);
    this.resizeListeners.forEach((listener) => listener(width, height));
  }
}
