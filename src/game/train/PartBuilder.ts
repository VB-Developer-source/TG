import * as THREE from "three";

export type V3 = [number, number, number];

export type PartAttachmentType = "coach" | "frontBogie" | "rearBogie";

export interface PartAttachment {
  type: PartAttachmentType;
  coachIndex: number;
  localMatrix: THREE.Matrix4;
}

export interface PartBatch {
  geo: string;
  mat: string;
  matrices: THREE.Matrix4[];
  attachments: PartAttachment[];
}

const UP = new THREE.Vector3(0, 1, 0);

/**
 * Collects transforms of repeated parts so the whole train renders as one
 * InstancedMesh per (geometry, material) pair instead of thousands of meshes.
 * Tracks per-instance coach and bogie attachments to support individual coach
 * articulation along continuous railway curves.
 */
export class PartBuilder {
  batches = new Map<string, PartBatch>();
  private base = new THREE.Matrix4();
  private currentAttachment: { type: PartAttachmentType; coachIndex: number } | null = null;
  private attachmentOffset: THREE.Matrix4 | null = null;

  withinAttachment(
    attachment: { type: PartAttachmentType; coachIndex: number },
    offset: THREE.Matrix4 | null,
    fn: () => void
  ) {
    const prevAtt = this.currentAttachment;
    const prevOff = this.attachmentOffset;
    this.currentAttachment = attachment;
    this.attachmentOffset = offset;
    fn();
    this.currentAttachment = prevAtt;
    this.attachmentOffset = prevOff;
  }

  add(geo: string, mat: string, pos: V3, scale: V3 = [1, 1, 1], rot: V3 = [0, 0, 0]) {
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot));
    this.addQ(geo, mat, pos, q, scale);
  }

  addQ(geo: string, mat: string, pos: V3, q: THREE.Quaternion, scale: V3) {
    const localM = new THREE.Matrix4().compose(new THREE.Vector3(...pos), q, new THREE.Vector3(...scale));
    localM.premultiply(this.base);
    const key = `${geo}|${mat}`;
    let b = this.batches.get(key);
    if (!b) {
      b = { geo, mat, matrices: [], attachments: [] };
      this.batches.set(key, b);
    }
    const straightM = this.attachmentOffset
      ? localM.clone().premultiply(this.attachmentOffset)
      : localM.clone();
    b.matrices.push(straightM);
    b.attachments.push({
      type: this.currentAttachment ? this.currentAttachment.type : "coach",
      coachIndex: this.currentAttachment ? this.currentAttachment.coachIndex : 0,
      localMatrix: localM.clone(),
    });
  }

  box(mat: string, pos: V3, size: V3, rot?: V3) {
    this.add("box", mat, pos, size, rot);
  }

  /** unit cylinder along local Y */
  cyl(mat: string, pos: V3, r: number, h: number, rot?: V3, geo = "cyl") {
    this.add(geo, mat, pos, [r, h, r], rot);
  }

  /** cylinder spanning two points */
  rod(mat: string, a: V3, b: V3, r: number, geo = "cylLow") {
    const va = new THREE.Vector3(...a);
    const vb = new THREE.Vector3(...b);
    const dir = vb.clone().sub(va);
    const len = dir.length();
    const q = new THREE.Quaternion().setFromUnitVectors(UP, dir.normalize());
    const mid = va.add(vb).multiplyScalar(0.5);
    this.addQ(geo, mat, [mid.x, mid.y, mid.z], q, [r, len, r]);
  }

  within(m: THREE.Matrix4, fn: () => void) {
    const prev = this.base;
    this.base = prev.clone().multiply(m);
    fn();
    this.base = prev;
  }

  translated(pos: V3, fn: () => void) {
    this.within(new THREE.Matrix4().makeTranslation(...pos), fn);
  }
}
