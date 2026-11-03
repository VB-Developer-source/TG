/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { CoachType, LiveryTheme, TRAIN_SPECS } from './TrainConfig';

export class TrainExterior {
  public group: THREE.Group;
  public coachType: CoachType;
  public livery: LiveryTheme;
  public slidingDoors: THREE.Group[] = [];

  // Materials
  private bodyMat!: THREE.MeshStandardMaterial;
  private cabMat!: THREE.MeshStandardMaterial;
  private accentMat!: THREE.MeshStandardMaterial;
  private doorMat!: THREE.MeshStandardMaterial;
  private roofMat!: THREE.MeshStandardMaterial;
  private windowMat!: THREE.MeshStandardMaterial;
  private underbodyMat!: THREE.MeshStandardMaterial;
  private barMat!: THREE.MeshStandardMaterial;
  private chromeMat!: THREE.MeshStandardMaterial;

  constructor(coachType: CoachType, livery: LiveryTheme) {
    this.group = new THREE.Group();
    this.coachType = coachType;
    this.livery = livery;

    this.initMaterials();
    this.buildCoachShell();
    this.buildRoof();
    this.buildWindowsAndDoors();
    this.buildUnderbodyEquipment();
    this.buildCouplersAndGangways();

    if (coachType === 'DMC' || coachType === 'DTC') {
      this.buildCabFront(coachType === 'DTC');
    }
  }

  private initMaterials() {
    this.bodyMat = new THREE.MeshStandardMaterial({
      color: this.livery.primaryColor,
      metalness: 0.45,
      roughness: 0.35,
    });

    this.cabMat = new THREE.MeshStandardMaterial({
      color: this.livery.cabColor,
      metalness: 0.5,
      roughness: 0.35,
    });

    this.accentMat = new THREE.MeshStandardMaterial({
      color: this.livery.accentColor,
      metalness: 0.55,
      roughness: 0.3,
    });

    this.doorMat = new THREE.MeshStandardMaterial({
      color: this.livery.doorColor,
      metalness: 0.55,
      roughness: 0.35,
    });

    this.roofMat = new THREE.MeshStandardMaterial({
      color: this.livery.roofColor,
      metalness: 0.8,
      roughness: 0.45,
    });

    this.windowMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      transparent: true,
      opacity: 0.65,
      roughness: 0.1,
      metalness: 0.9,
    });

    this.underbodyMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.5,
    });

    this.barMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.92,
      roughness: 0.18,
    });

    this.chromeMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      metalness: 0.95,
      roughness: 0.12,
    });
  }

  public updateLivery(newLivery: LiveryTheme) {
    this.livery = newLivery;
    this.bodyMat.color.setHex(newLivery.primaryColor);
    this.cabMat.color.setHex(newLivery.cabColor);
    this.accentMat.color.setHex(newLivery.accentColor);
    this.doorMat.color.setHex(newLivery.doorColor);
    this.roofMat.color.setHex(newLivery.roofColor);
  }

  /**
   * 1. Main Coach Body Shell (White Body with Magenta/Violet Waist & Eaves Stripes)
   */
  private buildCoachShell() {
    const W = TRAIN_SPECS.coachWidth;   // 3.66m
    const H = 2.65;                      // Saloon wall height
    const L = TRAIN_SPECS.coachLength;  // 21.3m
    const floorY = TRAIN_SPECS.platformOffset + 0.55; // ~1.2m above rail

    // Main Side Walls (Left and Right)
    [-W / 2, W / 2].forEach((xOffset, sideIdx) => {
      // Lower side skirting panel with fluted/ribbed corrugations
      const skirtGeo = new THREE.BoxGeometry(0.08, 0.85, L);
      const skirtMesh = new THREE.Mesh(skirtGeo, this.bodyMat);
      skirtMesh.position.set(xOffset, floorY + 0.42, 0);
      skirtMesh.castShadow = true;
      this.group.add(skirtMesh);

      // Fluted stainless steel ribs on lower skirt
      for (let r = 0.15; r <= 0.65; r += 0.14) {
        const ribGeo = new THREE.BoxGeometry(0.088, 0.035, L);
        const rib = new THREE.Mesh(ribGeo, this.chromeMat);
        rib.position.set(xOffset, floorY + r, 0);
        this.group.add(rib);
      }

      // Bold Magenta / Violet Waistline Belt Stripe (Matching reference image)
      const waistStripeGeo = new THREE.BoxGeometry(0.086, 0.32, L);
      const waistStripe = new THREE.Mesh(waistStripeGeo, this.accentMat);
      waistStripe.position.set(xOffset, floorY + 0.95, 0);
      this.group.add(waistStripe);

      // Upper Eaves Magenta / Violet Stripe
      const eavesStripeGeo = new THREE.BoxGeometry(0.086, 0.18, L);
      const eavesStripe = new THREE.Mesh(eavesStripeGeo, this.accentMat);
      eavesStripe.position.set(xOffset, floorY + H - 0.1, 0);
      this.group.add(eavesStripe);

      // Upper Window Belt Panel (White)
      const upperGeo = new THREE.BoxGeometry(0.08, 0.35, L);
      const upperMesh = new THREE.Mesh(upperGeo, this.bodyMat);
      upperMesh.position.set(xOffset, floorY + H - 0.38, 0);
      upperMesh.castShadow = true;
      this.group.add(upperMesh);

      // Large Bold Line Code Logo ("WR" or "CR") on side panel
      const logoCanvas = document.createElement('canvas');
      logoCanvas.width = 256;
      logoCanvas.height = 128;
      const lctx = logoCanvas.getContext('2d');
      if (lctx) {
        lctx.fillStyle = '#' + this.livery.accentColor.toString(16).padStart(6, '0');
        lctx.fillRect(0, 0, 256, 128);
        lctx.fillStyle = '#ffffff';
        lctx.font = 'bold 90px "Rajdhani", sans-serif';
        lctx.textAlign = 'center';
        lctx.fillText(this.livery.lineCode, 128, 92);
      }
      const logoTex = new THREE.CanvasTexture(logoCanvas);
      logoTex.colorSpace = THREE.SRGBColorSpace;
      const logoMat = new THREE.MeshBasicMaterial({ map: logoTex, transparent: true });

      [-5.5, 5.5].forEach((lz) => {
        const logoPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.6), logoMat);
        logoPlane.position.set(xOffset + (sideIdx === 0 ? -0.045 : 0.045), floorY + 0.95, lz);
        if (sideIdx === 0) logoPlane.rotation.y = -Math.PI / 2;
        else logoPlane.rotation.y = Math.PI / 2;
        this.group.add(logoPlane);
      });

      // Ladies Coach / Class Identification Striping
      if (this.coachType === 'TC' && sideIdx === 1) {
        const ladiesGeo = new THREE.BoxGeometry(0.089, 0.34, 4.5);
        const ladiesMat = new THREE.MeshStandardMaterial({
          color: this.livery.ladiesColor,
          roughness: 0.4,
        });
        const ladiesBand = new THREE.Mesh(ladiesGeo, ladiesMat);
        ladiesBand.position.set(xOffset, floorY + 0.95, 2.5);
        this.group.add(ladiesBand);
      }
    });

    // Floor Base Slab
    const floorGeo = new THREE.BoxGeometry(W, 0.15, L);
    const floorMesh = new THREE.Mesh(floorGeo, this.underbodyMat);
    floorMesh.position.set(0, floorY, 0);
    floorMesh.receiveShadow = true;
    this.group.add(floorMesh);
  }

  /**
   * 2. Corrugated Arched Roof
   */
  private buildRoof() {
    const W = TRAIN_SPECS.coachWidth;
    const L = TRAIN_SPECS.coachLength;
    const roofY = TRAIN_SPECS.platformOffset + 0.55 + 2.65; // ~3.85m

    // Arched Roof Profile
    const roofGeo = new THREE.CylinderGeometry(W * 0.65, W * 0.65, L, 24, 1, false, 0, Math.PI);
    roofGeo.rotateZ(Math.PI / 2);
    roofGeo.rotateY(Math.PI / 2);

    const roofMesh = new THREE.Mesh(roofGeo, this.roofMat);
    roofMesh.position.set(0, roofY - 0.2, 0);
    roofMesh.scale.set(0.85, 0.38, 1);
    roofMesh.castShadow = true;
    this.group.add(roofMesh);

    // Longitudinal Corrugation Ribs along Roof
    for (let r = -1.2; r <= 1.2; r += 0.4) {
      const ribGeo = new THREE.BoxGeometry(0.04, 0.04, L);
      const ribMesh = new THREE.Mesh(ribGeo, this.roofMat);
      ribMesh.position.set(r, roofY + 0.38 - Math.abs(r) * 0.12, 0);
      this.group.add(ribMesh);
    }

    // Circular Roof Exhaust Ventilators (Mushroom vents)
    const ventSpacing = 3.5;
    const ventCount = Math.floor(L / ventSpacing);
    for (let v = 0; v < ventCount; v++) {
      const vz = -L / 2 + 2.2 + v * ventSpacing;
      const ventGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.14, 16);
      const ventMesh = new THREE.Mesh(ventGeo, this.roofMat);
      ventMesh.position.set(0, roofY + 0.45, vz);
      ventMesh.castShadow = true;
      this.group.add(ventMesh);
    }
  }

  /**
   * 3. Doors & Windows (with iconic Mumbai 3-bar safety grilles!)
   */
  private buildWindowsAndDoors() {
    const W = TRAIN_SPECS.coachWidth;
    const L = TRAIN_SPECS.coachLength;
    const floorY = TRAIN_SPECS.platformOffset + 0.55;
    const doorCount = TRAIN_SPECS.doorsPerSide; // 4 wide doors per side
    const doorSpacing = L / doorCount;          // ~5.32m
    const halfL = L / 2;

    [-W / 2, W / 2].forEach((xOffset, sideIdx) => {
      const signX = sideIdx === 0 ? -1 : 1;

      // 4 Double-Leaf Sliding Doors in Magenta/Purple
      for (let d = 0; d < doorCount; d++) {
        const doorZ = -halfL + doorSpacing / 2 + d * doorSpacing;
        const doorGroup = new THREE.Group();
        doorGroup.position.set(xOffset, floorY + 1.05, doorZ);

        // Door Frame
        const frameGeo = new THREE.BoxGeometry(0.09, TRAIN_SPECS.doorHeight + 0.1, TRAIN_SPECS.doorWidth + 0.15);
        const frameMesh = new THREE.Mesh(frameGeo, this.accentMat);
        doorGroup.add(frameMesh);

        // Left and Right Sliding Door Leaves (Magenta/Purple)
        const leafW = TRAIN_SPECS.doorWidth / 2 - 0.02;
        const leafGeo = new THREE.BoxGeometry(0.04, TRAIN_SPECS.doorHeight - 0.05, leafW);

        const leftLeaf = new THREE.Mesh(leafGeo, this.doorMat);
        leftLeaf.position.set(signX * 0.03, 0, -leafW / 2);
        doorGroup.add(leftLeaf);

        const rightLeaf = new THREE.Mesh(leafGeo, this.doorMat);
        rightLeaf.position.set(signX * 0.03, 0, leafW / 2);
        doorGroup.add(rightLeaf);

        // Rounded glass window on each door leaf
        [-leafW / 2, leafW / 2].forEach((lz) => {
          const winGeo = new THREE.BoxGeometry(0.045, 0.7, 0.35);
          const winMesh = new THREE.Mesh(winGeo, this.windowMat);
          winMesh.position.set(signX * 0.03, 0.35, lz);
          doorGroup.add(winMesh);
        });

        // Store reference for interactive open/close animation
        this.slidingDoors.push(doorGroup);
        this.group.add(doorGroup);
      }

      // Windows between doors (with iconic 3-bar aluminum safety grilles)
      for (let bay = 0; bay <= doorCount; bay++) {
        let bayStartZ = -halfL + bay * doorSpacing + TRAIN_SPECS.doorWidth / 2 + 0.3;
        let bayEndZ = -halfL + (bay + 1) * doorSpacing - TRAIN_SPECS.doorWidth / 2 - 0.3;

        if (bay === 0) bayStartZ = -halfL + 0.6;
        if (bay === doorCount) bayEndZ = halfL - 0.6;

        const bayLen = bayEndZ - bayStartZ;
        if (bayLen > 1.2) {
          const winCount = Math.floor(bayLen / 1.1);
          const winSpacing = bayLen / (winCount + 1);

          for (let w = 1; w <= winCount; w++) {
            const winZ = bayStartZ + w * winSpacing;

            // Glass Window Pane
            const winGeo = new THREE.BoxGeometry(0.06, 0.95, 0.85);
            const winMesh = new THREE.Mesh(winGeo, this.windowMat);
            winMesh.position.set(xOffset, floorY + 1.55, winZ);
            this.group.add(winMesh);

            // Iconic Mumbai Local 3-Bar Aluminum Safety Grille!
            [-0.22, 0, 0.22].forEach((barY) => {
              const barGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.85);
              barGeo.rotateX(Math.PI / 2);
              const barMesh = new THREE.Mesh(barGeo, this.barMat);
              barMesh.position.set(xOffset + signX * 0.035, floorY + 1.55 + barY, winZ);
              this.group.add(barMesh);
            });
          }
        }
      }
    });
  }

  /**
   * 4. Underbody Electrical & Pneumatic Equipment
   */
  private buildUnderbodyEquipment() {
    const underY = TRAIN_SPECS.platformOffset + 0.18; // ~0.83m above rail
    const underMat = this.underbodyMat;

    // 1. Air Brake Main Reservoir Cylinders
    [-0.8, 0.8].forEach((x) => {
      const tankGeo = new THREE.CylinderGeometry(0.32, 0.32, 2.8, 16);
      tankGeo.rotateX(Math.PI / 2);
      const tank = new THREE.Mesh(tankGeo, underMat);
      tank.position.set(x, underY, -2.5);
      tank.castShadow = true;
      this.group.add(tank);
    });

    // 2. Auxiliary Converter / Inverter Cabinet Box
    const boxGeo = new THREE.BoxGeometry(1.6, 0.7, 2.4);
    const boxMesh = new THREE.Mesh(boxGeo, underMat);
    boxMesh.position.set(0, underY - 0.05, 2.2);
    boxMesh.castShadow = true;
    this.group.add(boxMesh);

    // 3. Battery Box Tray
    const batteryGeo = new THREE.BoxGeometry(1.4, 0.55, 1.8);
    const batteryMesh = new THREE.Mesh(batteryGeo, underMat);
    batteryMesh.position.set(0, underY, -5.8);
    batteryMesh.castShadow = true;
    this.group.add(batteryMesh);

    // 4. Traction Motor Cooling Duct
    const ductGeo = new THREE.BoxGeometry(1.5, 0.4, 1.2);
    const ductMesh = new THREE.Mesh(ductGeo, underMat);
    ductMesh.position.set(0, underY, 5.8);
    this.group.add(ductMesh);
  }

  /**
   * 5. Couplers & Inter-Coach Gangways
   */
  private buildCouplersAndGangways() {
    const halfL = TRAIN_SPECS.coachLength / 2;
    const floorY = TRAIN_SPECS.platformOffset + 0.55;

    [-halfL, halfL].forEach((cz, idx) => {
      const isFrontOrRearCab = (this.coachType === 'DMC' && idx === 1) || (this.coachType === 'DTC' && idx === 0);
      const dirSign = idx === 1 ? 1 : -1;

      // Center Schaku / Screw Coupler
      const couplerGroup = new THREE.Group();
      couplerGroup.position.set(0, floorY - 0.2, cz + dirSign * 0.45);

      const shankGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.9);
      shankGeo.rotateX(Math.PI / 2);
      const shank = new THREE.Mesh(shankGeo, this.underbodyMat);
      couplerGroup.add(shank);

      const headGeo = new THREE.BoxGeometry(0.35, 0.28, 0.35);
      const head = new THREE.Mesh(headGeo, this.underbodyMat);
      head.position.z = dirSign * 0.45;
      couplerGroup.add(head);

      this.group.add(couplerGroup);

      // Flexible Rubber Gangway Bellows between coaches
      if (!isFrontOrRearCab) {
        const bellowGeo = new THREE.BoxGeometry(1.6, 2.2, 0.4);
        const bellowMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.95 });
        const bellow = new THREE.Mesh(bellowGeo, bellowMat);
        bellow.position.set(0, floorY + 1.15, cz + dirSign * 0.2);
        this.group.add(bellow);
      }
    });
  }

  /**
   * 6. Authentic Mumbai Suburban Cab Front (Matching Attached Image image_a9d1ea4d.png)
   */
  private buildCabFront(isRearCab: boolean = false) {
    const W = TRAIN_SPECS.coachWidth;
    const halfL = TRAIN_SPECS.coachLength / 2;
    const floorY = TRAIN_SPECS.platformOffset + 0.55;
    const cabZ = isRearCab ? -halfL : halfL;

    const cabGroup = new THREE.Group();
    cabGroup.position.set(0, 0, cabZ);
    if (isRearCab) cabGroup.rotation.y = Math.PI;

    // 1. Aerodynamic Yellow Nose Shield (The iconic Mumbai EMU yellow face)
    const noseGeo = new THREE.BoxGeometry(W, 2.5, 1.4);
    const noseMesh = new THREE.Mesh(noseGeo, this.cabMat);
    noseMesh.position.set(0, floorY + 1.25, 0.7);
    noseMesh.castShadow = true;
    cabGroup.add(noseMesh);

    // White Cab Roof Crown & Side Pillars
    const crownGeo = new THREE.BoxGeometry(W + 0.02, 0.35, 1.45);
    const crownMesh = new THREE.Mesh(crownGeo, this.bodyMat);
    crownMesh.position.set(0, floorY + 2.5, 0.7);
    cabGroup.add(crownMesh);

    // 2. Black Headlight Housing Mask Band across lower nose (Exact match to photo)
    const maskGeo = new THREE.BoxGeometry(W * 0.88, 0.48, 0.12);
    const maskMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.4 });
    const maskMesh = new THREE.Mesh(maskGeo, maskMat);
    maskMesh.position.set(0, floorY + 1.05, 1.42);
    cabGroup.add(maskMesh);

    // Dual Twin Round Headlights with Chrome Bezels (Outer left & outer right)
    [-1.25, -0.95, 0.95, 1.25].forEach((hx) => {
      // Chrome surround ring
      const bezelGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.04, 16);
      bezelGeo.rotateX(Math.PI / 2);
      const bezel = new THREE.Mesh(bezelGeo, this.chromeMat);
      bezel.position.set(hx, floorY + 1.05, 1.48);
      cabGroup.add(bezel);

      // Glass lens
      const lensGeo = new THREE.CylinderGeometry(0.10, 0.10, 0.05, 16);
      lensGeo.rotateX(Math.PI / 2);
      const lensMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffedd5,
        emissiveIntensity: 2.5,
        roughness: 0.1,
      });
      const lens = new THREE.Mesh(lensGeo, lensMat);
      lens.position.set(hx, floorY + 1.05, 1.49);
      cabGroup.add(lens);
    });

    // Red Center Marker Lights in Black Mask
    [-0.35, 0.35].forEach((mx) => {
      const mGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.04, 12);
      mGeo.rotateX(Math.PI / 2);
      const mMat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        emissive: 0xef4444,
        emissiveIntensity: 2.0,
      });
      const marker = new THREE.Mesh(mGeo, mMat);
      marker.position.set(mx, floorY + 1.05, 1.48);
      cabGroup.add(marker);
    });

    // 3. Two Large Front Windshield Panes with Black Rubber Beadings & Wipers
    [-0.75, 0.75].forEach((wx) => {
      // Black rubber gasket frame
      const frameGeo = new THREE.BoxGeometry(1.2, 0.95, 0.06);
      const frame = new THREE.Mesh(frameGeo, maskMat);
      frame.position.set(wx, floorY + 1.85, 1.41);
      frame.rotation.x = -0.15;
      cabGroup.add(frame);

      // Glass pane
      const paneGeo = new THREE.BoxGeometry(1.1, 0.85, 0.08);
      const pane = new THREE.Mesh(paneGeo, this.windowMat);
      pane.position.set(wx, floorY + 1.85, 1.42);
      pane.rotation.x = -0.15;
      cabGroup.add(pane);

      // Black windshield wiper
      const wiperGeo = new THREE.BoxGeometry(0.02, 0.55, 0.02);
      const wiper = new THREE.Mesh(wiperGeo, maskMat);
      wiper.position.set(wx, floorY + 1.7, 1.46);
      wiper.rotation.z = 0.35;
      cabGroup.add(wiper);
    });

    // 4. Roof-Mounted Red Air Horn Bells (Prominent in reference photo!)
    [-0.7, 0.7].forEach((hx, idx) => {
      const hornGroup = new THREE.Group();
      hornGroup.position.set(hx, floorY + 2.7, 1.15);

      const hornMat = new THREE.MeshStandardMaterial({ color: 0xbe123c, metalness: 0.8, roughness: 0.3 }); // Red horn bell
      const bellGeo = new THREE.ConeGeometry(0.12, 0.35, 12);
      bellGeo.rotateX(Math.PI / 2);
      const bell = new THREE.Mesh(bellGeo, hornMat);
      hornGroup.add(bell);

      const stalkGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.15);
      const stalk = new THREE.Mesh(stalkGeo, this.chromeMat);
      stalk.position.set(0, -0.08, -0.1);
      hornGroup.add(stalk);

      cabGroup.add(hornGroup);
    });

    // 5. Electronic Destination Display LED Board (Above Windshield)
    const destBoxGeo = new THREE.BoxGeometry(1.9, 0.45, 0.2);
    const destBox = new THREE.Mesh(destBoxGeo, new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9 }));
    destBox.position.set(0, floorY + 2.45, 1.25);
    cabGroup.add(destBox);

    const destCanvas = document.createElement('canvas');
    destCanvas.width = 512;
    destCanvas.height = 128;
    const dctx = destCanvas.getContext('2d');
    if (dctx) {
      dctx.fillStyle = '#0f172a';
      dctx.fillRect(0, 0, 512, 128);
      dctx.fillStyle = '#f59e0b'; // Amber LED Matrix
      dctx.font = 'bold 40px "Rajdhani", sans-serif';
      dctx.textAlign = 'center';
      dctx.fillText(this.livery.destinationText, 256, 52);
      dctx.font = 'bold 34px "Noto Sans Devanagari", sans-serif';
      dctx.fillText(this.livery.destinationHindi, 256, 104);
    }
    const destTex = new THREE.CanvasTexture(destCanvas);
    destTex.colorSpace = THREE.SRGBColorSpace;
    const destScreenMat = new THREE.MeshStandardMaterial({
      map: destTex,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.9,
    });
    const destScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.4), destScreenMat);
    destScreen.position.set(0, floorY + 2.45, 1.36);
    cabGroup.add(destScreen);

    // 6. Front Buffer Beam with Dual Circular Side Buffer Plates & Center Screw Coupler
    const bufferBeamGeo = new THREE.BoxGeometry(W * 0.95, 0.32, 0.25);
    const bufferBeam = new THREE.Mesh(bufferBeamGeo, this.underbodyMat);
    bufferBeam.position.set(0, floorY - 0.15, 1.32);
    cabGroup.add(bufferBeam);

    // Dual Round Side Buffer Plates (Exact match to Indian Railways EMU photo)
    [-1.05, 1.05].forEach((bx) => {
      const bufferGroup = new THREE.Group();
      bufferGroup.position.set(bx, floorY - 0.15, 1.45);

      const shankGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.35, 12);
      shankGeo.rotateX(Math.PI / 2);
      const shank = new THREE.Mesh(shankGeo, this.underbodyMat);
      bufferGroup.add(shank);

      const plateGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.04, 20);
      plateGeo.rotateX(Math.PI / 2);
      const plate = new THREE.Mesh(plateGeo, this.underbodyMat);
      plate.position.z = 0.18;
      bufferGroup.add(plate);

      cabGroup.add(bufferGroup);
    });

    // 7. Heavy Cowcatcher / Cattle Guard with Vertical Grille Bars
    const cowcatcherGroup = new THREE.Group();
    cowcatcherGroup.position.set(0, floorY - 0.48, 1.35);

    // Frame
    const ccFrameGeo = new THREE.BoxGeometry(W * 0.88, 0.06, 0.4);
    const ccFrame = new THREE.Mesh(ccFrameGeo, this.underbodyMat);
    cowcatcherGroup.add(ccFrame);

    // Vertical Tubular Grille Bars
    for (let g = -W * 0.4; g <= W * 0.4; g += 0.16) {
      const barH = 0.38 - Math.abs(g) * 0.08;
      const ccBarGeo = new THREE.CylinderGeometry(0.016, 0.016, barH);
      const ccBar = new THREE.Mesh(ccBarGeo, this.underbodyMat);
      ccBar.position.set(g, -barH / 2, Math.abs(g) * 0.15);
      cowcatcherGroup.add(ccBar);
    }
    cabGroup.add(cowcatcherGroup);

    // 8. Round Indian Railways Crest Emblem on Cab Quarter (Matching photo)
    [-W / 2 - 0.01, W / 2 + 0.01].forEach((qx, idx) => {
      const crestGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.02, 16);
      crestGeo.rotateZ(Math.PI / 2);
      const crestMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8 }); // Blue IR crest
      const crest = new THREE.Mesh(crestGeo, crestMat);
      crest.position.set(qx, floorY + 0.95, 0.7);
      cabGroup.add(crest);
    });

    this.group.add(cabGroup);
  }

  /**
   * Set sliding doors open ratio (0.0 = fully closed, 1.0 = fully open)
   */
  public setDoorsOpenRatio(ratio: number) {
    const clamped = Math.max(0, Math.min(1, ratio));
    const maxSlide = (TRAIN_SPECS.doorWidth / 2) * 0.95; // ~0.68m slide

    this.slidingDoors.forEach((doorGroup) => {
      const leftLeaf = doorGroup.children[1];
      const rightLeaf = doorGroup.children[2];
      if (leftLeaf && rightLeaf) {
        const baseLeft = -TRAIN_SPECS.doorWidth / 4;
        const baseRight = TRAIN_SPECS.doorWidth / 4;
        leftLeaf.position.z = baseLeft - clamped * maxSlide;
        rightLeaf.position.z = baseRight + clamped * maxSlide;
      }
    });
  }
}
