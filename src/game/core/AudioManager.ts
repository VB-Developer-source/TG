import { TrainAudio } from "../audio/TrainAudio";

const MASTER_VOLUME = 0.8;
const AMBIENCE_VOLUME = 0.07;
const CLICK_VOLUME = 0.05;

export class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambience: AudioBufferSourceNode | null = null;
  private enabled = true;
  private trainAudio: TrainAudio | null = null;

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (this.ctx && this.master) {
      this.master.gain.setTargetAtTime(enabled ? MASTER_VOLUME : 0, this.ctx.currentTime, 0.08);
    }
  }

  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return;
    }
    const AudioCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;
    this.ctx = new AudioCtor();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.enabled ? MASTER_VOLUME : 0;
    this.master.connect(this.ctx.destination);
    this.startAmbience();

    // Initialize Train Audio
    this.trainAudio = new TrainAudio(this.ctx, this.master);
  }

  /** Play authentic Indian Railways Dual-Tone Air Horn */
  playHorn(): void {
    this.unlock();
    this.trainAudio?.playHorn();
  }

  /** Play pneumatic brake release hiss */
  playBrakeRelease(): void {
    this.unlock();
    this.trainAudio?.playBrakeRelease();
  }

  /** Play brake application air hiss and shoe squeal */
  playBrakeApply(): void {
    this.unlock();
    this.trainAudio?.playBrakeApply();
  }

  /** Play door warning buzzer chime */
  playDoorBuzzer(): void {
    this.unlock();
    this.trainAudio?.playDoorBuzzer();
  }

  /** Play door actuator movement */
  playDoorMovement(isOpen: boolean): void {
    this.unlock();
    this.trainAudio?.playDoorMovement(isOpen);
  }

  /** Play compressor cycle */
  playCompressorCycle(): void {
    this.unlock();
    this.trainAudio?.playCompressorCycle();
  }

  /** Update continuous traction motor and rolling sounds */
  updateTrainSound(speedKmh: number, motorLoad: number): void {
    this.trainAudio?.updateContinuousAudio(speedKmh, motorLoad);
  }

  /** Short relay-like tick for menu interactions. */
  click(): void {
    if (!this.ctx || !this.master || !this.enabled) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(1150, t);
    osc.frequency.exponentialRampToValueAtTime(520, t + 0.06);
    gain.gain.setValueAtTime(CLICK_VOLUME, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    osc.connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  dispose(): void {
    this.trainAudio?.dispose();
    this.trainAudio = null;
    this.ambience?.stop();
    this.ambience = null;
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
  }

  /** Low filtered brown noise: distant city and line-side hum. */
  private startAmbience(): void {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const seconds = 4;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 420;
    const gain = ctx.createGain();
    gain.gain.value = AMBIENCE_VOLUME;
    const lfo = ctx.createOscillator();
    const lfoDepth = ctx.createGain();
    lfo.frequency.value = 0.07;
    lfoDepth.gain.value = AMBIENCE_VOLUME * 0.35;
    lfo.connect(lfoDepth).connect(gain.gain);
    source.connect(filter).connect(gain).connect(this.master);
    source.start();
    lfo.start();
    this.ambience = source;
  }
}

