/**
 * Station and line-side dimensions in metres. Mumbai suburban lines run on
 * Indian broad gauge (1676 mm). Every world builder reads from here so later
 * sections (trains, routes, signals) can align to the same geometry.
 */
export const TRACK_LENGTH = 520;
export const TRACK_HALF = TRACK_LENGTH / 2;
/** Track centre lines, west to east. Tracks 2 and 3 serve the island platform. */
export const TRACK_X = [-10.5, -6, 6, 10.5] as const;

export const GAUGE = 1.676;
export const RAIL = { height: 0.172, headWidth: 0.072, footWidth: 0.146, webWidth: 0.017 } as const;
export const RAIL_OFFSET = GAUGE / 2 + RAIL.headWidth / 2;

export const BALLAST = { topWidth: 3.6, bottomWidth: 5.2, height: 0.32 } as const;
export const SLEEPER = { length: 2.75, height: 0.2, width: 0.26, spacing: 0.65, centerY: 0.34 } as const;
export const RAIL_BASE_Y = SLEEPER.centerY + SLEEPER.height / 2;
export const RAIL_TOP_Y = RAIL_BASE_Y + RAIL.height;

export const PLATFORM = {
  halfWidth: 4.25,
  height: 1.45,
  halfLength: 135,
  canopyHalfLength: 100,
  columnX: 1.8,
  columnSpacing: 9.6,
  roofRidgeY: 5.55,
  roofEaveY: 5.05,
  roofHalfWidth: 4.6,
  safetyLineInset: 0.7,
} as const;

export const STATION = { name: "DADAR", nameDevanagari: "दादर" } as const;

export const OHE = {
  spacing: 52,
  mastX: 13.2,
  mastHeight: 9.4,
  beamY: 9.0,
  contactY: RAIL_TOP_Y + 5.5,
  messengerSupportY: RAIL_TOP_Y + 6.9,
  messengerMidY: RAIL_TOP_Y + 6.3,
  dropperSpacing: 6.5,
} as const;

export const FOB = { z: -116, deckY: 10.2, halfSpan: 20.5, width: 4, stepRise: 0.25, stepRun: 0.3 } as const;

export const BOUNDARY_X = 17;
export const SHANTY_STRIP = { inner: 17.6, outer: 22.4 } as const;
export const TREE_STRIP = { inner: 22.6, outer: 25.6 } as const;
export const BUILDINGS_START_X = 26;

export function ohePortalZs(): number[] {
  const zs: number[] = [];
  for (let z = -TRACK_HALF; z <= TRACK_HALF + 1e-6; z += OHE.spacing) zs.push(z);
  return zs;
}

/** Height of the sagging messenger wire at z (parabola between portals). */
export function messengerHeightAt(z: number): number {
  const u = (((z + TRACK_HALF) % OHE.spacing) + OHE.spacing) % OHE.spacing / OHE.spacing;
  const sag = OHE.messengerSupportY - OHE.messengerMidY;
  return OHE.messengerSupportY - sag * 4 * u * (1 - u);
}

/** True where the footbridge stairs land beside the line. */
export function nearFootbridge(z: number): boolean {
  return z > FOB.z - 14 && z < FOB.z + 26;
}
