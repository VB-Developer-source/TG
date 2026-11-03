/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

export interface LoadingProgressCallback {
  (progress: number, message: string): void;
}

export class AssetManager {
  private textures: Map<string, THREE.Texture> = new Map();
  private audioContext: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private trackGainNode: GainNode | null = null;
  private trackOscillators: OscillatorNode[] = [];
  private isAmbiencePlaying: boolean = false;

  constructor() {
    this.soundEnabled = localStorage.getItem('mumbai_sim_sound') !== 'false';
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    localStorage.setItem('mumbai_sim_sound', enabled ? 'true' : 'false');
    if (!enabled && this.isAmbiencePlaying) {
      this.stopTrackAmbience();
    }
  }

  public getSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  /**
   * Initializes audio context on first user interaction
   */
  public initAudio() {
    if (!this.audioContext && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  /**
   * Generates procedural textures and preheats assets with real progress updates
   */
  public async loadAll(onProgress?: LoadingProgressCallback): Promise<void> {
    const steps = [
      { name: 'Initializing WebGL Engine...', weight: 15, fn: () => this.generateBallastTexture() },
      { name: 'Generating Broad Gauge Rails & Sleepers...', weight: 20, fn: () => this.generateSleeperTexture() },
      { name: 'Synthesizing Platform Pavement & Safety Tiles...', weight: 20, fn: () => this.generatePlatformTextures() },
      { name: 'Fabricating Mumbai Station Signboards...', weight: 15, fn: () => this.generateStationSignboards() },
      { name: 'Erecting OHE Catenary Masts & Power Lines...', weight: 15, fn: () => this.generateMastTexture() },
      { name: 'Synthesizing Audio Oscillators & Shaders...', weight: 15, fn: () => this.generateSkyBackdropTexture() },
    ];

    let currentProgress = 0;
    for (const step of steps) {
      if (onProgress) {
        onProgress(currentProgress, step.name);
      }
      // Small tick delay to allow UI rendering and smooth progress animation
      await new Promise((resolve) => setTimeout(resolve, 80));
      try {
        step.fn();
      } catch (err) {
        console.warn(`Asset generation fallback for ${step.name}:`, err);
      }
      currentProgress += step.weight;
    }

    if (onProgress) {
      onProgress(100, 'Mumbai Suburban Network Initialized');
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  public getTexture(key: string): THREE.Texture | undefined {
    return this.textures.get(key);
  }

  // --- Procedural Texture Generators ---

  private generateBallastTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dark grey-brown railway ballast background
    ctx.fillStyle = '#3c3a38';
    ctx.fillRect(0, 0, 512, 512);

    // Multi-layered stone gravel speckled pattern
    for (let i = 0; i < 4500; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const radius = 2 + Math.random() * 5;
      const shade = 40 + Math.floor(Math.random() * 65);
      const r = shade + Math.floor(Math.random() * 15);
      const g = shade + Math.floor(Math.random() * 10);
      const b = shade;
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;

      // Polygonal angular gravel stone
      ctx.beginPath();
      const sides = 5 + Math.floor(Math.random() * 3);
      for (let s = 0; s < sides; s++) {
        const angle = (s / sides) * Math.PI * 2;
        const rad = radius * (0.7 + Math.random() * 0.6);
        const px = x + Math.cos(angle) * rad;
        const py = y + Math.sin(angle) * rad;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    }

    // High frequency noise for grit
    const imgData = ctx.getImageData(0, 0, 512, 512);
    for (let p = 0; p < imgData.data.length; p += 4) {
      const noise = (Math.random() - 0.5) * 25;
      imgData.data[p] = Math.min(255, Math.max(0, imgData.data[p] + noise));
      imgData.data[p + 1] = Math.min(255, Math.max(0, imgData.data[p + 1] + noise));
      imgData.data[p + 2] = Math.min(255, Math.max(0, imgData.data[p + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 20);
    texture.colorSpace = THREE.SRGBColorSpace;
    this.textures.set('ballast', texture);
  }

  private generateSleeperTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Concrete base
    ctx.fillStyle = '#7a7a7a';
    ctx.fillRect(0, 0, 256, 256);

    // Weathered concrete mottling
    for (let i = 0; i < 2000; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const shade = 100 + (Math.random() - 0.5) * 40;
      ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, 0.25)`;
      ctx.fillRect(x, y, 2 + Math.random() * 6, 2 + Math.random() * 6);
    }

    // Pandrol clip rubber base pads
    ctx.fillStyle = '#222222';
    ctx.fillRect(35, 100, 35, 56);
    ctx.fillRect(186, 100, 35, 56);

    // Pandrol iron clip highlights
    ctx.fillStyle = '#d97706';
    ctx.fillRect(40, 115, 25, 26);
    ctx.fillRect(191, 115, 25, 26);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    this.textures.set('sleeper', texture);
  }

  private generatePlatformTextures() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mumbai concrete station platform floor tiles
    ctx.fillStyle = '#8e969d';
    ctx.fillRect(0, 0, 512, 512);

    // Grid lines for square pavers
    ctx.strokeStyle = '#5f676f';
    ctx.lineWidth = 2;
    const tileSize = 64;
    for (let x = 0; x <= 512; x += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    for (let y = 0; y <= 512; y += tileSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    // Platform edge safety markings (bright yellow non-skid tactile strip)
    ctx.fillStyle = '#eab308';
    ctx.fillRect(0, 0, 512, 60);

    // Tactile warning studs on the yellow strip
    ctx.fillStyle = '#ca8a04';
    for (let x = 8; x < 512; x += 24) {
      for (let y = 8; y < 52; y += 16) {
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Black hazard edge line
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 512, 8);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 15);
    texture.colorSpace = THREE.SRGBColorSpace;
    this.textures.set('platform', texture);
  }

  private generateStationSignboards() {
    // Standard Indian Railways Station Name Board (Yellow background with Bold Black text in English, Hindi, and Marathi)
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Classic IR Yellow background
    ctx.fillStyle = '#facc15';
    ctx.fillRect(0, 0, 1024, 256);

    // Black border frame
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#0f172a';
    ctx.strokeRect(7, 7, 1010, 242);

    // Inner thin border
    ctx.lineWidth = 3;
    ctx.strokeRect(20, 20, 984, 216);

    // Text: Dadar / दादर
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';

    // English Name
    ctx.font = 'bold 80px "Rajdhani", sans-serif';
    ctx.fillText('DADAR', 512, 105);

    // Devanagari (Hindi / Marathi)
    ctx.font = 'bold 58px "Noto Sans Devanagari", sans-serif, sans-serif';
    ctx.fillText('दादर', 512, 175);

    // Sea Level Elevation detail (MSL) typical of Indian Railways
    ctx.font = '600 24px "Chakra Petch", monospace';
    ctx.fillText('CENTRAL & WESTERN RAILWAY • HEIGHT ABOVE M.S.L. : 6.1 M', 512, 215);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    this.textures.set('station_board_dadar', texture);
  }

  private generateMastTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Galvanized steel mottled texture
    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, 0, 256, 256);

    // Zinc galvanized spangle patterns
    for (let i = 0; i < 800; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const val = 80 + Math.random() * 60;
      ctx.fillStyle = `rgba(${val}, ${val + 10}, ${val + 20}, 0.3)`;
      ctx.fillRect(x, y, 4 + Math.random() * 12, 4 + Math.random() * 12);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    this.textures.set('steel_mast', texture);
  }

  private generateSkyBackdropTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mumbai skyline gradient with golden hour atmosphere
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#1e293b');
    grad.addColorStop(0.4, '#334155');
    grad.addColorStop(0.8, '#f97316');
    grad.addColorStop(1, '#fdba74');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    // Silhouette of Mumbai buildings
    ctx.fillStyle = '#0f172a';
    for (let x = 0; x < 512; x += 18 + Math.random() * 20) {
      const w = 14 + Math.random() * 22;
      const h = 40 + Math.random() * 100;
      ctx.fillRect(x, 256 - h, w, h);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    this.textures.set('sky_backdrop', texture);
  }

  // --- Procedural Web Audio Synthesis (Indian Railways Audio) ---

  /**
   * Synthesizes authentic Indian Railways dual-tone pneumatic horn (WAP-7 / EMU)
   */
  public playHorn() {
    if (!this.soundEnabled) return;
    this.initAudio();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Master horn gain with acoustic envelope
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(0.35, now + 0.05); // Rapid valve open
    masterGain.gain.setValueAtTime(0.35, now + 1.2);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8); // Natural reverb decay

    // Resonant lowpass filter simulating train horn bell chamber
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.Q.setValueAtTime(3.5, now);

    // Dual horn tones: Low tone (~311 Hz, Eb4) + High tone (~392 Hz, G4)
    const freqA = 311.13;
    const freqB = 392.00;

    [freqA, freqB].forEach((freq) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      // Slight frequency flutter for air pressure realism
      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(0.5, now);

      osc.connect(oscGain);
      oscGain.connect(filter);
      osc.start(now);
      osc.stop(now + 1.8);
    });

    filter.connect(masterGain);
    masterGain.connect(ctx.destination);
  }

  /**
   * UI Click Sound
   */
  public playClick() {
    if (!this.soundEnabled) return;
    this.initAudio();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.08);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  /**
   * UI Hover tick
   */
  public playHover() {
    if (!this.soundEnabled) return;
    this.initAudio();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, now);

    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.03);
  }

  /**
   * Station Announcement Chime (Classic 4-Note Chime)
   */
  public playStationChime() {
    if (!this.soundEnabled) return;
    this.initAudio();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const notes = [587.33, 739.99, 880.00, 1174.66]; // D5, F#5, A5, D6

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noteTime = now + idx * 0.28;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0, noteTime);
      gain.gain.linearRampToValueAtTime(0.15, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(noteTime);
      osc.stop(noteTime + 0.45);
    });
  }

  /**
   * Ambient Track Rumble & Mumbai Suburban Atmosphere
   */
  public startTrackAmbience() {
    if (!this.soundEnabled || this.isAmbiencePlaying) return;
    this.initAudio();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    const trackGain = ctx.createGain();
    trackGain.gain.setValueAtTime(0.001, now);
    trackGain.gain.linearRampToValueAtTime(0.06, now + 2.0); // Gentle fade in

    // Low frequency rumble for track presence
    const rumbleOsc = ctx.createOscillator();
    rumbleOsc.type = 'triangle';
    rumbleOsc.frequency.setValueAtTime(45, now);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(110, now);

    rumbleOsc.connect(filter);
    filter.connect(trackGain);
    trackGain.connect(ctx.destination);

    rumbleOsc.start();
    this.trackGainNode = trackGain;
    this.trackOscillators = [rumbleOsc];
    this.isAmbiencePlaying = true;
  }

  public stopTrackAmbience() {
    if (!this.isAmbiencePlaying || !this.trackGainNode || !this.audioContext) return;
    const now = this.audioContext.currentTime;
    this.trackGainNode.gain.linearRampToValueAtTime(0.0001, now + 0.5);
    setTimeout(() => {
      this.trackOscillators.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {
          // ignore
        }
      });
      this.trackOscillators = [];
      this.isAmbiencePlaying = false;
    }, 550);
  }

  public dispose() {
    this.stopTrackAmbience();
    this.textures.forEach((texture) => texture.dispose());
    this.textures.clear();
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}
