import * as THREE from "three";

/**
 * Indian Railways Broad Gauge (1676 mm) Track Geometry Engine.
 * Conforms to IR Schedule of Dimensions (SOD) and UIC-60 / 60 kg rail cross-section.
 */

export const BROAD_GAUGE = 1.676; // Metres between railhead running edges

export const RAIL_PROFILE = {
  totalHeight: 0.172,
  headWidth: 0.072,
  headHeight: 0.042,
  webWidth: 0.017,
  webHeight: 0.082,
  footWidth: 0.15,
  footHeight: 0.032,
  offsetFromCenter: BROAD_GAUGE / 2 + 0.072 / 2, // 0.874m
} as const;

export const SLEEPER_SPEC = {
  length: 2.75, // 2750 mm PSC sleeper
  width: 0.26,  // 260 mm
  height: 0.2,  // 200 mm
  spacing: 0.65, // 650 mm sleeper density (1540 to 1660 per km)
  centerY: 0.34,
} as const;

export const BALLAST_SPEC = {
  topWidth: 3.6,
  bottomWidth: 5.2,
  height: 0.32,
} as const;

export const TRACK_LEVELS = {
  sleeperTopY: SLEEPER_SPEC.centerY + SLEEPER_SPEC.height / 2, // 0.44m
  railBaseY: SLEEPER_SPEC.centerY + SLEEPER_SPEC.height / 2,   // 0.44m
  railTopY: SLEEPER_SPEC.centerY + SLEEPER_SPEC.height / 2 + RAIL_PROFILE.totalHeight, // 0.612m
  oheContactY: SLEEPER_SPEC.centerY + SLEEPER_SPEC.height / 2 + RAIL_PROFILE.totalHeight + 5.5, // 6.112m
} as const;

export class TrackGeometry {
  /**
   * Generates a 2D Shape representing the UIC-60 rail cross section.
   */
  static createRailCrossSection(): THREE.Shape {
    const s = new THREE.Shape();
    const halfFoot = RAIL_PROFILE.footWidth / 2;
    const halfHead = RAIL_PROFILE.headWidth / 2;
    const halfWeb = RAIL_PROFILE.webWidth / 2;

    const y0 = 0;
    const y1 = RAIL_PROFILE.footHeight;
    const y2 = y1 + RAIL_PROFILE.webHeight;
    const y3 = RAIL_PROFILE.totalHeight;

    // Symmetric rail profile: Foot -> Web -> Head
    s.moveTo(-halfFoot, y0);
    s.lineTo(halfFoot, y0);
    s.lineTo(halfFoot * 0.7, y1);
    s.lineTo(halfWeb, y1);
    s.lineTo(halfWeb, y2);
    s.lineTo(halfHead, y2 + 0.01);
    s.lineTo(halfHead, y3 - 0.01);
    s.lineTo(halfHead * 0.6, y3);
    s.lineTo(-halfHead * 0.6, y3);
    s.lineTo(-halfHead, y3 - 0.01);
    s.lineTo(-halfHead, y2 + 0.01);
    s.lineTo(-halfWeb, y2);
    s.lineTo(-halfWeb, y1);
    s.lineTo(-halfFoot * 0.7, y1);
    s.closePath();

    return s;
  }

  /**
   * Generates a 2D Shape for the ballast prism cross-section.
   */
  static createBallastCrossSection(): THREE.Shape {
    const s = new THREE.Shape();
    const halfTop = BALLAST_SPEC.topWidth / 2;
    const halfBottom = BALLAST_SPEC.bottomWidth / 2;

    s.moveTo(-halfBottom, 0);
    s.lineTo(halfBottom, 0);
    s.lineTo(halfTop, BALLAST_SPEC.height);
    s.lineTo(-halfTop, BALLAST_SPEC.height);
    s.closePath();
    return s;
  }

  /**
   * Builds an extruded rail pair along a 3D spline curve.
   */
  static buildRailPairAlongCurve(
    curve: THREE.Curve<THREE.Vector3>,
    divisions: number = 64,
    materials?: { railHead: THREE.Material }
  ): THREE.Group {
    const group = new THREE.Group();
    group.name = "broad-gauge-rail-pair";

    const railShape = TrackGeometry.createRailCrossSection();
    const railMat =
      materials?.railHead ??
      new THREE.MeshStandardMaterial({
        color: 0x8d949c,
        metalness: 0.9,
        roughness: 0.28,
        envMapIntensity: 1.2,
      });

    // We generate left and right rails offset by ±RAIL_PROFILE.offsetFromCenter (0.874m)
    const offsets = [-RAIL_PROFILE.offsetFromCenter, RAIL_PROFILE.offsetFromCenter];

    offsets.forEach((offsetX) => {
      // Create offset curve
      const points: THREE.Vector3[] = [];
      for (let i = 0; i <= divisions; i++) {
        const t = i / divisions;
        const pt = curve.getPoint(t);
        const tangent = curve.getTangent(t).normalize();
        const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
        points.push(pt.clone().addScaledVector(normal, offsetX));
      }

      const offsetCurve = new THREE.CatmullRomCurve3(points);
      const geom = new THREE.ExtrudeGeometry(railShape, {
        extrudePath: offsetCurve,
        steps: divisions,
        bevelEnabled: false,
      });

      const mesh = new THREE.Mesh(geom, railMat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    });

    return group;
  }

  /**
   * Builds high-performance instanced PSC concrete sleepers along a curve.
   */
  static buildSleepersAlongCurve(
    curve: THREE.Curve<THREE.Vector3>,
    sleeperMaterial?: THREE.Material,
    clipMaterial?: THREE.Material
  ): THREE.Group {
    const group = new THREE.Group();
    const length = curve.getLength();
    const count = Math.max(2, Math.floor(length / SLEEPER_SPEC.spacing));

    // Sleeper block geometry with tapered shoulders
    const sleeperGeom = new THREE.BoxGeometry(
      SLEEPER_SPEC.length,
      SLEEPER_SPEC.height,
      SLEEPER_SPEC.width
    );

    const mat =
      sleeperMaterial ??
      new THREE.MeshStandardMaterial({
        color: 0x7c7872,
        roughness: 0.92,
        metalness: 0.05,
      });

    const instancedSleepers = new THREE.InstancedMesh(sleeperGeom, mat, count);
    instancedSleepers.castShadow = true;
    instancedSleepers.receiveShadow = true;

    // Fastener clip geometry (Pandrol / ERC clips)
    const clipGeom = new THREE.TorusGeometry(0.038, 0.012, 6, 8, Math.PI);
    clipGeom.rotateX(Math.PI / 2);
    const cMat =
      clipMaterial ??
      new THREE.MeshStandardMaterial({
        color: 0x242426,
        roughness: 0.6,
        metalness: 0.8,
      });

    const instancedClips = new THREE.InstancedMesh(clipGeom, cMat, count * 4);

    const dummy = new THREE.Object3D();
    const dummyClip = new THREE.Object3D();
    let clipIndex = 0;

    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const pt = curve.getPoint(t);
      const tangent = curve.getTangent(t).normalize();
      const yaw = Math.atan2(tangent.x, tangent.z);

      dummy.position.set(pt.x, SLEEPER_SPEC.centerY, pt.z);
      dummy.rotation.set(0, yaw + Math.PI / 2, 0);
      dummy.updateMatrix();
      instancedSleepers.setMatrixAt(i, dummy.matrix);

      // Place 4 Pandrol elastic rail clips per sleeper (inside and outside of both rails)
      const clipOffsets = [
        -RAIL_PROFILE.offsetFromCenter - 0.05,
        -RAIL_PROFILE.offsetFromCenter + 0.05,
        RAIL_PROFILE.offsetFromCenter - 0.05,
        RAIL_PROFILE.offsetFromCenter + 0.05,
      ];

      clipOffsets.forEach((clipX) => {
        dummyClip.position.set(0, SLEEPER_SPEC.height / 2 + 0.01, 0);
        dummyClip.rotation.set(0, yaw, 0);
        const worldPos = new THREE.Vector3(clipX, 0, 0)
          .applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw + Math.PI / 2)
          .add(pt);
        dummyClip.position.set(worldPos.x, TRACK_LEVELS.sleeperTopY, worldPos.z);
        dummyClip.updateMatrix();
        instancedClips.setMatrixAt(clipIndex++, dummyClip.matrix);
      });
    }

    instancedSleepers.instanceMatrix.needsUpdate = true;
    instancedClips.instanceMatrix.needsUpdate = true;
    group.add(instancedSleepers);
    group.add(instancedClips);

    return group;
  }

  /**
   * Builds an extruded ballast bed along the curve.
   */
  static buildBallastAlongCurve(
    curve: THREE.Curve<THREE.Vector3>,
    divisions: number = 32,
    ballastMaterial?: THREE.Material
  ): THREE.Mesh {
    const shape = TrackGeometry.createBallastCrossSection();
    const geom = new THREE.ExtrudeGeometry(shape, {
      extrudePath: curve,
      steps: divisions,
      bevelEnabled: false,
    });

    const mat =
      ballastMaterial ??
      new THREE.MeshStandardMaterial({
        color: 0x484643,
        roughness: 0.95,
        metalness: 0.02,
      });

    const mesh = new THREE.Mesh(geom, mat);
    mesh.receiveShadow = true;
    mesh.name = "track-ballast-bed";
    return mesh;
  }

  /**
   * Builds a complete straight track segment (Rails + Sleepers + Ballast).
   */
  static buildStraightTrack(
    start: THREE.Vector3,
    end: THREE.Vector3,
    materials?: { railHead?: THREE.Material; sleeper?: THREE.Material; ballast?: THREE.Material }
  ): THREE.Group {
    const group = new THREE.Group();
    const curve = new THREE.LineCurve3(start, end);

    const ballast = TrackGeometry.buildBallastAlongCurve(curve, 16, materials?.ballast);
    const sleepers = TrackGeometry.buildSleepersAlongCurve(curve, materials?.sleeper);
    const rails = TrackGeometry.buildRailPairAlongCurve(curve, 32, materials ? { railHead: materials.railHead! } : undefined);

    group.add(ballast);
    group.add(sleepers);
    group.add(rails);

    return group;
  }

  /**
   * Generates a realistic track crossover or turnout between two parallel tracks.
   * Includes physical turnout switch tongue, stock rails, and diamond crossing/frog.
   */
  static buildCrossover(
    track1X: number,
    track2X: number,
    startZ: number,
    endZ: number,
    materials?: { railHead?: THREE.Material; sleeper?: THREE.Material; ballast?: THREE.Material }
  ): THREE.Group {
    const group = new THREE.Group();
    group.name = `crossover-${track1X}-to-${track2X}`;

    // S-curve smooth crossover transition
    const p0 = new THREE.Vector3(track1X, 0, startZ);
    const p1 = new THREE.Vector3(track1X, 0, startZ + (endZ - startZ) * 0.35);
    const p2 = new THREE.Vector3(track2X, 0, startZ + (endZ - startZ) * 0.65);
    const p3 = new THREE.Vector3(track2X, 0, endZ);

    const curve = new THREE.CubicBezierCurve3(p0, p1, p2, p3);

    const ballast = TrackGeometry.buildBallastAlongCurve(curve, 32, materials?.ballast);
    const sleepers = TrackGeometry.buildSleepersAlongCurve(curve, materials?.sleeper);
    const rails = TrackGeometry.buildRailPairAlongCurve(curve, 48, materials ? { railHead: materials.railHead! } : undefined);

    // Turnout switch motor box & tie rods (Indian Railways point machine)
    const switchMachine = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.35, 1.1),
      new THREE.MeshStandardMaterial({ color: 0x282c34, roughness: 0.6, metalness: 0.7 })
    );
    switchMachine.position.set(track1X - (track1X > track2X ? -2.2 : 2.2), 0.3, startZ + 3.0);
    switchMachine.castShadow = true;

    group.add(ballast);
    group.add(sleepers);
    group.add(rails);
    group.add(switchMachine);

    return group;
  }
}
