/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export class UIAudio {
  private ctx: AudioContext;
  private outputNode: GainNode;

  constructor(ctx: AudioContext, outputNode: GainNode) {
    this.ctx = ctx;
    this.outputNode = outputNode;
  }

  private ensureRunning() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public playHover() {
    this.ensureRunning();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, now);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.outputNode);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  public playClick() {
    this.ensureRunning();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.07);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(this.outputNode);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  public playTransition() {
    this.ensureRunning();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(660, now + 0.15);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.outputNode);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playConfirm() {
    this.ensureRunning();
    const now = this.ctx.currentTime;
    [587.33, 880].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + i * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

      osc.connect(gain);
      gain.connect(this.outputNode);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  }
}
