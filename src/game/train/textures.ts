import * as THREE from "three";
import type { CoachSpec, Livery } from "./TrainConfig";

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  return { c, ctx };
}

function tex(c: HTMLCanvasElement, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Window glass with the horizontal safety bars typical of Mumbai locals. */
export function windowTexture() {
  const { c, ctx } = canvas(128, 128);
  const g = ctx.createLinearGradient(0, 0, 128, 128);
  g.addColorStop(0, "#5d7383");
  g.addColorStop(0.5, "#22313b");
  g.addColorStop(1, "#3c4f5c");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);

  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.beginPath();
  ctx.moveTo(10, 0);
  ctx.lineTo(50, 0);
  ctx.lineTo(0, 70);
  ctx.lineTo(0, 30);
  ctx.fill();

  for (let i = 1; i < 6; i++) {
    const y = (i * 128) / 6;
    ctx.fillStyle = "#b9bec2";
    ctx.fillRect(0, y - 3, 128, 5);
    ctx.fillStyle = "#6f767b";
    ctx.fillRect(0, y + 1, 128, 2);
  }
  ctx.strokeStyle = "#1a1d20";
  ctx.lineWidth = 8;
  ctx.strokeRect(0, 0, 128, 128);
  return tex(c);
}

export function interiorWindowTexture() {
  const { c, ctx } = canvas(128, 128);
  const g = ctx.createLinearGradient(0, 0, 0, 128);
  g.addColorStop(0, "#c9d8df");
  g.addColorStop(0.6, "#9fb3bb");
  g.addColorStop(1, "#7d8c78");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);

  for (let i = 1; i < 6; i++) {
    ctx.fillStyle = "#8f979c";
    ctx.fillRect(0, (i * 128) / 6 - 2, 128, 4);
  }
  ctx.strokeStyle = "#d7d4cc";
  ctx.lineWidth = 10;
  ctx.strokeRect(0, 0, 128, 128);
  return tex(c);
}

export function doorLeafTexture() {
  const { c, ctx } = canvas(128, 256);
  ctx.fillStyle = "#e4e4e4";
  ctx.fillRect(0, 0, 128, 256);

  // brushed steel streaks
  for (let i = 0; i < 128; i += 2) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.08})`;
    ctx.fillRect(i, 0, 1, 256);
  }

  // tall rounded door window + louvres, as on ICF/Medha EMU doors
  ctx.fillStyle = "#1c252b";
  ctx.beginPath();
  ctx.roundRect(40, 22, 48, 120, 22);
  ctx.fill();

  ctx.fillStyle = "rgba(0,0,0,0.35)";
  for (let y = 170; y < 236; y += 9) ctx.fillRect(30, y, 68, 4);

  ctx.fillStyle = "#1b1b1b";
  ctx.fillRect(0, 0, 6, 256);
  ctx.fillRect(122, 0, 6, 256);
  return tex(c);
}

export function hazardTexture() {
  const { c, ctx } = canvas(256, 64);
  ctx.fillStyle = "#f0c010";
  ctx.fillRect(0, 0, 256, 64);
  ctx.fillStyle = "#151515";
  for (let x = -64; x < 320; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 64);
    ctx.lineTo(x + 20, 64);
    ctx.lineTo(x + 84, 0);
    ctx.lineTo(x + 64, 0);
    ctx.fill();
  }
  return tex(c);
}

export function floorTexture() {
  // stainless chequer plate
  const { c, ctx } = canvas(256, 256);
  ctx.fillStyle = "#8d9196";
  ctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 16)
    for (let x = 0; x < 256; x += 16) {
      const flip = ((x + y) / 16) % 2;
      ctx.save();
      ctx.translate(x + 8, y + 8);
      ctx.rotate(flip ? Math.PI / 4 : -Math.PI / 4);
      ctx.fillStyle = "#b4b8bc";
      ctx.fillRect(-5, -1.5, 10, 3);
      ctx.fillStyle = "#5f6368";
      ctx.fillRect(-5, 1.5, 10, 1);
      ctx.restore();
    }
  const t = tex(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 16);
  return t;
}

export function ballastTexture() {
  const { c, ctx } = canvas(256, 256);
  ctx.fillStyle = "#6e675d";
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i++) {
    const v = 70 + Math.random() * 80;
    ctx.fillStyle = `rgb(${v},${v * 0.95},${v * 0.88})`;
    ctx.beginPath();
    ctx.arc(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  const t = tex(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 160);
  return t;
}

export function concreteTexture() {
  const { c, ctx } = canvas(256, 256);
  ctx.fillStyle = "#a59f93";
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 3000; i++) {
    ctx.fillStyle = `rgba(${Math.random() > 0.5 ? "255,255,255" : "0,0,0"},0.05)`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }
  ctx.strokeStyle = "rgba(0,0,0,0.18)";
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, 256, 256);
  const t = tex(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1, 60);
  return t;
}

/** LED destination + train number display. */
export function destinationTexture(l: Livery) {
  const { c, ctx } = canvas(512, 96);
  ctx.fillStyle = "#080807";
  ctx.fillRect(0, 0, 512, 96);
  ctx.fillStyle = "#ffae1a";
  ctx.font = "bold 50px 'IBM Plex Mono', monospace";
  ctx.textBaseline = "middle";
  ctx.fillText(l.routeCode, 18, 50);
  ctx.textAlign = "center";
  ctx.fillText(l.destination, 270, 50);
  ctx.font = "bold 22px 'IBM Plex Mono', monospace";
  ctx.textAlign = "right";
  ctx.fillText(l.trainNumber, 500, 26);
  ctx.fillText("12 CAR", 500, 74);
  // LED dot mask
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  for (let y = 0; y < 96; y += 4) ctx.fillRect(0, y, 512, 1);
  for (let x = 0; x < 512; x += 4) ctx.fillRect(x, 0, 1, 96);
  return tex(c);
}

export function pisTexture(l: Livery) {
  const { c, ctx } = canvas(512, 96);
  ctx.fillStyle = "#050505";
  ctx.fillRect(0, 0, 512, 96);
  ctx.fillStyle = "#ff3b26";
  ctx.font = "bold 34px 'IBM Plex Mono', monospace";
  ctx.textBaseline = "middle";
  ctx.fillText(`NEXT: DADAR`, 16, 32);
  ctx.fillStyle = "#3cff6a";
  ctx.font = "bold 24px 'IBM Plex Mono', monospace";
  ctx.fillText(`${l.routeCode} ${l.destination} · DOORS LEFT`, 16, 72);
  return tex(c);
}

export function coachLabelTexture(spec: CoachSpec) {
  const { c, ctx } = canvas(512, 128);
  ctx.clearRect(0, 0, 512, 128);
  let x = 10;
  if (spec.coachClass === "first") {
    // diagonal yellow/red first-class marking
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = i % 2 ? "#c8251d" : "#f0c010";
      ctx.beginPath();
      ctx.moveTo(x + i * 22, 118);
      ctx.lineTo(x + i * 22 + 22, 118);
      ctx.lineTo(x + i * 22 + 62, 10);
      ctx.lineTo(x + i * 22 + 40, 10);
      ctx.fill();
    }
    x += 200;
  } else if (spec.coachClass === "ladies") {
    ctx.fillStyle = "#1f8a4c";
    ctx.fillRect(x, 14, 180, 100);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 40px 'Barlow Condensed', sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText("LADIES", x + 18, 66);
    x += 200;
  }
  ctx.fillStyle = "#16181a";
  ctx.font = "bold 56px 'IBM Plex Mono', monospace";
  ctx.textBaseline = "middle";
  ctx.fillText(spec.number.split(" ").pop() ?? "", x, 66);
  return tex(c);
}

export function dialTexture(kind: "speedo" | "gauge") {
  const { c, ctx } = canvas(256, 256);
  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.arc(128, 128, 126, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f2f0e8";
  ctx.beginPath();
  ctx.arc(128, 128, 112, 0, Math.PI * 2);
  ctx.fill();
  const max = kind === "speedo" ? 120 : 10;
  const steps = kind === "speedo" ? 12 : 10;
  ctx.strokeStyle = "#111";
  ctx.fillStyle = "#111";
  ctx.font = "bold 18px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 0; i <= steps; i++) {
    const a = Math.PI * 0.75 + (i / steps) * Math.PI * 1.5;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(128 + Math.cos(a) * 100, 128 + Math.sin(a) * 100);
    ctx.lineTo(128 + Math.cos(a) * 84, 128 + Math.sin(a) * 84);
    ctx.stroke();
    ctx.fillText(String(Math.round((i / steps) * max)), 128 + Math.cos(a) * 68, 128 + Math.sin(a) * 68);
  }
  if (kind === "gauge") {
    ctx.strokeStyle = "#c22";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(128, 128, 104, Math.PI * 1.9, Math.PI * 2.25);
    ctx.stroke();
  }
  ctx.font = "bold 16px sans-serif";
  ctx.fillText(kind === "speedo" ? "km/h" : "kg/cm²", 128, 170);
  const a = Math.PI * 0.75 + (kind === "speedo" ? 0 : 0.55) * Math.PI * 1.5;
  ctx.strokeStyle = "#c21b1b";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(128, 128);
  ctx.lineTo(128 + Math.cos(a) * 92, 128 + Math.sin(a) * 92);
  ctx.stroke();
  ctx.fillStyle = "#222";
  ctx.beginPath();
  ctx.arc(128, 128, 10, 0, Math.PI * 2);
  ctx.fill();
  return tex(c);
}

/** Big white route letters on the belt line, e.g. "WR". */
export function routeLettersTexture(text: string) {
  const { c, ctx } = canvas(256, 128);
  ctx.clearRect(0, 0, 256, 128);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 110px 'Barlow Condensed', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 128, 70);
  return tex(c);
}
