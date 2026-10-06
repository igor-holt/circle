import { t as ACCOUNTS } from "./field-geometry-5WuIXnIo.mjs";
import { a as spherePositions, i as shortLabel, n as coldState, o as weightOf, r as diffuse } from "./routes-D_FYbOSA.mjs";
import { _ as SRGBColorSpace, a as CanvasTexture, b as Sprite, d as LineSegments, f as Mesh, i as BufferGeometry, m as PerspectiveCamera, n as WebGLRenderer, o as Color, p as MeshBasicMaterial, r as BufferAttribute, t as OrbitControls, u as LineBasicMaterial, v as Scene, x as SpriteMaterial, y as SphereGeometry } from "../_libs/three.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ego-3d-CE8XYkbS.js
function colorFor(index) {
	if (index === 0) return new Color("#e4485c");
	const weight = weightOf(index);
	if (weight >= 12) return new Color("#e6a15c");
	if (weight >= 4) return new Color("#3cbaa8");
	return new Color("#8eb4d0");
}
function heatColor(amount, target) {
	const t = Math.max(0, Math.min(1, amount));
	const cold = new Color("#24344a");
	const warm = new Color("#e6a15c");
	const hot = new Color("#e4485c");
	if (t < .5) target.copy(cold).lerp(warm, t * 2);
	else target.copy(warm).lerp(hot, (t - .5) * 2);
}
function labelTexture(text) {
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
	const tex = new CanvasTexture(canvas);
	tex.colorSpace = SRGBColorSpace;
	return tex;
}
function mountEgo3d(canvas, handlers) {
	const renderer = new WebGLRenderer({
		canvas,
		antialias: true,
		alpha: false
	});
	renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
	renderer.setClearColor(791584, 1);
	const scene = new Scene();
	const camera = new PerspectiveCamera(46, 1, .1, 200);
	camera.position.set(0, 4.5, 16);
	const controls = new OrbitControls(camera, canvas);
	controls.enableDamping = true;
	controls.target.set(0, 0, 0);
	const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	controls.autoRotate = !reduce;
	controls.autoRotateSpeed = .4;
	const pts = spherePositions();
	const geo = new SphereGeometry(1, 20, 14);
	const meshes = [];
	pts.forEach((p, i) => {
		const mat = new MeshBasicMaterial({ color: colorFor(i) });
		const mesh = new Mesh(geo, mat);
		const scale = i === 0 ? .42 : .16;
		mesh.scale.setScalar(scale);
		mesh.position.set(p.x, p.y, p.z);
		scene.add(mesh);
		meshes.push(mesh);
		if (i === 0 || weightOf(i) >= 4) {
			const sprite = new Sprite(new SpriteMaterial({
				map: labelTexture(shortLabel(i)),
				transparent: true,
				depthWrite: false
			}));
			sprite.scale.set(i === 0 ? 2.4 : 1.8, .38, 1);
			sprite.position.set(p.x, p.y + (i === 0 ? .55 : .38), p.z);
			scene.add(sprite);
		}
	});
	const edgeGeo = new BufferGeometry();
	const positions = new Float32Array(ACCOUNTS.length * 6);
	const colors = new Float32Array(ACCOUNTS.length * 6);
	ACCOUNTS.forEach((_, leaf) => {
		const p = pts[leaf + 1];
		const o = leaf * 6;
		positions[o + 3] = p.x;
		positions[o + 4] = p.y;
		positions[o + 5] = p.z;
	});
	edgeGeo.setAttribute("position", new BufferAttribute(positions, 3));
	edgeGeo.setAttribute("color", new BufferAttribute(colors, 3));
	const edges = new LineSegments(edgeGeo, new LineBasicMaterial({
		vertexColors: true,
		transparent: true,
		opacity: .85
	}));
	scene.add(edges);
	const scratch = new Color();
	function paintEdges(heat) {
		const attr = edgeGeo.getAttribute("color");
		const arr = attr.array;
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
			meshes[index].material.color.copy(scratch);
		});
		const hubMat = meshes[0].material;
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
			state = diffuse(state, .12);
			time += .12;
			paintEdges(state);
			report += .05;
			if (report > .25) {
				report = 0;
				let leader = 1;
				for (let i = 2; i < state.length; i++) if (state[i] > state[leader]) leader = i;
				handlers.onHeat({
					time,
					hub: state[0],
					leader: shortLabel(leader),
					leaderHeat: state[leader]
				});
			}
		}
		controls.update();
		renderer.render(scene, camera);
	};
	loop();
	return {
		setDiffuse(on) {
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
		}
	};
}
//#endregion
export { mountEgo3d };
