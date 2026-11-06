/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from "three";
import { GAUGE, RAIL_TOP_Y } from "./layout";
import type { TrackPath, TrackSample } from "../train/TrackPath";
import type { WorldMaterials } from "./materials";
import { mulberry32, pick, range } from "../core/random";

const PAINTS = [
  "#e8dcc4", "#d9b8a0", "#c9d4d6", "#d8c9a8", "#b8c4b0",
  "#e0cfc2", "#c4b8a8", "#a9b7c0", "#d6a98f", "#efe6d4", "#cfd8c4"
];

const LEAF_COLORS = ["#47662f", "#5d7a35", "#3f5e2a", "#6b8040", "#547333"];

/**
 * Procedural Continuous Track and Mumbai Environment Generator.
 * Constructs realistic multi-track Broad Gauge railway corridor, ballast, sleepers,
 * 25 kV AC OHE, boundary walls, and authentic Mumbai urban surroundings along any track curve.
 */
export class ContinuousTrackBuilder {
  /**
   * Builds a continuous 3D railway chunk covering [startDistM, endDistM] along the track path.
   */
  static buildTrackChunk(
    trackPath: TrackPath,
    startDistM: number,
    endDistM: number,
    materials?: WorldMaterials | null
  ): THREE.Group {
    const group = new THREE.Group();
    group.name = `track-chunk-${Math.round(startDistM)}-${Math.round(endDistM)}`;

    const len = endDistM - startDistM;
    if (len <= 0) return group;

    const sampleStep = 8.0; // 8m resolution for smooth curved trackbed
    const numSteps = Math.max(2, Math.ceil(len / sampleStep));
    const samples: TrackSample[] = [];

    for (let i = 0; i <= numSteps; i++) {
      const d = Math.min(endDistM, startDistM + (i / numSteps) * len);
      samples.push(trackPath.sampleAtDistance(d));
    }

    // Fallback materials if not passed from World
    const ballastMat = materials?.ballast ?? new THREE.MeshStandardMaterial({ color: 0x5a554e, roughness: 0.95 });
    const groundMat = materials?.ground ?? new THREE.MeshStandardMaterial({ color: 0x6e604f, roughness: 1.0 });
    const railMat = materials?.rail ?? new THREE.MeshStandardMaterial({ color: 0x5a483a, roughness: 0.7, metalness: 0.6 });
    const railHeadMat = materials?.railHead ?? new THREE.MeshStandardMaterial({ color: 0xdedad4, roughness: 0.25, metalness: 0.95 });
    const sleeperMat = materials?.sleeper ?? new THREE.MeshStandardMaterial({ color: 0x9c978f, roughness: 0.9 });
    const wallMat = materials?.wall ?? new THREE.MeshStandardMaterial({ color: 0x8f8a81, roughness: 0.95 });
    const steelMat = materials?.steel ?? new THREE.MeshStandardMaterial({ color: 0x71717a, roughness: 0.5, metalness: 0.7 });
    const wireMat = materials?.wire ?? new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.4, metalness: 0.6 });

    // 1. BALLAST BED & GROUND TERRAIN STRIP
    const ballastGeom = this.createBallastGeometry(samples);
    const ballastMesh = new THREE.Mesh(ballastGeom, ballastMat);
    ballastMesh.receiveShadow = true;
    group.add(ballastMesh);

    const terrainGeom = this.createTerrainGeometry(samples);
    const terrainMesh = new THREE.Mesh(terrainGeom, groundMat);
    terrainMesh.receiveShadow = true;
    group.add(terrainMesh);

    // 2. BROAD GAUGE DOUBLE RUNNING RAILS (Tracks 1 & 2 at -2.5m and +2.5m)
    const trackOffsets = [-2.5, 2.5];
    const { railBodyGeom, railHeadGeom } = this.createRailsGeometry(samples, trackOffsets);
    const railsMesh = new THREE.Mesh(railBodyGeom, railMat);
    const railHeadsMesh = new THREE.Mesh(railHeadGeom, railHeadMat);
    group.add(railsMesh);
    group.add(railHeadsMesh);

    // 3. CONCRETE PSC SLEEPERS (Spacing = 0.65m)
    const sleeperMesh = this.createSleepers(samples, trackOffsets, sleeperMat);
    if (sleeperMesh) group.add(sleeperMesh);

    // 4. 25 kV AC OHE MASTS & WIRES (Every ~50m)
    const oheGroup = this.createOheStructures(samples, steelMat, wireMat);
    group.add(oheGroup);

    // 5. RAILWAY BOUNDARY WALLS
    const wallMesh = this.createBoundaryWalls(samples, wallMat);
    group.add(wallMesh);

    // 6. PROCEDURAL MUMBAI URBAN SURROUNDINGS (Outside walls)
    const urbanGroup = this.createUrbanSurroundings(samples, startDistM, materials);
    group.add(urbanGroup);

    return group;
  }

  /**
   * Creates a smooth continuous ballast trapezoid mesh following the track curve samples.
   */
  private static createBallastGeometry(samples: TrackSample[]): THREE.BufferGeometry {
    const geom = new THREE.BufferGeometry();
    const halfTop = 6.8;
    const halfBase = 8.5;
    const ballastH = 0.35;

    const vertices: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    // Each cross-section has 4 vertices: [Left Base, Left Top, Right Top, Right Base]
    for (let i = 0; i < samples.length; i++) {
      const s = samples[i];
      const p = s.position;
      const r = s.normal;
      const u = s.up;

      const v0 = new THREE.Vector3().copy(p).addScaledVector(r, -halfBase);
      v0.y = Math.max(0, p.y - ballastH);

      const v1 = new THREE.Vector3().copy(p).addScaledVector(r, -halfTop);
      v1.y = p.y;

      const v2 = new THREE.Vector3().copy(p).addScaledVector(r, halfTop);
      v2.y = p.y;

      const v3 = new THREE.Vector3().copy(p).addScaledVector(r, halfBase);
      v3.y = Math.max(0, p.y - ballastH);

      vertices.push(v0.x, v0.y, v0.z);
      vertices.push(v1.x, v1.y, v1.z);
      vertices.push(v2.x, v2.y, v2.z);
      vertices.push(v3.x, v3.y, v3.z);

      const vCoord = i * 0.8;
      uvs.push(0.0, vCoord, 0.3, vCoord, 0.7, vCoord, 1.0, vCoord);

      if (i > 0) {
        const row = i * 4;
        const prev = (i - 1) * 4;
        // Quad 1: Left shoulder (v0 to v1)
        indices.push(prev, prev + 1, row + 1);
        indices.push(prev, row + 1, row);
        // Quad 2: Ballast top (v1 to v2)
        indices.push(prev + 1, prev + 2, row + 2);
        indices.push(prev + 1, row + 2, row + 1);
        // Quad 3: Right shoulder (v2 to v3)
        indices.push(prev + 2, prev + 3, row + 3);
        indices.push(prev + 2, row + 3, row + 2);
      }
    }

    geom.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geom.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
  }

  /**
   * Creates a wide terrain base strip extending 80m on both sides of the railway corridor.
   */
  private static createTerrainGeometry(samples: TrackSample[]): THREE.BufferGeometry {
    const geom = new THREE.BufferGeometry();
    const halfBase = 8.5;
    const outerMargin = 85.0;

    const vertices: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i < samples.length; i++) {
      const s = samples[i];
      const p = s.position;
      const r = s.normal;

      const leftOuter = new THREE.Vector3().copy(p).addScaledVector(r, -outerMargin);
      leftOuter.y = Math.max(0, p.y - 0.4);

      const leftInner = new THREE.Vector3().copy(p).addScaledVector(r, -halfBase);
      leftInner.y = Math.max(0, p.y - 0.35);

      const rightInner = new THREE.Vector3().copy(p).addScaledVector(r, halfBase);
      rightInner.y = Math.max(0, p.y - 0.35);

      const rightOuter = new THREE.Vector3().copy(p).addScaledVector(r, outerMargin);
      rightOuter.y = Math.max(0, p.y - 0.4);

      vertices.push(leftOuter.x, leftOuter.y, leftOuter.z);
      vertices.push(leftInner.x, leftInner.y, leftInner.z);
      vertices.push(rightInner.x, rightInner.y, rightInner.z);
      vertices.push(rightOuter.x, rightOuter.y, rightOuter.z);

      const vCoord = i * 0.4;
      uvs.push(0.0, vCoord, 0.4, vCoord, 0.6, vCoord, 1.0, vCoord);

      if (i > 0) {
        const row = i * 4;
        const prev = (i - 1) * 4;
        // Left flank
        indices.push(prev, prev + 1, row + 1);
        indices.push(prev, row + 1, row);
        // Right flank
        indices.push(prev + 2, prev + 3, row + 3);
        indices.push(prev + 2, row + 3, row + 2);
      }
    }

    geom.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geom.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
  }

  /**
   * Generates continuous Broad Gauge steel rails with shiny running surface heads.
   */
  private static createRailsGeometry(
    samples: TrackSample[],
    trackOffsets: number[]
  ): { railBodyGeom: THREE.BufferGeometry; railHeadGeom: THREE.BufferGeometry } {
    const halfGauge = GAUGE / 2; // 0.838m
    const railW = 0.07;
    const railH = 0.17;
    const railTop = RAIL_TOP_Y;

    const bodyVerts: number[] = [];
    const bodyIdxs: number[] = [];
    const headVerts: number[] = [];
    const headIdxs: number[] = [];

    let bodyVertexOffset = 0;
    let headVertexOffset = 0;

    for (const tOffset of trackOffsets) {
      for (const side of [-1, 1]) {
        const railLateral = tOffset + side * halfGauge;

        // Strip vertices for this rail line
        const startBodyIdx = bodyVertexOffset;
        const startHeadIdx = headVertexOffset;

        for (let i = 0; i < samples.length; i++) {
          const s = samples[i];
          const p = s.position;
          const r = s.normal;

          const center = new THREE.Vector3().copy(p).addScaledVector(r, railLateral);
          const leftPt = new THREE.Vector3().copy(center).addScaledVector(r, -railW / 2);
          const rightPt = new THREE.Vector3().copy(center).addScaledVector(r, railW / 2);

          const yBase = p.y + 0.12;
          const yTop = p.y + railTop;

          // Rail body quad (sides)
          bodyVerts.push(leftPt.x, yBase, leftPt.z);
          bodyVerts.push(leftPt.x, yTop, leftPt.z);
          bodyVerts.push(rightPt.x, yTop, rightPt.z);
          bodyVerts.push(rightPt.x, yBase, rightPt.z);

          // Rail head top quad
          headVerts.push(leftPt.x, yTop + 0.002, leftPt.z);
          headVerts.push(rightPt.x, yTop + 0.002, rightPt.z);

          if (i > 0) {
            const bRow = startBodyIdx + i * 4;
            const bPrev = startBodyIdx + (i - 1) * 4;
            // Left web face
            bodyIdxs.push(bPrev, bPrev + 1, bRow + 1);
            bodyIdxs.push(bPrev, bRow + 1, bRow);
            // Right web face
            bodyIdxs.push(bPrev + 2, bPrev + 3, bRow + 3);
            bodyIdxs.push(bPrev + 2, bRow + 3, bRow + 2);

            const hRow = startHeadIdx + i * 2;
            const hPrev = startHeadIdx + (i - 1) * 2;
            headIdxs.push(hPrev, hPrev + 1, hRow + 1);
            headIdxs.push(hPrev, hRow + 1, hRow);
          }
        }

        bodyVertexOffset += samples.length * 4;
        headVertexOffset += samples.length * 2;
      }
    }

    const railBodyGeom = new THREE.BufferGeometry();
    railBodyGeom.setAttribute("position", new THREE.Float32BufferAttribute(bodyVerts, 3));
    railBodyGeom.setIndex(bodyIdxs);
    railBodyGeom.computeVertexNormals();

    const railHeadGeom = new THREE.BufferGeometry();
    railHeadGeom.setAttribute("position", new THREE.Float32BufferAttribute(headVerts, 3));
    railHeadGeom.setIndex(headIdxs);
    railHeadGeom.computeVertexNormals();

    return { railBodyGeom, railHeadGeom };
  }

  /**
   * Instanced concrete sleepers along the track curve at 0.65m spacing.
   */
  private static createSleepers(
    samples: TrackSample[],
    trackOffsets: number[],
    material: THREE.Material
  ): THREE.InstancedMesh | null {
    const sleeperLength = 2.75;
    const sleeperWidth = 0.26;
    const sleeperHeight = 0.18;
    const geom = new THREE.BoxGeometry(sleeperLength, sleeperHeight, sleeperWidth);

    const spacing = 0.65;
    const totalSamplesLen = samples.length;
    if (totalSamplesLen < 2) return null;

    // Approximate count of sleepers across the chunk
    const chunkDistEst = (totalSamplesLen - 1) * 8.0;
    const sleepersPerTrack = Math.max(1, Math.floor(chunkDistEst / spacing));
    const totalInstances = sleepersPerTrack * trackOffsets.length;

    const instMesh = new THREE.InstancedMesh(geom, material, totalInstances);
    instMesh.receiveShadow = true;
    instMesh.castShadow = true;

    const dummy = new THREE.Object3D();
    let idx = 0;

    for (const tOffset of trackOffsets) {
      for (let k = 0; k < sleepersPerTrack; k++) {
        const u = k / sleepersPerTrack;
        const sIdx = Math.min(totalSamplesLen - 2, Math.floor(u * (totalSamplesLen - 1)));
        const alpha = (u * (totalSamplesLen - 1)) - sIdx;

        const s0 = samples[sIdx];
        const s1 = samples[sIdx + 1];

        const pos = new THREE.Vector3().lerpVectors(s0.position, s1.position, alpha);
        const norm = new THREE.Vector3().lerpVectors(s0.normal, s1.normal, alpha).normalize();
        const tang = new THREE.Vector3().lerpVectors(s0.tangent, s1.tangent, alpha).normalize();

        pos.addScaledVector(norm, tOffset);
        pos.y = pos.y + sleeperHeight / 2 + 0.01;

        dummy.position.copy(pos);
        dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tang);
        dummy.updateMatrix();

        instMesh.setMatrixAt(idx++, dummy.matrix);
      }
    }

    instMesh.instanceMatrix.needsUpdate = true;
    return instMesh;
  }

  /**
   * Generates 25 kV AC OHE masts and continuous catenary/contact wires.
   */
  private static createOheStructures(
    samples: TrackSample[],
    steelMat: THREE.Material,
    wireMat: THREE.Material
  ): THREE.Group {
    const group = new THREE.Group();
    group.name = "ohe-chunk";

    const mastSpacing = 50.0;
    const mastHeight = 8.8;
    const mastLateral = 7.2;

    const contactWirePts: THREE.Vector3[] = [];
    const catenaryWirePts: THREE.Vector3[] = [];

    // Erect mast every ~6 samples (~48m)
    const step = Math.max(2, Math.round(mastSpacing / 8.0));

    for (let i = 0; i < samples.length; i += step) {
      const s = samples[i];
      const p = s.position;
      const r = s.normal;

      // Left portal mast
      const leftCol = new THREE.Mesh(new THREE.BoxGeometry(0.3, mastHeight, 0.3), steelMat);
      leftCol.position.copy(p).addScaledVector(r, -mastLateral);
      leftCol.position.y += mastHeight / 2;
      group.add(leftCol);

      // Right portal mast
      const rightCol = new THREE.Mesh(new THREE.BoxGeometry(0.3, mastHeight, 0.3), steelMat);
      rightCol.position.copy(p).addScaledVector(r, mastLateral);
      rightCol.position.y += mastHeight / 2;
      group.add(rightCol);

      // Horizontal cross portal beam
      const beamW = mastLateral * 2 + 0.6;
      const beam = new THREE.Mesh(new THREE.BoxGeometry(beamW, 0.35, 0.35), steelMat);
      beam.position.copy(p);
      beam.position.y += mastHeight - 0.2;
      beam.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), r);
      group.add(beam);

      // Cantilever insulator drops for track 1 and track 2
      for (const tOffset of [-2.5, 2.5]) {
        const dropPos = new THREE.Vector3().copy(p).addScaledVector(r, tOffset);
        // Contact wire at 5.5m
        contactWirePts.push(new THREE.Vector3(dropPos.x, p.y + RAIL_TOP_Y + 5.5, dropPos.z));
        // Catenary messenger wire at 6.8m
        catenaryWirePts.push(new THREE.Vector3(dropPos.x, p.y + RAIL_TOP_Y + 6.8, dropPos.z));
      }
    }

    // Connect OHE wires
    if (contactWirePts.length >= 4) {
      // Track 1 contact wire
      const t1Contact = contactWirePts.filter((_, idx) => idx % 2 === 0);
      if (t1Contact.length >= 2) {
        const curve = new THREE.CatmullRomCurve3(t1Contact);
        const tubeGeom = new THREE.TubeGeometry(curve, t1Contact.length * 3, 0.015, 4, false);
        group.add(new THREE.Mesh(tubeGeom, wireMat));
      }
      // Track 2 contact wire
      const t2Contact = contactWirePts.filter((_, idx) => idx % 2 === 1);
      if (t2Contact.length >= 2) {
        const curve = new THREE.CatmullRomCurve3(t2Contact);
        const tubeGeom = new THREE.TubeGeometry(curve, t2Contact.length * 3, 0.015, 4, false);
        group.add(new THREE.Mesh(tubeGeom, wireMat));
      }
    }

    return group;
  }

  /**
   * Precast concrete railway boundary walls separating tracks from surrounding city.
   */
  private static createBoundaryWalls(samples: TrackSample[], wallMat: THREE.Material): THREE.Group {
    const group = new THREE.Group();
    const wallLateral = 13.5;
    const wallHeight = 2.4;

    for (const side of [-1, 1]) {
      const wallVerts: number[] = [];
      const wallIdxs: number[] = [];

      for (let i = 0; i < samples.length; i++) {
        const s = samples[i];
        const p = s.position;
        const r = s.normal;

        const base = new THREE.Vector3().copy(p).addScaledVector(r, side * wallLateral);
        const top = new THREE.Vector3().copy(base);
        top.y += wallHeight;

        wallVerts.push(base.x, base.y, base.z);
        wallVerts.push(top.x, top.y, top.z);

        if (i > 0) {
          const row = i * 2;
          const prev = (i - 1) * 2;
          wallIdxs.push(prev, prev + 1, row + 1);
          wallIdxs.push(prev, row + 1, row);
        }
      }

      const geom = new THREE.BufferGeometry();
      geom.setAttribute("position", new THREE.Float32BufferAttribute(wallVerts, 3));
      geom.setIndex(wallIdxs);
      geom.computeVertexNormals();
      group.add(new THREE.Mesh(geom, wallMat));
    }

    return group;
  }

  /**
   * Procedural Mumbai urban environment: Chawls, apartment towers, water tanks, trees.
   */
  private static createUrbanSurroundings(
    samples: TrackSample[],
    seedDist: number,
    materials?: WorldMaterials | null
  ): THREE.Group {
    const group = new THREE.Group();
    group.name = "urban-surroundings";

    const rng = mulberry32(Math.floor(seedDist * 13) + 400001);
    const buildingMat = materials?.building ?? new THREE.MeshStandardMaterial({ color: 0xd9b8a0, roughness: 0.9 });
    const treeMat = materials?.foliage ?? new THREE.MeshStandardMaterial({ color: 0x47662f, roughness: 0.85 });
    const tankMat = materials?.tank ?? new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.5 });

    const step = Math.max(3, Math.round(samples.length / 5));

    for (let i = 0; i < samples.length; i += step) {
      const s = samples[i];
      const p = s.position;
      const r = s.normal;
      const t = s.tangent;

      for (const side of [-1, 1]) {
        // Lateral placement: 22m to 55m from track center
        const lateralDist = side * range(rng, 24, 52);
        const bPos = new THREE.Vector3().copy(p).addScaledVector(r, lateralDist);

        // Building Dimensions
        const width = range(rng, 14, 26);
        const depth = range(rng, 12, 22);
        // Mix of medium-density chawls (12-28m) and tall high-rises (40-85m)
        const isTower = rng() < 0.28;
        const height = isTower ? range(rng, 45, 85) : range(rng, 14, 30);

        const bGeom = new THREE.BoxGeometry(width, height, depth);
        const col = new THREE.Color(pick(rng, PAINTS));
        const bMesh = new THREE.Mesh(
          bGeom,
          new THREE.MeshStandardMaterial({ color: col, roughness: 0.88 })
        );
        bMesh.position.set(bPos.x, p.y + height / 2, bPos.z);
        bMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), t);
        bMesh.castShadow = true;
        bMesh.receiveShadow = true;
        group.add(bMesh);

        // Rooftop Sintex Water Tanks
        const tankCount = 1 + Math.floor(rng() * 3);
        for (let k = 0; k < tankCount; k++) {
          const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.4, 8), tankMat);
          tank.position.set(
            bPos.x + range(rng, -width * 0.3, width * 0.3),
            p.y + height + 0.7,
            bPos.z + range(rng, -depth * 0.3, depth * 0.3)
          );
          group.add(tank);
        }

        // Trackside Tropical Trees (Rain trees & palms)
        if (rng() < 0.75) {
          const treeLateral = side * range(rng, 15.5, 20.0);
          const tPos = new THREE.Vector3().copy(p).addScaledVector(r, treeLateral);
          const treeH = range(rng, 6, 12);

          const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.35, treeH * 0.6, 6),
            new THREE.MeshStandardMaterial({ color: 0x4a3b2c, roughness: 0.9 })
          );
          trunk.position.set(tPos.x, p.y + treeH * 0.3, tPos.z);
          group.add(trunk);

          const foliage = new THREE.Mesh(
            new THREE.DodecahedronGeometry(treeH * 0.5, 1),
            new THREE.MeshStandardMaterial({ color: pick(rng, LEAF_COLORS), roughness: 0.8 })
          );
          foliage.position.set(tPos.x, p.y + treeH * 0.85, tPos.z);
          group.add(foliage);
        }
      }
    }

    return group;
  }
}
