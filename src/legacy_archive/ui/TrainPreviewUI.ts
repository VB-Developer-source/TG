/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TrainLiveryType } from '../train/TrainConfig';
import { AudioManager } from '../audio/AudioManager';

export type TrainCameraView = 'front' | 'side' | 'rear' | 'bogie' | 'interior' | 'cab' | 'orbit';

export interface TrainPreviewCallbacks {
  onBackToMenu: () => void;
  onSelectLivery: (livery: TrainLiveryType) => void;
  onSelectCoachCount: (count: number) => void;
  onSetCameraView: (view: TrainCameraView) => void;
  onToggleHeadlights: () => boolean;
  onToggleInteriorLights: () => boolean;
  onToggleDoors: () => boolean;
  onOpenAudioSettings: () => void;
}

export class TrainPreviewUI {
  public element: HTMLElement;
  private callbacks: TrainPreviewCallbacks;
  private audioManager: AudioManager;

  private isHeadlightsOn: boolean = true;
  private isInteriorOn: boolean = true;
  private areDoorsOpen: boolean = false;
  private isMotorPlaying: boolean = false;

  constructor(callbacks: TrainPreviewCallbacks) {
    this.callbacks = callbacks;
    this.audioManager = AudioManager.getInstance();
    this.element = document.createElement('div');
    this.element.className = 'menu-overlay';
    this.render();
  }

  private render() {
    this.element.innerHTML = `
      <!-- Top Navigation & Title Bar -->
      <div style="position: absolute; top: 1.5rem; left: 1.5rem; right: 1.5rem; display: flex; justify-content: space-between; align-items: flex-start; z-index: 100; pointer-events: none;">
        <div style="display: flex; gap: 1rem; align-items: center; pointer-events: auto;">
          <button class="btn-rail" id="btn-back-menu" style="padding: 0.6rem 1.25rem; font-size: 0.95rem;">
            ← Main Menu
          </button>
          <div style="background: rgba(15, 23, 42, 0.9); border: 1px solid var(--color-border); padding: 0.5rem 1rem; border-radius: 6px;">
            <div style="font-family: var(--font-display); font-size: 1.25rem; font-weight: 700; color: #f8fafc; letter-spacing: 0.05em;">
              MUMBAI SUBURBAN EMU SHOWROOM
            </div>
            <div style="font-family: var(--font-mono); font-size: 0.72rem; color: #fb923c;">
              1676mm Broad Gauge • 25kV AC Traction • Section 02 Mechanical Suite
            </div>
          </div>
        </div>

        <div style="display: flex; gap: 0.75rem; align-items: center; pointer-events: auto;">
          <button class="hud-pill" id="btn-audio-settings" title="Audio Mixer & Settings">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            </svg>
            <span>Audio Mixer</span>
          </button>
        </div>
      </div>

      <!-- Left Control Drawer: Livery, Length & Train Systems -->
      <div style="position: absolute; top: 6.5rem; left: 1.5rem; width: 340px; background: linear-gradient(135deg, rgba(7, 11, 20, 0.94) 0%, rgba(15, 23, 42, 0.92) 100%); border: 1px solid var(--color-border); border-radius: 8px; padding: 1.25rem; display: flex; flex-direction: column; gap: 1.25rem; z-index: 90; box-shadow: 0 10px 30px rgba(0,0,0,0.7); max-height: calc(100vh - 8rem); overflow-y: auto;">
        
        <!-- Livery Selection -->
        <div>
          <div style="font-family: var(--font-mono); font-size: 0.75rem; color: #fb923c; margin-bottom: 0.5rem; text-transform: uppercase;">
            Suburban Livery Theme
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem;" id="livery-buttons">
            <button class="quality-btn active" data-livery="western">Western (WR)</button>
            <button class="quality-btn" data-livery="central">Central (CR)</button>
            <button class="quality-btn" data-livery="harbour">Harbour (HB)</button>
            <button class="quality-btn" data-livery="ac_local">Medha AC</button>
          </div>
        </div>

        <!-- Train Length -->
        <div>
          <div style="font-family: var(--font-mono); font-size: 0.75rem; color: #fb923c; margin-bottom: 0.5rem; text-transform: uppercase;">
            Train Rake Configuration
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem;" id="coach-count-buttons">
            <button class="quality-btn active" data-coaches="3">3-Car Showroom</button>
            <button class="quality-btn" data-coaches="12">12-Car Full Rake</button>
          </div>
        </div>

        <!-- Interactive Train Mechanical Systems -->
        <div>
          <div style="font-family: var(--font-mono); font-size: 0.75rem; color: #fb923c; margin-bottom: 0.5rem; text-transform: uppercase;">
            Interactive Train Systems
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            <button class="btn-rail" id="btn-toggle-headlights" style="padding: 0.5rem 1rem; font-size: 0.85rem; justify-content: space-between;">
              <span>💡 Headlights</span>
              <span id="lbl-headlights" style="color: #10b981;">ON</span>
            </button>

            <button class="btn-rail" id="btn-toggle-interior" style="padding: 0.5rem 1rem; font-size: 0.85rem; justify-content: space-between;">
              <span>🔆 Interior Lights</span>
              <span id="lbl-interior" style="color: #10b981;">ON</span>
            </button>

            <button class="btn-rail" id="btn-toggle-doors" style="padding: 0.5rem 1rem; font-size: 0.85rem; justify-content: space-between;">
              <span>🚪 Passenger Doors</span>
              <span id="lbl-doors" style="color: #94a3b8;">CLOSED</span>
            </button>
          </div>
        </div>

        <!-- Sound Preview Rack -->
        <div>
          <div style="font-family: var(--font-mono); font-size: 0.75rem; color: #fb923c; margin-bottom: 0.5rem; text-transform: uppercase;">
            Live Sound System Test
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem;">
            <button class="quality-btn" id="snd-horn">🎺 EMU Horn</button>
            <button class="quality-btn" id="snd-motor">⚡ Motor Hum</button>
            <button class="quality-btn" id="snd-brake-rel">💨 Air Release</button>
            <button class="quality-btn" id="snd-brake-app">🛑 Brake Squeal</button>
            <button class="quality-btn" id="snd-clatter">🛤️ Track Clatter</button>
            <button class="quality-btn" id="snd-chime">🔔 Station Chime</button>
          </div>
        </div>

      </div>

      <!-- Bottom Center: Camera View Presets -->
      <div style="position: absolute; bottom: 1.5rem; left: 50%; transform: translateX(-50%); display: flex; gap: 0.35rem; background: rgba(15, 23, 42, 0.92); border: 1px solid var(--color-border); padding: 0.4rem 0.6rem; border-radius: 8px; z-index: 100; pointer-events: auto; max-width: 95vw; overflow-x: auto;">
        <button class="quality-btn active" data-cam="front">Front Cab</button>
        <button class="quality-btn" data-cam="side">Side Profile</button>
        <button class="quality-btn" data-cam="rear">Rear Cab</button>
        <button class="quality-btn" data-cam="bogie">Bogie & Wheels</button>
        <button class="quality-btn" data-cam="interior">Passenger Saloon</button>
        <button class="quality-btn" data-cam="cab">Driver Desk</button>
        <button class="quality-btn" data-cam="orbit">360° Free Orbit</button>
      </div>
    `;

    this.setupListeners();
  }

  private setupListeners() {
    // Back to Menu
    this.element.querySelector('#btn-back-menu')?.addEventListener('click', () => {
      this.audioManager.ui.playClick();
      this.callbacks.onBackToMenu();
    });

    // Audio Mixer
    this.element.querySelector('#btn-audio-settings')?.addEventListener('click', () => {
      this.callbacks.onOpenAudioSettings();
    });

    // Livery buttons
    const liveryBtns = this.element.querySelectorAll<HTMLButtonElement>('#livery-buttons button');
    liveryBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const liv = btn.getAttribute('data-livery') as TrainLiveryType;
        if (liv) {
          liveryBtns.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          this.audioManager.ui.playClick();
          this.callbacks.onSelectLivery(liv);
        }
      });
    });

    // Coach Count buttons
    const coachBtns = this.element.querySelectorAll<HTMLButtonElement>('#coach-count-buttons button');
    coachBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const count = parseInt(btn.getAttribute('data-coaches') || '3', 10);
        coachBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.audioManager.ui.playClick();
        this.callbacks.onSelectCoachCount(count);
      });
    });

    // Toggle Headlights
    this.element.querySelector('#btn-toggle-headlights')?.addEventListener('click', () => {
      this.isHeadlightsOn = this.callbacks.onToggleHeadlights();
      const lbl = this.element.querySelector('#lbl-headlights');
      if (lbl) {
        lbl.textContent = this.isHeadlightsOn ? 'ON' : 'OFF';
        (lbl as HTMLElement).style.color = this.isHeadlightsOn ? '#10b981' : '#94a3b8';
      }
      this.audioManager.ui.playClick();
    });

    // Toggle Interior Lights
    this.element.querySelector('#btn-toggle-interior')?.addEventListener('click', () => {
      this.isInteriorOn = this.callbacks.onToggleInteriorLights();
      const lbl = this.element.querySelector('#lbl-interior');
      if (lbl) {
        lbl.textContent = this.isInteriorOn ? 'ON' : 'OFF';
        (lbl as HTMLElement).style.color = this.isInteriorOn ? '#10b981' : '#94a3b8';
      }
      this.audioManager.ui.playClick();
    });

    // Toggle Doors
    this.element.querySelector('#btn-toggle-doors')?.addEventListener('click', () => {
      this.areDoorsOpen = this.callbacks.onToggleDoors();
      const lbl = this.element.querySelector('#lbl-doors');
      if (lbl) {
        lbl.textContent = this.areDoorsOpen ? 'OPEN' : 'CLOSED';
        (lbl as HTMLElement).style.color = this.areDoorsOpen ? '#f97316' : '#94a3b8';
      }
      // Trigger authentic door sounds: buzzer first if opening, then actuator slide
      if (this.areDoorsOpen) {
        this.audioManager.train.playDoorBuzzer();
        setTimeout(() => this.audioManager.train.playDoorMovement(true), 400);
      } else {
        this.audioManager.train.playDoorMovement(false);
      }
    });

    // Sound Triggers
    this.element.querySelector('#snd-horn')?.addEventListener('click', () => {
      this.audioManager.train.playHorn();
    });

    this.element.querySelector('#snd-motor')?.addEventListener('click', (e) => {
      const btn = e.target as HTMLElement;
      if (!this.isMotorPlaying) {
        this.audioManager.train.startMotorSound(0.5);
        btn.textContent = '⏹ Stop Motor';
        btn.classList.add('active');
        this.isMotorPlaying = true;
      } else {
        this.audioManager.train.stopMotorSound();
        btn.textContent = '⚡ Motor Hum';
        btn.classList.remove('active');
        this.isMotorPlaying = false;
      }
    });

    this.element.querySelector('#snd-brake-rel')?.addEventListener('click', () => {
      this.audioManager.train.playBrakeRelease();
    });

    this.element.querySelector('#snd-brake-app')?.addEventListener('click', () => {
      this.audioManager.train.playBrakeApply();
    });

    let isClatterPlaying = false;
    this.element.querySelector('#snd-clatter')?.addEventListener('click', (e) => {
      const btn = e.target as HTMLElement;
      if (!isClatterPlaying) {
        this.audioManager.train.startTrackClatter(0.6);
        btn.textContent = '⏹ Stop Clatter';
        btn.classList.add('active');
        isClatterPlaying = true;
      } else {
        this.audioManager.train.stopTrackClatter();
        btn.textContent = '🛤️ Track Clatter';
        btn.classList.remove('active');
        isClatterPlaying = false;
      }
    });

    this.element.querySelector('#snd-chime')?.addEventListener('click', () => {
      this.audioManager.env.playStationAnnouncement();
    });

    // Camera preset switcher
    const camBtns = this.element.querySelectorAll<HTMLButtonElement>('[data-cam]');
    camBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const view = btn.getAttribute('data-cam') as TrainCameraView;
        if (view) {
          camBtns.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          this.audioManager.ui.playClick();
          this.callbacks.onSetCameraView(view);
        }
      });
    });
  }

  public show() {
    this.element.style.display = 'flex';
  }

  public hide() {
    this.element.style.display = 'none';
  }
}
