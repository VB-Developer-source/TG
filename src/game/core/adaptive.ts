/**
 * Adaptive resolution: lower the device pixel ratio when frames run long,
 * raise it again when there is headroom. Pure so it can be unit tested.
 */
export const ADAPTIVE_DPR = {
  /** Seconds of frames averaged before each decision. */
  sampleWindow: 1.5,
  /** Average frame time above this drops resolution (~42 fps). */
  slowFrameMs: 24,
  /** Average frame time below this raises resolution (~55 fps). */
  fastFrameMs: 18,
  step: 0.25,
  /** Frames longer than this (tab switch, GC pause) are ignored. */
  outlierMs: 120,
} as const;

export function nextPixelRatio(current: number, avgFrameMs: number, min: number, max: number): number {
  let next = current;
  if (avgFrameMs > ADAPTIVE_DPR.slowFrameMs) next = current - ADAPTIVE_DPR.step;
  else if (avgFrameMs < ADAPTIVE_DPR.fastFrameMs) next = current + ADAPTIVE_DPR.step;
  return Math.min(max, Math.max(min, Number(next.toFixed(2))));
}
