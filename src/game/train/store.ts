import { create } from "zustand";
import type { LiveryId } from "./TrainConfig";

export type Screen = "menu" | "select" | "preview";
export type ViewId =
  | "menu"
  | "full"
  | "front"
  | "rear"
  | "side"
  | "bogie"
  | "pantograph"
  | "coupling"
  | "interior"
  | "cab";

export interface LightState {
  headlights: boolean;
  tail: boolean;
  interior: boolean;
  destination: boolean;
}

interface TrainUIState {
  screen: Screen;
  livery: LiveryId;
  view: ViewId;
  lights: LightState;
  doorsOpen: boolean;
  wheelDemo: boolean;
  setScreen: (s: Screen) => void;
  setLivery: (l: LiveryId) => void;
  setView: (v: ViewId) => void;
  toggleLight: (k: keyof LightState) => void;
  setDoorsOpen: (o: boolean) => void;
  setWheelDemo: (o: boolean) => void;
}

const VIEW_IDS: ViewId[] = ["menu", "full", "front", "rear", "side", "bogie", "pantograph", "coupling", "interior", "cab"];

/** Dev/check deep link: /?view=cab opens the preview straight on that camera. */
const linked = typeof window === "undefined" ? null : (new URLSearchParams(window.location.search).get("view") as ViewId | null);
const initialView: ViewId = linked && VIEW_IDS.includes(linked) ? linked : "menu";

export const useTrainStore = create<TrainUIState>((set) => ({
  screen: initialView === "menu" ? "menu" : "preview",
  livery: "western",
  view: initialView,
  lights: { headlights: true, tail: true, interior: true, destination: true },
  doorsOpen: false,
  wheelDemo: false,
  setScreen: (screen) => set({ screen, view: screen === "preview" ? "front" : "menu" }),
  setLivery: (livery) => set({ livery }),
  setView: (view) => set({ view }),
  toggleLight: (k) => set((s) => ({ lights: { ...s.lights, [k]: !s.lights[k] } })),
  setDoorsOpen: (doorsOpen) => set({ doorsOpen }),
  setWheelDemo: (wheelDemo) => set({ wheelDemo }),
}));

/** Per-frame runtime values (outside React). Future physics writes here. */
export const trainRuntime = {
  wheelAngle: 0,
  speed: 0,
  doorProgress: 0,
};
