/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export class TrainAudio {
  private ctx: AudioContext;
  private outputNode: GainNode;

  // Active continuous nodes
  private motorGain: GainNode | null = null;
  private motorOscs: OscillatorNode[] = [];
  private motorSpeed: number = 0;

  private rollGain: GainNode | null = null;
  private rollSource: AudioBufferSourceNode | null = null;

  private clatterInterval: number | null = null;
  private isClatterRunning: boolean = false;

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
   * Dual-Tone Pneumatic Air Horn (Authentic Indian Railways WAP-7 / EMU Rake)
   */
  public playHorn() {
    this.ensureRunning();
    const now = this.ctx.currentTime;

    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(0.45, now + 0.04);
    masterGain.gain.setValueAtTime(0.45, now + 1.2);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 1.85);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1250, now);
    filter.Q.setValueAtTime(3.2, now);

    // Primary tones: Eb4 (311.13 Hz) and G4 (392.00 Hz)
    [311.13, 392.00].forEach((freq) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      const toneGain = this.ctx.createGain();
      toneGain.gain.setValueAtTime(0.5, now);

      osc.connect(toneGain);
      toneGain.connect(filter);
      osc.start(now);
      osc.stop(now + 1.85);
    });

    filter.connect(masterGain);
    masterGain.connect(this.outputNode);
  }

  /**
   * Pneumatic Brake Release ("psssshhh-chhh")
   */
  public playBrakeRelease() {
    this.ensureRunning();
    const now = this.ctx.currentTime;
    const duration = 1.2;

    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.45));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2200, now);
    filter.frequency.exponentialRampToValueAtTime(600, now + duration);
    filter.Q.setValueAtTime(1.8, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.outputNode);

    noise.start(now);
  }

  /**
   * Brake Application (Air hiss + brake shoe squeal)
   */
  public playBrakeApply() {
    this.ensureRunning();
    const now = this.ctx.currentTime;
    const duration = 1.5;

    // High frequency brake shoe friction squeal
    const squealOsc = this.ctx.createOscillator();
    squealOsc.type = 'sine';
    squealOsc.frequency.setValueAtTime(2800, now);
    squealOsc.frequency.linearRampToValueAtTime(2400, now + duration);

    const squealGain = this.ctx.createGain();
    squealGain.gain.setValueAtTime(0.01, now);
    squealGain.gain.linearRampToValueAtTime(0.12, now + 0.3);
    squealGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    squealOsc.connect(squealGain);
    squealGain.connect(this.outputNode);
    squealOsc.start(now);
    squealOsc.stop(now + duration);

    // Accompanying brake cylinder air hiss
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.8);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1500, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.18, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.outputNode);
    noise.start(now);
  }

  /**
   * Door Warning Buzzer (Classic 3-pulse beep)
   */
  public playDoorBuzzer() {
    this.ensureRunning();
    const now = this.ctx.currentTime;
    const beepFreq = 980; // ~1 kHz warning tone

    for (let i = 0; i < 3; i++) {
      const t = now + i * 0.22;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(beepFreq, t);

      gain.gain.setValueAtTime(0, t);
      gain.gain.setValueAtTime(0.12, t + 0.01);
      gain.gain.setValueAtTime(0.12, t + 0.12);
      gain.gain.setValueAtTime(0, t + 0.13);

      osc.connect(gain);
      gain.connect(this.outputNode);
      osc.start(t);
      osc.stop(t + 0.14);
    }
  }

  /**
   * Door Opening / Closing Pneumatic Actuator Sound
   */
  public playDoorMovement(isOpen: boolean) {
    this.ensureRunning();
    const now = this.ctx.currentTime;
    const duration = 1.0;

    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(isOpen ? 800 : 1200, now);
    filter.frequency.linearRampToValueAtTime(isOpen ? 1200 : 700, now + duration);
    filter.Q.setValueAtTime(1.5, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.outputNode);
    noise.start(now);

    if (!isOpen) {
      const thudTime = now + 0.85;
      const thudOsc = this.ctx.createOscillator();
      const thudGain = this.ctx.createGain();

      thudOsc.type = 'sine';
      thudOsc.frequency.setValueAtTime(90, thudTime);
      thudOsc.frequency.exponentialRampToValueAtTime(30, thudTime + 0.12);

      thudGain.gain.setValueAtTime(0.3, thudTime);
      thudGain.gain.exponentialRampToValueAtTime(0.001, thudTime + 0.12);

      thudOsc.connect(thudGain);
      thudGain.connect(this.outputNode);
      thudOsc.start(thudTime);
      thudOsc.stop(thudTime + 0.13);
    }
  }

  /**
   * Air Compressor Reciprocating Cycle
   */
  public playCompressorCycle() {
    this.ensureRunning();
    const now = this.ctx.currentTime;
    const strokes = 8;
    const strokeInterval = 0.16;

    for (let s = 0; s < strokes; s++) {
      const t = now + s * strokeInterval;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(55, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.08);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(gain);
      gain.connect(this.outputNode);
      osc.start(t);
      osc.stop(t + 0.09);
    }
  }

  /**
   * 3-Phase AC Traction Motor / Inverter Whine
   */
  public startMotorSound(speedRatio: number = 0.3) {
    this.ensureRunning();
    if (this.motorGain) return;

    this.motorSpeed = Math.max(0, Math.min(1, speedRatio));
    const now = this.ctx.currentTime;

    this.motorGain = this.ctx.createGain();
    this.motorGain.gain.setValueAtTime(0.001, now);
    this.motorGain.gain.linearRampToValueAtTime(0.18, now + 0.5);

    const baseFreq = 120 + this.motorSpeed * 380;
    const highFreq = 950 + this.motorSpeed * 1200;

    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(baseFreq, now);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(highFreq, now);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, now);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(this.motorGain);
    this.motorGain.connect(this.outputNode);

    osc1.start(now);
    osc2.start(now);

    this.motorOscs = [osc1, osc2];
  }

  public setMotorSpeed(speedRatio: number) {
    this.motorSpeed = Math.max(0, Math.min(1, speedRatio));
    if (this.motorOscs.length >= 2) {
      const now = this.ctx.currentTime;
      const baseFreq = 120 + this.motorSpeed * 380;
      const highFreq = 950 + this.motorSpeed * 1200;
      this.motorOscs[0].frequency.linearRampToValueAtTime(baseFreq, now + 0.1);
      this.motorOscs[1].frequency.linearRampToValueAtTime(highFreq, now + 0.1);
    }
  }

  public stopMotorSound() {
    if (!this.motorGain) return;
    const now = this.ctx.currentTime;
    this.motorGain.gain.linearRampToValueAtTime(0.0001, now + 0.4);
    setTimeout(() => {
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
    }, 450);
  }

  /**
   * Rail Joint Clatter ("click-clack... click-clack")
   */
  public startTrackClatter(speedRatio: number = 0.5) {
    if (this.isClatterRunning) return;
    this.isClatterRunning = true;
    this.ensureRunning();

    const playClickPair = () => {
      if (!this.isClatterRunning) return;
      this.ensureRunning();
      const now = this.ctx.currentTime;

      [0, 0.065].forEach((offset) => {
        const t = now + offset;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(420, t);
        osc.frequency.exponentialRampToValueAtTime(140, t + 0.04);

        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

        osc.connect(gain);
        gain.connect(this.outputNode);
        osc.start(t);
        osc.stop(t + 0.05);
      });
    };

    const intervalMs = Math.max(350, 1200 - speedRatio * 800);
    playClickPair();
    this.clatterInterval = window.setInterval(playClickPair, intervalMs);
  }

  public stopTrackClatter() {
    this.isClatterRunning = false;
    if (this.clatterInterval !== null) {
      clearInterval(this.clatterInterval);
      this.clatterInterval = null;
    }
  }

  /**
   * Continuous Wheel Roll Friction Rumble
   */
  public startWheelRoll(speedRatio: number = 0.5) {
    if (this.rollGain) return;
    this.ensureRunning();
    const now = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.997 * b0 + white * 0.05;
      b1 = 0.985 * b1 + white * 0.11;
      b2 = 0.950 * b2 + white * 0.25;
      data[i] = (b0 + b1 + b2) * 0.3;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(320 + speedRatio * 400, now);
    filter.Q.setValueAtTime(1.2, now);

    this.rollGain = this.ctx.createGain();
    this.rollGain.gain.setValueAtTime(0.001, now);
    this.rollGain.gain.linearRampToValueAtTime(0.15, now + 0.6);

    noise.connect(filter);
    filter.connect(this.rollGain);
    this.rollGain.connect(this.outputNode);

    noise.start(now);
    this.rollSource = noise;
  }

  public stopWheelRoll() {
    if (!this.rollGain) return;
    const now = this.ctx.currentTime;
    this.rollGain.gain.linearRampToValueAtTime(0.0001, now + 0.4);
    setTimeout(() => {
      if (this.rollSource) {
        try {
          this.rollSource.stop();
          this.rollSource.disconnect();
        } catch {
          // ignore
        }
        this.rollSource = null;
      }
      this.rollGain = null;
    }, 450);
  }

  public dispose() {
    this.stopMotorSound();
    this.stopTrackClatter();
    this.stopWheelRoll();
  }
}
