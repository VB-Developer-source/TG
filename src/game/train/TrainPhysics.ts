/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Physical specifications and parameters for an Indian Railways 12-car Broad Gauge EMU rake.
 * Masses and ratings conform to standard RDSO / ICF / MRVC suburban EMU design parameters.
 */
export interface TrainPhysicsConfig {
  /** Number of coaches in consist (standard: 12 cars = 4 units of DTC-MC-TC) */
  cars: number;
  /** Tare mass of train in kilograms (approx 480 tonnes for 12 cars) */
  tareMassKg: number;
  /** Passenger payload in kilograms (0 to 120,000 kg depending on passenger load) */
  passengerMassKg: number;
  /** Number of motorized coaches (4 in a 12-car rake) */
  motorCoaches: number;
  /** Rated total continuous power in Watts (4 motor coaches * 4 motors * 250 kW = 4,000 kW) */
  totalPowerWatts: number;
  /** Maximum tractive effort at wheel rim in Newtons (~280 kN at start) */
  maxTractiveEffortN: number;
  /** Maximum service braking deceleration in m/s^2 (~1.0 m/s^2) */
  maxServiceBrakeDecel: number;
  /** Emergency braking deceleration in m/s^2 (~1.3 m/s^2) */
  emergencyBrakeDecel: number;
  /** Maximum permitted operational speed in m/s (105 km/h = 29.17 m/s) */
  maxSpeedMs: number;
  /** Nominal wheel radius in metres (914 mm diameter wheels -> 0.457 m) */
  wheelRadiusM: number;
  /**
   * Davis equation constant rolling resistance coefficient.
   * Unit: N / tonne (journal bearing and rolling contact resistance).
   * Prototypical Broad Gauge EMU: ~6.4 N/t.
   */
  davisA: number;
  /**
   * Davis equation linear mechanical and flange resistance coefficient.
   * Unit: N / (tonne * (m/s)).
   * Prototypical Broad Gauge EMU: ~0.14 N/(t * (m/s)).
   */
  davisB: number;
  /**
   * Davis equation quadratic aerodynamic drag coefficient for the complete consist.
   * Unit: N / (m/s)^2.
   * Prototypical 12-coach Indian Railways Broad Gauge EMU consist: ~38.0 to 42.0 N / (m/s)^2 (~3.33 N/(m/s)^2 per coach).
   * Produces ~30.9 kN of aerodynamic drag at 100 km/h (27.78 m/s).
   */
  davisC: number;
}

export const DEFAULT_EMU_CONFIG: TrainPhysicsConfig = {
  cars: 12,
  tareMassKg: 480_000,
  passengerMassKg: 65_000, // ~800 passengers average off-peak
  motorCoaches: 4,
  totalPowerWatts: 4_000_000, // 4.0 MW
  maxTractiveEffortN: 275_000, // 275 kN
  maxServiceBrakeDecel: 1.05, // 1.05 m/s^2
  emergencyBrakeDecel: 1.35, // 1.35 m/s^2
  maxSpeedMs: 105 / 3.6, // 29.17 m/s = 105 km/h
  wheelRadiusM: 0.457, // 914 mm dia wheel
  davisA: 6.4, // N / tonne
  davisB: 0.14, // N / (tonne * (m/s))
  davisC: 40.0, // N / (m/s)^2 for 12-car consist (~30.9 kN at 100 km/h)
};

export type ControllerMode = "OFF" | "TRACTION" | "COAST" | "SERVICE_BRAKE" | "EMERGENCY_BRAKE";
export type Reverser = 1 | 0 | -1; // 1 = Forward, 0 = Neutral, -1 = Reverse

export interface TrainPhysicsState {
  /** Speed along track in m/s (always >= 0) */
  speed: number;
  /** Speed in km/h for display */
  speedKmh: number;
  /** Distance travelled along track spline in metres */
  distance: number;
  /** Current net linear acceleration in m/s^2 (positive = accelerating, negative = braking) */
  acceleration: number;
  /** Current active controller mode */
  controllerMode: ControllerMode;
  /** Traction notch (0 = OFF, 1 = Shunting/25%, 2 = Series/50%, 3 = Parallel/75%, 4 = WeakField/100%) */
  tractionNotch: number;
  /** Brake notch (0 = Released, 1 = Min, 2 = Init, 3 = Full, 4 = Max Service) */
  brakeNotch: number;
  /** Direction reverser (1 = FWD, 0 = NEU, -1 = REV) */
  reverser: Reverser;
  /** Brake Pipe (BP) pressure in bar (5.0 = fully released, 3.5 = full service, 0.0 = emergency) */
  brakePipePressureBar: number;
  /** Main Reservoir (MR) pressure in bar (~8.5 bar) */
  mainReservoirBar: number;
  /** Brake Cylinder (BC) pressure in bar (0.0 = released, 3.8 = full brake) */
  brakeCylinderBar: number;
  /** Emergency brake active flag */
  emergencyBrakeActive: boolean;
  /** Pantograph raised state (must be true for 25kV traction) */
  pantographRaised: boolean;
  /** Passenger doors open state (interlock prevents traction when open) */
  doorsOpen: boolean;
  /** Wheel rotation angle in radians */
  wheelAngle: number;
  /** Tractive effort currently applied in kN */
  tractiveEffortKn: number;
  /** Motor load ratio (0.0 to 1.0) for audio synthesis */
  motorLoad: number;
}

export class TrainPhysics {
  private config: TrainPhysicsConfig;
  private state: TrainPhysicsState;
  private listeners: Set<(state: TrainPhysicsState) => void> = new Set();

  constructor(customConfig?: Partial<TrainPhysicsConfig>) {
    this.config = { ...DEFAULT_EMU_CONFIG, ...customConfig };
    this.state = {
      speed: 0,
      speedKmh: 0,
      distance: 0,
      acceleration: 0,
      controllerMode: "OFF",
      tractionNotch: 0,
      brakeNotch: 0,
      reverser: 1, // Forward by default
      brakePipePressureBar: 5.0,
      mainReservoirBar: 8.5,
      brakeCylinderBar: 0.0,
      emergencyBrakeActive: false,
      pantographRaised: true,
      doorsOpen: false,
      wheelAngle: 0,
      tractiveEffortKn: 0,
      motorLoad: 0,
    };
  }

  public subscribe(listener: (state: TrainPhysicsState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.state.speedKmh = this.state.speed * 3.6;
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  public getState(): Readonly<TrainPhysicsState> {
    return this.state;
  }

  public getConfig(): Readonly<TrainPhysicsConfig> {
    return this.config;
  }

  /** Total train mass in tonnes */
  public getTotalMassTonnes(): number {
    return (this.config.tareMassKg + this.config.passengerMassKg) / 1000;
  }

  // ================= CONTROLLER COMMANDS ================= //

  /** Step traction notch up (or reduce brake) */
  public increaseThrottle(): void {
    if (this.state.emergencyBrakeActive) return;

    if (this.state.brakeNotch > 0) {
      // Releasing brake first
      this.state.brakeNotch--;
      if (this.state.brakeNotch === 0) {
        this.state.controllerMode = "COAST";
      }
    } else {
      // Increasing traction
      if (this.state.doorsOpen) {
        // Safety interlock: cannot apply power while doors are open
        return;
      }
      if (this.state.reverser === 0) {
        // Cannot apply power in Neutral
        return;
      }
      this.state.tractionNotch = Math.min(4, this.state.tractionNotch + 1);
      this.state.controllerMode = this.state.tractionNotch > 0 ? "TRACTION" : "COAST";
    }
    this.notify();
  }

  /** Step traction notch down / apply service brake */
  public decreaseThrottle(): void {
    if (this.state.emergencyBrakeActive) return;

    if (this.state.tractionNotch > 0) {
      // Decreasing traction notch
      this.state.tractionNotch--;
      if (this.state.tractionNotch === 0) {
        this.state.controllerMode = "COAST";
      }
    } else {
      // Applying service brake notch
      this.state.brakeNotch = Math.min(4, this.state.brakeNotch + 1);
      this.state.controllerMode = "SERVICE_BRAKE";
    }
    this.notify();
  }

  /** Set exact traction notch (0 to 4) */
  public setTractionNotch(notch: number): void {
    if (this.state.emergencyBrakeActive) return;
    const n = Math.max(0, Math.min(4, Math.floor(notch)));
    if (n > 0) {
      if (this.state.doorsOpen || this.state.reverser === 0) return;
      this.state.brakeNotch = 0;
      this.state.tractionNotch = n;
      this.state.controllerMode = "TRACTION";
    } else {
      this.state.tractionNotch = 0;
      if (this.state.brakeNotch === 0) this.state.controllerMode = "COAST";
    }
    this.notify();
  }

  /** Set exact brake notch (0 to 4) */
  public setBrakeNotch(notch: number): void {
    if (this.state.emergencyBrakeActive) return;
    const b = Math.max(0, Math.min(4, Math.floor(notch)));
    if (b > 0) {
      this.state.tractionNotch = 0;
      this.state.brakeNotch = b;
      this.state.controllerMode = "SERVICE_BRAKE";
    } else {
      this.state.brakeNotch = 0;
      if (this.state.tractionNotch === 0) this.state.controllerMode = "COAST";
    }
    this.notify();
  }

  /** Set train into Coasting (0 power, 0 brake) */
  public setCoast(): void {
    if (this.state.emergencyBrakeActive) return;
    this.state.tractionNotch = 0;
    this.state.brakeNotch = 0;
    this.state.controllerMode = "COAST";
    this.notify();
  }

  /** Toggle or apply Emergency Brake */
  public toggleEmergencyBrake(force?: boolean): void {
    const next = force !== undefined ? force : !this.state.emergencyBrakeActive;
    this.state.emergencyBrakeActive = next;
    if (next) {
      this.state.tractionNotch = 0;
      this.state.brakeNotch = 4;
      this.state.controllerMode = "EMERGENCY_BRAKE";
    } else {
      this.state.controllerMode = "COAST";
      this.state.brakeNotch = 0;
    }
    this.notify();
  }

  /** Set direction reverser (1 = FWD, 0 = NEUTRAL, -1 = REV) */
  public setReverser(rev: Reverser): void {
    if (Math.abs(this.state.speed) > 0.1) {
      // Reverser interlock: can only be moved at standstill
      return;
    }
    this.state.reverser = rev;
    if (rev === 0) {
      this.state.tractionNotch = 0;
      if (this.state.controllerMode === "TRACTION") this.state.controllerMode = "COAST";
    }
    this.notify();
  }

  /** Set passenger doors state */
  public setDoors(open: boolean): void {
    this.state.doorsOpen = open;
    if (open && this.state.tractionNotch > 0) {
      // Safety interlock cuts traction power when doors open
      this.state.tractionNotch = 0;
      this.state.controllerMode = "COAST";
    }
    this.notify();
  }

  /** Toggle pantograph position (25 kV AC OHE contact) */
  public setPantograph(raised: boolean): void {
    this.state.pantographRaised = raised;
    if (!raised && this.state.tractionNotch > 0) {
      this.state.tractionNotch = 0;
      this.state.controllerMode = "COAST";
    }
    this.notify();
  }

  // ================= SIMULATION INTEGRATION STEP ================= //

  /**
   * Advances the train physics simulation by delta time (dt in seconds).
   * Calculates tractive effort, aerodynamic/mechanical resistance, pneumatic braking,
   * updates velocity, wheel rotation angle, and total distance travelled along track.
   */
  public update(dt: number, gradientPercent: number = 0, curveRadiusM?: number): void {
    // Clamp dt to avoid physics numerical instability on tab switch
    const clampedDt = Math.min(dt, 0.1);
    if (clampedDt <= 0) return;

    const totalMassKg = this.config.tareMassKg + this.config.passengerMassKg;
    const totalMassTonnes = totalMassKg / 1000;
    const g = 9.80665;

    // 1. Target Pneumatic Pressures
    let targetBp = 5.0; // standard 5.0 bar
    let targetBc = 0.0;

    if (this.state.emergencyBrakeActive) {
      targetBp = 0.0; // Dump to atmosphere
      targetBc = 3.8; // Full emergency brake cylinder pressure
    } else if (this.state.brakeNotch > 0) {
      // Graduated service brake reduction
      const bpReductions = [0, 0.4, 0.8, 1.2, 1.5]; // bar reduction for notches 1-4
      const bcPressures = [0, 0.8, 1.7, 2.8, 3.8];
      const notch = this.state.brakeNotch;
      targetBp = 5.0 - bpReductions[notch];
      targetBc = bcPressures[notch];
    }

    // Smooth pneumatic pressure propagation (choke-fed air pipe response)
    const bpRate = this.state.emergencyBrakeActive ? 6.0 : 2.5; // bar/s
    this.state.brakePipePressureBar +=
      Math.sign(targetBp - this.state.brakePipePressureBar) *
      Math.min(Math.abs(targetBp - this.state.brakePipePressureBar), bpRate * clampedDt);

    const bcRate = 3.0;
    this.state.brakeCylinderBar +=
      Math.sign(targetBc - this.state.brakeCylinderBar) *
      Math.min(Math.abs(targetBc - this.state.brakeCylinderBar), bcRate * clampedDt);

    // 2. Tractive Effort calculation
    let tractiveEffortN = 0;
    if (
      this.state.controllerMode === "TRACTION" &&
      this.state.tractionNotch > 0 &&
      this.state.pantographRaised &&
      !this.state.doorsOpen &&
      !this.state.emergencyBrakeActive &&
      this.state.reverser !== 0
    ) {
      const notchFraction = this.state.tractionNotch / 4.0; // 0.25, 0.50, 0.75, 1.00
      const currentSpeed = Math.max(0.1, this.state.speed);

      // Hyperbolic power curve: F = Power / Speed (capped by starting adhesion tractive effort)
      const maxPowerAtNotch = this.config.totalPowerWatts * notchFraction;
      const powerLimitedForce = maxPowerAtNotch / currentSpeed;
      const startingAdhesionForce = this.config.maxTractiveEffortN * notchFraction;

      tractiveEffortN = Math.min(startingAdhesionForce, powerLimitedForce);

      // Speed limit governor
      if (this.state.speed >= this.config.maxSpeedMs) {
        tractiveEffortN = 0;
      }
    }

    this.state.tractiveEffortKn = tractiveEffortN / 1000;
    this.state.motorLoad = tractiveEffortN / this.config.maxTractiveEffortN;

    // 3. Train Resistance calculation (Davis equation)
    // Formula: R_total (N) = R_roll + R_mech + R_aero
    //   R_roll (N) = davisA * totalMassTonnes         [N/tonne * tonne = N]
    //   R_mech (N) = davisB * v * totalMassTonnes     [N/(tonne*(m/s)) * (m/s) * tonne = N]
    //   R_aero (N) = davisC * v^2                     [N/(m/s)^2 * (m/s)^2 = N]
    const v = Math.abs(this.state.speed);
    const davisResistanceN =
      this.config.davisA * totalMassTonnes +
      this.config.davisB * v * totalMassTonnes +
      this.config.davisC * v * v;

    // Gradient resistance: F_g = M * g * (gradientPercent / 100)
    const gradientResistanceN = totalMassKg * g * (gradientPercent / 100);

    // Curve resistance: standard IR formula ~ 0.0004 * W / R
    let curveResistanceN = 0;
    if (curveRadiusM && curveRadiusM > 50) {
      curveResistanceN = (0.0004 * totalMassKg * g) / (curveRadiusM / 1000);
    }

    const totalPassiveResistanceN = davisResistanceN + curveResistanceN + gradientResistanceN;

    // 4. Braking Force calculation
    // Braking deceleration proportional to Brake Cylinder (BC) pressure
    const bcRatio = Math.max(0, Math.min(1, this.state.brakeCylinderBar / 3.8));
    const maxBrakeDecel = this.state.emergencyBrakeActive
      ? this.config.emergencyBrakeDecel
      : this.config.maxServiceBrakeDecel;
    const effectiveBrakeDecel = maxBrakeDecel * bcRatio;
    const brakeForceN = totalMassKg * effectiveBrakeDecel;

    // 5. Net Force and Acceleration
    let netForceN = 0;

    if (this.state.speed > 0.001) {
      // Train is moving forward
      netForceN = tractiveEffortN - totalPassiveResistanceN - brakeForceN;
    } else if (this.state.speed < -0.001) {
      // Train is moving backward
      netForceN = -tractiveEffortN + totalPassiveResistanceN + brakeForceN;
    } else {
      // Train is stationary (holding against resistance and brakes)
      if (tractiveEffortN > totalPassiveResistanceN + brakeForceN) {
        netForceN = (tractiveEffortN - totalPassiveResistanceN - brakeForceN) * this.state.reverser;
      } else {
        netForceN = 0;
      }
    }

    const acceleration = netForceN / totalMassKg;
    this.state.acceleration = acceleration;

    // 6. Integrate Speed and Distance
    const prevSpeed = this.state.speed;
    let newSpeed = prevSpeed + acceleration * clampedDt;

    // Stop if braking/resistance brings velocity to standstill
    if (prevSpeed > 0 && newSpeed < 0 && tractiveEffortN === 0) {
      newSpeed = 0;
      this.state.acceleration = 0;
    } else if (prevSpeed < 0 && newSpeed > 0 && tractiveEffortN === 0) {
      newSpeed = 0;
      this.state.acceleration = 0;
    }

    // Clamp to max speed
    newSpeed = Math.max(-this.config.maxSpeedMs * 0.3, Math.min(this.config.maxSpeedMs, newSpeed));
    this.state.speed = newSpeed;

    // Distance travelled (metres)
    const deltaDistance = ((prevSpeed + newSpeed) / 2) * clampedDt;
    this.state.distance += deltaDistance;

    // Wheelset angular rotation (radians)
    const angularVelocity = newSpeed / this.config.wheelRadiusM;
    this.state.wheelAngle += angularVelocity * clampedDt;

    this.notify();
  }

  /** Reset physics to standstill at given track position */
  public reset(distance: number = 0): void {
    this.state.speed = 0;
    this.state.speedKmh = 0;
    this.state.distance = distance;
    this.state.acceleration = 0;
    this.state.controllerMode = "OFF";
    this.state.tractionNotch = 0;
    this.state.brakeNotch = 0;
    this.state.emergencyBrakeActive = false;
    this.state.brakePipePressureBar = 5.0;
    this.state.brakeCylinderBar = 0.0;
    this.notify();
  }
}

export const trainPhysics = new TrainPhysics();
