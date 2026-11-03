/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { AssetManager } from './AssetManager';
import { Train } from '../train/Train';
import { TrainBuilder } from '../train/TrainBuilder';

export class World {
  public group: THREE.Group;
  public stationTrain: Train | null = null;
  private assetManager: AssetManager;
  private trackLength: number = 240; // Meters along Z
  private gauge: number = 1.676; // Indian Broad Gauge (1676 mm)

  // Track positions: Track 1 (Center rail, main view) and Track 2 (Right parallel line)
  public trackX1: number = 0;
  public trackX2: number = 3.8;

  constructor(assetManager: AssetManager) {
    this.group = new THREE.Group();
    this.assetManager = assetManager;

    this.buildTerrainAndBallast();
    this.buildBroadGaugeTracks();
    this.buildOHECatenarySystem();
    this.buildMumbaiStationPlatform();
    this.buildRightRetainingWallAndShanties();
    this.buildFootOverbridge();
    this.buildUrbanEnvironment();
    this.buildStationTrain();
  }

  /**
   * Builds an authentic Mumbai Local Train standing on Track 2 (or down the line)
   * so Track 1 foreground remains clear for the iconic track-level perspective.
   */
  private buildStationTrain() {
    this.stationTrain = TrainBuilder.build({
      coachCount: 6,
      livery: 'western',
      position: new THREE.Vector3(this.trackX2, 0, 15),
    });
    this.group.add(this.stationTrain.group);
  }

  /**
   * 1. Ground Terrain & Ballast Bed Embankment
   */
  private buildTerrainAndBallast() {
    // Large expansive ground preventing floating void
    const groundGeo = new THREE.PlaneGeometry(450, 450, 16, 16);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x3d352e, // Warm dusty Mumbai soil
      roughness: 0.95,
      metalness: 0.05,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    this.group.add(ground);

    // Elevated Ballast Bed (Trapezoidal prism with sloping shoulders across both tracks)
    const ballastShape = new THREE.Shape();
    ballastShape.moveTo(-2.4, 0);
    ballastShape.lineTo(-1.9, 0.42);
    ballastShape.lineTo(5.7, 0.42);
    ballastShape.lineTo(6.2, 0);
    ballastShape.closePath();

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      steps: 1,
      depth: this.trackLength,
      bevelEnabled: false,
    };

    const ballastGeo = new THREE.ExtrudeGeometry(ballastShape, extrudeSettings);
    ballastGeo.translate(0, 0, -this.trackLength / 2);

    const ballastTex = this.assetManager.getTexture('ballast');
    const ballastMat = new THREE.MeshStandardMaterial({
      color: 0x484440,
      map: ballastTex || null,
      roughness: 0.92,
      metalness: 0.08,
    });
    const ballastMesh = new THREE.Mesh(ballastGeo, ballastMat);
    ballastMesh.receiveShadow = true;
    this.group.add(ballastMesh);
  }

  /**
   * 2. Broad Gauge Rails & Concrete Sleepers
   */
  private buildBroadGaugeTracks() {
    // Standard 60kg Indian Railways UIC rail profile
    const railShape = new THREE.Shape();
    railShape.moveTo(-0.075, 0);
    railShape.lineTo(0.075, 0);
    railShape.lineTo(0.07, 0.025);
    railShape.lineTo(0.015, 0.04);
    railShape.lineTo(0.015, 0.12);
    railShape.lineTo(0.035, 0.14);
    railShape.lineTo(0.035, 0.17);
    railShape.lineTo(-0.035, 0.17);
    railShape.lineTo(-0.035, 0.14);
    railShape.lineTo(-0.015, 0.12);
    railShape.lineTo(-0.015, 0.04);
    railShape.lineTo(-0.07, 0.025);
    railShape.closePath();

    const railGeo = new THREE.ExtrudeGeometry(railShape, {
      steps: 1,
      depth: this.trackLength,
      bevelEnabled: false,
    });
    railGeo.translate(0, 0, -this.trackLength / 2);

    // Highly realistic polished steel rail material (reflective top running surface)
    const railMat = new THREE.MeshStandardMaterial({
      color: 0x949da6,
      metalness: 0.94,
      roughness: 0.20,
    });

    // Create 4 rails (Track 1 & Track 2)
    const railOffsets = [
      this.trackX1 - this.gauge / 2,
      this.trackX1 + this.gauge / 2,
      this.trackX2 - this.gauge / 2,
      this.trackX2 + this.gauge / 2,
    ];

    railOffsets.forEach((x) => {
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(x, 0.52, 0);
      rail.castShadow = true;
      rail.receiveShadow = true;
      this.group.add(rail);
    });

    // Pre-stressed Concrete Sleepers using InstancedMesh
    const sleeperSpacing = 0.65;
    const sleeperCountPerTrack = Math.floor(this.trackLength / sleeperSpacing);
    const totalSleepers = sleeperCountPerTrack * 2;

    const sleeperGeo = new THREE.BoxGeometry(2.75, 0.16, 0.24);
    const sleeperTex = this.assetManager.getTexture('sleeper');
    const sleeperMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      map: sleeperTex || null,
      roughness: 0.85,
      metalness: 0.15,
    });

    const sleeperInstanced = new THREE.InstancedMesh(sleeperGeo, sleeperMat, totalSleepers);
    sleeperInstanced.castShadow = true;
    sleeperInstanced.receiveShadow = true;

    const dummy = new THREE.Object3D();
    let idx = 0;

    // Track 1 Sleepers
    for (let i = 0; i < sleeperCountPerTrack; i++) {
      const z = -this.trackLength / 2 + i * sleeperSpacing;
      dummy.position.set(this.trackX1, 0.44, z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      sleeperInstanced.setMatrixAt(idx++, dummy.matrix);
    }

    // Track 2 Sleepers
    for (let i = 0; i < sleeperCountPerTrack; i++) {
      const z = -this.trackLength / 2 + i * sleeperSpacing;
      dummy.position.set(this.trackX2, 0.44, z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      sleeperInstanced.setMatrixAt(idx++, dummy.matrix);
    }

    sleeperInstanced.instanceMatrix.needsUpdate = true;
    sleeperInstanced.computeBoundingSphere();
    this.group.add(sleeperInstanced);
  }

  /**
   * 3. 25kV AC Overhead Equipment (OHE) Catenary System & Portal Masts
   */
  private buildOHECatenarySystem() {
    const mastSpacing = 28;
    const mastCount = Math.floor(this.trackLength / mastSpacing);

    const mastTex = this.assetManager.getTexture('steel_mast');
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      map: mastTex || null,
      metalness: 0.85,
      roughness: 0.35,
    });

    const insulatorMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.4,
      metalness: 0.2,
    });

    const copperMat = new THREE.MeshStandardMaterial({
      color: 0xb45309,
      metalness: 0.9,
      roughness: 0.3,
    });

    const messengerMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.85,
      roughness: 0.4,
    });

    // Build OHE Portal Gantries spanning from Left platform boundary to Right retaining wall
    for (let i = 0; i <= mastCount; i++) {
      const z = -this.trackLength / 2 + i * mastSpacing;
      const mastGroup = new THREE.Group();

      const mastHeight = 8.4;
      const leftMastX = -8.5;
      const rightMastX = 6.2;
      const portalSpan = rightMastX - leftMastX;

      // Left Vertical Lattice Mast
      const leftMastGeo = new THREE.BoxGeometry(0.28, mastHeight, 0.32);
      const leftMast = new THREE.Mesh(leftMastGeo, steelMat);
      leftMast.position.set(leftMastX, mastHeight / 2, z);
      leftMast.castShadow = true;
      mastGroup.add(leftMast);

      // Right Vertical Mast
      const rightMastGeo = new THREE.BoxGeometry(0.28, mastHeight, 0.32);
      const rightMast = new THREE.Mesh(rightMastGeo, steelMat);
      rightMast.position.set(rightMastX, mastHeight / 2, z);
      rightMast.castShadow = true;
      mastGroup.add(rightMast);

      // Horizontal Lattice Truss Beam spanning across both tracks
      const beamGeo = new THREE.BoxGeometry(portalSpan, 0.35, 0.25);
      const beam = new THREE.Mesh(beamGeo, steelMat);
      beam.position.set((leftMastX + rightMastX) / 2, 7.8, z);
      beam.castShadow = true;
      mastGroup.add(beam);

      // Cantilever Drop Brackets & Porcelain Insulators above each track
      [this.trackX1, this.trackX2].forEach((trackCenterX) => {
        const dropRodGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.4);
        const dropRod = new THREE.Mesh(dropRodGeo, steelMat);
        dropRod.position.set(trackCenterX, 7.1, z);
        dropRod.castShadow = true;
        mastGroup.add(dropRod);

        const insGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.45, 8);
        const insulator = new THREE.Mesh(insGeo, insulatorMat);
        insulator.position.set(trackCenterX, 6.7, z);
        mastGroup.add(insulator);

        const regArmGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.7);
        const regArm = new THREE.Mesh(regArmGeo, steelMat);
        regArm.rotation.z = Math.PI / 4;
        regArm.position.set(trackCenterX - 0.2, 5.75, z);
        mastGroup.add(regArm);
      });

      this.group.add(mastGroup);
    }

    // Continuous Overhead Electric Cables
    [this.trackX1, this.trackX2].forEach((trackX) => {
      // 1. Contact Wire (Bottom, height = 5.65m)
      const contactWireGeo = new THREE.CylinderGeometry(0.012, 0.012, this.trackLength, 6);
      contactWireGeo.rotateX(Math.PI / 2);
      const contactWire = new THREE.Mesh(contactWireGeo, copperMat);
      contactWire.position.set(trackX, 5.65, 0);
      this.group.add(contactWire);

      // 2. Catenary Messenger Cable (Upper, height = 6.85m)
      const catenaryWireGeo = new THREE.CylinderGeometry(0.015, 0.015, this.trackLength, 6);
      catenaryWireGeo.rotateX(Math.PI / 2);
      const catenaryWire = new THREE.Mesh(catenaryWireGeo, messengerMat);
      catenaryWire.position.set(trackX, 6.85, 0);
      this.group.add(catenaryWire);

      // 3. Droppers every 4 meters
      const dropperCount = Math.floor(this.trackLength / 4);
      for (let d = 0; d < dropperCount; d++) {
        const dz = -this.trackLength / 2 + d * 4;
        const dropGeo = new THREE.CylinderGeometry(0.005, 0.005, 1.2);
        const dropper = new THREE.Mesh(dropGeo, copperMat);
        dropper.position.set(trackX, 6.25, dz);
        this.group.add(dropper);
      }
    });
  }

  /**
   * 4. Mumbai Suburban Island Platform 2 / 3 (Dadar) on the LEFT of Track 1
   * Matches Screenshot 1: green/teal pitched canopy, yellow "दादर / DADAR" board facing Track 1
   */
  private buildMumbaiStationPlatform() {
    const platformGroup = new THREE.Group();
    const platformLength = 160;
    const platformWidth = 6.4;
    const platformHeight = 1.05;

    // Platform Base: x from -1.95 to -8.35
    const platformGeo = new THREE.BoxGeometry(platformWidth, platformHeight, platformLength);
    const platformTex = this.assetManager.getTexture('platform');
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      map: platformTex || null,
      roughness: 0.8,
      metalness: 0.1,
    });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.set(-1.95 - platformWidth / 2, platformHeight / 2, 0);
    platform.receiveShadow = true;
    platformGroup.add(platform);

    // Platform Yellow Safety Coping Stone Edge along Track 1
    const curbGeo = new THREE.BoxGeometry(0.32, platformHeight + 0.02, platformLength);
    const curbMat = new THREE.MeshStandardMaterial({
      color: 0xeab308, // Bright yellow safety edge
      roughness: 0.6,
    });
    const curb = new THREE.Mesh(curbGeo, curbMat);
    curb.position.set(-1.98, platformHeight / 2, 0);
    platformGroup.add(curb);

    // Station Canopy Roof (Dark Green/Teal classic corrugated canopy matching Screenshot 1)
    const canopyLength = 135;
    const canopyHeight = 4.8;
    const canopyCenterX = -5.15;

    // Green painted steel columns down the center of the platform
    const colSpacing = 12;
    const colCount = Math.floor(canopyLength / colSpacing);
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x1e3932, // Dark teal-green
      metalness: 0.75,
      roughness: 0.35,
    });

    for (let c = 0; c <= colCount; c++) {
      const pz = -canopyLength / 2 + c * colSpacing;

      // Heavy Column
      const pillarGeo = new THREE.CylinderGeometry(0.18, 0.18, canopyHeight - platformHeight);
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(canopyCenterX, platformHeight + (canopyHeight - platformHeight) / 2, pz);
      pillar.castShadow = true;
      platformGroup.add(pillar);

      // Angled cantilever trusses
      const trussGeo = new THREE.BoxGeometry(5.8, 0.14, 0.14);
      const truss = new THREE.Mesh(trussGeo, pillarMat);
      truss.position.set(canopyCenterX, canopyHeight, pz);
      truss.castShadow = true;
      platformGroup.add(truss);
    }

    // Corrugated Roof Sheets (Dark green butterfly / pitched slope)
    const roofWingGeo = new THREE.BoxGeometry(3.6, 0.08, canopyLength);
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x1b332c, // Dark green/teal corrugated canopy
      metalness: 0.5,
      roughness: 0.6,
    });

    // Right roof wing (facing track 1)
    const rightRoof = new THREE.Mesh(roofWingGeo, roofMat);
    rightRoof.position.set(canopyCenterX + 1.7, canopyHeight + 0.25, 0);
    rightRoof.rotation.z = -0.12;
    rightRoof.castShadow = true;
    platformGroup.add(rightRoof);

    // Left roof wing
    const leftRoof = new THREE.Mesh(roofWingGeo, roofMat);
    leftRoof.position.set(canopyCenterX - 1.7, canopyHeight + 0.25, 0);
    leftRoof.rotation.z = 0.12;
    leftRoof.castShadow = true;
    platformGroup.add(leftRoof);

    // Station Name Boards (Dadar / दादर) facing Track 1
    const boardPositions = [-40, 0, 40];
    const boardTex = this.assetManager.getTexture('station_board_dadar');
    const boardMat = new THREE.MeshBasicMaterial({ map: boardTex || null });

    boardPositions.forEach((bz) => {
      const boardGroup = new THREE.Group();
      const boardGeo = new THREE.BoxGeometry(0.08, 1.1, 4.2);
      const board = new THREE.Mesh(boardGeo, boardMat);
      board.position.set(-3.6, 2.9, bz);
      board.castShadow = true;
      boardGroup.add(board);

      // Hanging stanchions from canopy
      const rod1 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.4), pillarMat);
      rod1.position.set(-3.6, 3.8, bz - 1.5);
      const rod2 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.4), pillarMat);
      rod2.position.set(-3.6, 3.8, bz + 1.5);
      boardGroup.add(rod1, rod2);

      platformGroup.add(boardGroup);
    });

    // Platform Amenities: Waiting Benches
    const benchPositions = [-50, -25, -10, 15, 30, 55];
    benchPositions.forEach((bz) => {
      const bench = this.createPlatformBench();
      bench.position.set(-5.15, platformHeight, bz);
      platformGroup.add(bench);
    });

    // Station Analog Clock
    const clock = this.createStationClock();
    clock.position.set(-5.15, 3.8, 12);
    platformGroup.add(clock);

    this.group.add(platformGroup);
  }

  /**
   * 5. Right-Side Concrete Retaining Wall, Low-Poly Bushes, and Shanties
   * Matches Screenshot 1 & 2 on the right of the tracks
   */
  private buildRightRetainingWallAndShanties() {
    const wallGroup = new THREE.Group();
    const wallX = 6.2;
    const wallHeight = 2.4;

    // Concrete Retaining Wall with horizontal line segments
    const wallGeo = new THREE.BoxGeometry(0.4, wallHeight, this.trackLength);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.9,
      metalness: 0.1,
    });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(wallX, wallHeight / 2, 0);
    wall.receiveShadow = true;
    wall.castShadow = true;
    wallGroup.add(wall);

    // Wall coping capstone
    const capGeo = new THREE.BoxGeometry(0.55, 0.18, this.trackLength);
    const capMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.set(wallX, wallHeight + 0.09, 0);
    wallGroup.add(cap);

    // Low-poly green icosahedron bushes along the wall (identical to Screenshot 1 & 2)
    const bushGeo = new THREE.IcosahedronGeometry(0.85, 1);
    const bushMat1 = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.85, flatShading: true });
    const bushMat2 = new THREE.MeshStandardMaterial({ color: 0x388e3c, roughness: 0.85, flatShading: true });

    const bushCount = 35;
    for (let b = 0; b < bushCount; b++) {
      const bz = -this.trackLength / 2 + (b / bushCount) * this.trackLength + (Math.sin(b * 3) * 2);
      const bush = new THREE.Mesh(bushGeo, b % 2 === 0 ? bushMat1 : bushMat2);
      const scale = 0.75 + Math.abs(Math.sin(b * 1.5)) * 0.65;
      bush.scale.set(scale, scale * 1.1, scale);
      bush.position.set(wallX + 0.65, wallHeight + 0.45 * scale, bz);
      bush.castShadow = true;
      wallGroup.add(bush);
    }

    // Shanties and huts with colorful corrugated roofs along the wall perimeter
    const roofColors = [0x1d4ed8, 0xb45309, 0x475569, 0x0284c7, 0x78350f];
    const hutCount = 28;
    for (let h = 0; h < hutCount; h++) {
      const hz = -this.trackLength / 2 + h * 8.5;
      const hutWidth = 3.2 + (h % 3) * 0.8;
      const hutDepth = 4.0;
      const hutHeight = 2.2;

      // Hut body
      const bodyGeo = new THREE.BoxGeometry(hutWidth, hutHeight, hutDepth);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.95 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.set(wallX + 1.2 + hutWidth / 2, hutHeight / 2, hz);
      body.castShadow = true;
      body.receiveShadow = true;
      wallGroup.add(body);

      // Angled corrugated tin roof
      const tinGeo = new THREE.BoxGeometry(hutWidth + 0.4, 0.08, hutDepth + 0.3);
      const tinMat = new THREE.MeshStandardMaterial({
        color: roofColors[h % roofColors.length],
        metalness: 0.6,
        roughness: 0.5,
      });
      const tinRoof = new THREE.Mesh(tinGeo, tinMat);
      tinRoof.position.set(wallX + 1.2 + hutWidth / 2, hutHeight + 0.15, hz);
      tinRoof.rotation.z = 0.14;
      tinRoof.castShadow = true;
      wallGroup.add(tinRoof);
    }

    this.group.add(wallGroup);
  }

  private createPlatformBench(): THREE.Group {
    const bench = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.7 });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.8, roughness: 0.4 });

    const seatGeo = new THREE.BoxGeometry(0.5, 0.05, 2.0);
    const seat = new THREE.Mesh(seatGeo, woodMat);
    seat.position.set(0, 0.45, 0);
    seat.castShadow = true;
    bench.add(seat);

    const backGeo = new THREE.BoxGeometry(0.05, 0.35, 2.0);
    const back = new THREE.Mesh(backGeo, woodMat);
    back.position.set(0.22, 0.72, 0);
    back.castShadow = true;
    bench.add(back);

    [-0.8, 0.8].forEach((lz) => {
      const legGeo = new THREE.BoxGeometry(0.55, 0.45, 0.06);
      const leg = new THREE.Mesh(legGeo, ironMat);
      leg.position.set(0.05, 0.22, lz);
      leg.castShadow = true;
      bench.add(leg);
    });

    return bench;
  }

  private createStationClock(): THREE.Group {
    const clockGroup = new THREE.Group();
    const frameGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.2, 24);
    frameGeo.rotateZ(Math.PI / 2);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.8 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    clockGroup.add(frame);

    const dialGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.21, 24);
    dialGeo.rotateZ(Math.PI / 2);
    const dialMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
    const dial = new THREE.Mesh(dialGeo, dialMat);
    clockGroup.add(dial);

    const armGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.8);
    const arm = new THREE.Mesh(armGeo, frameMat);
    arm.position.set(0, 0.6, 0);
    clockGroup.add(arm);

    return clockGroup;
  }

  /**
   * 6. Pedestrian Foot Overbridge (FOB) across tracks
   */
  private buildFootOverbridge() {
    const fobGroup = new THREE.Group();
    const fobZ = 75;
    const bridgeHeight = 7.6;
    const spanWidth = 26;

    const steelMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.8, roughness: 0.35 });

    const spanGeo = new THREE.BoxGeometry(spanWidth, 2.4, 3.2);
    const span = new THREE.Mesh(spanGeo, steelMat);
    span.position.set(-1.0, bridgeHeight, fobZ);
    span.castShadow = true;
    fobGroup.add(span);

    const roofGeo = new THREE.BoxGeometry(spanWidth + 0.4, 0.2, 3.6);
    const roof = new THREE.Mesh(roofGeo, new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 }));
    roof.position.set(-1.0, bridgeHeight + 1.3, fobZ);
    fobGroup.add(roof);

    [-9.0, 7.0].forEach((px) => {
      const pGeo = new THREE.BoxGeometry(0.8, bridgeHeight, 0.8);
      const pillar = new THREE.Mesh(pGeo, steelMat);
      pillar.position.set(px, bridgeHeight / 2, fobZ);
      pillar.castShadow = true;
      fobGroup.add(pillar);
    });

    this.group.add(fobGroup);
  }

  /**
   * 7. Dense Urban Mumbai Residential Chawl Buildings flanking BOTH sides
   * Matches Screenshot 1 & 2: warm pastel tones, grid windows, balconies, Sintex tanks
   */
  private buildUrbanEnvironment() {
    const envGroup = new THREE.Group();

    // Authentic Mumbai facade palette
    const buildingColors = [
      0xfef3c7, // Pale cream
      0xfde68a, // Soft warm yellow
      0xfed7aa, // Mumbai terracotta / ochre
      0xe2e8f0, // Weathered concrete grey
      0xdcfce7, // Sage pastel green
      0xffedd5, // Peach / sand
    ];

    const windowMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.2,
    });

    const tankMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Black plastic Sintex water tank
      roughness: 0.4,
    });

    // Helper to generate a detailed Mumbai apartment chawl building
    const createApartmentBuilding = (w: number, h: number, d: number, color: number) => {
      const bGroup = new THREE.Group();

      const bGeo = new THREE.BoxGeometry(w, h, d);
      const bMat = new THREE.MeshStandardMaterial({ color, roughness: 0.85 });
      const bMesh = new THREE.Mesh(bGeo, bMat);
      bMesh.position.y = h / 2;
      bMesh.castShadow = true;
      bMesh.receiveShadow = true;
      bGroup.add(bMesh);

      // Floor horizontal relief bands
      const floorCount = Math.floor(h / 3.2);
      for (let fl = 1; fl < floorCount; fl++) {
        const bandGeo = new THREE.BoxGeometry(w + 0.15, 0.12, d + 0.15);
        const bandMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9 });
        const band = new THREE.Mesh(bandGeo, bandMat);
        band.position.y = fl * 3.2;
        bGroup.add(band);
      }

      // Grid windows on the front track-facing facade
      const cols = Math.floor(d / 2.6);
      for (let fl = 1; fl < floorCount; fl++) {
        for (let c = 0; c < cols; c++) {
          const wz = -d / 2 + (c + 0.5) * 2.6;
          const winGeo = new THREE.BoxGeometry(0.12, 1.3, 1.2);
          const win = new THREE.Mesh(winGeo, windowMat);
          win.position.set(-w / 2 - 0.05, fl * 3.2 - 1.2, wz);
          bGroup.add(win);

          // Hanging colorful laundry banner on alternate floors (vibrant Mumbai lifestyle detail)
          if ((fl + c) % 3 === 0) {
            const laundryColors = [0xef4444, 0x3b82f6, 0xf59e0b, 0x10b981];
            const clothGeo = new THREE.BoxGeometry(0.08, 0.45, 0.85);
            const clothMat = new THREE.MeshBasicMaterial({ color: laundryColors[(fl + c) % laundryColors.length] });
            const cloth = new THREE.Mesh(clothGeo, clothMat);
            cloth.position.set(-w / 2 - 0.12, fl * 3.2 - 2.1, wz);
            bGroup.add(cloth);
          }
        }
      }

      // Rooftop water tank
      const tankGeo = new THREE.CylinderGeometry(1.2, 1.2, 1.8, 12);
      const tank = new THREE.Mesh(tankGeo, tankMat);
      tank.position.set(0, h + 0.9, 0);
      bGroup.add(tank);

      return bGroup;
    };

    // Right-Side Dense Residential Rows (x = 11 to 45)
    for (let i = 0; i < 22; i++) {
      const bw = 10 + (i % 3) * 3;
      const bd = 12 + ((i * 2) % 4) * 2.5;
      const bh = 18 + ((i * 3) % 6) * 4.2;
      const bx = 12 + (i % 2) * 14 + (i % 3) * 2;
      const bz = -this.trackLength / 2 + i * 11;
      const col = buildingColors[i % buildingColors.length];

      const building = createApartmentBuilding(bw, bh, bd, col);
      building.position.set(bx + bw / 2, 0, bz);
      envGroup.add(building);
    }

    // Left-Side Dense Residential Rows (behind platform, x = -13 to -50)
    for (let i = 0; i < 20; i++) {
      const bw = 11 + (i % 3) * 3;
      const bd = 12 + ((i * 3) % 4) * 2.5;
      const bh = 18 + ((i * 2) % 6) * 4.2;
      const bx = -14 - (i % 2) * 14 - (i % 3) * 2;
      const bz = -this.trackLength / 2 + i * 12;
      const col = buildingColors[(i + 2) % buildingColors.length];

      const building = createApartmentBuilding(bw, bh, bd, col);
      building.position.set(bx - bw / 2, 0, bz);
      envGroup.add(building);
    }

    // Coconut Palms along trackside boundaries
    const palmCount = 20;
    for (let p = 0; p < palmCount; p++) {
      const palm = this.createCoconutPalm();
      const px = p % 2 === 0 ? -12.5 : 8.2;
      const pz = -this.trackLength / 2 + (p / palmCount) * this.trackLength + 3;
      palm.position.set(px, 0, pz);
      envGroup.add(palm);
    }

    this.group.add(envGroup);
  }

  /**
   * Procedural Composite Coconut Palm Tree
   */
  private createCoconutPalm(): THREE.Group {
    const palm = new THREE.Group();
    const trunkHeight = 8 + Math.random() * 3.5;
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x785338, roughness: 0.9 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.6 });

    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.2, trunkHeight * 0.4, 0.1),
      new THREE.Vector3(0.6, trunkHeight * 0.75, 0.4),
      new THREE.Vector3(0.8, trunkHeight, 0.5),
    ]);

    const trunkGeo = new THREE.TubeGeometry(curve, 8, 0.2, 8, false);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.castShadow = true;
    palm.add(trunk);

    const crownTop = new THREE.Vector3(0.8, trunkHeight, 0.5);
    const frondCount = 7;
    for (let f = 0; f < frondCount; f++) {
      const angle = (f / frondCount) * Math.PI * 2;
      const frondGeo = new THREE.ConeGeometry(0.8, 3.2, 4);
      frondGeo.translate(0, 1.6, 0);
      frondGeo.rotateX(Math.PI / 2.6);

      const frond = new THREE.Mesh(frondGeo, leafMat);
      frond.position.copy(crownTop);
      frond.rotation.y = angle;
      frond.castShadow = true;
      palm.add(frond);
    }

    return palm;
  }

  public update(delta: number) {
    this.stationTrain?.update(delta);
  }

  public dispose() {
    this.stationTrain?.dispose();
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry?.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material?.dispose();
        }
      }
    });
  }
}
