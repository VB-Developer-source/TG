import { PersistentStore, type KeyValueStorage } from "../core/PersistentStore";

export interface RouteInfo {
  id: string;
  name: string;
  termini: string;
  description: string;
  /** Design token suffix for the line colour, e.g. "western" -> bg-line-western. */
  tone: "western" | "central" | "harbour" | "transharbour";
}

export interface TrainInfo {
  id: string;
  name: string;
  cars: number;
  description: string;
  traits: string[];
  airConditioned: boolean;
  /** First unit number painted on this rake's coaches (fictional). */
  unitBase: number;
}

export const ROUTES: readonly RouteInfo[] = [
  {
    id: "western",
    name: "Western Line",
    termini: "Churchgate — Virar",
    description: "The coastal spine through Dadar, Bandra and Borivali, with slow and fast corridors.",
    tone: "western",
  },
  {
    id: "central",
    name: "Central Line",
    termini: "CSMT — Kalyan",
    description: "From the Victorian terminus north past Dadar and Thane toward the Ghats.",
    tone: "central",
  },
  {
    id: "harbour",
    name: "Harbour Line",
    termini: "CSMT — Panvel",
    description: "East along the harbour through Wadala and Kurla, across the creek to Navi Mumbai.",
    tone: "harbour",
  },
  {
    id: "transharbour",
    name: "Trans-Harbour Line",
    termini: "Thane — Vashi",
    description: "A link line between Thane and Navi Mumbai through the industrial belt.",
    tone: "transharbour",
  },
];

export const TRAINS: readonly TrainInfo[] = [
  {
    id: "emu-12",
    name: "12-Car EMU",
    cars: 12,
    description: "The everyday suburban workhorse, with open doors and a first-class coach.",
    traits: ["Non-AC", "Slow & fast services"],
    airConditioned: false,
    unitBase: 5101,
  },
  {
    id: "emu-15",
    name: "15-Car EMU",
    cars: 15,
    description: "A longer rake for the busiest fast corridors at peak hour.",
    traits: ["Non-AC", "Peak-hour capacity"],
    airConditioned: false,
    unitBase: 5301,
  },
  {
    id: "ac-local",
    name: "AC Local",
    cars: 12,
    description: "Air-conditioned EMU with automatic sliding doors.",
    traits: ["Air-conditioned", "Automatic doors"],
    airConditioned: true,
    unitBase: 7001,
  },
];

export interface Selection {
  routeId: string;
  trainId: string;
}

export const SELECTION_STORAGE_KEY = "mls.selection.v1";
export const DEFAULT_SELECTION: Selection = { routeId: "western", trainId: "emu-12" };

export function sanitizeSelection(raw: unknown): Selection {
  const source = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    routeId: ROUTES.some((r) => r.id === source["routeId"]) ? (source["routeId"] as string) : DEFAULT_SELECTION.routeId,
    trainId: TRAINS.some((t) => t.id === source["trainId"]) ? (source["trainId"] as string) : DEFAULT_SELECTION.trainId,
  };
}

export type SelectionStore = PersistentStore<Selection>;

export function createSelectionStore(storage: KeyValueStorage | null): SelectionStore {
  return new PersistentStore(storage, SELECTION_STORAGE_KEY, sanitizeSelection, { ...DEFAULT_SELECTION });
}
