import * as THREE from "three";
import type { StationRecord } from "../data/types";
import { OHEBuilder } from "../OHEBuilder";
import { TrackGeometry } from "../TrackGeometry";

export interface StationBuilderOptions {
  station: StationRecord;
  trackLength?: number;
}

/**
 * Procedural Indian Railways Station Generator.
 * Generates station-specific layouts strictly driven by the StationRecord database.
 */
export class StationBuilder {
  /**
   * Generates a canvas texture for the iconic Indian Railways bilingual station nameboard.
   * Format: Yellow background, black border, Devanagari script on top, English in middle, Hindi/code at bottom.
   */
  static createNameboardTexture(
    englishName: string,
    marathiName: string,
    stationCode: string,
    isProvisional: boolean = false
  ): THREE.CanvasTexture {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 340;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      // Board background: IR Sunflower Yellow (or amber hatch if provisional)
      ctx.fillStyle = isProvisional ? "#fbbf24" : "#ffcc00";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Heavy black outer and inner border
      ctx.strokeStyle = "#111111";
      ctx.lineWidth = 14;
      ctx.strokeRect(7, 7, canvas.width - 14, canvas.height - 14);
      ctx.lineWidth = 4;
      ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);

      // Text styling
      ctx.fillStyle = "#111111";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Marathi (Devanagari)
      ctx.font = "bold 64px 'Noto Sans Devanagari', 'Mukta', sans-serif";
      ctx.fillText(marathiName, canvas.width / 2, 85);

      // English
      ctx.font = "bold 84px 'Big Shoulders Display', 'IBM Plex Sans', sans-serif";
      ctx.fillText(englishName.toUpperCase(), canvas.width / 2, 185);

      // Station code & elevation badge
      ctx.font = "600 36px 'IBM Plex Mono', monospace";
      ctx.fillText(`[ ${stationCode} ]  ·  ELEV. MSL +7M`, canvas.width / 2, 270);

      if (isProvisional) {
        ctx.fillStyle = "#b91c1c";
        ctx.font = "bold 26px 'IBM Plex Mono', monospace";
        ctx.fillText("⚠ PROVISIONAL LAYOUT — UNVERIFIED PLATFORM COUNT", canvas.width / 2, 312);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  /**
   * Builds the complete station environment for the given station record.
   */
  static buildStation(options: StationBuilderOptions): THREE.Group {
    const { station, trackLength = 480 } = options;
    const group = new THREE.Group();
    group.name = `station-${station.stationId}`;

    const isProvisional = station.passengerPlatformCount === null;
    const platformCount = station.passengerPlatformCount ?? 2; // Default to 2 provisional platforms if unverified

    // Dimensions
    const platformLength = 270; // Accommodation for 12/15-car EMU
    const platformHalfLength = platformLength / 2;
    const platformHeight = 1.45; // Match EMU floor level
    const platformWidth = 7.5; // Wide Indian suburban island platform
    const halfWidth = platformWidth / 2;
    const trackSpacing = 4.5;

    // Platform Materials
    const platformCopingMat = new THREE.MeshStandardMaterial({
      color: 0x9e9e9e,
      roughness: 0.85,
      metalness: 0.05,
    });
    const platformSurfaceMat = new THREE.MeshStandardMaterial({
      color: 0x5c5955,
      roughness: 0.9,
    });
    const yellowLineMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.5,
    });
    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0x2e4053,
      roughness: 0.7,
      metalness: 0.3,
    });
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x3d4852,
      roughness: 0.5,
      metalness: 0.8,
    });

    // Compute island platform X positions and track offsets
    // For Kalyan (6 PF), Vasai Road (6 PF), Parel (6 PF): 3 island platforms
    // For Panvel (5 PF), Dombivli (5 PF): 2 island + 1 side platform
    // For LTT (4 PF): 2 island platforms
    // For Provisional (null PF): 1 island platform between 2 provisional tracks
    const islandCount = Math.ceil(platformCount / 2);
    const islandXOffsets: number[] = [];
    const runningTrackXs: number[] = [];

    let currentX = -((islandCount - 1) * (platformWidth + trackSpacing * 2)) / 2;

    for (let i = 0; i < islandCount; i++) {
      const islandX = currentX;
      islandXOffsets.push(islandX);

      // Flanking tracks on left and right of island platform
      const leftTrackX = islandX - (halfWidth + trackSpacing / 2);
      const rightTrackX = islandX + (halfWidth + trackSpacing / 2);

      if (!runningTrackXs.includes(leftTrackX)) runningTrackXs.push(leftTrackX);
      if (!runningTrackXs.includes(rightTrackX)) runningTrackXs.push(rightTrackX);

      currentX += platformWidth + trackSpacing * 2;
    }

    // 1. Build Running Tracks
    runningTrackXs.forEach((trackX) => {
      const start = new THREE.Vector3(trackX, 0, -trackLength / 2);
      const end = new THREE.Vector3(trackX, 0, trackLength / 2);
      const track = TrackGeometry.buildStraightTrack(start, end);
      group.add(track);
    });

    // 2. Build Platforms
    islandXOffsets.forEach((islandX, idx) => {
      const platformGroup = new THREE.Group();
      platformGroup.name = `island-platform-${idx + 1}`;

      // Concrete Platform Deck
      const deckGeom = new THREE.BoxGeometry(platformWidth, platformHeight, platformLength);
      const deck = new THREE.Mesh(deckGeom, platformSurfaceMat);
      deck.position.set(islandX, platformHeight / 2, 0);
      deck.receiveShadow = true;
      deck.castShadow = true;
      platformGroup.add(deck);

      // Concrete Edge Coping stones
      const copingGeom = new THREE.BoxGeometry(0.5, 0.1, platformLength);
      const leftCoping = new THREE.Mesh(copingGeom, platformCopingMat);
      leftCoping.position.set(islandX - halfWidth + 0.25, platformHeight + 0.05, 0);
      const rightCoping = new THREE.Mesh(copingGeom, platformCopingMat);
      rightCoping.position.set(islandX + halfWidth - 0.25, platformHeight + 0.05, 0);
      platformGroup.add(leftCoping, rightCoping);

      // Yellow Commuter Safety Lines (0.7m inset from platform edge)
      const safetyLineGeom = new THREE.PlaneGeometry(0.12, platformLength);
      safetyLineGeom.rotateX(-Math.PI / 2);
      const leftLine = new THREE.Mesh(safetyLineGeom, yellowLineMat);
      leftLine.position.set(islandX - halfWidth + 0.7, platformHeight + 0.101, 0);
      const rightLine = new THREE.Mesh(safetyLineGeom, yellowLineMat);
      rightLine.position.set(islandX + halfWidth - 0.7, platformHeight + 0.101, 0);
      platformGroup.add(leftLine, rightLine);

      // Platform Canopy (Shelter Roof)
      const canopyLength = 180;
      const canopyGeom = new THREE.BoxGeometry(platformWidth + 1.2, 0.18, canopyLength);
      const canopy = new THREE.Mesh(canopyGeom, canopyMat);
      canopy.position.set(islandX, platformHeight + 4.2, 0);
      canopy.castShadow = true;
      platformGroup.add(canopy);

      // Canopy Support Steel Columns
      const columnSpacing = 12;
      const columnCount = Math.floor(canopyLength / columnSpacing);
      const columnGeom = new THREE.CylinderGeometry(0.12, 0.12, 4.2, 8);
      for (let c = -columnCount / 2; c <= columnCount / 2; c++) {
        const colLeft = new THREE.Mesh(columnGeom, steelMat);
        colLeft.position.set(islandX - 1.8, platformHeight + 2.1, c * columnSpacing);
        colLeft.castShadow = true;
        const colRight = new THREE.Mesh(columnGeom, steelMat);
        colRight.position.set(islandX + 1.8, platformHeight + 2.1, c * columnSpacing);
        colRight.castShadow = true;
        platformGroup.add(colLeft, colRight);
      }

      // Station Nameboards (North end, South end, and Middle)
      const boardZPositions = [-platformHalfLength + 20, 0, platformHalfLength - 20];
      const boardTex = StationBuilder.createNameboardTexture(
        station.stationName,
        station.stationNameDevanagari,
        station.stationCode,
        isProvisional
      );
      const boardMat = new THREE.MeshBasicMaterial({ map: boardTex });
      const boardGeom = new THREE.BoxGeometry(4.8, 1.6, 0.12);

      boardZPositions.forEach((bz) => {
        const board = new THREE.Mesh(boardGeom, boardMat);
        board.position.set(islandX, platformHeight + 2.6, bz);
        // Twin hanging posts
        const postGeom = new THREE.CylinderGeometry(0.04, 0.04, 1.6, 6);
        const post1 = new THREE.Mesh(postGeom, steelMat);
        post1.position.set(islandX - 1.8, platformHeight + 3.8, bz);
        const post2 = new THREE.Mesh(postGeom, steelMat);
        post2.position.set(islandX + 1.8, platformHeight + 3.8, bz);
        platformGroup.add(board, post1, post2);
      });

      // Commuter Benches (Blue Indian Railways stainless steel benches)
      const benchMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.4 });
      for (let bz = -60; bz <= 60; bz += 30) {
        const bench = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.45, 0.6), benchMat);
        bench.position.set(islandX, platformHeight + 0.25, bz);
        platformGroup.add(bench);
      }

      // Platform Number Indicators
      const pfNumLeft = idx * 2 + 1;
      const pfNumRight = idx * 2 + 2;
      const pfBadgeGeom = new THREE.BoxGeometry(0.6, 0.6, 0.1);
      const pfBadgeMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
      const pfLeftBadge = new THREE.Mesh(pfBadgeGeom, pfBadgeMat);
      pfLeftBadge.position.set(islandX - halfWidth + 0.4, platformHeight + 3.2, 0);
      const pfRightBadge = new THREE.Mesh(pfBadgeGeom, pfBadgeMat);
      pfRightBadge.position.set(islandX + halfWidth - 0.4, platformHeight + 3.2, 0);
      platformGroup.add(pfLeftBadge, pfRightBadge);

      group.add(platformGroup);
    });

    // 3. Build Overhead Foot Overbridge (FOB) Spanning All Tracks & Platforms
    const minTrackX = Math.min(...runningTrackXs);
    const maxTrackX = Math.max(...runningTrackXs);
    const bridgeSpan = maxTrackX - minTrackX + 14.0;
    const bridgeY = 7.8;
    const bridgeZ = -70;

    const bridgeDeckGeom = new THREE.BoxGeometry(bridgeSpan, 0.4, 4.5);
    const bridgeDeck = new THREE.Mesh(bridgeDeckGeom, platformSurfaceMat);
    bridgeDeck.position.set((minTrackX + maxTrackX) / 2, bridgeY, bridgeZ);
    bridgeDeck.castShadow = true;
    group.add(bridgeDeck);

    // Bridge Roof & Truss
    const bridgeRoof = new THREE.Mesh(
      new THREE.BoxGeometry(bridgeSpan, 0.2, 5.0),
      canopyMat
    );
    bridgeRoof.position.set((minTrackX + maxTrackX) / 2, bridgeY + 3.2, bridgeZ);
    group.add(bridgeRoof);

    // Covered Stairs descending to each island platform
    islandXOffsets.forEach((islandX) => {
      const stairsGeom = new THREE.BoxGeometry(2.8, bridgeY - platformHeight, 8.5);
      stairsGeom.rotateX(-Math.PI / 6);
      const stairs = new THREE.Mesh(stairsGeom, platformSurfaceMat);
      stairs.position.set(islandX, (bridgeY + platformHeight) / 2, bridgeZ + 6.0);
      group.add(stairs);
    });

    // 4. Build 25kV OHE Catenary Masts & Wires for All Station Tracks
    const portalZs = [-180, -120, -60, 0, 60, 120, 180];
    portalZs.forEach((pz) => {
      const portal = OHEBuilder.buildPortal(bridgeSpan);
      portal.position.set((minTrackX + maxTrackX) / 2, 0, pz);
      group.add(portal);
    });

    // String OHE wires between portals for each running track
    for (let i = 0; i < portalZs.length - 1; i++) {
      const z1 = portalZs[i];
      const z2 = portalZs[i + 1];
      runningTrackXs.forEach((tx) => {
        const spanWires = OHEBuilder.buildWireSpan(tx, z1, z2);
        group.add(spanWires);
      });
    }

    // 5. Special Infrastructure for Verified Stations: Pit Lines, Stabling Lines, Sick Lines
    if (station.pitLineCount && station.pitLineCount > 0) {
      const pitYardGroup = new THREE.Group();
      pitYardGroup.name = "maintenance-pit-lines";
      const startPitX = maxTrackX + 6.0;

      for (let p = 0; p < station.pitLineCount; p++) {
        const pitX = startPitX + p * 4.2;
        // Pit trench beneath track
        const trenchGeom = new THREE.BoxGeometry(1.4, 1.2, 220);
        const trenchMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.95 });
        const trench = new THREE.Mesh(trenchGeom, trenchMat);
        trench.position.set(pitX, -0.6, 0);

        // Raised rail pedestals
        const pitTrack = TrackGeometry.buildStraightTrack(
          new THREE.Vector3(pitX, 0, -110),
          new THREE.Vector3(pitX, 0, 110)
        );

        // Red Buffer stop at dead end
        const buffer = StationBuilder.buildBufferStop(pitX, 112);

        pitYardGroup.add(trench, pitTrack, buffer);
      }
      group.add(pitYardGroup);
    }

    // Stabling Lines for Vasai Road (5 lines) or Parel (6 lines)
    if (station.stablingLineCount && station.stablingLineCount > 0) {
      const stablingGroup = new THREE.Group();
      stablingGroup.name = "stabling-yard";
      const startStablingX = minTrackX - 6.0;

      for (let s = 0; s < station.stablingLineCount; s++) {
        const stablingX = startStablingX - s * 4.2;
        const stablingTrack = TrackGeometry.buildStraightTrack(
          new THREE.Vector3(stablingX, 0, -140),
          new THREE.Vector3(stablingX, 0, 140)
        );
        const buffer = StationBuilder.buildBufferStop(stablingX, 142);
        stablingGroup.add(stablingTrack, buffer);
      }
      group.add(stablingGroup);
    }

    // 6. Branch Crossovers for Junctions (Kalyan, Wadala, Mahim)
    if (station.trackLayout === "JUNCTION" && runningTrackXs.length >= 2) {
      const x1 = runningTrackXs[0];
      const x2 = runningTrackXs[1];
      const crossover = TrackGeometry.buildCrossover(x1, x2, 130, 190);
      group.add(crossover);
    }

    return group;
  }

  /**
   * Builds an authentic Indian Railways hydraulic / fixed beam buffer stop.
   */
  static buildBufferStop(trackX: number, z: number): THREE.Group {
    const group = new THREE.Group();
    group.name = `buffer-stop-${trackX}`;

    const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.5 });
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.6, metalness: 0.8 });

    // Steel Buffer A-Frame
    const frameGeom = new THREE.BoxGeometry(2.2, 1.4, 0.4);
    const frame = new THREE.Mesh(frameGeom, steelMat);
    frame.position.set(trackX, 0.8, z);

    // Red Buffer Beam
    const beamGeom = new THREE.BoxGeometry(2.6, 0.45, 0.25);
    const beam = new THREE.Mesh(beamGeom, redMat);
    beam.position.set(trackX, 1.1, z - 0.2);

    // Dual Round Buffer Plates
    const plateGeom = new THREE.CylinderGeometry(0.24, 0.24, 0.1, 16);
    plateGeom.rotateX(Math.PI / 2);
    const leftPlate = new THREE.Mesh(plateGeom, steelMat);
    leftPlate.position.set(trackX - 0.85, 1.1, z - 0.35);
    const rightPlate = new THREE.Mesh(plateGeom, steelMat);
    rightPlate.position.set(trackX + 0.85, 1.1, z - 0.35);

    group.add(frame, beam, leftPlate, rightPlate);
    return group;
  }
}
