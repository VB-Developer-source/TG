/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TrainLiveryType = 'western' | 'central' | 'harbour' | 'ac_local';

export type CoachType = 'DMC' | 'TC' | 'MC' | 'DTC';

export interface LiveryTheme {
  id: TrainLiveryType;
  name: string;
  lineCode: string;
  cabColor: number;         // Front cab face shield (Iconic Mumbai EMU bright yellow)
  primaryColor: number;     // Main body panel color (Clean white / stainless steel)
  accentColor: number;      // Cheatline / waistline stripe (Iconic MRVC Magenta/Violet)
  doorColor: number;        // Passenger sliding door color
  roofColor: number;        // Galvanized corrugated roof
  destinationText: string;  // Front LED display
  destinationHindi: string;
  ladiesColor: number;      // Ladies coach highlight
}

export const LIVERY_THEMES: Record<TrainLiveryType, LiveryTheme> = {
  western: {
    id: 'western',
    name: 'Western Railway (WR EMU)',
    lineCode: 'WR',
    cabColor: 0xfacc15,         // Vibrant IR Suburban Yellow Front Face
    primaryColor: 0xf8fafc,     // White / Stainless Steel Body
    accentColor: 0x9d174d,      // Mumbai MRVC Magenta / Deep Violet Waist & Eaves Band
    doorColor: 0x86198f,        // Magenta Passenger Doors
    roofColor: 0x475569,        // Galvanized Corrugated Roof
    destinationText: 'FAST • BORIVALI',
    destinationHindi: 'फास्ट • बोरिवली',
    ladiesColor: 0x10b981,      // Green-Yellow Zebra Band
  },
  central: {
    id: 'central',
    name: 'Central Railway (CR EMU)',
    lineCode: 'CR',
    cabColor: 0xfacc15,         // Vibrant Yellow Front Face
    primaryColor: 0xf8fafc,     // White Body
    accentColor: 0x881337,      // Deep Maroon / Crimson Band
    doorColor: 0x7f1d1d,
    roofColor: 0x334155,
    destinationText: 'SLOW • KALYAN',
    destinationHindi: 'धीमी • कल्याण',
    ladiesColor: 0xec4899,
  },
  harbour: {
    id: 'harbour',
    name: 'Harbour Line (HB EMU)',
    lineCode: 'HB',
    cabColor: 0xfacc15,
    primaryColor: 0xf8fafc,
    accentColor: 0x065f46,      // Deep Emerald Teal Band
    doorColor: 0x047857,
    roofColor: 0x334155,
    destinationText: 'LOCAL • PANVEL',
    destinationHindi: 'लोकल • पनवेल',
    ladiesColor: 0x10b981,
  },
  ac_local: {
    id: 'ac_local',
    name: 'Medha AC Suburban EMU',
    lineCode: 'AC',
    cabColor: 0x0284c7,         // Aero Blue / Silver Front
    primaryColor: 0xcbd5e1,     // Polished Stainless Steel Silver
    accentColor: 0x0284c7,      // Bright Sky Blue Belt Band
    doorColor: 0x0369a1,
    roofColor: 0x64748b,
    destinationText: 'AC FAST • CHURCHGATE',
    destinationHindi: 'वातानुकूलित • चर्चगेट',
    ladiesColor: 0x06b6d4,
  },
};

export const TRAIN_SPECS = {
  gauge: 1.676,            // Indian Broad Gauge (1676 mm)
  coachWidth: 3.66,        // Broad Gauge Suburban width (3660 mm)
  coachHeight: 3.90,       // Height above rail head
  coachLength: 21.30,      // Length over body (21300 mm)
  bogieCenterDist: 14.63,  // Distance between bogie pivots
  bogieWheelbase: 2.89,    // Axle spacing within bogie
  wheelDiameter: 0.952,    // Standard wheel diameter (952 mm)
  axleDiameter: 0.18,
  doorsPerSide: 4,         // 4 wide passenger doorways per coach
  doorWidth: 1.45,
  doorHeight: 2.10,
  platformOffset: 0.65,    // Clearance above rail
  couplerLength: 0.90,     // Gangway connection gap
};
