/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export class LoadingScreen {
  public element: HTMLElement;
  private progressBar: HTMLElement | null = null;
  private progressPercent: HTMLElement | null = null;
  private statusText: HTMLElement | null = null;

  constructor() {
    this.element = document.createElement('div');
    this.element.className = 'loading-screen-container';
    this.render();
  }

  private render() {
    this.element.innerHTML = `
      <div class="loading-content">
        <div class="loading-badge">
          <span>●</span> Indian Railways Suburban Division
        </div>
        
        <h1 class="loading-title">
          Mumbai Local
          <span>Train Simulator 3D</span>
        </h1>
        
        <p class="loading-subtitle">Experience the lifeline of Mumbai.</p>

        <div class="rail-anim-wrapper">
          <div class="train-pulse-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="4" y="3" width="16" height="16" rx="2"/>
              <path d="M4 11h16"/>
              <path d="M12 3v8"/>
              <path d="m8 19-2 3"/>
              <path d="m16 19 2 3"/>
              <circle cx="8" cy="15" r="1" fill="#f97316"/>
              <circle cx="16" cy="15" r="1" fill="#f97316"/>
            </svg>
          </div>
          <div class="rail-track-line"></div>
          <div class="rail-ties-line"></div>
        </div>

        <div class="loading-progress-box">
          <div class="loading-bar-track">
            <div class="loading-bar-fill" id="loading-bar" style="width: 0%;"></div>
          </div>
          
          <div class="loading-details">
            <span class="loading-status-text" id="loading-status">
              Initializing Engine...
            </span>
            <span class="loading-percentage" id="loading-pct">0%</span>
          </div>
        </div>
      </div>
    `;

    this.progressBar = this.element.querySelector('#loading-bar');
    this.progressPercent = this.element.querySelector('#loading-pct');
    this.statusText = this.element.querySelector('#loading-status');
  }

  public update(percent: number, message: string) {
    const clamped = Math.min(100, Math.max(0, Math.round(percent)));
    if (this.progressBar) {
      this.progressBar.style.width = `${clamped}%`;
    }
    if (this.progressPercent) {
      this.progressPercent.textContent = `${clamped}%`;
    }
    if (this.statusText) {
      this.statusText.textContent = message;
    }
  }

  public hide(onComplete?: () => void) {
    this.element.classList.add('fade-out');
    setTimeout(() => {
      if (this.element.parentElement) {
        this.element.parentElement.removeChild(this.element);
      }
      if (onComplete) onComplete();
    }, 600);
  }
}
