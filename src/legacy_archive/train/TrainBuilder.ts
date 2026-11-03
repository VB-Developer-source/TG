/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { Train, TrainOptions } from './Train';
import { TrainLiveryType } from './TrainConfig';

export class TrainBuilder {
  /**
   * Builds an authentic 12-Car Mumbai suburban commuter train rake
   */
  public static build12CarRake(livery: TrainLiveryType = 'western', position?: THREE.Vector3): Train {
    return new Train({
      coachCount: 12,
      livery,
      position,
    });
  }

  /**
   * Builds a 3-Car inspection rake for close-up 360 showroom previews
   */
  public static buildPreviewRake(livery: TrainLiveryType = 'western', position?: THREE.Vector3): Train {
    return new Train({
      coachCount: 3,
      livery,
      position,
    });
  }

  /**
   * Custom rake builder
   */
  public static build(options: TrainOptions): Train {
    return new Train(options);
  }
}
