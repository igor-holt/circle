import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { ACCOUNTS } from "@/lib/field-geometry";
import { coldState, diffuse, shortLabel, spherePositions, weightOf } from "@/lib/embeddings";

export type HeatSnapshot = {
  time: number;
  hub: number;
  leader: string;
  leaderHeat: number;
};

type Handlers = {
  diffuse: boolean;
  onHeat: (snapshot: HeatSnapshot) => void;
};

function colorFor(index: number): THREE.Color {
  if (index === 0) return new THREE.Color("#e4485c");
  const weight = weightOf(index);
  if (weight >= 12) return new THREE.Color("#e6a15c");
  if (weight >= 4) return new THREE.Color("#3cbaa8");
  return new THREE.Color("#8eb4d0");
}

function heatColor(amount: number, target: THREE.Color) {
  const t = Math.max(0, Math.min(1, amount));
  const cold = new THREE.Color("#24344a");
  const warm = new THREE.Color("#e6a15c");
  const hot = new THREE.Color("#e4485c");
  if (t < 0.5) target.copy(cold).lerp(warm, t * 2);
  else target.copy(warm).lerp(hot, (t - 0.5) * 2);
}

function labelTexture(text: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 96;
  const g = canvas.getContext("2d");
  if (g) {
    g.fillStyle = "#e7ebf2";
    g.font = "500 36px Outfit, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(text, 256, 48);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function mountEgo3d(canvas: HTMLCanvasElement, handlers: Handlers) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x050607, 1);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 200);
  camera.position.set(0, 4.5, 16);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.target.set(0, 0, 0);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  controls.autoRotate = !reduce;
  controls.autoRotateSpeed = 0.4;

  const pts = spherePositions();
  const geo = new THREE.SphereGeometry(1, 20, 14);
  const meshes: THREE.Mesh[] = [];
  pts.forEach((p, i) => {
    const mat = new THREE.MeshBasicMaterial({ color: colorFor(i) });
    const mesh = new THREE.Mesh(geo, mat);
    const scale = i === 0 ? 0.42 : 0.16;
    mesh.scale.setScalar(scale);
    mesh.position.set(p.x, p.y, p.z);
    scene.add(mesh);
    meshes.push(mesh);
    if (i === 0 || weightOf(i) >= 4) {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: labelTexture(shortLabel(i)), transparent: true, depthWrite: false }),
      );
      sprite.scale.set(i === 0 ? 2.4 : 1.8, 0.38, 1);
      sprite.position.set(p.x, p.y + (i === 0 ? 0.55 : 0.38), p.z);
      scene.add(sprite);
    }
  });

  const edgeGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(ACCOUNTS.length * 6);
  const colors = new Float32Array(ACCOUNTS.length * 6);
  ACCOUNTS.forEach((_, leaf) => {
    const p = pts[leaf + 1];
    const o = leaf * 6;
    positions[o + 3] = p.x;
    positions[o + 4] = p.y;
    positions[o + 5] = p.z;
  });
  edgeGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  edgeGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const edges = new THREE.LineSegments(
    edgeGeo,
    new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.85 }),
  );
  scene.add(edges);
  const scratch = new THREE.Color();

  function paintEdges(heat: number[] | null) {
    const attr = edgeGeo.getAttribute("color") as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    ACCOUNTS.forEach((_, leaf) => {
      const index = leaf + 1;
      const o = leaf * 6;
      if (heat) heatColor(heat[0] ?? 0, scratch);
      else scratch.copy(colorFor(0));
      arr[o] = scratch.r;
      arr[o + 1] = scratch.g;
      arr[o + 2] = scratch.b;
      if (heat) heatColor(heat[index] ?? 0, scratch);
      else scratch.copy(colorFor(index));
      arr[o + 3] = scratch.r;
      arr[o + 4] = scratch.g;
      arr[o + 5] = scratch.b;
      (meshes[index].material as THREE.MeshBasicMaterial).color.copy(scratch);
    });
    const hubMat = meshes[0].material as THREE.MeshBasicMaterial;
    if (heat) heatColor(heat[0] ?? 0, scratch);
    else scratch.copy(colorFor(0));
    hubMat.color.copy(scratch);
    attr.needsUpdate = true;
  }
  paintEdges(null);

  let running = handlers.diffuse && !reduce;
  let state = coldState();
  let time = 0;
  let report = 0;

  function resize() {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  let frame = 0;
  const loop = () => {
    frame = requestAnimationFrame(loop);
    if (running) {
      state = diffuse(state, 0.12);
      time += 0.12;
      paintEdges(state);
      report += 0.05;
      if (report > 0.25) {
        report = 0;
        let leader = 1;
        for (let i = 2; i < state.length; i++) if (state[i] > state[leader]) leader = i;
        handlers.onHeat({
          time,
          hub: state[0],
          leader: shortLabel(leader),
          leaderHeat: state[leader],
        });
      }
    }
    controls.update();
    renderer.render(scene, camera);
  };
  loop();

  return {
    setDiffuse(on: boolean) {
      running = on && !reduce;
      if (!on) {
        state = coldState();
        time = 0;
        paintEdges(null);
      }
    },
    destroy() {
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      geo.dispose();
      edgeGeo.dispose();
      renderer.dispose();
    },
  };
}
