import * as THREE from "three";
import type { AssetManager } from "../core/AssetManager";
import type { TextureKey } from "./textures";

export type WorldMaterials = ReturnType<typeof createMaterials>;

/** Shared materials: one per surface type, reused across every mesh. */
export function createMaterials(assets: AssetManager) {
  const tex = (key: TextureKey) => assets.getTexture(key);
  const std = (params: THREE.MeshStandardMaterialParameters) =>
    assets.track(new THREE.MeshStandardMaterial(params));

  return {
    ground: std({ map: tex("ground"), roughness: 1 }),
    trackbed: std({ map: tex("trackbed"), roughness: 1 }),
    ballast: std({ map: tex("gravel"), roughness: 1 }),
    sleeper: std({ map: tex("concrete"), roughness: 0.95 }),
    rail: std({ color: 0x6b4a38, metalness: 0.55, roughness: 0.7 }),
    railHead: std({ color: 0xdedad4, metalness: 1, roughness: 0.2 }),
    wall: std({ map: tex("concreteWall"), roughness: 0.95 }),
    platformTop: std({ map: tex("tiles"), roughness: 0.85 }),
    coping: std({ color: 0xc9c2b5, roughness: 0.8 }),
    safetyLine: std({ color: 0xf2c230, roughness: 0.7 }),
    canopySteel: std({ color: 0x2f5a4f, metalness: 0.35, roughness: 0.55 }),
    roof: std({ map: tex("roofSheet"), color: 0xa9b7b3, metalness: 0.45, roughness: 0.5 }),
    lamp: std({ color: 0xfff3dc, emissive: 0xfff0d2, emissiveIntensity: 1.8 }),
    darkSteel: std({ color: 0x2b2f33, metalness: 0.6, roughness: 0.5 }),
    board: std({ map: tex("stationBoard"), roughness: 0.55 }),
    lattice: std({
      map: tex("lattice"),
      alphaTest: 0.5,
      side: THREE.DoubleSide,
      color: 0xaeb3b8,
      metalness: 0.6,
      roughness: 0.5,
    }),
    steel: std({ color: 0x9aa0a6, metalness: 0.7, roughness: 0.45 }),
    wire: std({ color: 0x5a4030, metalness: 0.6, roughness: 0.4 }),
    building: std({ map: tex("facade"), vertexColors: true, roughness: 0.92 }),
    tank: std({ color: 0x1c1e21, roughness: 0.55 }),
    shanty: std({ map: tex("concrete"), vertexColors: true, roughness: 0.9 }),
    foliage: std({ vertexColors: true, roughness: 0.85, flatShading: true }),
    palm: std({ vertexColors: true, roughness: 0.8, side: THREE.DoubleSide }),
    bridge: std({ map: tex("concreteWall"), color: 0xc4beb2, roughness: 0.9 }),
  };
}
