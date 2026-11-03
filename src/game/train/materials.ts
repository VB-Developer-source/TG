import * as THREE from "three";
import type { Livery } from "./TrainConfig";
import type { LightState } from "./store";
import * as T from "./textures";

export type MaterialSet = ReturnType<typeof createMaterials>;

const std = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(p);

/** One shared material set for the whole train; livery changes recolour it in place. */
export function createMaterials(l: Livery) {
  const m = {
    body: std({ color: l.body, roughness: 0.42, metalness: 0.25, side: THREE.DoubleSide }),
    band: std({ color: l.band, roughness: 0.4, metalness: 0.2 }),
    bandThin: std({ color: l.bandThin, roughness: 0.4, metalness: 0.2 }),
    front: std({ color: l.front, roughness: 0.38, metalness: 0.2, side: THREE.DoubleSide }),
    roof: std({ color: "#8d9296", roughness: 0.65, metalness: 0.45 }),
    underframe: std({ color: "#2b2d2f", roughness: 0.8, metalness: 0.4 }),
    bogie: std({ color: "#3a3d40", roughness: 0.7, metalness: 0.55 }),
    steel: std({ color: "#9ea3a6", roughness: 0.32, metalness: 0.95 }),
    stainless: std({ color: "#d9dde0", roughness: 0.18, metalness: 1 }),
    frame: std({ color: "#a7abae", roughness: 0.3, metalness: 0.8 }),
    winOut: std({ map: T.windowTexture(), roughness: 0.08, metalness: 0.4 }),
    winIn: std({ map: T.interiorWindowTexture(), roughness: 0.2, emissive: "#8fa3ad", emissiveIntensity: 0.25 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: "#26343c",
      roughness: 0.04,
      metalness: 0.1,
      transparent: true,
      opacity: 0.38,
      clearcoat: 1,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    leaf: std({ map: T.doorLeafTexture(), color: l.door, roughness: 0.4, metalness: 0.25 }),
    doorway: std({ color: "#15181b", roughness: 0.9 }),
    yellow: std({ color: "#efbd12", roughness: 0.5 }),
    hazard: std({ map: T.hazardTexture(), roughness: 0.55 }),
    black: std({ color: "#121314", roughness: 0.6, metalness: 0.2 }),
    rubber: std({ color: "#1d1e1f", roughness: 0.95 }),
    spring: std({ color: "#3d4a3a", roughness: 0.55, metalness: 0.6 }),
    brake: std({ color: "#5a4636", roughness: 0.85, metalness: 0.3 }),
    seat: std({ color: l.seat, roughness: 0.6, metalness: 0.1 }),
    seatFrame: std({ color: "#7d8287", roughness: 0.35, metalness: 0.85 }),
    floor: std({ map: T.floorTexture(), roughness: 0.85 }),
    interior: std({ color: "#e9e4d6", roughness: 0.7, side: THREE.DoubleSide }),
    partition: std({ color: "#cfd8da", roughness: 0.25, transparent: true, opacity: 0.55 }),
    strap: std({ color: "#d4d8db", roughness: 0.2, metalness: 1 }),
    fan: std({ color: "#f1efe8", roughness: 0.45 }),
    insulator: std({ color: "#7a3b22", roughness: 0.3, metalness: 0.05 }),
    carbon: std({ color: "#1c1c1c", roughness: 0.5, metalness: 0.6 }),
    copper: std({ color: "#b06f3c", roughness: 0.35, metalness: 0.9 }),
    desk: std({ color: "#c43f93", roughness: 0.45, metalness: 0.1 }),
    panel: std({ color: "#9b86cf", roughness: 0.5, metalness: 0.1 }),
    cabSeat: std({ color: "#c45cad", roughness: 0.55 }),
    red: std({ color: "#c0261d", roughness: 0.4 }),
    green: std({ color: "#1f9d4a", roughness: 0.4, emissive: "#1f9d4a", emissiveIntensity: 0.6 }),
    amber: std({ color: "#e09a1a", roughness: 0.4, emissive: "#e09a1a", emissiveIntensity: 0.6 }),
    speedo: std({ map: T.dialTexture("speedo"), roughness: 0.3, emissive: "#ffffff", emissiveIntensity: 0.15 }),
    gauge: std({ map: T.dialTexture("gauge"), roughness: 0.3, emissive: "#ffffff", emissiveIntensity: 0.15 }),
    headLead: std({ color: "#fffbe8", roughness: 0.1, emissive: "#fff4cc", emissiveIntensity: 3 }),
    headOff: std({ color: "#cfd3d4", roughness: 0.1, metalness: 0.6 }),
    tailOn: std({ color: "#5a0b08", roughness: 0.2, emissive: "#ff2010", emissiveIntensity: 3 }),
    tailOff: std({ color: "#5a1410", roughness: 0.2 }),
    tube: std({ color: "#ffffff", emissive: "#f4f7ff", emissiveIntensity: 2.2 }),
    dest: std({ map: T.destinationTexture(l), emissive: "#ffffff", emissiveMap: null, emissiveIntensity: 1.2 }),
    pis: std({ map: T.pisTexture(l), emissive: "#ffffff", emissiveIntensity: 1 }),
    track: std({ color: "#8a8f93", roughness: 0.35, metalness: 0.9 }),
    sleeper: std({ color: "#8e8a83", roughness: 0.9 }),
  };
  const dest = m.dest as THREE.MeshStandardMaterial;
  dest.emissiveMap = dest.map;
  const pis = m.pis as THREE.MeshStandardMaterial;
  pis.emissiveMap = pis.map;
  return m;
}

export function materialByKey(m: MaterialSet, key: string): THREE.Material {
  return (m as Record<string, THREE.Material>)[key]!;
}

export function applyLivery(m: MaterialSet, l: Livery) {
  (m.body as THREE.MeshStandardMaterial).color.set(l.body);
  (m.band as THREE.MeshStandardMaterial).color.set(l.band);
  (m.bandThin as THREE.MeshStandardMaterial).color.set(l.bandThin);
  (m.front as THREE.MeshStandardMaterial).color.set(l.front);
  (m.seat as THREE.MeshStandardMaterial).color.set(l.seat);
  (m.leaf as THREE.MeshStandardMaterial).color.set(l.door);
  for (const [key, make] of [
    ["dest", T.destinationTexture],
    ["pis", T.pisTexture],
  ] as const) {
    const mat = materialByKey(m, key) as THREE.MeshStandardMaterial;
    mat.map?.dispose();
    mat.map = make(l);
    mat.emissiveMap = mat.map;
    mat.needsUpdate = true;
  }
}

export function applyLights(m: MaterialSet, s: LightState) {
  const set = (k: string, on: boolean, value: number) => {
    (materialByKey(m, k) as THREE.MeshStandardMaterial).emissiveIntensity = on ? value : 0;
  };
  set("headLead", s.headlights, 3);
  set("tailOn", s.tail, 3);
  set("tube", s.interior, 2.2);
  set("winIn", s.interior, 0.25);
  set("pis", s.interior, 1);
  set("dest", s.destination, 1.2);
  (m.tube as THREE.MeshStandardMaterial).color.set(s.interior ? "#ffffff" : "#9a9c9e");
}

export function disposeMaterials(m: MaterialSet) {
  for (const mat of Object.values(m)) {
    const s = mat as THREE.MeshStandardMaterial;
    s.map?.dispose();
    s.dispose();
  }
}
