// Pure data + layout rules for the 12-coach Mumbai suburban EMU.
// No React / three.js imports so this stays unit-testable.

export type LiveryId = "western" | "central" | "harbour";

export interface Livery {
  id: LiveryId;
  name: string;
  short: string;
  /** hex colors used by 3D materials */
  body: string;
  band: string;
  bandThin: string;
  front: string;
  door: string;
  seat: string;
  numberPrefix: string;
  routeCode: string;
  destination: string;
  trainNumber: string;
  terminals: string;
  description: string;
}

export const LIVERIES: Record<LiveryId, Livery> = {
  western: {
    id: "western",
    name: "Western Line",
    short: "WR",
    body: "#f1f1ee",
    band: "#b3176f",
    bandThin: "#b3176f",
    front: "#f5c514",
    door: "#b3176f",
    seat: "#1d2b40",
    numberPrefix: "WR",
    routeCode: "F",
    destination: "CHURCHGATE",
    trainNumber: "93018",
    terminals: "Churchgate ⇄ Virar",
    description: "White body with magenta belt line and doors, yellow ICF-style cab front.",
  },
  central: {
    id: "central",
    name: "Central Line",
    short: "CR",
    body: "#e6e8eb",
    band: "#a1222b",
    bandThin: "#25406b",
    front: "#f2c418",
    door: "#c9ccd0",
    seat: "#1d2b40",
    numberPrefix: "CR",
    routeCode: "S",
    destination: "CSMT",
    trainNumber: "95212",
    terminals: "CSMT ⇄ Kalyan",
    description: "Light grey body with red and navy belt lines, inspired by Central Railway EMUs.",
  },
  harbour: {
    id: "harbour",
    name: "Harbour Line",
    short: "HB",
    body: "#eef0ec",
    band: "#1f6e66",
    bandThin: "#1f6e66",
    front: "#eeba10",
    door: "#c9d2cf",
    seat: "#1d2b40",
    numberPrefix: "CR-H",
    routeCode: "H",
    destination: "PANVEL",
    trainNumber: "98114",
    terminals: "CSMT ⇄ Panvel",
    description: "White body with a teal-green belt line, inspired by Harbour Line rakes.",
  },
};

export const LIVERY_ORDER: LiveryId[] = ["western", "central", "harbour"];

// ---- Dimensions (metres). Broad gauge 1676 mm. ----
export const COACH_COUNT = 12;
export const COACH_LENGTH = 20;
export const COACH_GAP = 0.7;
export const COACH_PITCH = COACH_LENGTH + COACH_GAP;
export const RAIL_HALF_GAUGE = 0.838; // 1676 mm / 2
export const WHEEL_RADIUS = 0.48;
export const BOGIE_OFFSET = COACH_LENGTH / 2 - 3.0;
export const DOOR_Z = [-6.4, 0, 6.4];
export const WINDOW_Z = [-8.4, -4.6, -3.2, -1.8, 1.8, 3.2, 4.6, 8.4];
export const CAB_DEPTH = 2.5;
export const MOTOR_COACHES = [1, 4, 7, 10];
export const DETAILED_INTERIOR_COACHES = [0, 1];
export const PANTOGRAPH_Z = -COACH_LENGTH / 2 + 3.4;

export type CoachRole = "cab-front" | "cab-rear" | "motor" | "trailer";
export type CoachClass = "general" | "first" | "ladies";

export interface CoachSpec {
  index: number;
  role: CoachRole;
  cab: boolean;
  motor: boolean;
  /** world z of coach centre; coach local +z is its "front" end */
  z: number;
  /** rotate 180° about Y (rear driving coach) */
  flipped: boolean;
  number: string;
  coachClass: CoachClass;
  detailedInterior: boolean;
}

const CLASS_BY_INDEX: Record<number, CoachClass> = { 2: "ladies", 5: "first", 6: "first", 9: "ladies" };

export function coachZ(index: number, count: number = COACH_COUNT): number {
  return ((count - 1) / 2 - index) * COACH_PITCH;
}

export function buildTrainLayout(livery: Livery, count: number = COACH_COUNT): CoachSpec[] {
  const actualCount = Math.max(2, count);
  return Array.from({ length: actualCount }, (_, index) => {
    const first = index === 0;
    const last = index === actualCount - 1;
    // Motor coaches occur roughly every 3rd coach (1, 4, 7, 10, etc.)
    const motor = index % 3 === 1;
    const role: CoachRole = first ? "cab-front" : last ? "cab-rear" : motor ? "motor" : "trailer";
    const unit = Math.floor(index / 3) + 1;
    const suffix = "ABC"[index % 3] ?? "A";
    return {
      index,
      role,
      cab: first || last,
      motor,
      z: coachZ(index, actualCount),
      flipped: last,
      number: `${livery.numberPrefix} ${livery.trainNumber.slice(0, 2)}${String(unit * 10 + index).padStart(2, "0")}${suffix}`,
      coachClass: CLASS_BY_INDEX[index] ?? "general",
      detailedInterior: DETAILED_INTERIOR_COACHES.includes(index) || first || last,
    };
  });
}

export const FRONT_FACE_Z = coachZ(0) + COACH_LENGTH / 2;
export const REAR_FACE_Z = coachZ(COACH_COUNT - 1) - COACH_LENGTH / 2;
