import { ACCOUNTS } from "@/lib/field-geometry";
import { layout, shortLabel, weightOf, type LayoutId } from "@/lib/embeddings";

const HUB = "#e4485c";

export function categoricalColor(index: number): string {
  if (index === 0) return HUB;
  const weight = weightOf(index);
  if (weight >= 12) return "#e6a15c";
  if (weight >= 4) return "#3cbaa8";
  return "#8eb4d0";
}

function heatColor(amount: number): string {
  const t = Math.max(0, Math.min(1, amount));
  const stops = [
    [36, 52, 74],
    [230, 161, 92],
    [228, 72, 92],
  ];
  const x = t * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(x));
  const f = x - i;
  const a = stops[i];
  const b = stops[i + 1];
  const ch = (k: number) => Math.round(a[k] + (b[k] - a[k]) * f);
  return `rgb(${ch(0)} ${ch(1)} ${ch(2)})`;
}

export function paintLayout(
  canvas: HTMLCanvasElement,
  id: LayoutId,
  heat: number[] | null,
) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (width < 2 || height < 2) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  const g = canvas.getContext("2d");
  if (!g) return;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, width, height);
  const pts = layout(id);
  const pad = 28;
  const map = (p: { x: number; y: number }) => ({
    x: pad + ((p.x + 1) / 2) * (width - pad * 2),
    y: pad + ((1 - p.y) / 2) * (height - pad * 2),
  });
  const dots = pts.map(map);
  const hub = dots[0];
  for (let i = 1; i < dots.length; i++) {
    g.beginPath();
    g.moveTo(hub.x, hub.y);
    g.lineTo(dots[i].x, dots[i].y);
    g.strokeStyle = heat ? heatColor(heat[i] ?? 0) : categoricalColor(i);
    g.globalAlpha = 0.55;
    g.lineWidth = 1;
    g.stroke();
  }
  g.globalAlpha = 1;
  dots.forEach((dot, i) => {
    g.beginPath();
    g.arc(dot.x, dot.y, i === 0 ? 7 : 4.5, 0, Math.PI * 2);
    g.fillStyle = heat ? heatColor(heat[i] ?? 0) : categoricalColor(i);
    g.fill();
  });
  g.font = "12px Outfit, sans-serif";
  g.fillStyle = "#e7ebf2";
  g.textAlign = "center";
  dots.forEach((dot, i) => {
    const show = i === 0 || weightOf(i) >= 12;
    if (!show) return;
    const label = shortLabel(i);
    const dx = dot.x - hub.x;
    const dy = dot.y - hub.y;
    const len = Math.hypot(dx, dy) || 1;
    const ox = i === 0 ? 0 : (dx / len) * 12;
    const oy = i === 0 ? 16 : (dy / len) * 12;
    g.fillText(label, dot.x + ox, dot.y + oy);
  });
}

export const ACCOUNT_TOTAL = ACCOUNTS.length;
