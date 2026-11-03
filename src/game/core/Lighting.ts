import * as THREE from "three";
import type { QualityProfile } from "../settings/settings";

/** Golden-hour haze over the suburbs. */
export const ATMOSPHERE = {
  zenith: new THREE.Color("#5f7fa6"),
  horizon: new THREE.Color("#f1c79c"),
  ground: new THREE.Color("#8d7b66"),
  fog: new THREE.Color("#e2bc97"),
  sun: new THREE.Color("#ffd3a1"),
  sunIntensity: 3.1,
  hemiSky: new THREE.Color("#cfd9e8"),
  hemiGround: new THREE.Color("#8a6d52"),
  hemiIntensity: 1.15,
  ambient: 0.18,
  /** Direction from the scene toward the sun. */
  sunDirection: new THREE.Vector3(-0.58, 0.3, -0.76).normalize(),
  environmentIntensity: 0.55,
  fogNear: 40,
} as const;

const SHADOW_EXTENT = 70;
const SHADOW_DISTANCE = 160;
const SHADOW_FOCUS_AHEAD = 28;
const SHADOW_SNAP = 6;

const skyVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position = clip.xyww; // pin to the far plane
  }
`;

const skyFragment = /* glsl */ `
  uniform vec3 zenith;
  uniform vec3 horizon;
  uniform vec3 ground;
  uniform vec3 sunColor;
  uniform vec3 sunDir;
  varying vec3 vDir;
  void main() {
    vec3 dir = normalize(vDir);
    float h = dir.y;
    vec3 col = mix(horizon, zenith, pow(clamp(h, 0.0, 1.0), 0.5));
    col = mix(col, ground, smoothstep(0.0, -0.12, h));
    float s = max(dot(dir, sunDir), 0.0);
    col += sunColor * (pow(s, 5.0) * 0.45 + pow(s, 80.0) * 1.2);
    col += sunColor * smoothstep(0.9993, 0.9997, s) * 6.0;
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export class Lighting {
  readonly sun: THREE.DirectionalLight;
  readonly sky: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>;
  private readonly hemi: THREE.HemisphereLight;
  private readonly ambient: THREE.AmbientLight;
  private readonly fog: THREE.Fog;
  private envTarget: THREE.WebGLRenderTarget | null = null;

  private readonly focus = new THREE.Vector3();
  private readonly snapped = new THREE.Vector3(Infinity, 0, Infinity);
  private readonly forward = new THREE.Vector3();

  constructor(private readonly scene: THREE.Scene) {
    this.hemi = new THREE.HemisphereLight(ATMOSPHERE.hemiSky, ATMOSPHERE.hemiGround, ATMOSPHERE.hemiIntensity);
    this.ambient = new THREE.AmbientLight(ATMOSPHERE.sun, ATMOSPHERE.ambient);

    this.sun = new THREE.DirectionalLight(ATMOSPHERE.sun, ATMOSPHERE.sunIntensity);
    this.sun.castShadow = true;
    const cam = this.sun.shadow.camera;
    cam.left = -SHADOW_EXTENT;
    cam.right = SHADOW_EXTENT;
    cam.top = SHADOW_EXTENT;
    cam.bottom = -SHADOW_EXTENT;
    cam.near = 1;
    cam.far = SHADOW_DISTANCE * 2;
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.03;

    this.sky = new THREE.Mesh(
      new THREE.SphereGeometry(10, 32, 16),
      new THREE.ShaderMaterial({
        vertexShader: skyVertex,
        fragmentShader: skyFragment,
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          zenith: { value: ATMOSPHERE.zenith },
          horizon: { value: ATMOSPHERE.horizon },
          ground: { value: ATMOSPHERE.ground },
          sunColor: { value: ATMOSPHERE.sun },
          sunDir: { value: ATMOSPHERE.sunDirection },
        },
      }),
    );
    this.sky.frustumCulled = false;
    this.sky.renderOrder = -1;

    this.fog = new THREE.Fog(ATMOSPHERE.fog, ATMOSPHERE.fogNear, 340);
    scene.fog = this.fog;
    scene.background = ATMOSPHERE.fog.clone();
    scene.add(this.hemi, this.ambient, this.sun, this.sun.target, this.sky);
  }

  applySettings(profile: QualityProfile, shadows: boolean): void {
    this.fog.far = profile.drawDistance;
    this.sun.castShadow = shadows;
    const size = profile.shadowMapSize;
    if (this.sun.shadow.mapSize.x !== size) {
      this.sun.shadow.mapSize.set(size, size);
      this.sun.shadow.map?.dispose();
      this.sun.shadow.map = null;
    }
  }

  /** Bakes the sky into a PMREM environment for reflections on rails and steel. */
  bakeEnvironment(gl: THREE.WebGLRenderer): void {
    const pmrem = new THREE.PMREMGenerator(gl);
    const envScene = new THREE.Scene();
    const skyCopy = new THREE.Mesh(this.sky.geometry, this.sky.material);
    envScene.add(skyCopy);
    this.envTarget?.dispose();
    this.envTarget = pmrem.fromScene(envScene, 0, 0.1, 100);
    pmrem.dispose();
    this.scene.environment = this.envTarget.texture;
    this.scene.environmentIntensity = ATMOSPHERE.environmentIntensity;
  }

  /** Keeps the sky centred on the camera and the shadow frustum ahead of it. */
  update(camera: THREE.Camera): void {
    this.sky.position.copy(camera.position);
    camera.getWorldDirection(this.forward);
    this.forward.y = 0;
    if (this.forward.lengthSq() < 1e-6) this.forward.set(0, 0, -1);
    this.forward.normalize();
    this.focus.copy(camera.position).addScaledVector(this.forward, SHADOW_FOCUS_AHEAD);
    this.focus.set(
      Math.round(this.focus.x / SHADOW_SNAP) * SHADOW_SNAP,
      0,
      Math.round(this.focus.z / SHADOW_SNAP) * SHADOW_SNAP,
    );
    if (this.focus.equals(this.snapped)) return;
    this.snapped.copy(this.focus);
    this.sun.target.position.copy(this.focus);
    this.sun.position.copy(this.focus).addScaledVector(ATMOSPHERE.sunDirection, SHADOW_DISTANCE);
    this.sun.target.updateMatrixWorld();
  }

  dispose(): void {
    this.sky.geometry.dispose();
    this.sky.material.dispose();
    this.envTarget?.dispose();
    this.sun.shadow.map?.dispose();
    this.scene.remove(this.hemi, this.ambient, this.sun, this.sun.target, this.sky);
  }
}
