/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Authentic procedural Web Audio synthesis for Mumbai Suburban Broad Gauge EMUs.
 * Recreates:
 * - 3-phase IGBT / GTO traction motor inverter tones
 * - Dual-tone pneumatic air horns (WAP-7 / EMU tuned to 311.13 Hz and 392.00 Hz)
 * - Graduated pneumatic brake hiss & shoe squeal
 * - Wheel-rail rolling friction rumble & track-joint clatter
 * - Door warning chime & pneumatic actuator slide
 * - Air compressor reciprocating cycle
 */
export class TrainAudio {
  private ctx: AudioContext | null = null;
  private outputNode: GainNode | null = null;

  // Motor Inverter Continuous Nodes
  private motorGain: GainNode | null = null;
  private motorOscs: OscillatorNode[] = [];
  private motorFilter: BiquadFilterNode | null = null;

  // Wheel Roll Rumble & Rail Clatter
  private rollGain: GainNode | null = null;
  private rollSource: AudioBufferSourceNode | null = null;
  private rollFilter: BiquadFilterNode | null = null;

  private isClatterRunning = false;
  private clatterInterval: number | null = null;

  constructor(ctx: AudioContext, outputNode: GainNode) {
    this.ctx = ctx;
    this.outputNode = outputNode;
  }

  private isAvailable(): boolean {
    return !!(this.ctx && this.outputNode && this.ctx.state === "running");
  }

  /**
   * Dual-Tone Pneumatic Air Horn (Authentic Indian Railways EMU Rake)
   */
  public playHorn(): void {
    if (!this.isAvailable()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(0.5, now + 0.04);
    masterGain.gain.setValueAtTime(0.5, now + 1.1);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1350, now);
    filter.Q.setValueAtTime(2.8, now);

    // Primary tones: Eb4 (311.13 Hz) and G4 (392.00 Hz)
    [311.13, 392.0].forEach((freq) => {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, now);

      const toneGain = ctx.createGain();
      toneGain.gain.setValueAtTime(0.45, now);

      osc.connect(toneGain);
      toneGain.connect(filter);
      osc.start(now);
      osc.stop(now + 1.8);
    });

    filter.connect(masterGain);
    masterGain.connect(this.outputNode!);
  }

  /**
   * Pneumatic Brake Release ("psssshhh-chhh")
   */
  public playBrakeRelease(): void {
    if (!this.isAvailable()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const duration = 1.1;

    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.42));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(2400, now);
    filter.frequency.exponentialRampToValueAtTime(550, now + duration);
    filter.Q.setValueAtTime(1.8, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.outputNode!);

    noise.start(now);
  }

  /**
   * Brake Application (Air hiss + brake shoe squeal)
   */
  public playBrakeApply(): void {
    if (!this.isAvailable()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const duration = 1.4;

    // High frequency brake shoe friction squeal
    const squealOsc = ctx.createOscillator();
    squealOsc.type = "sine";
    squealOsc.frequency.setValueAtTime(2700, now);
    squealOsc.frequency.linearRampToValueAtTime(2300, now + duration);

    const squealGain = ctx.createGain();
    squealGain.gain.setValueAtTime(0.01, now);
    squealGain.gain.linearRampToValueAtTime(0.1, now + 0.3);
    squealGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    squealOsc.connect(squealGain);
    squealGain.connect(this.outputNode!);
    squealOsc.start(now);
    squealOsc.stop(now + duration);

    // Accompanying brake cylinder air hiss
    const bufferSize = Math.floor(ctx.sampleRate * 0.7);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1400, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.18, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.outputNode!);
    noise.start(now);
  }

  /**
   * Door Warning Buzzer (3-pulse 980 Hz warning tone)
   */
  public playDoorBuzzer(): void {
    if (!this.isAvailable()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const beepFreq = 980;

    for (let i = 0; i < 3; i++) {
      const t = now + i * 0.22;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "square";
      osc.frequency.setValueAtTime(beepFreq, t);

      gain.gain.setValueAtTime(0, t);
      gain.gain.setValueAtTime(0.12, t + 0.01);
      gain.gain.setValueAtTime(0.12, t + 0.12);
      gain.gain.setValueAtTime(0, t + 0.13);

      osc.connect(gain);
      gain.connect(this.outputNode!);
      osc.start(t);
      osc.stop(t + 0.14);
    }
  }

  /**
   * Door Opening / Closing Pneumatic Sound
   */
  public playDoorMovement(isOpen: boolean): void {
    if (!this.isAvailable()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const duration = 1.0;

    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(isOpen ? 800 : 1200, now);
    filter.frequency.linearRampToValueAtTime(isOpen ? 1200 : 700, now + duration);
    filter.Q.setValueAtTime(1.5, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.outputNode!);
    noise.start(now);
  }

  /**
   * Air Compressor Reciprocating Cycle
   */
  public playCompressorCycle(): void {
    if (!this.isAvailable()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const strokes = 8;
    const strokeInterval = 0.16;

    for (let s = 0; s < strokes; s++) {
      const t = now + s * strokeInterval;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(55, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.08);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(gain);
      gain.connect(this.outputNode!);
      osc.start(t);
      osc.stop(t + 0.09);
    }
  }

  /**
   * Updates continuous 3-phase AC traction motor sound & wheel-rail roll sound.
   *
   * @param speedKmh - Current velocity in km/h
   * @param motorLoad - Electrical tractive effort ratio (0.0 to 1.0)
   */
  public updateContinuousAudio(speedKmh: number, motorLoad: number): void {
    if (!this.isAvailable()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const speedRatio = Math.max(0, Math.min(1, speedKmh / 105));

    // 1. Motor Inverter Sound
    if (speedRatio > 0.005 || motorLoad > 0.05) {
      if (!this.motorGain) {
        this.motorGain = ctx.createGain();
        this.motorGain.gain.setValueAtTime(0.001, now);

        this.motorFilter = ctx.createBiquadFilter();
        this.motorFilter.type = "lowpass";
        this.motorFilter.frequency.setValueAtTime(2200, now);

        // Low fundamental motor hum
        const osc1 = ctx.createOscillator();
        osc1.type = "sawtooth";
        osc1.frequency.setValueAtTime(110, now);

        // High IGBT PWM inverter switching whine
        const osc2 = ctx.createOscillator();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(950, now);

        osc1.connect(this.motorFilter);
        osc2.connect(this.motorFilter);
        this.motorFilter.connect(this.motorGain);
        this.motorGain.connect(this.outputNode!);

        osc1.start(now);
        osc2.start(now);
        this.motorOscs = [osc1, osc2];
      }

      // Modulate frequency with speed and power
      const baseFreq = 95 + speedRatio * 420;
      const inverterFreq = 850 + speedRatio * 1400;
      this.motorOscs[0]?.frequency.setTargetAtTime(baseFreq, now, 0.08);
      this.motorOscs[1]?.frequency.setTargetAtTime(inverterFreq, now, 0.08);

      const targetGain = Math.min(0.24, 0.04 + motorLoad * 0.16 + speedRatio * 0.08);
      this.motorGain.gain.setTargetAtTime(targetGain, now, 0.1);
    } else if (this.motorGain) {
      this.motorGain.gain.setTargetAtTime(0.0001, now, 0.3);
      if (this.motorGain.gain.value < 0.001) {
        this.motorOscs.forEach((osc) => {
          try {
            osc.stop();
            osc.disconnect();
          } catch {
            // ignore
          }
        });
        this.motorOscs = [];
        this.motorGain.disconnect();
        this.motorGain = null;
      }
    }

    // 2. Wheel-Rail Rolling Friction Rumble
    if (speedRatio > 0.01) {
      if (!this.rollGain) {
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let b0 = 0,
          b1 = 0,
          b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.997 * b0 + white * 0.05;
          b1 = 0.985 * b1 + white * 0.11;
          b2 = 0.95 * b2 + white * 0.25;
          data[i] = (b0 + b1 + b2) * 0.3;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        this.rollFilter = ctx.createBiquadFilter();
        this.rollFilter.type = "bandpass";
        this.rollFilter.frequency.setValueAtTime(320, now);
        this.rollFilter.Q.setValueAtTime(1.2, now);

        this.rollGain = ctx.createGain();
        this.rollGain.gain.setValueAtTime(0.001, now);

        noise.connect(this.rollFilter);
        this.rollFilter.connect(this.rollGain);
        this.rollGain.connect(this.outputNode!);

        noise.start(now);
        this.rollSource = noise;
      }

      this.rollFilter?.frequency.setTargetAtTime(260 + speedRatio * 420, now, 0.1);
      const targetRollGain = Math.min(0.22, speedRatio * 0.2);
      this.rollGain.gain.setTargetAtTime(targetRollGain, now, 0.1);

      // Track joint clatter cadence
      this.updateTrackClatter(speedRatio);
    } else if (this.rollGain) {
      this.rollGain.gain.setTargetAtTime(0.0001, now, 0.3);
      this.stopTrackClatter();
    }
  }

  private updateTrackClatter(speedRatio: number): void {
    if (this.isClatterRunning || speedRatio < 0.05) return;
    this.isClatterRunning = true;

    const playClickPair = () => {
      if (!this.isClatterRunning || !this.isAvailable()) return;
      const ctx = this.ctx!;
      const now = ctx.currentTime;

      [0, 0.06].forEach((offset) => {
        const t = now + offset;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(420, t);
        osc.frequency.exponentialRampToValueAtTime(140, t + 0.04);

        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

        osc.connect(gain);
        gain.connect(this.outputNode!);
        osc.start(t);
        osc.stop(t + 0.05);
      });
    };

    const intervalMs = Math.max(280, 1100 - speedRatio * 750);
    this.clatterInterval = window.setInterval(playClickPair, intervalMs);
  }

  private stopTrackClatter(): void {
    this.isClatterRunning = false;
    if (this.clatterInterval !== null) {
      clearInterval(this.clatterInterval);
      this.clatterInterval = null;
    }
  }

  public dispose(): void {
    this.stopTrackClatter();
    if (this.rollSource) {
      try {
        this.rollSource.stop();
        this.rollSource.disconnect();
      } catch {
        // ignore
      }
      this.rollSource = null;
    }
    this.motorOscs.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // ignore
      }
    });
    this.motorOscs = [];
    this.motorGain = null;
    this.rollGain = null;
  }
}
