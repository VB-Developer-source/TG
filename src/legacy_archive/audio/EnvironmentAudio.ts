/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export class EnvironmentAudio {
  private ctx: AudioContext;
  private outputNode: GainNode;
  private stationGain: GainNode | null = null;
  private ambientOscs: OscillatorNode[] = [];
  private isAmbiencePlaying: boolean = false;

  constructor(ctx: AudioContext, outputNode: GainNode) {
    this.ctx = ctx;
    this.outputNode = outputNode;
  }

  private ensureRunning() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  /**
   * Distant Station Ambience & Suburban Atmosphere
   */
  public startStationAmbience() {
    if (this.isAmbiencePlaying) return;
    this.ensureRunning();
    const now = this.ctx.currentTime;

    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.linearRampToValueAtTime(0.12, now + 1.5);

    const osc1 = this.ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(52, now);

    const filter1 = this.ctx.createBiquadFilter();
    filter1.type = 'lowpass';
    filter1.frequency.setValueAtTime(95, now);

    osc1.connect(filter1);
    filter1.connect(masterGain);
    osc1.start(now);

    masterGain.connect(this.outputNode);

    this.stationGain = masterGain;
    this.ambientOscs = [osc1];
    this.isAmbiencePlaying = true;
  }

  public stopStationAmbience() {
    if (!this.isAmbiencePlaying || !this.stationGain) return;
    const now = this.ctx.currentTime;
    this.stationGain.gain.linearRampToValueAtTime(0.0001, now + 0.6);
    setTimeout(() => {
      this.ambientOscs.forEach((o) => {
        try {
          o.stop();
          o.disconnect();
        } catch {
          // ignore
        }
      });
      this.ambientOscs = [];
      this.stationGain = null;
      this.isAmbiencePlaying = false;
    }, 650);
  }

  /**
   * Indian Railways Station Announcement Chime & Reverb
   * (4-note sequence: D5 -> F#5 -> A5 -> D6)
   */
  public playStationAnnouncement() {
    this.ensureRunning();
    const now = this.ctx.currentTime;
    const notes = [587.33, 739.99, 880.00, 1174.66]; // D5, F#5, A5, D6

    notes.forEach((freq, idx) => {
      const noteTime = now + idx * 0.28;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0, noteTime);
      gain.gain.linearRampToValueAtTime(0.2, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.45);

      osc.connect(gain);
      gain.connect(this.outputNode);
      osc.start(noteTime);
      osc.stop(noteTime + 0.5);
    });
  }

  public dispose() {
    this.stopStationAmbience();
  }
}
