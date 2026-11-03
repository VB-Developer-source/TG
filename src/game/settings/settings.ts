import { PersistentStore, type KeyValueStorage } from "../core/PersistentStore";

export type GraphicsQuality = "low" | "medium" | "high";
export const GRAPHICS_QUALITIES: readonly GraphicsQuality[] = ["low", "medium", "high"];

export interface GameSettings {
  quality: GraphicsQuality;
  shadows: boolean;
  sound: boolean;
  /** Multiplier applied to mouse / touch look speed. */
  cameraSensitivity: number;
}

export const SENSITIVITY_RANGE = { min: 0.2, max: 2, step: 0.1 } as const;
export const SETTINGS_STORAGE_KEY = "mls.settings.v1";

export const DEFAULT_SETTINGS: Readonly<GameSettings> = Object.freeze({
  quality: "medium",
  shadows: true,
  sound: true,
  cameraSensitivity: 1,
});

/** Rendering budget for each quality level. */
export interface QualityProfile {
  maxPixelRatio: number;
  minPixelRatio: number;
  shadowMapSize: number;
  /** Fog end / visible distance in metres. */
  drawDistance: number;
  anisotropy: number;
}

export const QUALITY_PROFILES: Readonly<Record<GraphicsQuality, QualityProfile>> = {
  low: { maxPixelRatio: 1, minPixelRatio: 0.6, shadowMapSize: 1024, drawDistance: 240, anisotropy: 1 },
  medium: { maxPixelRatio: 1.5, minPixelRatio: 0.75, shadowMapSize: 2048, drawDistance: 340, anisotropy: 4 },
  high: { maxPixelRatio: 2, minPixelRatio: 1, shadowMapSize: 4096, drawDistance: 440, anisotropy: 8 },
};

function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step;
}

/** Coerces anything (old saves, hand-edited storage) into valid settings. */
export function sanitizeSettings(raw: unknown): GameSettings {
  const source = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const quality = GRAPHICS_QUALITIES.includes(source["quality"] as GraphicsQuality)
    ? (source["quality"] as GraphicsQuality)
    : DEFAULT_SETTINGS.quality;
  const sensitivityRaw =
    typeof source["cameraSensitivity"] === "number" && Number.isFinite(source["cameraSensitivity"])
      ? source["cameraSensitivity"]
      : DEFAULT_SETTINGS.cameraSensitivity;
  const cameraSensitivity = Number(
    roundToStep(
      Math.min(SENSITIVITY_RANGE.max, Math.max(SENSITIVITY_RANGE.min, sensitivityRaw)),
      SENSITIVITY_RANGE.step,
    ).toFixed(2),
  );
  return {
    quality,
    shadows: typeof source["shadows"] === "boolean" ? source["shadows"] : DEFAULT_SETTINGS.shadows,
    sound: typeof source["sound"] === "boolean" ? source["sound"] : DEFAULT_SETTINGS.sound,
    cameraSensitivity,
  };
}

export type SettingsStore = PersistentStore<GameSettings>;

export function createSettingsStore(storage: KeyValueStorage | null): SettingsStore {
  return new PersistentStore(storage, SETTINGS_STORAGE_KEY, sanitizeSettings, { ...DEFAULT_SETTINGS });
}
