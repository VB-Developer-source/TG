/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Game } from './core/Game';

/**
 * Main game bootstrap entry function
 */
export function initSimulator(containerId = 'root') {
  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`Mount container #${containerId} not found`);
  }
  return new Game(container);
}

export { Game };
