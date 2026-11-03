/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AudioManager } from '../audio/AudioManager';

export class AudioSettings {
  public element: HTMLElement;
  private audioManager: AudioManager;
  private isOpen: boolean = false;

  constructor() {
    this.audioManager = AudioManager.getInstance();
    this.element = document.createElement('div');
    this.element.className = 'modal-backdrop';
    this.element.style.display = 'none';
    this.render();
  }

  public open() {
    this.isOpen = true;
    this.element.style.display = 'flex';
    this.syncUI();
    this.audioManager.ui.playClick();
  }

  public close() {
    this.isOpen = false;
    this.element.style.display = 'none';
    this.audioManager.ui.playClick();
  }

  private render() {
    this.element.innerHTML = `
      <div class="modal-window" style="max-width: 640px;">
        <div class="modal-header">
          <div class="modal-title">
            <span class="modal-title-accent">🔊</span> Sound & Audio Settings
          </div>
          <button class="modal-close-btn" id="btn-close-audio">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="modal-body" style="gap: 1.25rem;">
          <!-- Master Mute Toggle -->
          <div class="setting-row">
            <div class="setting-label-col">
              <span class="setting-label">Master Audio</span>
              <span class="setting-desc">Enable or mute all simulation sounds</span>
            </div>
            <label class="switch">
              <input type="checkbox" id="toggle-audio-mute">
              <span class="slider-switch"></span>
            </label>
          </div>

          <!-- Master Volume Slider -->
          <div class="setting-row">
            <div class="setting-label-col">
              <span class="setting-label">Master Volume</span>
              <span class="setting-desc">Overall output level (<span id="lbl-master-vol">80%</span>)</span>
            </div>
            <div style="width: 150px;">
              <input type="range" id="slider-master-vol" min="0" max="1" step="0.05" value="0.8"
                     style="accent-color: #f97316; width: 100%; cursor: pointer;">
            </div>
          </div>

          <!-- Train Sounds Volume -->
          <div class="setting-row">
            <div class="setting-label-col">
              <span class="setting-label">Train & Traction Sounds</span>
              <span class="setting-desc">Electric motor, horn, air brakes, wheel clatter (<span id="lbl-train-vol">85%</span>)</span>
            </div>
            <div style="width: 150px;">
              <input type="range" id="slider-train-vol" min="0" max="1" step="0.05" value="0.85"
                     style="accent-color: #f97316; width: 100%; cursor: pointer;">
            </div>
          </div>

          <!-- Environment Sounds Volume -->
          <div class="setting-row">
            <div class="setting-label-col">
              <span class="setting-label">Station & Environment Ambience</span>
              <span class="setting-desc">Platform atmosphere, breeze, announcements (<span id="lbl-env-vol">70%</span>)</span>
            </div>
            <div style="width: 150px;">
              <input type="range" id="slider-env-vol" min="0" max="1" step="0.05" value="0.7"
                     style="accent-color: #f97316; width: 100%; cursor: pointer;">
            </div>
          </div>

          <!-- UI Sounds Volume -->
          <div class="setting-row">
            <div class="setting-label-col">
              <span class="setting-label">Interface & Menu Sounds</span>
              <span class="setting-desc">Button clicks, hover ticks, transitions (<span id="lbl-ui-vol">80%</span>)</span>
            </div>
            <div style="width: 150px;">
              <input type="range" id="slider-ui-vol" min="0" max="1" step="0.05" value="0.8"
                     style="accent-color: #f97316; width: 100%; cursor: pointer;">
            </div>
          </div>

          <!-- Individual Sound Preview Rack -->
          <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(249, 115, 22, 0.2); border-radius: 6px; padding: 1rem;">
            <div style="font-family: var(--font-mono); font-size: 0.75rem; color: #fb923c; margin-bottom: 0.75rem; text-transform: uppercase;">
              Audio Subsystem Test Rack
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
              <button class="quality-btn" id="test-horn">🎺 Horn</button>
              <button class="quality-btn" id="test-motor">⚡ Motor Hum</button>
              <button class="quality-btn" id="test-brake-rel">💨 Brake Rel</button>
              <button class="quality-btn" id="test-brake-app">🛑 Brake Apply</button>
              <button class="quality-btn" id="test-doors">🚪 Door Buzzer</button>
              <button class="quality-btn" id="test-chime">🔔 Station Chime</button>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-rail primary" id="btn-done-audio" style="padding: 0.5rem 1.5rem; font-size: 0.9rem;">
            Done
          </button>
        </div>
      </div>
    `;

    this.setupListeners();
  }

  private setupListeners() {
    this.element.querySelector('#btn-close-audio')?.addEventListener('click', () => this.close());
    this.element.querySelector('#btn-done-audio')?.addEventListener('click', () => this.close());

    // Mute toggle
    const muteToggle = this.element.querySelector<HTMLInputElement>('#toggle-audio-mute');
    muteToggle?.addEventListener('change', (e) => {
      const active = !(e.target as HTMLInputElement).checked; // checked = unmuted
      this.audioManager.setMuted(active);
    });

    // Master volume slider
    const masterSlider = this.element.querySelector<HTMLInputElement>('#slider-master-vol');
    const masterLbl = this.element.querySelector('#lbl-master-vol');
    masterSlider?.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      this.audioManager.setMasterVolume(val);
      if (masterLbl) masterLbl.textContent = `${Math.round(val * 100)}%`;
    });

    // Train volume slider
    const trainSlider = this.element.querySelector<HTMLInputElement>('#slider-train-vol');
    const trainLbl = this.element.querySelector('#lbl-train-vol');
    trainSlider?.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      this.audioManager.setTrainVolume(val);
      if (trainLbl) trainLbl.textContent = `${Math.round(val * 100)}%`;
    });

    // Env volume slider
    const envSlider = this.element.querySelector<HTMLInputElement>('#slider-env-vol');
    const envLbl = this.element.querySelector('#lbl-env-vol');
    envSlider?.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      this.audioManager.setEnvironmentVolume(val);
      if (envLbl) envLbl.textContent = `${Math.round(val * 100)}%`;
    });

    // UI volume slider
    const uiSlider = this.element.querySelector<HTMLInputElement>('#slider-ui-vol');
    const uiLbl = this.element.querySelector('#lbl-ui-vol');
    uiSlider?.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      this.audioManager.setUIVolume(val);
      if (uiLbl) uiLbl.textContent = `${Math.round(val * 100)}%`;
    });

    // Test buttons
    this.element.querySelector('#test-horn')?.addEventListener('click', () => {
      this.audioManager.train.playHorn();
    });

    let isMotorTesting = false;
    this.element.querySelector('#test-motor')?.addEventListener('click', (e) => {
      const btn = e.target as HTMLElement;
      if (!isMotorTesting) {
        this.audioManager.train.startMotorSound(0.5);
        btn.textContent = '⏹ Stop Motor';
        btn.classList.add('active');
        isMotorTesting = true;
      } else {
        this.audioManager.train.stopMotorSound();
        btn.textContent = '⚡ Motor Hum';
        btn.classList.remove('active');
        isMotorTesting = false;
      }
    });

    this.element.querySelector('#test-brake-rel')?.addEventListener('click', () => {
      this.audioManager.train.playBrakeRelease();
    });

    this.element.querySelector('#test-brake-app')?.addEventListener('click', () => {
      this.audioManager.train.playBrakeApply();
    });

    this.element.querySelector('#test-doors')?.addEventListener('click', () => {
      this.audioManager.train.playDoorBuzzer();
      setTimeout(() => this.audioManager.train.playDoorMovement(true), 600);
    });

    this.element.querySelector('#test-chime')?.addEventListener('click', () => {
      this.audioManager.env.playStationAnnouncement();
    });
  }

  private syncUI() {
    const muteToggle = this.element.querySelector<HTMLInputElement>('#toggle-audio-mute');
    if (muteToggle) muteToggle.checked = !this.audioManager.getMuted();

    const masterSlider = this.element.querySelector<HTMLInputElement>('#slider-master-vol');
    const masterVal = this.audioManager.getMasterVolume();
    if (masterSlider) masterSlider.value = masterVal.toString();
    const masterLbl = this.element.querySelector('#lbl-master-vol');
    if (masterLbl) masterLbl.textContent = `${Math.round(masterVal * 100)}%`;

    const trainSlider = this.element.querySelector<HTMLInputElement>('#slider-train-vol');
    const trainVal = this.audioManager.getTrainVolume();
    if (trainSlider) trainSlider.value = trainVal.toString();
    const trainLbl = this.element.querySelector('#lbl-train-vol');
    if (trainLbl) trainLbl.textContent = `${Math.round(trainVal * 100)}%`;

    const envSlider = this.element.querySelector<HTMLInputElement>('#slider-env-vol');
    const envVal = this.audioManager.getEnvironmentVolume();
    if (envSlider) envSlider.value = envVal.toString();
    const envLbl = this.element.querySelector('#lbl-env-vol');
    if (envLbl) envLbl.textContent = `${Math.round(envVal * 100)}%`;

    const uiSlider = this.element.querySelector<HTMLInputElement>('#slider-ui-vol');
    const uiVal = this.audioManager.getUIVolume();
    if (uiSlider) uiSlider.value = uiVal.toString();
    const uiLbl = this.element.querySelector('#lbl-ui-vol');
    if (uiLbl) uiLbl.textContent = `${Math.round(uiVal * 100)}%`;
  }
}
