/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Game } from '../core/Game';
import { CameraMode } from '../core/Camera';
import { TimeOfDay } from '../core/Lighting';
import { AudioSettings } from './AudioSettings';

export class MainMenu {
  public element: HTMLElement;
  private game: Game;
  public isMenuVisible: boolean = true;

  // Modals
  private routeModal: HTMLElement | null = null;
  private trainModal: HTMLElement | null = null;
  private aboutModal: HTMLElement | null = null;
  private audioSettingsModal: AudioSettings | null = null;

  // State
  private selectedRoute: string = 'Western Line (Churchgate – Dahanu Road)';
  private selectedTrain: string = '12-Car Bombardier EMU Rake';

  // Live telemetry & FPS tracking
  private frameCount: number = 0;
  private lastFpsUpdateTime: number = performance.now();
  private currentFps: number = 60;

  // HUD elements
  private freeCamHud: HTMLElement | null = null;
  private telemetryEl: HTMLElement | null = null;
  private fpsMenuEl: HTMLElement | null = null;
  private fpsHudEl: HTMLElement | null = null;

  constructor(game: Game) {
    this.game = game;
    this.element = document.createElement('div');
    this.element.style.position = 'absolute';
    this.element.style.inset = '0';
    this.element.style.pointerEvents = 'none';
    this.render();
  }

  private render() {
    this.element.innerHTML = `
      <!-- Main Menu Viewport Overlay (Matches Screenshot 1) -->
      <div class="menu-overlay" id="main-menu-container">
        <!-- Top Left Station Pill Badge -->
        <div class="station-pill-badge" id="station-badge">
          <span class="indicator-dot"></span>
          <span>DADAR · ISLAND PLATFORM 2 / 3</span>
        </div>

        <!-- Left Brand & Minimalist Numbered Navigation -->
        <div class="menu-floating-left">
          <div class="brand-section">
            <h1 class="brand-title-condensed">
              <span class="brand-title-white">MUMBAI LOCAL</span>
              <span class="brand-title-orange">TRAIN SIMULATOR</span>
            </h1>
            <p class="brand-subheading">Experience the lifeline of Mumbai.</p>
          </div>

          <nav class="menu-numbered-nav" role="navigation" aria-label="Main Menu">
            <button class="menu-nav-row" id="btn-play">
              <div class="menu-nav-marker"></div>
              <span class="menu-nav-index">01</span>
              <span class="menu-nav-label">PLAY</span>
            </button>

            <button class="menu-nav-row" id="btn-route-select">
              <div class="menu-nav-marker"></div>
              <span class="menu-nav-index">02</span>
              <span class="menu-nav-label">ROUTE SELECT</span>
            </button>

            <button class="menu-nav-row" id="btn-train-select">
              <div class="menu-nav-marker"></div>
              <span class="menu-nav-index">03</span>
              <span class="menu-nav-label">TRAIN SELECT</span>
            </button>

            <button class="menu-nav-row" id="btn-settings">
              <div class="menu-nav-marker"></div>
              <span class="menu-nav-index">04</span>
              <span class="menu-nav-label">SETTINGS</span>
            </button>

            <button class="menu-nav-row" id="btn-about">
              <div class="menu-nav-marker"></div>
              <span class="menu-nav-index">05</span>
              <span class="menu-nav-label">ABOUT</span>
            </button>
          </nav>
        </div>

        <!-- Bottom Bar Status Badges (Matches Screenshot 1) -->
        <div class="menu-bottom-bar">
          <div class="bottom-badges-left">
            <div class="bottom-pill">
              <span class="orange-dot"></span>
              <span>SECTION 01 · FOUNDATION</span>
            </div>
            <div class="bottom-pill">
              <span id="label-active-route">CHURCHGATE — VIRAR</span>
            </div>
          </div>
          <div class="bottom-badges-right">
            <div class="bottom-pill" id="fps-badge-menu">
              <span>60 FPS</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Free Camera Inspection HUD (Matches Screenshot 2) -->
      <div class="freecam-hud" id="freecam-hud">
        <div class="freecam-top-bar">
          <div class="freecam-badges-group">
            <div class="station-pill-badge">
              <span class="indicator-dot"></span>
              <span>FREE CAMERA · DADAR</span>
            </div>
            <div class="freecam-notice-pill">
              <span>TRAIN DRIVING ARRIVES IN A LATER BUILD</span>
            </div>
          </div>

          <button class="btn-menu-esc" id="btn-freecam-menu">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span>MENU</span>
            <span class="key-badge">ESC</span>
          </button>
        </div>

        <div class="freecam-bottom-bar">
          <!-- WASD Keys Guide -->
          <div class="freecam-controls-guide">
            <span class="key-badge">W</span>
            <span class="key-badge">A</span>
            <span class="key-badge">S</span>
            <span class="key-badge">D</span>
            <span>move</span>
            <span style="margin: 0 0.2rem; opacity: 0.4;">•</span>
            <span class="key-badge">Q</span>
            <span class="key-badge">E</span>
            <span>height</span>
            <span style="margin: 0 0.2rem; opacity: 0.4;">•</span>
            <span class="key-badge">Shift</span>
            <span>fast</span>
            <span style="margin: 0 0.2rem; opacity: 0.4;">•</span>
            <span class="key-badge">Drag</span>
            <span>look</span>
            <span style="margin: 0 0.2rem; opacity: 0.4;">•</span>
            <span class="key-badge">Wheel</span>
            <span>dolly</span>
          </div>

          <!-- Camera Telemetry Readout -->
          <div class="freecam-telemetry-col">
            <div class="telemetry-pill" id="freecam-telemetry">
              X 0.0 · Y 0.8 · Z 14.0
            </div>
            <div class="telemetry-pill" id="freecam-fps" style="font-size: 0.74rem; color: #94a3b8;">
              60 FPS · 1.0x RES
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Windows Container -->
      <div id="modal-container"></div>
    `;

    this.freeCamHud = this.element.querySelector('#freecam-hud');
    this.telemetryEl = this.element.querySelector('#freecam-telemetry');
    this.fpsMenuEl = this.element.querySelector('#fps-badge-menu');
    this.fpsHudEl = this.element.querySelector('#freecam-fps');

    this.setupListeners();
    this.createRouteModal();
    this.createTrainModal();
    this.createAboutModal();
  }

  private setupListeners() {
    const playBtn = this.element.querySelector('#btn-play');
    const menuContainer = this.element.querySelector('#main-menu-container') as HTMLElement;
    const escBtn = this.element.querySelector('#btn-freecam-menu');

    // Button Hover Sounds
    const allButtons = this.element.querySelectorAll<HTMLButtonElement>('.menu-nav-row, .btn-rail, .btn-menu-esc');
    allButtons.forEach((btn) => {
      btn.addEventListener('mouseenter', () => {
        this.game.audio.ui.playHover();
      });
    });

    // 01 PLAY Button -> Enter Free Camera Mode
    playBtn?.addEventListener('click', () => {
      this.game.audio.ui.playConfirm();
      this.enterFreeCameraMode();
    });

    // Top-Right MENU / ESC button -> Return to Main Menu
    escBtn?.addEventListener('click', () => {
      this.game.audio.ui.playClick();
      this.exitFreeCameraMode();
    });

    // ESC Key listener
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!this.isMenuVisible) {
          this.game.audio.ui.playClick();
          this.exitFreeCameraMode();
        } else {
          // Close open modals
          if (this.routeModal) this.routeModal.style.display = 'none';
          if (this.trainModal) this.trainModal.style.display = 'none';
          if (this.aboutModal) this.aboutModal.style.display = 'none';
        }
      }
    });

    // 02 ROUTE SELECT
    this.element.querySelector('#btn-route-select')?.addEventListener('click', () => {
      this.game.audio.ui.playClick();
      if (this.routeModal) this.routeModal.style.display = 'flex';
    });

    // 03 TRAIN SELECT
    this.element.querySelector('#btn-train-select')?.addEventListener('click', () => {
      this.game.audio.ui.playClick();
      if (this.trainModal) this.trainModal.style.display = 'flex';
    });

    // 04 SETTINGS
    this.element.querySelector('#btn-settings')?.addEventListener('click', () => {
      this.game.audio.ui.playClick();
      this.game.ui.openSettings();
    });

    // 05 ABOUT
    this.element.querySelector('#btn-about')?.addEventListener('click', () => {
      this.game.audio.ui.playClick();
      if (this.aboutModal) this.aboutModal.style.display = 'flex';
    });
  }

  public enterFreeCameraMode() {
    this.isMenuVisible = false;
    const menuContainer = this.element.querySelector('#main-menu-container') as HTMLElement;
    if (menuContainer) menuContainer.style.display = 'none';
    if (this.freeCamHud) this.freeCamHud.classList.add('active');

    // Switch camera to free mode
    this.game.camera.setMode('free');
  }

  public exitFreeCameraMode() {
    this.isMenuVisible = true;
    const menuContainer = this.element.querySelector('#main-menu-container') as HTMLElement;
    if (menuContainer) menuContainer.style.display = 'flex';
    if (this.freeCamHud) this.freeCamHud.classList.remove('active');

    // Reset camera to cinematic track-level mode
    this.game.camera.setMode('cinematic');
  }

  public update(delta: number) {
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsUpdateTime >= 400) {
      this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdateTime));
      this.frameCount = 0;
      this.lastFpsUpdateTime = now;

      if (this.fpsMenuEl) {
        this.fpsMenuEl.innerHTML = `<span>${this.currentFps} FPS</span>`;
      }
      if (this.fpsHudEl) {
        this.fpsHudEl.innerHTML = `<span>${this.currentFps} FPS · 1.0x RES</span>`;
      }
    }

    if (!this.isMenuVisible && this.telemetryEl) {
      const tel = this.game.camera.getTelemetry();
      this.telemetryEl.textContent = `X ${tel.x} · Y ${tel.y} · Z ${tel.z}`;
    }
  }

  public show() {
    this.element.style.display = 'flex';
    this.exitFreeCameraMode();
  }

  public hide() {
    this.element.style.display = 'none';
  }

  // --- Modals Implementation ---

  private createRouteModal() {
    this.routeModal = document.createElement('div');
    this.routeModal.className = 'modal-backdrop';
    this.routeModal.style.display = 'none';

    this.routeModal.innerHTML = `
      <div class="modal-window">
        <div class="modal-header">
          <div class="modal-title">
            <span>●</span>
            <span>MUMBAI SUBURBAN <span class="highlight" style="color: #f97316;">ROUTE SELECT</span></span>
          </div>
          <button class="modal-close-btn" id="close-route-modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <p style="font-size: 0.9rem; color: #94a3b8; margin: 0;">
            Select an operational Mumbai suburban corridor. High-speed quad-track Broad Gauge mainline with 25kV AC overhead catenary.
          </p>

          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            <!-- Western Line -->
            <div class="route-card selected" data-route="western" style="background: rgba(30, 41, 59, 0.6); border: 1px solid #f97316; padding: 1rem; border-radius: 6px; cursor: pointer;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 700; color: #f8fafc; font-size: 1.1rem;">Western Line (Churchgate – Virar – Dahanu)</span>
                <span style="background: #f97316; color: #000; font-size: 0.72rem; font-weight: 800; padding: 0.2rem 0.5rem; border-radius: 4px;">ACTIVE</span>
              </div>
              <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 0.35rem;">
                Dadar Junction • Bandra • Andheri • Borivali • 60km Quad Track • 1676mm Broad Gauge
              </div>
            </div>

            <!-- Central Line -->
            <div class="route-card" data-route="central" style="background: rgba(30, 41, 59, 0.4); border: 1px solid rgba(148, 163, 184, 0.2); padding: 1rem; border-radius: 6px; cursor: pointer;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 700; color: #f8fafc; font-size: 1.1rem;">Central Main Line (CSMT – Dadar – Kalyan)</span>
                <span style="background: rgba(148, 163, 184, 0.2); color: #cbd5e1; font-size: 0.72rem; padding: 0.2rem 0.5rem; border-radius: 4px;">FAST / SLOW</span>
              </div>
              <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 0.35rem;">
                CSMT • Byculla • Dadar • Kurla • Ghatkopar • Thane • 54km 6-Track Corridor
              </div>
            </div>

            <!-- Harbour Line -->
            <div class="route-card" data-route="harbour" style="background: rgba(30, 41, 59, 0.4); border: 1px solid rgba(148, 163, 184, 0.2); padding: 1rem; border-radius: 6px; cursor: pointer;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 700; color: #f8fafc; font-size: 1.1rem;">Harbour Line (CSMT – Wadala – Panvel)</span>
                <span style="background: rgba(148, 163, 184, 0.2); color: #cbd5e1; font-size: 0.72rem; padding: 0.2rem 0.5rem; border-radius: 4px;">TWIN TRACK</span>
              </div>
              <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 0.35rem;">
                CSMT • Wadala Road • Chembur • Vashi • Nerul • Panvel • 49km
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-rail" id="btn-confirm-route">Confirm Route</button>
        </div>
      </div>
    `;

    this.routeModal.querySelector('#close-route-modal')?.addEventListener('click', () => {
      this.routeModal!.style.display = 'none';
    });

    this.routeModal.querySelector('#btn-confirm-route')?.addEventListener('click', () => {
      this.game.audio.ui.playConfirm();
      this.routeModal!.style.display = 'none';
    });

    this.element.querySelector('#modal-container')?.appendChild(this.routeModal);
  }

  private createTrainModal() {
    this.trainModal = document.createElement('div');
    this.trainModal.className = 'modal-backdrop';
    this.trainModal.style.display = 'none';

    this.trainModal.innerHTML = `
      <div class="modal-window">
        <div class="modal-header">
          <div class="modal-title">
            <span>●</span>
            <span>MUMBAI EMU <span class="highlight" style="color: #f97316;">TRAIN SELECT</span></span>
          </div>
          <button class="modal-close-btn" id="close-train-modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <p style="font-size: 0.9rem; color: #94a3b8; margin: 0;">
            Configure Indian Railways suburban Electric Multiple Unit (EMU) rake variants. Inspect interior, pantograph, and bogies.
          </p>

          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            <!-- Western Railway Rake -->
            <div style="background: rgba(30, 41, 59, 0.6); border: 1px solid #f97316; padding: 1rem; border-radius: 6px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="font-weight: 700; color: #f8fafc; font-size: 1.1rem;">Western Railway (WR) 12-Car EMU</span>
                <span style="color: #fb923c; font-weight: 700; font-size: 0.85rem;">YELLOW & VIOLET</span>
              </div>
              <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 0.35rem;">
                Authentic yellow nose, black headlight cluster mask, red horns, dual circular buffer plates, WR logo plates, and blue cushioned bench seats.
              </div>
            </div>

            <!-- Central Railway Rake -->
            <div style="background: rgba(30, 41, 59, 0.4); border: 1px solid rgba(148, 163, 184, 0.2); padding: 1rem; border-radius: 6px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="font-weight: 700; color: #f8fafc; font-size: 1.1rem;">Central Railway (CR) 12-Car EMU</span>
                <span style="color: #cbd5e1; font-weight: 600; font-size: 0.85rem;">CR RED & CREAM</span>
              </div>
              <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 0.35rem;">
                Central Railway crimson-red livery with white roof and standard suburban rake configuration.
              </div>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(15, 23, 42, 0.7); padding: 0.75rem 1rem; border-radius: 6px; border: 1px solid rgba(249, 115, 22, 0.2);">
            <div>
              <div style="font-weight: 700; color: #f8fafc;">3D Train Inspection Showroom</div>
              <div style="font-size: 0.78rem; color: #94a3b8;">Rotate, zoom, test doors, toggle headlights, and test pneumatic horn in full 3D.</div>
            </div>
            <button class="btn-rail primary" id="btn-enter-3d-showroom">Open Showroom</button>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-rail" id="btn-confirm-train">Close</button>
        </div>
      </div>
    `;

    this.trainModal.querySelector('#close-train-modal')?.addEventListener('click', () => {
      this.trainModal!.style.display = 'none';
    });

    this.trainModal.querySelector('#btn-confirm-train')?.addEventListener('click', () => {
      this.trainModal!.style.display = 'none';
    });

    this.trainModal.querySelector('#btn-enter-3d-showroom')?.addEventListener('click', () => {
      this.game.audio.ui.playConfirm();
      this.trainModal!.style.display = 'none';
      this.hide();
      this.game.switchScene('train_preview');
    });

    this.element.querySelector('#modal-container')?.appendChild(this.trainModal);
  }

  private createAboutModal() {
    this.aboutModal = document.createElement('div');
    this.aboutModal.className = 'modal-backdrop';
    this.aboutModal.style.display = 'none';

    this.aboutModal.innerHTML = `
      <div class="modal-window">
        <div class="modal-header">
          <div class="modal-title">
            <span>●</span>
            <span>ABOUT <span class="highlight" style="color: #f97316;">MUMBAI LOCAL SIMULATOR</span></span>
          </div>
          <button class="modal-close-btn" id="close-about-modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="modal-body" style="font-size: 0.88rem; line-height: 1.6; color: #cbd5e1;">
          <p>
            <strong>Mumbai Local Train Simulator 3D</strong> is a high-performance browser simulation honoring the iconic suburban railway network of Mumbai—the bustling lifeline carrying over 7.5 million daily commuters.
          </p>
          <div style="background: rgba(30, 41, 59, 0.4); padding: 0.75rem 1rem; border-radius: 6px; border-left: 3px solid #f97316;">
            <strong>Technical Specifications:</strong><br/>
            • <strong>Track Gauge:</strong> 1676 mm Indian Broad Gauge (5 ft 6 in)<br/>
            • <strong>Traction:</strong> 25kV 50Hz AC Overhead Equipment (OHE)<br/>
            • <strong>3D Engine:</strong> Three.js WebGL with PBR Materials & Dynamic Shadows<br/>
            • <strong>Audio Engine:</strong> Procedural Web Audio API with Dual-Tone Pneumatic Horn, Traction Inverter Frequency Modulation, and Track Joint Clatter
          </div>
          <p style="margin: 0; color: #94a3b8; font-size: 0.8rem;">
            Section 01: Engine Foundation & 3D Environment Complete.<br/>
            Section 02: Detailed Mumbai EMU Train Model & Audio Engine Complete.<br/>
            Section 03: Driving Physics, Signals & Commuter Simulation Arriving in Next Build.
          </p>
        </div>

        <div class="modal-footer">
          <button class="btn-rail primary" id="btn-close-about">Close</button>
        </div>
      </div>
    `;

    this.aboutModal.querySelector('#close-about-modal')?.addEventListener('click', () => {
      this.aboutModal!.style.display = 'none';
    });
    this.aboutModal.querySelector('#btn-close-about')?.addEventListener('click', () => {
      this.aboutModal!.style.display = 'none';
    });

    this.element.querySelector('#modal-container')?.appendChild(this.aboutModal);
  }
}
