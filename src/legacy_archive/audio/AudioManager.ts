/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TrainAudio } from './TrainAudio';
import { EnvironmentAudio } from './EnvironmentAudio';
import { UIAudio } from './UIAudio';

export class AudioManager {
  private static instance: AudioManager | null = null;
  public ctx: AudioContext | null = null;

  // Audio Bus Nodes
  private masterGain!: GainNode;
  private trainGain!: GainNode;
  private envGain!: GainNode;
  private uiGain!: GainNode;

  // Subsystems
  public train!: TrainAudio;
  public env!: EnvironmentAudio;
  public ui!: UIAudio;

  // Volume Levels (0.0 to 1.0)
  private masterVolume: number = 0.8;
  private trainVolume: number = 0.85;
  private envVolume: number = 0.7;
  private uiVolume: number = 0.8;
  private isMuted: boolean = false;

  constructor() {
    this.loadSettings();
    this.setupAudio();
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private setupAudio() {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();

    // Build Audio Bus Graph:
    // [Sources] -> [Sub Gain] -> [Master Gain] -> [Destination]
    this.masterGain = this.ctx.createGain();
    this.trainGain = this.ctx.createGain();
    this.envGain = this.ctx.createGain();
    this.uiGain = this.ctx.createGain();

    this.trainGain.connect(this.masterGain);
    this.envGain.connect(this.masterGain);
    this.uiGain.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    // Apply stored gains
    this.applyGains();

    // Instantiate Subsystems
    this.train = new TrainAudio(this.ctx, this.trainGain);
    this.env = new EnvironmentAudio(this.ctx, this.envGain);
    this.ui = new UIAudio(this.ctx, this.uiGain);

    // Autoplay Unlock on any user gesture
    const unlockAudio = () => {
      this.resume();
    };
    ['pointerdown', 'click', 'keydown', 'touchstart'].forEach((evt) => {
      window.addEventListener(evt, unlockAudio, { passive: true });
    });
  }

  public async resume(): Promise<void> {
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch (e) {
        console.warn('AudioContext resume failed:', e);
      }
    }
  }

  // --- Volume Controls & Persistence ---

  public setMasterVolume(val: number) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    localStorage.setItem('mumbai_sim_vol_master', this.masterVolume.toString());
    this.applyGains();
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  public setTrainVolume(val: number) {
    this.trainVolume = Math.max(0, Math.min(1, val));
    localStorage.setItem('mumbai_sim_vol_train', this.trainVolume.toString());
    this.applyGains();
  }

  public getTrainVolume(): number {
    return this.trainVolume;
  }

  public setEnvironmentVolume(val: number) {
    this.envVolume = Math.max(0, Math.min(1, val));
    localStorage.setItem('mumbai_sim_vol_env', this.envVolume.toString());
    this.applyGains();
  }

  public getEnvironmentVolume(): number {
    return this.envVolume;
  }

  public setUIVolume(val: number) {
    this.uiVolume = Math.max(0, Math.min(1, val));
    localStorage.setItem('mumbai_sim_vol_ui', this.uiVolume.toString());
    this.applyGains();
  }

  public getUIVolume(): number {
    return this.uiVolume;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    localStorage.setItem('mumbai_sim_muted', muted ? 'true' : 'false');
    this.applyGains();
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  private applyGains() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const effectiveMaster = this.isMuted ? 0 : this.masterVolume;

    this.masterGain.gain.setValueAtTime(effectiveMaster, now);
    this.trainGain.gain.setValueAtTime(this.trainVolume, now);
    this.envGain.gain.setValueAtTime(this.envVolume, now);
    this.uiGain.gain.setValueAtTime(this.uiVolume, now);
  }

  private loadSettings() {
    const savedMaster = localStorage.getItem('mumbai_sim_vol_master');
    if (savedMaster !== null) this.masterVolume = parseFloat(savedMaster) || 0.8;

    const savedTrain = localStorage.getItem('mumbai_sim_vol_train');
    if (savedTrain !== null) this.trainVolume = parseFloat(savedTrain) || 0.85;

    const savedEnv = localStorage.getItem('mumbai_sim_vol_env');
    if (savedEnv !== null) this.envVolume = parseFloat(savedEnv) || 0.7;

    const savedUI = localStorage.getItem('mumbai_sim_vol_ui');
    if (savedUI !== null) this.uiVolume = parseFloat(savedUI) || 0.8;

    const savedMuted = localStorage.getItem('mumbai_sim_muted');
    if (savedMuted !== null) this.isMuted = savedMuted === 'true';
  }

  public dispose() {
    this.train?.dispose();
    this.env?.dispose();
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close();
    }
  }
}
