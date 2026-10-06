import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ACCOUNTS, LEAF_COUNT, TIE_WEIGHT, type Structure } from "@/lib/field-geometry";
import { LAYOUTS, shortLabel, type LayoutId } from "@/lib/embeddings";
import { audit, PLATE_GOLD } from "@/lib/algorithm";
import { paintLayout } from "@/components/paint-layout";
import type { HeatSnapshot } from "@/components/ego-3d";

export const Route = createFileRoute("/")({ component: Home });

type Mode = "algorithm" | "board" | LayoutId | "spatial" | "diffusion" | Structure;

type View = {
  id: Mode;
  group: string;
  label: string;
  title: string;
  blurb: string;
};

const VIEWS: View[] = [
  {
    id: "algorithm",
    group: "Decision",
    label: "Algorithm",
    title: "Five steps on the original plate",
    blurb: "Measured on the uploaded figure. The redraw is not the instrument.",
  },
  {
    id: "board",
    group: "Board",
    label: "Analysis board",
    title: "Force-directed layouts on the holt_igor ego network",
    blurb: "Same graph, five embeddings. Layout changes spacing, not the star.",
  },
  ...LAYOUTS.map((item) => ({
    id: item.id,
    group: "Embeddings",
    label: `${item.title} · ${item.note}`,
    title: `${item.title} (${item.note})`,
    blurb: "Gold = weight ≥ 12. Teal = 4–11. Blue = 1–3. The hub is red.",
  })),
  {
    id: "spatial",
    group: "Graphic models",
    label: "3D interaction network",
    title: "holt_igor · 3D interaction network",
    blurb: "Red hub, gold ties of 12 or more, teal 4–11, blue 1–3. Distance falls as weight rises. Drag to orbit.",
  },
  {
    id: "diffusion",
    group: "Graphic models",
    label: "Deferential diffusion",
    title: "holt_igor · deferential diffusion",
    blurb: "Initial flux is w/W. Edge time τ = W/w. Equilibrium is 1/51.",
  },
  {
    id: "all",
    group: "Constructions",
    label: "Orthogonal, symmetric, opposite, inverse clique",
    title: "Four constructions of the star",
    blurb: "Axes, a mirror, antipodes, and the complement clique, side by side.",
  },
  {
    id: "orthogonal",
    group: "Constructions",
    label: "Orthogonal",
    title: "Orthogonal",
    blurb: "Each account lies on a coordinate axis. The route from the hub runs only along X, then Y, then Z.",
  },
  {
    id: "symmetric",
    group: "Constructions",
    label: "Symmetric",
    title: "Symmetric",
    blurb: "Mirror across the plane x = 0. Twenty-five accounts, twenty-five reflections.",
  },
  {
    id: "opposite",
    group: "Constructions",
    label: "Opposite",
    title: "Opposite",
    blurb: "Central inversion. Each account is joined to the one opposite it, through the hub.",
  },
  {
    id: "inverse",
    group: "Constructions",
    label: "Inverse clique",
    title: "Inverse clique",
    blurb: "Complement of the star. The hub drops out and the fifty accounts become K₅₀.",
  },
];

const GROUPS = ["Decision", "Board", "Embeddings", "Graphic models", "Constructions"];

function isLayout(mode: Mode): mode is LayoutId {
  return LAYOUTS.some((item) => item.id === mode);
}

function isField(mode: Mode): mode is Structure {
  return mode === "all" || mode === "orthogonal" || mode === "symmetric" || mode === "opposite" || mode === "inverse";
}

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-xs tracking-wide text-muted uppercase">
      <span className="inline-block size-1.5" style={{ background: color }} />
      {label}
    </span>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-14">
      <div className="font-mono text-sm text-fg">{value}</div>
      <div className="text-xs tracking-wide text-muted uppercase">{label}</div>
    </div>
  );
}

function RenderMenu({ mode, onPick }: { mode: Mode; onPick: (id: Mode) => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = VIEWS.find((item) => item.id === mode) ?? VIEWS[0];

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative w-full sm:w-80">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls="render-menu"
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-11 w-full items-center justify-between gap-3 border border-line bg-bg px-3 text-left"
      >
        <span className="min-w-0">
          <span className="block font-mono text-xs tracking-wide text-muted uppercase">{current.group}</span>
          <span className="block truncate text-sm text-fg">{current.label}</span>
        </span>
        <ChevronDown aria-hidden="true" className={"size-4 shrink-0 text-muted " + (open ? "rotate-180" : "")} />
      </button>
      {open ? (
        <div
          id="render-menu"
          role="menu"
          aria-label="Renderings and graphic models"
          className="absolute z-20 mt-1 max-h-96 w-full overflow-y-auto border border-line bg-bg p-1"
        >
          {GROUPS.map((group) => (
            <div key={group}>
              <p className="px-2 pt-3 pb-1 font-mono text-xs tracking-wide text-muted uppercase">{group}</p>
              {VIEWS.filter((item) => item.group === group).map((item) => {
                const on = item.id === mode;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onPick(item.id);
                      setOpen(false);
                    }}
                    className={
                      "flex min-h-11 w-full items-center px-2 text-left text-sm " + (on ? "bg-fg text-ink" : "text-muted")
                    }
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Panel({ id, tall }: { id: LayoutId; tall?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const draw = () => paintLayout(canvas, id, null);
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [id]);
  return <canvas ref={ref} className={tall ? "absolute inset-0 h-full w-full" : "h-64 w-full sm:h-72"} />;
}

function AlgorithmSheet() {
  const report = audit();
  return (
    <section className="grid flex-1 gap-px bg-line lg:grid-cols-5">
      <div className="bg-bg lg:col-span-2">
        <img src="/plate-marked.png" alt="Original figure with measured radii" className="w-full bg-bg object-contain" />
        <table className="w-full border-t border-line text-left text-sm">
          <thead>
            <tr className="font-mono text-xs tracking-wide text-muted uppercase">
              <th className="px-4 py-2 font-normal sm:px-6">Orange disk</th>
              <th className="px-2 py-2 font-normal">w</th>
              <th className="px-4 py-2 font-normal sm:px-6">px</th>
            </tr>
          </thead>
          <tbody>
            {PLATE_GOLD.map((row) => (
              <tr key={row.label} className="border-t border-line">
                <td className="px-4 py-2 text-fg sm:px-6">{row.label}</td>
                <td className="px-2 py-2 font-mono text-muted">{row.weight}</td>
                <td className="px-4 py-2 font-mono text-fg sm:px-6">{row.radius}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="border-t border-line px-4 py-3 text-sm text-muted sm:px-6">
          One blue disk sits at 45 px, inside Skindie. It is not in the gold band.
        </p>
      </div>
      <ol className="bg-bg lg:col-span-3">
        {report.steps.map((step) => (
          <li key={step.n} className="border-b border-line px-4 py-4 sm:px-6">
            <div className="flex items-baseline justify-between gap-4">
              <span className="font-mono text-xs text-muted">{step.n}</span>
              <span className="font-mono text-xs tracking-wide text-muted uppercase">{step.name}</span>
            </div>
            <p className="mt-2 text-sm font-light text-fg">{step.cut}</p>
            <p className="mt-1 text-sm text-muted">{step.keep}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Home() {
  const [mode, setMode] = useState<Mode>("algorithm");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [heat, setHeat] = useState<HeatSnapshot | null>(null);
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const view = VIEWS.find((item) => item.id === mode) ?? VIEWS[0];
  const live = mode === "spatial" || mode === "diffusion" || isField(mode);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !live) return;
    let dead = false;
    let destroy = () => {};
    const current = modeRef.current;
    const load =
      current === "spatial" || current === "diffusion"
        ? import("@/components/ego-3d").then((mod) => {
            if (dead || !canvasRef.current) return;
            const api = mod.mountEgo3d(canvasRef.current, {
              diffuse: current === "diffusion",
              onHeat: setHeat,
            });
            destroy = () => api.destroy();
          })
        : import("@/components/mount-field").then((mod) => {
            if (dead || !canvasRef.current || !isField(current)) return;
            const api = mod.mountField(canvasRef.current, {
              onHover: () => {},
              onFail: () => {},
            });
            api.setStructure(current);
            api.setNames(true);
            destroy = () => api.destroy();
          });
    void load;
    return () => {
      dead = true;
      destroy();
    };
  }, [mode, live]);

  const fastest = ACCOUNTS.map((account, index) => ({
    name: shortLabel(index + 1),
    tau: TIE_WEIGHT / account.value,
  }))
    .sort((a, b) => a.tau - b.tau)
    .slice(0, 4);

  return (
    <main className="flex min-h-dvh flex-col bg-bg text-fg">
      <header className="sticky top-0 z-10 border-b border-line bg-bg">
        <div className="flex flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-mono text-xs tracking-wide text-muted uppercase">Affinity Field</p>
              <h1 className="truncate text-lg font-light tracking-tight text-fg">{view.title}</h1>
            </div>
            <div className="flex gap-6">
              <Stat value={String(LEAF_COUNT + 1).padStart(3, "0")} label="Nodes" />
              <Stat value={String(LEAF_COUNT).padStart(3, "0")} label="Ties" />
              <Stat value={String(TIE_WEIGHT)} label="Weight" />
            </div>
          </div>
          <RenderMenu mode={mode} onPick={setMode} />
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-line px-4 py-2 sm:px-6">
          <Swatch color="#e4485c" label="Hub" />
          <Swatch color="#e6a15c" label="≥ 12" />
          <Swatch color="#3cbaa8" label="4–11" />
          <Swatch color="#8eb4d0" label="1–3" />
        </div>
      </header>

      {mode === "algorithm" ? (
        <AlgorithmSheet />
      ) : mode === "board" ? (
        <section className="grid flex-1 grid-cols-1 gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
          {LAYOUTS.map((item) => (
            <figure key={item.id} className="min-w-0 bg-bg">
              <figcaption className="flex items-baseline justify-between px-4 pt-3">
                <span className="text-sm text-fg">{item.title}</span>
                <span className="font-mono text-xs text-muted">{item.note}</span>
              </figcaption>
              <Panel id={item.id} />
            </figure>
          ))}
          <aside className="flex flex-col justify-end gap-2 bg-bg px-4 py-6 text-sm text-muted">
            <p className="font-light text-fg">Same graph. The star does not change.</p>
            <p>Spacing and overlap. Weight shortens an edge only when the force law says so.</p>
          </aside>
        </section>
      ) : (
        <section className="flex min-h-0 flex-1 flex-col">
          {isLayout(mode) ? (
            <div className="relative min-h-80 flex-1">
              <Panel id={mode} tall />
            </div>
          ) : (
            <div className="relative min-h-80 flex-1">
              <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" />
            </div>
          )}
          <footer className="flex flex-col gap-1 border-t border-line px-4 py-3 font-mono text-xs text-muted sm:px-6">
            <p className="text-fg">{view.blurb}</p>
            {mode === "diffusion" ? (
              <p>
                {heat
                  ? `t ${heat.time.toFixed(1)} · hub ${heat.hub.toFixed(2)} · ahead ${heat.leader} ${heat.leaderHeat.toFixed(2)} · τ ${fastest.map((row) => `${row.name} ${row.tau.toFixed(1)}`).join(" · ")}`
                  : "Heat starts on the hub and leaves along each tie."}
              </p>
            ) : null}
          </footer>
        </section>
      )}
    </main>
  );
}
