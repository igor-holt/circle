import { ACCOUNTS, TIE_WEIGHT } from "./field-geometry.ts";
import { shortLabel } from "./embeddings.ts";

export type Rank = {
  label: string;
  weight: number;
  flux: number;
  tau: number;
};

/** Disks measured on the original plate after a 2px erosion killed the spokes. */
export const PLATE = {
  leaves: 50,
  gold: 5,
  teal: 7,
  blue: 38,
  goldMeanPx: 63.5,
  tealMeanPx: 158,
  blueMeanPx: 297,
} as const;

/** Labeled orange disks, nearest the hub first. Radius is pixels on the plate. */
export const PLATE_GOLD = [
  { label: "AiofEffect", weight: 12, radius: 35 },
  { label: "Skindie", weight: 19, radius: 50 },
  { label: "Robin R.", weight: 13, radius: 76 },
  { label: "sierra catalina", weight: 5, radius: 77 },
  { label: "maro", weight: 12, radius: 81 },
] as const;

export function ranks(): Rank[] {
  return ACCOUNTS.map((account, index) => ({
    label: shortLabel(index + 1),
    weight: account.value,
    flux: account.value / TIE_WEIGHT,
    tau: TIE_WEIGHT / account.value,
  })).sort((a, b) => a.tau - b.tau);
}

export function audit() {
  const order = ranks();
  const lead = order[0];
  const slower = (order.at(-1)?.tau ?? lead.tau) / lead.tau;
  const slowerText = Math.abs(slower - Math.round(slower)) < 1e-6 ? String(Math.round(slower)) : slower.toFixed(1);
  const ratio = PLATE.goldMeanPx / PLATE.blueMeanPx;
  const steps = [
    {
      n: "01",
      name: "Question",
      cut: "The title on the plate says “3D interaction network.” Owner: the figure. The file is a flat drawing. There is no depth to measure.",
      keep: `After the spokes were eroded and the hub’s shadow was deleted: ${PLATE.leaves} leaf disks. That matches the ledger. Do not add a person.`,
    },
    {
      n: "02",
      name: "Delete",
      cut: "Labels are not nodes. The letters of holt_igor are orange and sparse. Delete them before you count.",
      keep: `What survives is 1 red disk, ${PLATE.gold} orange, ${PLATE.teal} teal, ${PLATE.blue} blue. The ledger’s gold band is four accounts. The plate paints a fifth orange disk.`,
    },
    {
      n: "03",
      name: "Simplify",
      cut: "Do not refit five layouts to a picture that already has radii.",
      keep: `Mean radius: orange ${PLATE.goldMeanPx} px, teal ${PLATE.tealMeanPx} px, blue ${PLATE.blueMeanPx} px. Orange/blue is ${ratio.toFixed(2)}. A drawing ratio, not a weight law.`,
    },
    {
      n: "04",
      name: "Accelerate",
      cut: "Read the marks. Closest is not heaviest. AiofEffect (12) sits inside Skindie (19). A blue disk sits at 45 px, inside Skindie.",
      keep: `sierra catalina weighs 5 and is painted orange, level with Robin R. (13). Ledger order is still Skindie first, τ ${lead.tau.toFixed(1)}, ${slowerText}× a weight-1 tie. The plate does not show that order.`,
    },
    {
      n: "05",
      name: "Automate",
      cut: "The measurement is the erosion and the color match, run on this file. The redraw is not the instrument.",
      keep: "Fly the edge list for conductance. Do not fly the plate for rank. The plate fails the color rule and fails monotone radius.",
    },
  ];
  return { steps, order, ratio };
}
