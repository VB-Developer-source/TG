/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Game } from '../core/Game';
import { QualityPreset } from '../core/Renderer';
import { AudioSettings } from './AudioSettings';

export class SettingsMenu {
  public element: HTMLElement;
  private game: Game;
  private isOpen: boolean = false;
  private audioSettingsModal: AudioSettings | null = null;

  constructor(game: Game) {
    this.game = game;
    this.element = document.createElement('div');
    this.element.className = 'modal-backdrop';
    this.element.style.display = 'none';
    this.render();
  }

  public open() {
    this.isOpen = true;
    this.element.style.display = 'flex';
    this.syncStateWithUI();
    this.game.assetManager.playClick();
  }

  public close() {
    this.isOpen = false;
    this.element.style.display = 'none';
    this.game.assetManager.playClick();
  }

  private render() {
    this.element.innerHTML = `
      <div class="modal-window">
        <div class="modal-header">
          <div class="modal-title">
            <span class="modal-title-accent">⚙</span> Simulator Settings
          </div>
          <button class="modal-close-btn" id="btn-close-settings" title="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <div class="settings-group">
            <!-- Graphics Quality -->
            <div class="setting-row">
              <div class="setting-label-col">
                <span class="setting-label">Graphics Quality</span>
                <span class="setting-desc">Adjust pixel resolution, render scale & antialiasing</span>
              </div>
              <div class="quality-button-group" id="quality-buttons">
                <button class="quality-btn" data-quality="low">Low</button>
                <button class="quality-btn" data-quality="medium">Med</button>
                <button class="quality-btn" data-quality="high">High</button>
                <button class="quality-btn" data-quality="ultra">Ultra</button>
              </div>
            </div>

            <!-- Dynamic Shadows -->
            <div class="setting-row">
              <div class="setting-label-col">
                <span class="setting-label">Sunlight & Structure Shadows</span>
                <span class="setting-desc">Real-time soft shadows on tracks, sleepers and platform</span>
              </div>
              <label class="switch">
                <input type="checkbox" id="toggle-shadows">
                <span class="slider-switch"></span>
              </label>
            </div>

            <!-- Sound & Audio -->
            <div class="setting-row">
              <div class="setting-label-col">
                <span class="setting-label">Sound & Track Atmosphere</span>
                <span class="setting-desc">Pneumatic train horn, track rumble & station announcements</span>
              </div>
              <label class="switch">
                <input type="checkbox" id="toggle-sound">
                <span class="slider-switch"></span>
              </label>
            </div>

            <!-- Audio Mixer Shortcut -->
            <div class="setting-row">
              <div class="setting-label-col">
                <span class="setting-label">Audio Mixer Channels</span>
                <span class="setting-desc">Configure individual Train, Station & UI volume levels</span>
              </div>
              <button class="btn-rail" id="btn-open-mixer" style="padding: 0.45rem 1rem; font-size: 0.85rem;">
                Open Mixer 🎚️
              </button>
            </div>

            <!-- Camera Sensitivity -->
            <div class="setting-row">
              <div class="setting-label-col">
                <span class="setting-label">Camera Sensitivity</span>
                <span class="setting-desc">Drag and inspection speed (<span id="sens-value">1.0x</span>)</span>
              </div>
              <div style="display: flex; align-items: center; gap: 0.75rem; width: 140px;">
                <input type="range" id="slider-sensitivity" min="0.4" max="2.5" step="0.1" value="1.0" 
                       style="accent-color: #f97316; width: 100%; cursor: pointer;">
              </div>
            </div>

            <!-- Fullscreen Mode -->
            <div class="setting-row">
              <div class="setting-label-col">
                <span class="setting-label">Display Mode</span>
                <span class="setting-desc">Toggle immersive fullscreen browser display</span>
              </div>
              <button class="btn-rail" id="btn-toggle-fullscreen" style="padding: 0.45rem 1rem; font-size: 0.85rem;">
                Fullscreen
              </button>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-rail" id="btn-reset-settings" style="padding: 0.5rem 1.25rem; font-size: 0.9rem; background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.4);">
            Reset to Default
          </button>
          <button class="btn-rail primary" id="btn-save-close" style="padding: 0.5rem 1.5rem; font-size: 0.9rem;">
            Done
          </button>
        </div>
      </div>
    `;

    this.setupListeners();
  }

  private setupListeners() {
    // Close button
    this.element.querySelector('#btn-close-settings')?.addEventListener('click', () => this.close());
    this.element.querySelector('#btn-save-close')?.addEventListener('click', () => this.close());

    // Quality buttons
    const qualityButtons = this.element.querySelectorAll<HTMLButtonElement>('#quality-buttons .quality-btn');
    qualityButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const quality = btn.getAttribute('data-quality') as QualityPreset;
        if (quality) {
          this.game.setQuality(quality);
          qualityButtons.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          this.game.assetManager.playClick();
        }
      });
    });

    // Shadows toggle
    const shadowsToggle = this.element.querySelector<HTMLInputElement>('#toggle-shadows');
    shadowsToggle?.addEventListener('change', (e) => {
      const checked = (e.target as HTMLInputElement).checked;
      this.game.lighting.setShadowsEnabled(checked);
      this.game.renderer.setShadows(checked);
      this.game.assetManager.playClick();
    });

    // Sound toggle
    const soundToggle = this.element.querySelector<HTMLInputElement>('#toggle-sound');
    soundToggle?.addEventListener('change', (e) => {
      const checked = (e.target as HTMLInputElement).checked;
      this.game.assetManager.setSoundEnabled(checked);
      this.game.audio.setMuted(!checked);
      if (checked) {
        this.game.assetManager.playClick();
        this.game.assetManager.startTrackAmbience();
      } else {
        this.game.assetManager.stopTrackAmbience();
      }
    });

    // Audio Mixer Modal
    this.audioSettingsModal = new AudioSettings();
    this.element.appendChild(this.audioSettingsModal.element);
    this.element.querySelector('#btn-open-mixer')?.addEventListener('click', () => {
      this.audioSettingsModal?.open();
    });

    // Sensitivity slider
    const sensSlider = this.element.querySelector<HTMLInputElement>('#slider-sensitivity');
    const sensValSpan = this.element.querySelector('#sens-value');
    sensSlider?.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      this.game.camera.setSensitivity(val);
      if (sensValSpan) {
        sensValSpan.textContent = `${val.toFixed(1)}x`;
      }
    });

    // Fullscreen toggle
    this.element.querySelector('#btn-toggle-fullscreen')?.addEventListener('click', () => {
      this.game.assetManager.playClick();
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.warn('Fullscreen request failed:', err);
        });
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });

    // Reset settings
    this.element.querySelector('#btn-reset-settings')?.addEventListener('click', () => {
      localStorage.removeItem('mumbai_sim_quality');
      localStorage.removeItem('mumbai_sim_shadows');
      localStorage.removeItem('mumbai_sim_sound');
      localStorage.removeItem('mumbai_sim_sensitivity');

      this.game.setQuality('high');
      this.game.lighting.setShadowsEnabled(true);
      this.game.renderer.setShadows(true);
      this.game.assetManager.setSoundEnabled(true);
      this.game.camera.setSensitivity(1.0);

      this.syncStateWithUI();
      this.game.assetManager.playClick();
    });
  }

  private syncStateWithUI() {
    // Sync Quality
    const quality = this.game.renderer.quality;
    this.element.querySelectorAll('#quality-buttons .quality-btn').forEach((b) => {
      if (b.getAttribute('data-quality') === quality) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    // Sync Shadows
    const shadowsToggle = this.element.querySelector<HTMLInputElement>('#toggle-shadows');
    if (shadowsToggle) {
      shadowsToggle.checked = this.game.lighting.getShadowsEnabled();
    }

    // Sync Sound
    const soundToggle = this.element.querySelector<HTMLInputElement>('#toggle-sound');
    if (soundToggle) {
      soundToggle.checked = this.game.assetManager.getSoundEnabled();
    }

    // Sync Sensitivity
    const sens = this.game.camera.getSensitivity();
    const sensSlider = this.element.querySelector<HTMLInputElement>('#slider-sensitivity');
    const sensValSpan = this.element.querySelector('#sens-value');
    if (sensSlider) sensSlider.value = sens.toString();
    if (sensValSpan) sensValSpan.textContent = `${sens.toFixed(1)}x`;
  }
}
