import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  ACCOUNTS,
  HALF,
  LEAF_COUNT,
  cliquePairs,
  positionsFor,
  type Structure,
  type Vec3,
} from "@/lib/field-geometry";

export type HoverInfo = {
  rank: number;
  id: string;
  name: string;
  value: number;
};

export type FieldApi = {
  setStructure: (structure: Structure) => void;
  setNames: (on: boolean) => void;
  destroy: () => void;
};

type Handlers = {
  onHover: (info: HoverInfo | null) => void;
  onFail: () => void;
};

type Kind = Exclude<Structure, "all">;

const ACCENT = 0xd6b15c;
const FG = 0xe7ebf2;
const PAIRS = cliquePairs();
const KINDS: Kind[] = ["orthogonal", "symmetric", "opposite", "inverse"];

const CAPTIONS: Record<Kind, string> = {
  orthogonal: "Orthogonal",
  symmetric: "Symmetric",
  opposite: "Opposite",
  inverse: "Inverse clique",
};

function initials(name: string): string {
  const parts = name
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0] ?? "?").slice(0, 2).toUpperCase();
}

function discTexture(rank: number, letters: string, strong: boolean): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const g = canvas.getContext("2d");
  if (g) {
    g.beginPath();
    g.arc(128, 128, 108, 0, Math.PI * 2);
    g.fillStyle = "#141820";
    g.fill();
    g.lineWidth = 12;
    g.strokeStyle = strong ? "#d6b15c" : "#8e98aa";
    g.stroke();
    g.fillStyle = "#e7ebf2";
    g.font = "600 48px Outfit, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(letters, 128, 132);
    if (rank > 0) {
      g.beginPath();
      g.arc(198, 56, 28, 0, Math.PI * 2);
      g.fillStyle = "#d6b15c";
      g.fill();
      g.fillStyle = "#1a1408";
      g.font = "600 22px Outfit, sans-serif";
      g.fillText(String(rank), 198, 58);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function textTexture(text: string, color: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 96;
  const g = canvas.getContext("2d");
  if (g) {
    g.fillStyle = color;
    g.font = "500 36px Outfit, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(text, 320, 48);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function toVectors(pts: Vec3[]): THREE.Vector3[] {
  return pts.map((p) => new THREE.Vector3(p.x, p.y, p.z));
}

function lineSegments(segments: number, color: number, opacity: number): THREE.LineSegments {
  const arr = new Float32Array(segments * 6);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
  const mat = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
  });
  const lines = new THREE.LineSegments(geo, mat);
  lines.frustumCulled = false;
  return lines;
}

function writeSeg(
  lines: THREE.LineSegments,
  seg: number,
  ax: number,
  ay: number,
  az: number,
  bx: number,
  by: number,
  bz: number,
) {
  const attr = lines.geometry.getAttribute("position") as THREE.BufferAttribute;
  const arr = attr.array as Float32Array;
  const o = seg * 6;
  arr[o] = ax;
  arr[o + 1] = ay;
  arr[o + 2] = az;
  arr[o + 3] = bx;
  arr[o + 4] = by;
  arr[o + 5] = bz;
}

function accountScale(value: number, maxW: number): number {
  return 0.72 + Math.sqrt(value / maxW) * 0.62;
}

export function mountField(canvas: HTMLCanvasElement, handlers: Handlers): FieldApi {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  if (!renderer.getContext()) {
    handlers.onFail();
    return {
      setStructure() {},
      setNames() {},
      destroy() {
        renderer.dispose();
      },
    };
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x050607, 1);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050607, 0.0075);
  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 280);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.target.set(0, 1, 0);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  controls.autoRotate = !reduce;
  controls.autoRotateSpeed = 0.35;

  const maxW = ACCOUNTS.reduce((m, a) => Math.max(m, a.value), 1);
  const discMats = ACCOUNTS.map(
    (account, i) =>
      new THREE.SpriteMaterial({
        map: discTexture(i + 1, initials(account.name), account.value >= 10),
        transparent: true,
        depthWrite: false,
      }),
  );
  const labelMats = ACCOUNTS.map(
    (account) =>
      new THREE.SpriteMaterial({
        map: textTexture("@" + account.id, "#e7ebf2"),
        transparent: true,
        depthWrite: false,
      }),
  );
  const hubMat = new THREE.SpriteMaterial({
    map: discTexture(0, "IH", true),
    transparent: true,
    depthWrite: false,
  });
  const hubLabelMat = new THREE.SpriteMaterial({
    map: textTexture("holt_igor", "#d6b15c"),
    transparent: true,
    depthWrite: false,
  });
  const excludedMat = new THREE.SpriteMaterial({
    map: discTexture(0, "IH", false),
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
  });

  const built: Record<Kind, { group: THREE.Group; caption: THREE.Sprite; labels: THREE.Sprite[] }> =
    {
      orthogonal: null!,
      symmetric: null!,
      opposite: null!,
      inverse: null!,
    };

  for (const kind of KINDS) {
    const group = new THREE.Group();
    const pts = toVectors(positionsFor(kind));
    const labels: THREE.Sprite[] = [];

    const hub = new THREE.Sprite(kind === "inverse" ? excludedMat : hubMat);
    hub.scale.set(1.55, 1.55, 1);
    group.add(hub);
    if (kind !== "inverse") {
      const hubLabel = new THREE.Sprite(hubLabelMat);
      hubLabel.scale.set(3.2, 0.48, 1);
      hubLabel.position.set(0, -1.25, 0);
      group.add(hubLabel);
      const star = lineSegments(LEAF_COUNT, ACCENT, kind === "opposite" ? 0.2 : 0.45);
      pts.forEach((p, i) => writeSeg(star, i, 0, 0, 0, p.x, p.y, p.z));
      (star.geometry.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
      group.add(star);
    }

    pts.forEach((p, i) => {
      const sprite = new THREE.Sprite(discMats[i]);
      const s = accountScale(ACCOUNTS[i].value, maxW);
      sprite.scale.set(s, s, 1);
      sprite.position.copy(p);
      sprite.userData = { index: i };
      group.add(sprite);
      const label = new THREE.Sprite(labelMats[i]);
      label.scale.set(2.8, 0.42, 1);
      label.position.set(p.x, p.y - s * 0.78, p.z);
      label.visible = false;
      group.add(label);
      labels.push(label);
    });

    if (kind === "orthogonal") {
      const axisMat = new THREE.LineBasicMaterial({ color: FG, transparent: true, opacity: 0.7 });
      for (const end of [
        new THREE.Vector3(16, 0, 0),
        new THREE.Vector3(0, 16, 0),
        new THREE.Vector3(0, 0, 16),
      ]) {
        const geo = new THREE.BufferGeometry().setFromPoints([end.clone().multiplyScalar(-1), end]);
        group.add(new THREE.Line(geo, axisMat));
        const tag = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: textTexture(end.x ? "X" : end.y ? "Y" : "Z", "#e7ebf2"),
            transparent: true,
            depthWrite: false,
          }),
        );
        tag.scale.set(1.1, 0.28, 1);
        tag.position.copy(end).multiplyScalar(1.06);
        group.add(tag);
      }
    }

    if (kind === "symmetric") {
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(14, 18),
        new THREE.MeshBasicMaterial({
          color: ACCENT,
          transparent: true,
          opacity: 0.14,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      plane.rotation.y = Math.PI / 2;
      group.add(plane);
      const pairs = lineSegments(HALF, ACCENT, 0.85);
      for (let i = 0; i < HALF; i++) {
        const a = pts[i];
        const b = pts[i + HALF];
        writeSeg(pairs, i, a.x, a.y, a.z, b.x, b.y, b.z);
      }
      (pairs.geometry.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
      group.add(pairs);
    }

    if (kind === "opposite") {
      const diameters = lineSegments(HALF, FG, 0.8);
      for (let i = 0; i < HALF; i++) {
        const a = pts[i];
        const b = pts[i + HALF];
        writeSeg(diameters, i, a.x, a.y, a.z, b.x, b.y, b.z);
      }
      (diameters.geometry.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
      group.add(diameters);
    }

    if (kind === "inverse") {
      const clique = lineSegments(PAIRS.length, ACCENT, 0.16);
      for (let k = 0; k < PAIRS.length; k++) {
        const [i, j] = PAIRS[k];
        const a = pts[i];
        const b = pts[j];
        writeSeg(clique, k, a.x, a.y, a.z, b.x, b.y, b.z);
      }
      (clique.geometry.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
      group.add(clique);
    }

    const caption = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: textTexture(CAPTIONS[kind], "#d6b15c"),
        transparent: true,
        depthWrite: false,
      }),
    );
    caption.scale.set(7.2, 1.08, 1);
    caption.position.set(0, kind === "inverse" ? 9.2 : 12.4, 0);
    group.add(caption);

    scene.add(group);
    built[kind] = { group, caption, labels };
  }

  let structure: Structure = "all";
  let showNames = false;
  let camLerp = 1;
  const camGoal = new THREE.Vector3();
  const targetGoal = new THREE.Vector3(0, 1, 0);

  function narrow(): boolean {
    return canvas.clientWidth > 0 && canvas.clientWidth < 720;
  }

  function pose(kind: Kind): { x: number; y: number; s: number } {
    if (structure !== "all") return { x: 0, y: 0, s: 1 };
    if (narrow()) {
      const col = kind === "symmetric" || kind === "inverse" ? 1 : -1;
      const row = kind === "opposite" || kind === "inverse" ? -1 : 1;
      return { x: col * 11, y: row * 9 + 1, s: 0.4 };
    }
    const x = { orthogonal: -22, symmetric: -7.2, opposite: 7.2, inverse: 22 }[kind];
    return { x, y: 1.5, s: 0.52 };
  }

  function apply() {
    for (const kind of KINDS) {
      const item = built[kind];
      const on = structure === "all" || structure === kind;
      item.group.visible = on;
      item.caption.visible = structure === "all";
      for (let i = 0; i < item.labels.length; i++) {
        item.labels[i].visible = on && structure !== "all" && (showNames || ACCOUNTS[i].value >= 12);
      }
    }
    const cams: Record<Structure, [number, number, number, number]> = narrow()
      ? {
          all: [0, 8, 36, 1],
          orthogonal: [14, 10, 16, 0],
          symmetric: [16, 6, 12, 0],
          opposite: [14, 12, 14, 0],
          inverse: [0, 6, 20, 0],
        }
      : {
          all: [0, 10, 46, 1.2],
          orthogonal: [16, 11, 18, 0],
          symmetric: [18, 5, 10, 0],
          opposite: [14, 14, 14, 0],
          inverse: [0.2, 7, 20, 0],
        };
    const cam = cams[structure];
    camGoal.set(cam[0], cam[1], cam[2]);
    targetGoal.set(0, cam[3], 0);
    camLerp = 1;
  }

  function snap() {
    for (const kind of KINDS) {
      const p = pose(kind);
      built[kind].group.position.set(p.x, p.y, 0);
      built[kind].group.scale.setScalar(p.s);
    }
  }

  apply();
  snap();
  camera.position.copy(camGoal);
  controls.target.copy(targetGoal);

  function resize() {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (structure === "all") {
      snap();
      apply();
      camera.position.copy(camGoal);
      controls.target.copy(targetGoal);
      camLerp = 0;
    }
  }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  const ray = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let dragging = false;
  const hitList: THREE.Sprite[] = [];

  function onPointer(ev: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    ray.setFromCamera(pointer, camera);
    hitList.length = 0;
    for (const kind of KINDS) {
      if (!built[kind].group.visible) continue;
      built[kind].group.traverse((obj) => {
        if (obj instanceof THREE.Sprite && typeof obj.userData.index === "number") hitList.push(obj);
      });
    }
    const hit = ray.intersectObjects(hitList, false)[0];
    if (!hit) {
      handlers.onHover(null);
      return;
    }
    const index = hit.object.userData.index as number;
    const account = ACCOUNTS[index];
    handlers.onHover({ rank: index + 1, id: account.id, name: account.name, value: account.value });
  }
  canvas.addEventListener("pointermove", onPointer);
  canvas.addEventListener("pointerleave", () => handlers.onHover(null));
  controls.addEventListener("start", () => {
    dragging = true;
    camLerp = 0;
  });
  controls.addEventListener("end", () => {
    dragging = false;
  });

  let frame = 0;
  const ease = reduce ? 1 : 0.12;
  function tick() {
    frame = requestAnimationFrame(tick);
    for (const kind of KINDS) {
      const p = pose(kind);
      const group = built[kind].group;
      group.position.x += (p.x - group.position.x) * ease;
      group.position.y += (p.y - group.position.y) * ease;
      const s = group.scale.x + (p.s - group.scale.x) * ease;
      group.scale.setScalar(s);
    }
    if (camLerp > 0 && !dragging) {
      camera.position.lerp(camGoal, ease);
      controls.target.lerp(targetGoal, ease);
      camLerp *= 0.88;
      if (camLerp < 0.02) camLerp = 0;
    }
    controls.update();
    renderer.render(scene, camera);
  }
  tick();

  return {
    setStructure(next) {
      structure = next;
      apply();
    },
    setNames(on) {
      showNames = on;
      apply();
    },
    destroy() {
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener("pointermove", onPointer);
      controls.dispose();
      scene.traverse((obj: THREE.Object3D) => {
        const mesh = obj as THREE.Mesh;
        mesh.geometry?.dispose();
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat?.dispose();
      });
      renderer.dispose();
    },
  };
}
