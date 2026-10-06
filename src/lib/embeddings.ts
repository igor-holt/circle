import { ACCOUNTS } from "./field-geometry.ts";

export type Pt = { x: number; y: number };

export type LayoutId = "weighted" | "unweighted" | "kamada" | "spectral" | "circular";

const HUB = 0;
const N = ACCOUNTS.length + 1;

export function weightOf(index: number): number {
  return index === HUB ? 0 : ACCOUNTS[index - 1].value;
}

export function shortLabel(index: number): string {
  if (index === HUB) return "holt_igor";
  const account = ACCOUNTS[index - 1];
  if (account.id === "AorathianMaps") return "Robin R.";
  if (account.id === "GregoryNimensky" || account.id === "beffjezos") return "e/acc";
  if (account.name.length <= 16) return account.name;
  return account.name.split(" ")[0] ?? account.id;
}

function recenter(pts: Pt[]): Pt[] {
  const hub = pts[HUB];
  return pts.map((p) => ({ x: p.x - hub.x, y: p.y - hub.y }));
}

function fit(pts: Pt[], span = 2): Pt[] {
  let max = 0.001;
  for (const p of pts) max = Math.max(max, Math.hypot(p.x, p.y));
  const s = span / 2 / max;
  return pts.map((p) => ({ x: p.x * s, y: p.y * s }));
}

function fruchterman(weighted: boolean, kFactor: number): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < N; i++) {
    const angle = (i * Math.PI * 2) / N;
    const r = i === HUB ? 0 : 0.35;
    pts.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
  }
  const area = 12 * 12;
  const k = kFactor * Math.sqrt(area / N);
  const iterations = 280;
  for (let iter = 0; iter < iterations; iter++) {
    const disp = pts.map(() => ({ x: 0, y: 0 }));
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        let dx = pts[i].x - pts[j].x;
        let dy = pts[i].y - pts[j].y;
        const dist = Math.hypot(dx, dy) + 0.02;
        const force = (k * k) / dist;
        dx /= dist;
        dy /= dist;
        disp[i].x += dx * force;
        disp[i].y += dy * force;
        disp[j].x -= dx * force;
        disp[j].y -= dy * force;
      }
    }
    for (let i = 1; i < N; i++) {
      let dx = pts[i].x - pts[HUB].x;
      let dy = pts[i].y - pts[HUB].y;
      const dist = Math.hypot(dx, dy) + 0.02;
      const pull = weighted ? weightOf(i) / 6 : 1;
      const force = ((dist * dist) / k) * pull;
      dx /= dist;
      dy /= dist;
      disp[i].x -= dx * force;
      disp[i].y -= dy * force;
      disp[HUB].x += dx * force;
      disp[HUB].y += dy * force;
    }
    const temp = 1.1 * (1 - iter / iterations);
    for (let i = 0; i < N; i++) {
      const len = Math.hypot(disp[i].x, disp[i].y) || 1;
      const step = Math.min(len, temp);
      pts[i].x += (disp[i].x / len) * step;
      pts[i].y += (disp[i].y / len) * step;
    }
    const hx = pts[HUB].x;
    const hy = pts[HUB].y;
    for (const p of pts) {
      p.x -= hx;
      p.y -= hy;
    }
  }
  return fit(pts);
}

function kamada(): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < N; i++) {
    const angle = i * Math.PI * (3 - Math.sqrt(5));
    pts.push({ x: Math.cos(angle) * (i === HUB ? 0 : 1), y: Math.sin(angle) * (i === HUB ? 0 : 1) });
  }
  const ideal = (i: number, j: number) => {
    if (i > j) return ideal(j, i);
    if (i === HUB) return 0.35 + weightOf(j) * 0.11;
    return 1.6;
  };
  for (let iter = 0; iter < 180; iter++) {
    const disp = pts.map(() => ({ x: 0, y: 0 }));
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        let dx = pts[j].x - pts[i].x;
        let dy = pts[j].y - pts[i].y;
        const dist = Math.hypot(dx, dy) + 0.02;
        const rest = ideal(i, j);
        const kSpring = i === HUB || j === HUB ? 0.08 : 0.015;
        const force = kSpring * (dist - rest);
        dx /= dist;
        dy /= dist;
        disp[i].x += dx * force;
        disp[i].y += dy * force;
        disp[j].x -= dx * force;
        disp[j].y -= dy * force;
      }
    }
    const damp = 0.45 * (1 - iter / 220);
    for (let i = 0; i < N; i++) {
      pts[i].x += disp[i].x * damp;
      pts[i].y += disp[i].y * damp;
    }
    const hx = pts[HUB].x;
    const hy = pts[HUB].y;
    for (const p of pts) {
      p.x -= hx;
      p.y -= hy;
    }
  }
  return fit(recenter(pts));
}

function jacobiValues(matrix: number[][]): { values: number[]; vectors: number[][] } {
  const n = matrix.length;
  const m = matrix.map((row) => row.slice());
  const v: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  );
  for (let sweep = 0; sweep < 14; sweep++) {
    for (let p = 0; p < n - 1; p++) {
      for (let q = p + 1; q < n; q++) {
        const apq = m[p][q];
        if (Math.abs(apq) < 1e-10) continue;
        const app = m[p][p];
        const aqq = m[q][q];
        const tau = (aqq - app) / (2 * apq);
        const t = Math.sign(tau || 1) / (Math.abs(tau) + Math.sqrt(1 + tau * tau));
        const c = 1 / Math.sqrt(1 + t * t);
        const s = t * c;
        const colP = m.map((row) => row[p]);
        const colQ = m.map((row) => row[q]);
        for (let k = 0; k < n; k++) {
          m[k][p] = c * colP[k] - s * colQ[k];
          m[k][q] = s * colP[k] + c * colQ[k];
        }
        for (let k = 0; k < n; k++) {
          const pk = m[p][k];
          const qk = m[q][k];
          m[p][k] = c * pk - s * qk;
          m[q][k] = s * pk + c * qk;
        }
        m[p][q] = 0;
        m[q][p] = 0;
        m[p][p] = c * c * app - 2 * s * c * apq + s * s * aqq;
        m[q][q] = s * s * app + 2 * s * c * apq + c * c * aqq;
        for (let k = 0; k < n; k++) {
          const vp = v[k][p];
          const vq = v[k][q];
          v[k][p] = c * vp - s * vq;
          v[k][q] = s * vp + c * vq;
        }
      }
    }
  }
  return { values: m.map((row, i) => row[i]), vectors: v };
}

function spectral(): Pt[] {
  const lap = Array.from({ length: N }, () => Array(N).fill(0));
  ACCOUNTS.forEach((account, leaf) => {
    const i = leaf + 1;
    const w = account.value;
    lap[HUB][HUB] += w;
    lap[i][i] += w;
    lap[HUB][i] = -w;
    lap[i][HUB] = -w;
  });
  const { values, vectors } = jacobiValues(lap);
  const order = values.map((value, index) => ({ value, index })).sort((a, b) => a.value - b.value);
  const a = order[1]?.index ?? 1;
  const b = order[2]?.index ?? 2;
  const pts = vectors.map((row) => ({ x: row[a], y: row[b] }));
  return fit(recenter(pts));
}

function circular(): Pt[] {
  const pts: Pt[] = Array.from({ length: N }, () => ({ x: 0, y: 0 }));
  const hubAngle = Math.PI * 0.18;
  pts[HUB] = { x: Math.cos(hubAngle), y: Math.sin(hubAngle) };
  const leaves = ACCOUNTS.map((_, i) => i + 1).sort((a, b) => weightOf(b) - weightOf(a) || a - b);
  leaves.forEach((index, order) => {
    const angle = hubAngle + ((order + 1) / leaves.length) * Math.PI * 2;
    pts[index] = { x: Math.cos(angle), y: Math.sin(angle) };
  });
  return pts;
}

let cache: Record<LayoutId, Pt[]> | null = null;

export function layout(id: LayoutId): Pt[] {
  if (!cache) {
    cache = {
      weighted: fruchterman(true, 0.9),
      unweighted: fruchterman(false, 1.6),
      kamada: kamada(),
      spectral: spectral(),
      circular: circular(),
    };
  }
  return cache[id];
}

export const LAYOUTS: { id: LayoutId; title: string; note: string }[] = [
  { id: "weighted", title: "Fruchterman–Reingold", note: "weighted, k=0.9" },
  { id: "unweighted", title: "Fruchterman–Reingold", note: "unweighted, k=1.6" },
  { id: "kamada", title: "Kamada–Kawai", note: "energy minimization" },
  { id: "spectral", title: "Spectral", note: "Laplacian eigenvectors" },
  { id: "circular", title: "Circular", note: "not force-directed" },
];

export function spherePositions(): { x: number; y: number; z: number }[] {
  const pts: { x: number; y: number; z: number }[] = [{ x: 0, y: 0, z: 0 }];
  const phi = Math.PI * (3 - Math.sqrt(5));
  const maxW = ACCOUNTS.reduce((m, a) => Math.max(m, a.value), 1);
  ACCOUNTS.forEach((account, i) => {
    const y = 1 - (i / Math.max(1, ACCOUNTS.length - 1)) * 2;
    const ring = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = i * phi;
    const radius = 1.15 + (1 - account.value / maxW) ** 0.65 * 6.4;
    pts.push({
      x: Math.cos(theta) * ring * radius,
      y: y * radius * 0.72,
      z: Math.sin(theta) * ring * radius,
    });
  });
  return pts;
}

const TOTAL_WEIGHT = ACCOUNTS.reduce((sum, account) => sum + account.value, 0);

/** Heat equation on the star. Flux on an edge defers to its tie weight. */
export function diffuse(state: number[], dt: number): number[] {
  const next = state.slice();
  let hubFlux = 0;
  for (let i = 1; i < N; i++) {
    const flux = (weightOf(i) / TOTAL_WEIGHT) * (state[HUB] - state[i]);
    next[i] += dt * flux;
    hubFlux += flux;
  }
  next[HUB] -= dt * hubFlux;
  for (let i = 0; i < N; i++) next[i] = Math.min(1, Math.max(0, next[i]));
  return next;
}

export function coldState(): number[] {
  const state = Array(N).fill(0);
  state[HUB] = 1;
  return state;
}

export function halfLife(index: number): number {
  const w = weightOf(index);
  return w > 0 ? (Math.log(2) * TOTAL_WEIGHT) / w : Infinity;
}

export const NODE_COUNT = N;
