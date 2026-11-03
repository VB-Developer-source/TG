import * as THREE from "three";
import { TRACK_LEVELS } from "./TrackGeometry";

/**
 * 25 kV AC Overhead Electrification (OHE) Generator for Indian Railways Broad Gauge.
 * Conforms to RDSO standard OHE portal structures and catenary alignment.
 *
 * Contact wire is strictly calibrated to Y = 6.112m (matching Session 02 EMU pantograph).
 */
export class OHEBuilder {
  static readonly CONTACT_Y = TRACK_LEVELS.oheContactY; // 6.112m
  static readonly MESSENGER_SUPPORT_Y = TRACK_LEVELS.oheContactY + 1.4; // 7.512m
  static readonly MESSENGER_MID_Y = TRACK_LEVELS.oheContactY + 0.8; // 6.912m (catenary sag)
  static readonly MAST_HEIGHT = 9.4; // Metres
  static readonly PORTAL_BEAM_Y = 8.8; // Metres
  static readonly DROPPER_SPACING = 6.5; // Metres between vertical droppers

  /**
   * Builds an Indian Railways standard steel lattice OHE Portal spanning multiple tracks.
   */
  static buildPortal(
    spanWidth: number = 24.0,
    materials?: { steel?: THREE.Material; insulator?: THREE.Material }
  ): THREE.Group {
    const group = new THREE.Group();
    group.name = "ir-ohe-portal";

    const steelMat =
      materials?.steel ??
      new THREE.MeshStandardMaterial({
        color: 0x47515a,
        roughness: 0.6,
        metalness: 0.7,
      });

    const halfSpan = spanWidth / 2;

    // Upright lattice masts (Left & Right)
    const mastGeom = new THREE.BoxGeometry(0.35, OHEBuilder.MAST_HEIGHT, 0.35);
    const leftMast = new THREE.Mesh(mastGeom, steelMat);
    leftMast.position.set(-halfSpan, OHEBuilder.MAST_HEIGHT / 2, 0);
    leftMast.castShadow = true;

    const rightMast = new THREE.Mesh(mastGeom, steelMat);
    rightMast.position.set(halfSpan, OHEBuilder.MAST_HEIGHT / 2, 0);
    rightMast.castShadow = true;

    // Concrete mast foundation pedestals
    const baseGeom = new THREE.BoxGeometry(0.8, 0.9, 0.8);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x6e6c66, roughness: 0.9 });
    const leftBase = new THREE.Mesh(baseGeom, baseMat);
    leftBase.position.set(-halfSpan, 0.45, 0);

    const rightBase = new THREE.Mesh(baseGeom, baseMat);
    rightBase.position.set(halfSpan, 0.45, 0);

    // Horizontal truss boom (Boom cross-beam)
    const boomGeom = new THREE.BoxGeometry(spanWidth + 0.5, 0.5, 0.5);
    const boom = new THREE.Mesh(boomGeom, steelMat);
    boom.position.set(0, OHEBuilder.PORTAL_BEAM_Y, 0);
    boom.castShadow = true;

    group.add(leftMast, rightMast, leftBase, rightBase, boom);

    return group;
  }

  /**
   * Builds drop cantilevers and insulators hanging from the portal for a given track X position.
   */
  static buildTrackDropArm(
    trackX: number,
    materials?: { steel?: THREE.Material; insulator?: THREE.Material }
  ): THREE.Group {
    const group = new THREE.Group();
    group.name = `ohe-drop-arm-${trackX}`;

    const steelMat =
      materials?.steel ??
      new THREE.MeshStandardMaterial({ color: 0x5a636c, roughness: 0.5, metalness: 0.75 });

    const insulatorMat =
      materials?.insulator ??
      new THREE.MeshStandardMaterial({ color: 0x5a3d28, roughness: 0.3, metalness: 0.1 }); // Brown ceramic

    // Drop tube from portal beam down to messenger support
    const dropGeom = new THREE.CylinderGeometry(0.04, 0.04, OHEBuilder.PORTAL_BEAM_Y - OHEBuilder.MESSENGER_SUPPORT_Y, 8);
    const drop = new THREE.Mesh(dropGeom, steelMat);
    drop.position.set(trackX, (OHEBuilder.PORTAL_BEAM_Y + OHEBuilder.MESSENGER_SUPPORT_Y) / 2, 0);

    // Ceramic disc insulators (catenary insulation)
    const discGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.16, 12);
    const disc = new THREE.Mesh(discGeom, insulatorMat);
    disc.position.set(trackX, OHEBuilder.MESSENGER_SUPPORT_Y + 0.1, 0);

    // Steady arm & registration arm holding contact wire at 6.112m
    const armGeom = new THREE.CylinderGeometry(0.02, 0.02, 1.2, 6);
    armGeom.rotateZ(Math.PI / 4);
    const arm = new THREE.Mesh(armGeom, steelMat);
    arm.position.set(trackX + 0.35, OHEBuilder.CONTACT_Y + 0.5, 0);

    group.add(drop, disc, arm);
    return group;
  }

  /**
   * Generates continuous OHE catenary wires (Messenger Wire + Contact Wire + Droppers)
   * along a span between two portal Z coordinates for a specific track X.
   */
  static buildWireSpan(
    trackX: number,
    startZ: number,
    endZ: number,
    wireMaterial?: THREE.Material
  ): THREE.Group {
    const group = new THREE.Group();
    group.name = `ohe-wire-span-${trackX}`;

    const copperMat =
      wireMaterial ??
      new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.8,
        metalness: 0.2,
      });

    const spanLength = Math.abs(endZ - startZ);
    const minZ = Math.min(startZ, endZ);
    const maxZ = Math.max(startZ, endZ);

    // 1. Contact wire (straight horizontal line at exactly Y = 6.112m)
    const contactGeom = new THREE.CylinderGeometry(0.007, 0.007, spanLength, 6);
    contactGeom.rotateX(Math.PI / 2);
    const contactWire = new THREE.Mesh(contactGeom, copperMat);
    contactWire.position.set(trackX, OHEBuilder.CONTACT_Y, (startZ + endZ) / 2);
    group.add(contactWire);

    // 2. Catenary messenger wire with parabolic sag
    const divisions = 24;
    const curvePoints: THREE.Vector3[] = [];
    for (let i = 0; i <= divisions; i++) {
      const u = i / divisions;
      const z = minZ + u * spanLength;
      // Parabolic sag equation: y = supportY - sag * 4 * u * (1 - u)
      const sag = OHEBuilder.MESSENGER_SUPPORT_Y - OHEBuilder.MESSENGER_MID_Y;
      const y = OHEBuilder.MESSENGER_SUPPORT_Y - sag * 4 * u * (1 - u);
      curvePoints.push(new THREE.Vector3(trackX, y, z));
    }

    const messengerCurve = new THREE.CatmullRomCurve3(curvePoints);
    const messengerGeom = new THREE.TubeGeometry(messengerCurve, divisions, 0.009, 6, false);
    const messengerWire = new THREE.Mesh(messengerGeom, copperMat);
    group.add(messengerWire);

    // 3. Vertical droppers linking messenger wire to contact wire every 6.5m
    const dropperCount = Math.floor(spanLength / OHEBuilder.DROPPER_SPACING);
    for (let d = 1; d < dropperCount; d++) {
      const u = d / dropperCount;
      const z = minZ + u * spanLength;
      const sag = OHEBuilder.MESSENGER_SUPPORT_Y - OHEBuilder.MESSENGER_MID_Y;
      const topY = OHEBuilder.MESSENGER_SUPPORT_Y - sag * 4 * u * (1 - u);
      const dropperHeight = Math.max(0.1, topY - OHEBuilder.CONTACT_Y);

      const dropperGeom = new THREE.CylinderGeometry(0.003, 0.003, dropperHeight, 4);
      const dropper = new THREE.Mesh(dropperGeom, copperMat);
      dropper.position.set(trackX, OHEBuilder.CONTACT_Y + dropperHeight / 2, z);
      group.add(dropper);
    }

    return group;
  }
}
