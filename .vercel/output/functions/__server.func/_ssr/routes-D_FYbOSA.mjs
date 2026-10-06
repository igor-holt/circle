import { i as __toESM } from "../_runtime.mjs";
import { i as TIE_WEIGHT, r as LEAF_COUNT, t as ACCOUNTS } from "./field-geometry-5WuIXnIo.mjs";
import { G as require_jsx_runtime, K as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-D_FYbOSA.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var HUB$1 = 0;
var N = ACCOUNTS.length + 1;
function weightOf(index) {
	return index === HUB$1 ? 0 : ACCOUNTS[index - 1].value;
}
function shortLabel(index) {
	if (index === HUB$1) return "holt_igor";
	const account = ACCOUNTS[index - 1];
	if (account.id === "AorathianMaps") return "Robin R.";
	if (account.id === "GregoryNimensky" || account.id === "beffjezos") return "e/acc";
	if (account.name.length <= 16) return account.name;
	return account.name.split(" ")[0] ?? account.id;
}
function recenter(pts) {
	const hub = pts[HUB$1];
	return pts.map((p) => ({
		x: p.x - hub.x,
		y: p.y - hub.y
	}));
}
function fit(pts, span = 2) {
	let max = .001;
	for (const p of pts) max = Math.max(max, Math.hypot(p.x, p.y));
	const s = span / 2 / max;
	return pts.map((p) => ({
		x: p.x * s,
		y: p.y * s
	}));
}
function fruchterman(weighted, kFactor) {
	const pts = [];
	for (let i = 0; i < N; i++) {
		const angle = i * Math.PI * 2 / N;
		const r = i === HUB$1 ? 0 : .35;
		pts.push({
			x: Math.cos(angle) * r,
			y: Math.sin(angle) * r
		});
	}
	const k = kFactor * Math.sqrt(144 / N);
	const iterations = 280;
	for (let iter = 0; iter < iterations; iter++) {
		const disp = pts.map(() => ({
			x: 0,
			y: 0
		}));
		for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
			let dx = pts[i].x - pts[j].x;
			let dy = pts[i].y - pts[j].y;
			const dist = Math.hypot(dx, dy) + .02;
			const force = k * k / dist;
			dx /= dist;
			dy /= dist;
			disp[i].x += dx * force;
			disp[i].y += dy * force;
			disp[j].x -= dx * force;
			disp[j].y -= dy * force;
		}
		for (let i = 1; i < N; i++) {
			let dx = pts[i].x - pts[HUB$1].x;
			let dy = pts[i].y - pts[HUB$1].y;
			const dist = Math.hypot(dx, dy) + .02;
			const pull = weighted ? weightOf(i) / 6 : 1;
			const force = dist * dist / k * pull;
			dx /= dist;
			dy /= dist;
			disp[i].x -= dx * force;
			disp[i].y -= dy * force;
			disp[HUB$1].x += dx * force;
			disp[HUB$1].y += dy * force;
		}
		const temp = 1.1 * (1 - iter / iterations);
		for (let i = 0; i < N; i++) {
			const len = Math.hypot(disp[i].x, disp[i].y) || 1;
			const step = Math.min(len, temp);
			pts[i].x += disp[i].x / len * step;
			pts[i].y += disp[i].y / len * step;
		}
		const hx = pts[HUB$1].x;
		const hy = pts[HUB$1].y;
		for (const p of pts) {
			p.x -= hx;
			p.y -= hy;
		}
	}
	return fit(pts);
}
function kamada() {
	const pts = [];
	for (let i = 0; i < N; i++) {
		const angle = i * Math.PI * (3 - Math.sqrt(5));
		pts.push({
			x: Math.cos(angle) * (i === HUB$1 ? 0 : 1),
			y: Math.sin(angle) * (i === HUB$1 ? 0 : 1)
		});
	}
	const ideal = (i, j) => {
		if (i > j) return ideal(j, i);
		if (i === HUB$1) return .35 + weightOf(j) * .11;
		return 1.6;
	};
	for (let iter = 0; iter < 180; iter++) {
		const disp = pts.map(() => ({
			x: 0,
			y: 0
		}));
		for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
			let dx = pts[j].x - pts[i].x;
			let dy = pts[j].y - pts[i].y;
			const dist = Math.hypot(dx, dy) + .02;
			const rest = ideal(i, j);
			const force = (i === HUB$1 || j === HUB$1 ? .08 : .015) * (dist - rest);
			dx /= dist;
			dy /= dist;
			disp[i].x += dx * force;
			disp[i].y += dy * force;
			disp[j].x -= dx * force;
			disp[j].y -= dy * force;
		}
		const damp = .45 * (1 - iter / 220);
		for (let i = 0; i < N; i++) {
			pts[i].x += disp[i].x * damp;
			pts[i].y += disp[i].y * damp;
		}
		const hx = pts[HUB$1].x;
		const hy = pts[HUB$1].y;
		for (const p of pts) {
			p.x -= hx;
			p.y -= hy;
		}
	}
	return fit(recenter(pts));
}
function jacobiValues(matrix) {
	const n = matrix.length;
	const m = matrix.map((row) => row.slice());
	const v = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => i === j ? 1 : 0));
	for (let sweep = 0; sweep < 14; sweep++) for (let p = 0; p < n - 1; p++) for (let q = p + 1; q < n; q++) {
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
	return {
		values: m.map((row, i) => row[i]),
		vectors: v
	};
}
function spectral() {
	const lap = Array.from({ length: N }, () => Array(N).fill(0));
	ACCOUNTS.forEach((account, leaf) => {
		const i = leaf + 1;
		const w = account.value;
		lap[HUB$1][HUB$1] += w;
		lap[i][i] += w;
		lap[HUB$1][i] = -w;
		lap[i][HUB$1] = -w;
	});
	const { values, vectors } = jacobiValues(lap);
	const order = values.map((value, index) => ({
		value,
		index
	})).sort((a, b) => a.value - b.value);
	const a = order[1]?.index ?? 1;
	const b = order[2]?.index ?? 2;
	return fit(recenter(vectors.map((row) => ({
		x: row[a],
		y: row[b]
	}))));
}
function circular() {
	const pts = Array.from({ length: N }, () => ({
		x: 0,
		y: 0
	}));
	const hubAngle = Math.PI * .18;
	pts[HUB$1] = {
		x: Math.cos(hubAngle),
		y: Math.sin(hubAngle)
	};
	const leaves = ACCOUNTS.map((_, i) => i + 1).sort((a, b) => weightOf(b) - weightOf(a) || a - b);
	leaves.forEach((index, order) => {
		const angle = hubAngle + (order + 1) / leaves.length * Math.PI * 2;
		pts[index] = {
			x: Math.cos(angle),
			y: Math.sin(angle)
		};
	});
	return pts;
}
var cache = null;
function layout(id) {
	if (!cache) cache = {
		weighted: fruchterman(true, .9),
		unweighted: fruchterman(false, 1.6),
		kamada: kamada(),
		spectral: spectral(),
		circular: circular()
	};
	return cache[id];
}
var LAYOUTS = [
	{
		id: "weighted",
		title: "Fruchterman–Reingold",
		note: "weighted, k=0.9"
	},
	{
		id: "unweighted",
		title: "Fruchterman–Reingold",
		note: "unweighted, k=1.6"
	},
	{
		id: "kamada",
		title: "Kamada–Kawai",
		note: "energy minimization"
	},
	{
		id: "spectral",
		title: "Spectral",
		note: "Laplacian eigenvectors"
	},
	{
		id: "circular",
		title: "Circular",
		note: "not force-directed"
	}
];
function spherePositions() {
	const pts = [{
		x: 0,
		y: 0,
		z: 0
	}];
	const phi = Math.PI * (3 - Math.sqrt(5));
	const maxW = ACCOUNTS.reduce((m, a) => Math.max(m, a.value), 1);
	ACCOUNTS.forEach((account, i) => {
		const y = 1 - i / Math.max(1, ACCOUNTS.length - 1) * 2;
		const ring = Math.sqrt(Math.max(0, 1 - y * y));
		const theta = i * phi;
		const radius = 1.15 + (1 - account.value / maxW) ** .65 * 6.4;
		pts.push({
			x: Math.cos(theta) * ring * radius,
			y: y * radius * .72,
			z: Math.sin(theta) * ring * radius
		});
	});
	return pts;
}
var TOTAL_WEIGHT = ACCOUNTS.reduce((sum, account) => sum + account.value, 0);
/** Heat equation on the star. Flux on an edge defers to its tie weight. */
function diffuse(state, dt) {
	const next = state.slice();
	let hubFlux = 0;
	for (let i = 1; i < N; i++) {
		const flux = weightOf(i) / TOTAL_WEIGHT * (state[HUB$1] - state[i]);
		next[i] += dt * flux;
		hubFlux += flux;
	}
	next[HUB$1] -= dt * hubFlux;
	for (let i = 0; i < N; i++) next[i] = Math.min(1, Math.max(0, next[i]));
	return next;
}
function coldState() {
	const state = Array(N).fill(0);
	state[HUB$1] = 1;
	return state;
}
function halfLife(index) {
	const w = weightOf(index);
	return w > 0 ? Math.log(2) * TOTAL_WEIGHT / w : Infinity;
}
var HUB = "#e4485c";
function categoricalColor(index) {
	if (index === 0) return HUB;
	const weight = weightOf(index);
	if (weight >= 12) return "#e6a15c";
	if (weight >= 4) return "#3cbaa8";
	return "#8eb4d0";
}
function heatColor(amount) {
	const t = Math.max(0, Math.min(1, amount));
	const stops = [
		[
			36,
			52,
			74
		],
		[
			230,
			161,
			92
		],
		[
			228,
			72,
			92
		]
	];
	const x = t * (stops.length - 1);
	const i = Math.min(stops.length - 2, Math.floor(x));
	const f = x - i;
	const a = stops[i];
	const b = stops[i + 1];
	const ch = (k) => Math.round(a[k] + (b[k] - a[k]) * f);
	return `rgb(${ch(0)} ${ch(1)} ${ch(2)})`;
}
function paintLayout(canvas, id, heat) {
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
	const map = (p) => ({
		x: pad + (p.x + 1) / 2 * (width - 56),
		y: pad + (1 - p.y) / 2 * (height - 56)
	});
	const dots = pts.map(map);
	const hub = dots[0];
	for (let i = 1; i < dots.length; i++) {
		g.beginPath();
		g.moveTo(hub.x, hub.y);
		g.lineTo(dots[i].x, dots[i].y);
		g.strokeStyle = heat ? heatColor(heat[i] ?? 0) : categoricalColor(i);
		g.globalAlpha = .55;
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
		if (!(i === 0 || weightOf(i) >= 12)) return;
		const label = shortLabel(i);
		const dx = dot.x - hub.x;
		const dy = dot.y - hub.y;
		const len = Math.hypot(dx, dy) || 1;
		const ox = i === 0 ? 0 : dx / len * 12;
		const oy = i === 0 ? 16 : dy / len * 12;
		g.fillText(label, dot.x + ox, dot.y + oy);
	});
}
ACCOUNTS.length;
var routes_exports = /* @__PURE__ */ __exportAll({ component: () => Home });
var VIEWS = [
	{
		id: "board",
		group: "Board",
		label: "Analysis board",
		title: "Force-directed layouts on the holt_igor ego network",
		blurb: "Same graph, five embeddings. Layout changes spacing, not the star."
	},
	...LAYOUTS.map((item) => ({
		id: item.id,
		group: "Embeddings",
		label: `${item.title} · ${item.note}`,
		title: `${item.title} (${item.note})`,
		blurb: "Gold = weight ≥ 12. Teal = 4–11. Blue = 1–3. The hub is red."
	})),
	{
		id: "spatial",
		group: "Graphic models",
		label: "3D interaction network",
		title: "holt_igor · 3D interaction network",
		blurb: "Red hub, gold ties of 12 or more, teal 4–11, blue 1–3. Distance falls as weight rises. Drag to orbit."
	},
	{
		id: "diffusion",
		group: "Graphic models",
		label: "Deferential diffusion",
		title: "holt_igor · deferential diffusion",
		blurb: "Heat follows tie weight. Half-life is ln 2 · W / w."
	},
	{
		id: "all",
		group: "Constructions",
		label: "Orthogonal, symmetric, opposite, inverse clique",
		title: "Four constructions of the star",
		blurb: "Axes, a mirror, antipodes, and the complement clique, side by side."
	},
	{
		id: "orthogonal",
		group: "Constructions",
		label: "Orthogonal",
		title: "Orthogonal",
		blurb: "Each account lies on a coordinate axis. The route from the hub runs only along X, then Y, then Z."
	},
	{
		id: "symmetric",
		group: "Constructions",
		label: "Symmetric",
		title: "Symmetric",
		blurb: "Mirror across the plane x = 0. Twenty-five accounts, twenty-five reflections."
	},
	{
		id: "opposite",
		group: "Constructions",
		label: "Opposite",
		title: "Opposite",
		blurb: "Central inversion. Each account is joined to the one opposite it, through the hub."
	},
	{
		id: "inverse",
		group: "Constructions",
		label: "Inverse clique",
		title: "Inverse clique",
		blurb: "Complement of the star. The hub drops out and the fifty accounts become K₅₀."
	}
];
var GROUPS = [
	"Board",
	"Embeddings",
	"Graphic models",
	"Constructions"
];
function isLayout(mode) {
	return LAYOUTS.some((item) => item.id === mode);
}
function isField(mode) {
	return mode === "all" || mode === "orthogonal" || mode === "symmetric" || mode === "opposite" || mode === "inverse";
}
function Swatch({ color, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "inline-flex items-center gap-2 text-xs text-muted",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "inline-block size-2 rounded-full",
			style: { background: color }
		}), label]
	});
}
function RenderMenu({ mode, onPick }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const rootRef = (0, import_react.useRef)(null);
	const current = VIEWS.find((item) => item.id === mode) ?? VIEWS[0];
	(0, import_react.useEffect)(() => {
		if (!open) return;
		const onKey = (event) => {
			if (event.key === "Escape") setOpen(false);
		};
		const onPointer = (event) => {
			if (!rootRef.current?.contains(event.target)) setOpen(false);
		};
		document.addEventListener("keydown", onKey);
		document.addEventListener("pointerdown", onPointer);
		return () => {
			document.removeEventListener("keydown", onKey);
			document.removeEventListener("pointerdown", onPointer);
		};
	}, [open]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref: rootRef,
		className: "relative",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			"aria-expanded": open,
			"aria-haspopup": "menu",
			"aria-controls": "render-menu",
			onClick: () => setOpen((value) => !value),
			className: "flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-line bg-surface px-3 text-left",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "min-w-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block text-xs tracking-wide text-muted uppercase",
					children: current.group
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block truncate text-sm text-fg",
					children: current.label
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				"aria-hidden": "true",
				className: "font-mono text-xs text-accent",
				children: open ? "close" : "open"
			})]
		}), open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			id: "render-menu",
			role: "menu",
			"aria-label": "Renderings and graphic models",
			className: "absolute z-20 mt-2 max-h-96 w-full overflow-y-auto rounded-xl border border-line bg-bg p-2",
			children: GROUPS.map((group) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "px-2 pt-2 pb-1 text-xs tracking-wide text-muted uppercase",
					children: group
				}), VIEWS.filter((item) => item.group === group).map((item) => {
					const on = item.id === mode;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						role: "menuitem",
						onClick: () => {
							onPick(item.id);
							setOpen(false);
						},
						className: "flex min-h-11 w-full items-center rounded-lg px-2 text-left text-sm " + (on ? "bg-accent text-ink" : "text-fg"),
						children: item.label
					}, item.id);
				})]
			}, group))
		}) : null]
	});
}
function Panel({ id, tall }) {
	const ref = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const canvas = ref.current;
		if (!canvas) return;
		const draw = () => paintLayout(canvas, id, null);
		draw();
		const observer = new ResizeObserver(draw);
		observer.observe(canvas);
		return () => observer.disconnect();
	}, [id]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
		ref,
		className: tall ? "h-[68vh] min-h-80 w-full" : "h-64 w-full sm:h-80"
	});
}
function Home() {
	const [mode, setMode] = (0, import_react.useState)("board");
	const canvasRef = (0, import_react.useRef)(null);
	const [heat, setHeat] = (0, import_react.useState)(null);
	const modeRef = (0, import_react.useRef)(mode);
	modeRef.current = mode;
	const view = VIEWS.find((item) => item.id === mode) ?? VIEWS[0];
	const live = mode === "spatial" || mode === "diffusion" || isField(mode);
	(0, import_react.useEffect)(() => {
		if (!canvasRef.current || !live) return;
		let dead = false;
		let destroy = () => {};
		const current = modeRef.current;
		current === "spatial" || current === "diffusion" ? import("./ego-3d-CE8XYkbS.mjs").then((mod) => {
			if (dead || !canvasRef.current) return;
			const api = mod.mountEgo3d(canvasRef.current, {
				diffuse: current === "diffusion",
				onHeat: setHeat
			});
			destroy = () => api.destroy();
		}) : import("./mount-field-Pvdan0jz.mjs").then((mod) => {
			if (dead || !canvasRef.current || !isField(current)) return;
			const api = mod.mountField(canvasRef.current, {
				onHover: () => {},
				onFail: () => {}
			});
			api.setStructure(current);
			api.setNames(true);
			destroy = () => api.destroy();
		});
		return () => {
			dead = true;
			destroy();
		};
	}, [mode, live]);
	const fastest = ACCOUNTS.map((account, index) => ({
		name: shortLabel(index + 1),
		half: halfLife(index + 1)
	})).sort((a, b) => a.half - b.half).slice(0, 4);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "min-h-dvh bg-bg text-fg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "sticky top-0 z-10 border-b border-line bg-bg px-4 py-3 sm:px-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto flex max-w-6xl flex-col gap-3 lg:flex-row lg:items-end lg:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-mono text-xs tracking-wide text-accent uppercase",
							children: "Affinity Field"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-lg text-fg sm:text-xl",
							children: view.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 font-mono text-xs text-muted",
							children: [
								LEAF_COUNT + 1,
								" nodes · ",
								LEAF_COUNT,
								" ties · weight ",
								TIE_WEIGHT
							]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "w-full lg:max-w-sm",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RenderMenu, {
						mode,
						onPick: setMode
					})
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto mt-3 flex max-w-6xl flex-wrap gap-x-4 gap-y-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Swatch, {
						color: "#e4485c",
						label: "Hub"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Swatch, {
						color: "#e6a15c",
						label: "Weight ≥ 12"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Swatch, {
						color: "#3cbaa8",
						label: "4–11"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Swatch, {
						color: "#8eb4d0",
						label: "1–3"
					})
				]
			})]
		}), mode === "board" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:grid-cols-2 sm:px-8 lg:grid-cols-3",
			children: [LAYOUTS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", {
				className: "min-w-0 rounded-xl border border-line bg-surface p-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figcaption", {
					className: "mb-1 text-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-sm text-fg",
						children: item.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-xs text-muted",
						children: item.note
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, { id: item.id })]
			}, item.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "flex flex-col justify-center gap-3 px-2 text-sm leading-relaxed text-muted sm:col-span-2 lg:col-span-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-fg",
					children: "Same graph. The star does not change."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Each embedding only moves spacing, overlap, and whether weight shortens an edge." })]
			})]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "px-4 py-4 sm:px-8",
			children: [isLayout(mode) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-hidden rounded-xl border border-line",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					id: mode,
					tall: true
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "relative h-[68vh] min-h-80 overflow-hidden rounded-xl border border-line",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
					ref: canvasRef,
					className: "h-full w-full touch-none"
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-muted",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-fg",
					children: view.blurb
				}), mode === "diffusion" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 font-mono text-xs text-fg",
					children: heat ? `t ${heat.time.toFixed(1)} · hub ${heat.hub.toFixed(2)} · ahead ${heat.leader} ${heat.leaderHeat.toFixed(2)} · ${fastest.map((row) => `${row.name} ${row.half.toFixed(1)}`).join(" · ")}` : "Heat starts on the hub and leaves along each tie."
				}) : null]
			})]
		})]
	});
}
//#endregion
export { spherePositions as a, shortLabel as i, coldState as n, weightOf as o, diffuse as r, routes_exports as t };
