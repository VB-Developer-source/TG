/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { CoachType, TRAIN_SPECS } from './TrainConfig';

export class TrainInterior {
  public group: THREE.Group;
  public coachType: CoachType;

  // Materials
  private static sharedSeatMat: THREE.MeshStandardMaterial | null = null;
  private static sharedChromeMat: THREE.MeshStandardMaterial | null = null;
  private static sharedDeskMat: THREE.MeshStandardMaterial | null = null;
  private static sharedFloorMat: THREE.MeshStandardMaterial | null = null;

  constructor(coachType: CoachType) {
    this.group = new THREE.Group();
    this.coachType = coachType;

    if (!TrainInterior.sharedSeatMat) {
      TrainInterior.sharedSeatMat = new THREE.MeshStandardMaterial({
        color: 0x1e3a8a, // Deep blue rexine cushioned bench seats (exact match to interior photo)
        roughness: 0.65,
        metalness: 0.15,
      });
      TrainInterior.sharedChromeMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0, // Polished stainless steel handrails, racks & stanchions
        metalness: 0.95,
        roughness: 0.14,
      });
      TrainInterior.sharedDeskMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.7,
        roughness: 0.4,
      });

      // Checkerplate diamond non-slip metal floor
      const floorCanvas = document.createElement('canvas');
      floorCanvas.width = 256;
      floorCanvas.height = 256;
      const fctx = floorCanvas.getContext('2d');
      if (fctx) {
        fctx.fillStyle = '#64748b';
        fctx.fillRect(0, 0, 256, 256);
        fctx.strokeStyle = '#475569';
        fctx.lineWidth = 2;
        for (let i = 0; i <= 256; i += 16) {
          fctx.beginPath();
          fctx.moveTo(i, 0);
          fctx.lineTo(i + 8, 256);
          fctx.stroke();
        }
      }
      const floorTex = new THREE.CanvasTexture(floorCanvas);
      floorTex.wrapS = THREE.RepeatWrapping;
      floorTex.wrapT = THREE.RepeatWrapping;
      floorTex.repeat.set(4, 25);
      floorTex.colorSpace = THREE.SRGBColorSpace;
      TrainInterior.sharedFloorMat = new THREE.MeshStandardMaterial({
        map: floorTex,
        metalness: 0.75,
        roughness: 0.35,
      });
    }

    this.buildPassengerSaloon();

    if (coachType === 'DMC' || coachType === 'DTC') {
      this.buildDriverCabin(coachType === 'DTC');
    }
  }

  /**
   * 1. Passenger Saloon (Exact Match to Attached Interior Photo image_4fdf2990.png)
   */
  private buildPassengerSaloon() {
    const W = TRAIN_SPECS.coachWidth;
    const L = TRAIN_SPECS.coachLength;
    const floorY = TRAIN_SPECS.platformOffset + 0.55;
    const ceilingY = floorY + 2.5;

    const seatMat = TrainInterior.sharedSeatMat!;
    const chromeMat = TrainInterior.sharedChromeMat!;
    const floorMat = TrainInterior.sharedFloorMat!;

    // Diamond plate interior floor surface
    const floorOverlayGeo = new THREE.PlaneGeometry(W - 0.2, L - 0.5);
    const floorOverlay = new THREE.Mesh(floorOverlayGeo, floorMat);
    floorOverlay.rotation.x = -Math.PI / 2;
    floorOverlay.position.set(0, floorY + 0.08, 0);
    floorOverlay.receiveShadow = true;
    this.group.add(floorOverlay);

    // Transverse 3x3 Seating Bays spaced between door portals
    const bayZPositions = [-7.5, -2.5, 2.5, 7.5];
    bayZPositions.forEach((bz) => {
      // Left 3-seater bench (Deep blue vinyl)
      const seatLeft = this.createSeatingUnit(1.35, 0.48);
      seatLeft.position.set(-W / 2 + 0.8, floorY + 0.08, bz);
      this.group.add(seatLeft);

      // Right 3-seater bench
      const seatRight = this.createSeatingUnit(1.35, 0.48);
      seatRight.position.set(W / 2 - 0.8, floorY + 0.08, bz);
      this.group.add(seatRight);

      // Overhead Wire-Mesh Luggage Racks (with horizontal stainless steel tubes)
      [-W / 2 + 0.45, W / 2 - 0.45].forEach((rx) => {
        const rackGeo = new THREE.BoxGeometry(0.55, 0.03, 3.4);
        const rackMesh = new THREE.Mesh(rackGeo, chromeMat);
        rackMesh.position.set(rx, floorY + 2.05, bz);
        this.group.add(rackMesh);
      });

      // Vertical Tubular Partition Frames separating doorway from seat bays (Visible in photo!)
      [-W / 2 + 0.8, W / 2 - 0.8].forEach((px) => {
        [-1.8, 1.8].forEach((pzOffset) => {
          const partFrame = this.createDoorwayPartition();
          partFrame.position.set(px, floorY + 0.08, bz + pzOffset);
          this.group.add(partFrame);
        });
      });
    });

    // Two Parallel Rows of Rotary Ceiling Fans (Exact match to interior photo!)
    [-0.65, 0.65].forEach((fx) => {
      for (let fz = -L / 2 + 2.8; fz <= L / 2 - 2.8; fz += 2.8) {
        const fan = this.createCeilingFan();
        fan.position.set(fx, ceilingY - 0.14, fz);
        this.group.add(fan);
      }
    });

    // Dual Longitudinal Overhead Grab Rail Tubes (with hanging oval grab loops/straps)
    [-0.55, 0.55].forEach((hx) => {
      const tubeGeo = new THREE.CylinderGeometry(0.02, 0.02, L - 3.5, 12);
      tubeGeo.rotateX(Math.PI / 2);
      const tubeMesh = new THREE.Mesh(tubeGeo, chromeMat);
      tubeMesh.position.set(hx, floorY + 2.15, 0);
      this.group.add(tubeMesh);

      // Hanging Handhold Straps every 1.2m
      for (let s = -L / 2 + 2.4; s <= L / 2 - 2.4; s += 1.2) {
        const strapGroup = new THREE.Group();
        strapGroup.position.set(hx, floorY + 2.02, s);

        // Stainless steel bracket
        const bracketGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.16);
        const bracket = new THREE.Mesh(bracketGeo, chromeMat);
        strapGroup.add(bracket);

        // Stainless steel oval loop / ring
        const loopGeo = new THREE.TorusGeometry(0.08, 0.012, 8, 16);
        const loop = new THREE.Mesh(loopGeo, chromeMat);
        loop.position.y = -0.16;
        strapGroup.add(loop);

        this.group.add(strapGroup);
      }
    });

    // Central Overhead LCD Passenger Information Monitors (Mounted to ceiling down the center)
    [-5.0, 0, 5.0].forEach((mz) => {
      const monitorGroup = new THREE.Group();
      monitorGroup.position.set(0, ceilingY - 0.28, mz);

      const caseGeo = new THREE.BoxGeometry(0.7, 0.4, 0.1);
      const caseMesh = new THREE.Mesh(caseGeo, new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9 }));
      monitorGroup.add(caseMesh);

      const screenGeo = new THREE.PlaneGeometry(0.62, 0.32);
      const screenMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 }); // Cyan/Blue information screen
      const screenFront = new THREE.Mesh(screenGeo, screenMat);
      screenFront.position.z = 0.052;
      monitorGroup.add(screenFront);

      const screenBack = new THREE.Mesh(screenGeo, screenMat);
      screenBack.position.z = -0.052;
      screenBack.rotation.y = Math.PI;
      monitorGroup.add(screenBack);

      this.group.add(monitorGroup);
    });
  }

  private createSeatingUnit(width: number, depth: number): THREE.Group {
    const group = new THREE.Group();
    const seatMat = TrainInterior.sharedSeatMat!;
    const chromeMat = TrainInterior.sharedChromeMat!;

    // Seat Cushion Base (Deep blue vinyl)
    const cushionGeo = new THREE.BoxGeometry(width, 0.12, depth);
    const cushion = new THREE.Mesh(cushionGeo, seatMat);
    cushion.position.set(0, 0.44, 0);
    cushion.castShadow = true;
    group.add(cushion);

    // Ergonomic Backrest
    const backGeo = new THREE.BoxGeometry(width, 0.48, 0.08);
    const back = new THREE.Mesh(backGeo, seatMat);
    back.position.set(0, 0.74, -depth / 2 + 0.04);
    group.add(back);

    // Tubular Stainless Steel Armrests and Support Legs
    [-width / 2 + 0.05, width / 2 - 0.05].forEach((lx) => {
      const legGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.44);
      const leg = new THREE.Mesh(legGeo, chromeMat);
      leg.position.set(lx, 0.22, 0);
      group.add(leg);

      const armGeo = new THREE.CylinderGeometry(0.018, 0.018, depth);
      armGeo.rotateX(Math.PI / 2);
      const arm = new THREE.Mesh(armGeo, chromeMat);
      arm.position.set(lx, 0.65, 0);
      group.add(arm);
    });

    return group;
  }

  private createDoorwayPartition(): THREE.Group {
    const part = new THREE.Group();
    const chromeMat = TrainInterior.sharedChromeMat!;

    // Vertical Frame Pipes
    [-0.5, 0.5].forEach((vx) => {
      const vGeo = new THREE.CylinderGeometry(0.022, 0.022, 2.0);
      const vPipe = new THREE.Mesh(vGeo, chromeMat);
      vPipe.position.set(vx, 1.0, 0);
      part.add(vPipe);
    });

    // 5 Horizontal Grille Bars (Matching photo)
    for (let h = 0.5; h <= 1.8; h += 0.3) {
      const hGeo = new THREE.CylinderGeometry(0.014, 0.014, 1.0);
      hGeo.rotateZ(Math.PI / 2);
      const hPipe = new THREE.Mesh(hGeo, chromeMat);
      hPipe.position.set(0, h, 0);
      part.add(hPipe);
    }

    return part;
  }

  private createCeilingFan(): THREE.Group {
    const fanGroup = new THREE.Group();
    const chromeMat = TrainInterior.sharedChromeMat!;

    // Motor Hub
    const hubGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16);
    const hub = new THREE.Mesh(hubGeo, chromeMat);
    fanGroup.add(hub);

    // Circular Wire-Mesh Cage (Visible in photo)
    const cageGeo = new THREE.TorusGeometry(0.28, 0.015, 8, 20);
    const cage = new THREE.Mesh(cageGeo, chromeMat);
    cage.rotation.x = Math.PI / 2;
    fanGroup.add(cage);

    // 3 Fan Blades
    for (let b = 0; b < 3; b++) {
      const bladeGeo = new THREE.BoxGeometry(0.24, 0.01, 0.06);
      const blade = new THREE.Mesh(bladeGeo, chromeMat);
      blade.position.x = 0.15;
      blade.rotation.y = (b * Math.PI * 2) / 3;
      fanGroup.add(blade);
    }

    return fanGroup;
  }

  /**
   * 2. Driver Cabin (Console Desk, Throttle/Brake, Gauges, Driver Seat)
   */
  private buildDriverCabin(isRear: boolean = false) {
    const halfL = TRAIN_SPECS.coachLength / 2;
    const floorY = TRAIN_SPECS.platformOffset + 0.55;
    const cabZ = isRear ? -halfL + 0.8 : halfL - 0.8;

    const cabGroup = new THREE.Group();
    cabGroup.position.set(0, floorY, cabZ);
    if (isRear) cabGroup.rotation.y = Math.PI;

    const deskMat = TrainInterior.sharedDeskMat!;
    const chromeMat = TrainInterior.sharedChromeMat!;

    // Driver Control Desk Console (Sloped Dashboard)
    const deskGeo = new THREE.BoxGeometry(2.4, 0.95, 0.85);
    const desk = new THREE.Mesh(deskGeo, deskMat);
    desk.position.set(0, 0.48, 0.4);
    desk.castShadow = true;
    cabGroup.add(desk);

    // Dashboard Instrument Panel
    const panelGeo = new THREE.BoxGeometry(2.1, 0.35, 0.45);
    const panel = new THREE.Mesh(panelGeo, new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 }));
    panel.position.set(0, 0.95, 0.4);
    panel.rotation.x = -0.3;
    cabGroup.add(panel);

    // Digital Speedometer Display Screen (Active green/cyan backlight)
    const speedoScreenGeo = new THREE.PlaneGeometry(0.35, 0.22);
    const speedoMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const speedoScreen = new THREE.Mesh(speedoScreenGeo, speedoMat);
    speedoScreen.position.set(0, 1.05, 0.52);
    speedoScreen.rotation.x = -0.3;
    cabGroup.add(speedoScreen);

    // Analog Pressure Gauges (Brake Pipe, Main Reservoir, 25kV OHE Voltage)
    [-0.55, -0.28, 0.28, 0.55].forEach((gx) => {
      const gaugeGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.02, 16);
      gaugeGeo.rotateX(Math.PI / 2);
      const gauge = new THREE.Mesh(gaugeGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 }));
      gauge.position.set(gx, 1.02, 0.48);
      cabGroup.add(gauge);
    });

    // Master Controller (Traction Throttle & Dynamic Brake Handle)
    const throttleBaseGeo = new THREE.BoxGeometry(0.18, 0.25, 0.22);
    const throttleBase = new THREE.Mesh(throttleBaseGeo, deskMat);
    throttleBase.position.set(-0.65, 0.98, 0.15);
    cabGroup.add(throttleBase);

    const handleGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.25);
    const handle = new THREE.Mesh(handleGeo, chromeMat);
    handle.position.set(-0.65, 1.15, 0.15);
    handle.rotation.z = 0.25;
    cabGroup.add(handle);

    // Automatic Air Brake Valve Handle
    const brakeHandle = new THREE.Mesh(handleGeo, new THREE.MeshStandardMaterial({ color: 0xef4444 }));
    brakeHandle.position.set(0.65, 1.15, 0.15);
    brakeHandle.rotation.z = -0.2;
    cabGroup.add(brakeHandle);

    // Driver High-Back Seat
    const seatGroup = new THREE.Group();
    seatGroup.position.set(0, 0, -0.45);

    const seatCushionGeo = new THREE.BoxGeometry(0.55, 0.12, 0.55);
    const seatCushion = new THREE.Mesh(seatCushionGeo, TrainInterior.sharedSeatMat!);
    seatCushion.position.set(0, 0.48, 0);
    seatGroup.add(seatCushion);

    const seatBackGeo = new THREE.BoxGeometry(0.55, 0.75, 0.1);
    const seatBack = new THREE.Mesh(seatBackGeo, TrainInterior.sharedSeatMat!);
    seatBack.position.set(0, 0.88, -0.22);
    seatGroup.add(seatBack);

    const pedGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.48);
    const ped = new THREE.Mesh(pedGeo, chromeMat);
    ped.position.set(0, 0.24, 0);
    seatGroup.add(ped);

    cabGroup.add(seatGroup);

    // Partition Wall
    const partGeo = new THREE.BoxGeometry(TRAIN_SPECS.coachWidth, 2.5, 0.08);
    const part = new THREE.Mesh(partGeo, new THREE.MeshStandardMaterial({ color: 0x334155 }));
    part.position.set(0, 1.25, -0.85);
    cabGroup.add(part);

    this.group.add(cabGroup);
  }
}
