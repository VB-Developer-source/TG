export type Rng = () => number;

/** Small seeded PRNG so the procedural world is identical on every load. */
export function mulberry32(seed: number): Rng {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const range = (rng: Rng, min: number, max: number) => min + (max - min) * rng();

export function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length) % items.length] as T;
}
