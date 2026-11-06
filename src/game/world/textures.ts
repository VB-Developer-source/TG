import * as THREE from "three";
import type { AssetManager, LoadTask } from "../core/AssetManager";
import { mulberry32, pick, range, type Rng } from "../core/random";
import { STATION } from "./layout";

/**
 * Procedural canvas textures. Nothing is downloaded, so the world always
 * loads. Each texture's real-world size is noted next to its generator.
 */
export const TEXTURE_KEYS = [
  "gravel",
  "trackbed",
  "ground",
  "concrete",
  "concreteWall",
  "tiles",
  "roofSheet",
  "lattice",
  "facade",
  "stationBoard",
] as const;
export type TextureKey = (typeof TEXTURE_KEYS)[number];

type Ctx = CanvasRenderingContext2D;

function makeCanvas(width: number, height = width): [HTMLCanvasElement, Ctx] {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas is not available");
  return [canvas, ctx];
}

function speckle(ctx: Ctx, rng: Rng, count: number, size: number, colors: string[], min: number, max: number, alpha = 1) {
  ctx.globalAlpha = alpha;
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = pick(rng, colors);
    const s = range(rng, min, max);
    ctx.fillRect(rng() * size, rng() * size, s, s);
  }
  ctx.globalAlpha = 1;
}

function blob(ctx: Ctx, x: number, y: number, r: number, color: string, alpha: number) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

/** 2 m tile of track ballast. */
function gravel(rng: Rng): HTMLCanvasElement {
  const size = 512;
  const [c, ctx] = makeCanvas(size);
  ctx.fillStyle = "#5f5a53";
  ctx.fillRect(0, 0, size, size);
  const stones = ["#8a847b", "#5a554e", "#77706a", "#9b958b", "#4a4540", "#6e5d4f", "#827a70"];
  for (let i = 0; i < 9000; i++) {
    const x = rng() * size;
    const y = rng() * size;
    const r = range(rng, 1.6, 4.6);
    ctx.fillStyle = pick(rng, stones);
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * range(rng, 0.6, 1), rng() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(x - r * 0.4, y - r * 0.5, r * 0.6, r * 0.4);
  }
  speckle(ctx, rng, 700, size, ["#5b3a26", "#4a2f20"], 1, 2.5, 0.5);
  return c;
}

/** 4 m tile of the dirt and fines between tracks. */
function trackbed(rng: Rng): HTMLCanvasElement {
  const size = 512;
  const [c, ctx] = makeCanvas(size);
  ctx.fillStyle = "#5a524a";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 30; i++) blob(ctx, rng() * size, rng() * size, range(rng, 20, 70), "#2b2723", range(rng, 0.15, 0.35));
  speckle(ctx, rng, 9000, size, ["#7a7268", "#4c463f", "#6a6159", "#8d857a", "#5e4a3a"], 1, 3);
  return c;
}

/** 75 m seamless organic ground tile of weathered Mumbai soil, dust and vegetation. */
function ground(rng: Rng): HTMLCanvasElement {
  const size = 512;
  const [c, ctx] = makeCanvas(size);
  // Base warm loam soil
  ctx.fillStyle = "#65594b";
  ctx.fillRect(0, 0, size, size);

  // Broad soft earthen gradients
  for (let i = 0; i < 25; i++) {
    blob(ctx, rng() * size, rng() * size, range(rng, 60, 160), "#4e4337", 0.4);
  }
  for (let i = 0; i < 25; i++) {
    blob(ctx, rng() * size, rng() * size, range(rng, 50, 140), "#736758", 0.35);
  }
  // Soft patches of coastal monsoon grass
  for (let i = 0; i < 35; i++) {
    blob(ctx, rng() * size, rng() * size, range(rng, 40, 120), pick(rng, ["#505a2f", "#5b6636", "#455027"]), 0.28);
  }
  // Fine weathered dust and ballast blend
  for (let i = 0; i < 15; i++) {
    blob(ctx, rng() * size, rng() * size, range(rng, 20, 70), "#383129", 0.25);
  }
  return c;
}

/** Sleeper concrete, mapped once per face. */
function concrete(rng: Rng): HTMLCanvasElement {
  const size = 256;
  const [c, ctx] = makeCanvas(size);
  ctx.fillStyle = "#a6a199";
  ctx.fillRect(0, 0, size, size);
  speckle(ctx, rng, 3000, size, ["#8e8a83", "#bcb8b0", "#7c7871"], 1, 2.5, 0.4);
  for (let i = 0; i < 8; i++) blob(ctx, rng() * size, rng() * size, range(rng, 15, 40), "#5e4a3a", 0.25);
  return c;
}

/** 4 m tile of weathered wall concrete with monsoon streaks. */
function concreteWall(rng: Rng): HTMLCanvasElement {
  const size = 512;
  const [c, ctx] = makeCanvas(size);
  ctx.fillStyle = "#a39d92";
  ctx.fillRect(0, 0, size, size);
  speckle(ctx, rng, 5000, size, ["#8f897e", "#b5afa4", "#7d776d"], 1, 3, 0.35);
  for (let i = 0; i < 70; i++) {
    const x = rng() * size;
    const w = range(rng, 3, 18);
    const h = range(rng, 80, 380);
    const y = rng() * (size - h * 0.5);
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, "rgba(40,36,30,0.28)");
    g.addColorStop(1, "rgba(40,36,30,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
  }
  const base = ctx.createLinearGradient(0, size * 0.8, 0, size);
  base.addColorStop(0, "rgba(50,40,30,0)");
  base.addColorStop(1, "rgba(50,40,30,0.35)");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  return c;
}

/** 4 m tile of 0.5 m platform tiles. */
function tiles(rng: Rng): HTMLCanvasElement {
  const size = 512;
  const cell = size / 8;
  const [c, ctx] = makeCanvas(size);
  ctx.fillStyle = "#77716a";
  ctx.fillRect(0, 0, size, size);
  const shades = ["#b9ad98", "#b3a690", "#c0b49f", "#a99c86", "#b6ab97"];
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      ctx.fillStyle = pick(rng, shades);
      ctx.fillRect(x * cell + 1.5, y * cell + 1.5, cell - 3, cell - 3);
    }
  }
  speckle(ctx, rng, 5000, size, ["#9d917c", "#cbbfaa", "#8b806c"], 1, 2, 0.35);
  for (let i = 0; i < 26; i++) blob(ctx, rng() * size, rng() * size, range(rng, 8, 30), pick(rng, ["#6b2f22", "#4a3a2c", "#3a332b"]), range(rng, 0.12, 0.28));
  return c;
}

/** Corrugated roofing, 8 corrugations per tile. */
function roofSheet(rng: Rng): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(64, 128);
  for (let i = 0; i < 8; i++) {
    const g = ctx.createLinearGradient(0, i * 16, 0, i * 16 + 16);
    g.addColorStop(0, "#d8dcda");
    g.addColorStop(0.5, "#8d9592");
    g.addColorStop(1, "#c5cac7");
    ctx.fillStyle = g;
    ctx.fillRect(0, i * 16, 64, 16);
  }
  speckle(ctx, rng, 120, 64, ["#7a5235", "#5f3f2a"], 1, 3, 0.4);
  return c;
}

/** Steel lattice for OHE masts and portal beams (alpha tested). */
function lattice(): HTMLCanvasElement {
  const size = 128;
  const [c, ctx] = makeCanvas(size);
  ctx.clearRect(0, 0, size, size);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 12;
  ctx.strokeRect(6, 6, size - 12, size - 12);
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(size, size);
  ctx.moveTo(size, 0);
  ctx.lineTo(0, size);
  ctx.stroke();
  return c;
}

/** 16 m x 12 m of apartment facade: 4 bays x 4 floors. White, tinted per building. */
function facade(rng: Rng): HTMLCanvasElement {
  const size = 512;
  const cell = size / 4;
  const [c, ctx] = makeCanvas(size);
  ctx.fillStyle = "#ece7dd";
  ctx.fillRect(0, 0, size, size);
  speckle(ctx, rng, 2500, size, ["#d6d0c4", "#f4f0e8", "#c9c2b5"], 1, 3, 0.5);
  for (let fy = 0; fy < 4; fy++) {
    for (let fx = 0; fx < 4; fx++) {
      const x = fx * cell;
      const y = fy * cell;
      ctx.fillStyle = "#cfc8bb";
      ctx.fillRect(x, y + cell - 7, cell, 7);
      const wx = x + 28;
      const wy = y + 30;
      const ww = 72;
      const wh = 56;
      const streak = ctx.createLinearGradient(0, wy + wh, 0, wy + wh + range(rng, 30, 70));
      streak.addColorStop(0, "rgba(30,28,24,0.28)");
      streak.addColorStop(1, "rgba(30,28,24,0)");
      ctx.fillStyle = streak;
      ctx.fillRect(wx + 4, wy + wh, ww - 8, 70);
      ctx.fillStyle = "#bdb5a7";
      ctx.fillRect(wx - 4, wy - 4, ww + 8, wh + 8);
      const roll = rng();
      ctx.fillStyle = roll < 0.12 ? "#f0d29a" : roll < 0.3 ? "#7f8c8e" : "#2c353f";
      ctx.fillRect(wx, wy, ww, wh);
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(wx, wy, ww / 2 - 2, wh);
      ctx.fillStyle = "#bdb5a7";
      ctx.fillRect(wx + ww / 2 - 2, wy, 4, wh);
      if (rng() < 0.3) {
        ctx.fillStyle = "#d9d9d6";
        ctx.fillRect(wx + ww + 6, wy + 22, 20, 16);
        ctx.fillStyle = "#9a9a96";
        ctx.fillRect(wx + ww + 9, wy + 25, 14, 10);
      }
      if (rng() < 0.15) {
        const colors = ["#c0392b", "#2e86c1", "#f4d03f", "#ffffff", "#8e44ad", "#27ae60"];
        for (let k = 0; k < 6; k++) {
          ctx.fillStyle = pick(rng, colors);
          ctx.fillRect(wx + 4 + k * 11, wy + wh + 6, 8, range(rng, 10, 18));
        }
      }
    }
  }
  for (let i = 0; i < 12; i++) blob(ctx, rng() * size, rng() * size, range(rng, 30, 80), "#4b4237", 0.12);
  // Roof faces sample the top-left corner: keep it plain wall colour.
  ctx.fillStyle = "#ece7dd";
  ctx.fillRect(0, 0, 12, 12);
  return c;
}

/** Yellow station name board with black lettering. */
function stationBoard(withDevanagari: boolean): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(1024, 288);
  ctx.fillStyle = "#f3c21c";
  ctx.fillRect(0, 0, 1024, 288);
  ctx.strokeStyle = "#141414";
  ctx.lineWidth = 12;
  ctx.strokeRect(14, 14, 996, 260);
  ctx.fillStyle = "#121212";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (withDevanagari) {
    ctx.font = `700 92px "Noto Sans Devanagari", sans-serif`;
    ctx.fillText(STATION.nameDevanagari, 512, 96);
    ctx.font = `700 104px "IBM Plex Sans", Arial, sans-serif`;
    ctx.fillText(STATION.name, 512, 204);
  } else {
    ctx.font = `700 150px "IBM Plex Sans", Arial, sans-serif`;
    ctx.fillText(STATION.name, 512, 150);
  }
  return c;
}

interface TextureOptions {
  repeat?: [number, number];
  anisotropic?: boolean;
}

function toTexture(canvas: HTMLCanvasElement, opts: TextureOptions, anisotropy: number): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  if (opts.repeat) texture.repeat.set(opts.repeat[0], opts.repeat[1]);
  if (opts.anisotropic) {
    texture.userData["anisotropic"] = true;
    texture.anisotropy = anisotropy;
  }
  return texture;
}

export interface TextureTaskOptions {
  /** Anisotropic filtering level for ground-like textures. */
  anisotropy: () => number;
  /** Whether the Devanagari signage font loaded. */
  hasDevanagari: () => boolean;
}

/** One load task per texture so progress reflects real work. */
export function createTextureTasks(assets: AssetManager, options: TextureTaskOptions): LoadTask[] {
  const rng = mulberry32(1853); // first Indian passenger train, Bori Bunder to Thane
  const make =
    (key: TextureKey, draw: () => HTMLCanvasElement, opts: TextureOptions = {}) =>
    () => {
      assets.setTexture(key, toTexture(draw(), opts, options.anisotropy()));
    };
  return [
    { id: "tex-gravel", label: "Crushing ballast stone", run: make("gravel", () => gravel(rng), { repeat: [0.5, 0.5], anisotropic: true }) },
    { id: "tex-trackbed", label: "Grading the trackbed", run: make("trackbed", () => trackbed(rng), { anisotropic: true }) },
    { id: "tex-ground", label: "Spreading dusty earth", run: make("ground", () => ground(rng), { anisotropic: true }) },
    { id: "tex-concrete", label: "Casting concrete sleepers", run: make("concrete", () => concrete(rng)) },
    { id: "tex-wall", label: "Weathering boundary walls", run: make("concreteWall", () => concreteWall(rng), { repeat: [0.25, 0.25] }) },
    { id: "tex-tiles", label: "Tiling the platform", run: make("tiles", () => tiles(rng), { anisotropic: true }) },
    { id: "tex-roof", label: "Rolling corrugated sheets", run: make("roofSheet", () => roofSheet(rng)) },
    { id: "tex-lattice", label: "Fabricating mast lattice", run: make("lattice", () => lattice()) },
    { id: "tex-facade", label: "Painting building facades", run: make("facade", () => facade(rng)) },
    {
      id: "tex-board",
      label: "Lettering station boards",
      run: make("stationBoard", () => stationBoard(options.hasDevanagari())),
    },
  ];
}

export function applyAnisotropy(assets: AssetManager, anisotropy: number): void {
  for (const key of TEXTURE_KEYS) {
    try {
      const texture = assets.getTexture(key);
      if (texture.userData["anisotropic"] && texture.anisotropy !== anisotropy) {
        texture.anisotropy = anisotropy;
        texture.needsUpdate = true;
      }
    } catch {
      /* not loaded yet */
    }
  }
}
