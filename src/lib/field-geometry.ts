export type Vec3 = { x: number; y: number; z: number };

export type Account = { id: string; name: string; value: number };

export type Structure = "all" | "orthogonal" | "symmetric" | "opposite" | "inverse";

const PHI = Math.PI * (3 - Math.sqrt(5));

export const ACCOUNTS: Account[] = [
  { id: "skindie___", name: "Skindie", value: 19 },
  { id: "AorathianMaps", name: "Robin Richardson", value: 13 },
  { id: "AiofEffect", name: "AiofEffect", value: 12 },
  { id: "ProofofMaro", name: "maro", value: 12 },
  { id: "grok", name: "Grok", value: 5 },
  { id: "Soorena", name: "Soorena", value: 5 },
  { id: "sierracatalina", name: "sierra catalina", value: 5 },
  { id: "OSoulsie", name: "Souls", value: 4 },
  { id: "AODxLA", name: "AOD", value: 4 },
  { id: "bot", name: "Grok Bot", value: 4 },
  { id: "comedypartdeux", name: "Donny Parmesani", value: 4 },
  { id: "GregoryNimensky", name: "nimensky (e/acc)", value: 3 },
  { id: "XRPeaceOfMind", name: "Shellfish", value: 3 },
  { id: "Miss_G_1", name: "Miss G", value: 3 },
  { id: "AunySillyMe", name: "Auny", value: 3 },
  { id: "unkonfined", name: "Unkonfined", value: 3 },
  { id: "cosmosarcive", name: "Cosmos Archive", value: 3 },
  { id: "rookepoole", name: "Rooke Poole", value: 2 },
  { id: "adinaS3", name: "Adina", value: 2 },
  { id: "beffjezos", name: "Beff (e/acc)", value: 2 },
  { id: "warwithwhom", name: "warwithwhom", value: 2 },
  { id: "PierceLilholt", name: "Pierce Alexander Lilholt", value: 2 },
  { id: "hovinthenorth", name: "Hovhannes Mkhitaryan", value: 2 },
  { id: "qbitstream", name: "meow", value: 2 },
  { id: "juan_gonzalesP", name: "GonzalesJ", value: 2 },
  { id: "SimonGFarmer", name: "Simon G. Farmer", value: 2 },
  { id: "antigrok", name: "Anti Grok", value: 2 },
  { id: "GearlessRoe", name: "Roe", value: 1 },
  { id: "elonmusk", name: "Elon Musk", value: 1 },
  { id: "WilliamJMcCart7", name: "wjmccartan-Billy", value: 1 },
  { id: "suavecito585", name: "Suavecito", value: 1 },
  { id: "Observer__369", name: "Timothy the Observer", value: 1 },
  { id: "zebanderson", name: "Zeb Anderson", value: 1 },
  { id: "TinfoilTricorn", name: "The Tinfoil Tricorn", value: 1 },
  { id: "SmoothCat", name: "Tony Rosamilia", value: 1 },
  { id: "MaryMajic", name: "Mary", value: 1 },
  { id: "chriswwriter", name: "Chris Whitenack", value: 1 },
  { id: "missMihalik", name: "Kamilla Mihalik", value: 1 },
  { id: "anah_sahh", name: "Hannah", value: 1 },
  { id: "DIZZHAKK", name: "DIZZHAKK", value: 1 },
  { id: "jobescape_ai", name: "Jobescape", value: 1 },
  { id: "DoinksTheFrog", name: "Doinks The Frog", value: 1 },
  { id: "NotPierce69", name: "S", value: 1 },
  { id: "VoidStateKate", name: "VOID", value: 1 },
  { id: "DaneDe4orest", name: "Dane DeForest", value: 1 },
  { id: "HennieLudick", name: "Hennie Ludick", value: 1 },
  { id: "RealCashpig", name: "Cashpig", value: 1 },
  { id: "Kyrannio", name: "Kiri", value: 1 },
  { id: "expressochai", name: "Chai", value: 1 },
  { id: "UziObi", name: "Uzi Obi", value: 1 },
];

export const LEAF_COUNT = ACCOUNTS.length;
export const HALF = Math.floor(LEAF_COUNT / 2);
export const CLIQUE_EDGES = (LEAF_COUNT * (LEAF_COUNT - 1)) / 2;
export const TIE_WEIGHT = ACCOUNTS.reduce((sum, account) => sum + account.value, 0);

const RAYS: Vec3[] = [
  { x: 1, y: 0, z: 0 },
  { x: -1, y: 0, z: 0 },
  { x: 0, y: 1, z: 0 },
  { x: 0, y: -1, z: 0 },
  { x: 0, y: 0, z: 1 },
  { x: 0, y: 0, z: -1 },
];

function maxWeight(): number {
  return ACCOUNTS.reduce((max, account) => Math.max(max, account.value), 1);
}

export function reflectX(p: Vec3): Vec3 {
  return { x: -p.x, y: p.y, z: p.z };
}

export function negate(p: Vec3): Vec3 {
  return { x: -p.x, y: -p.y, z: -p.z };
}

export function helixPositions(): Vec3[] {
  const maxW = maxWeight();
  const n = LEAF_COUNT;
  return ACCOUNTS.map((account, i) => {
    const w = account.value / maxW;
    const angle = i * PHI;
    const radius = 2.15 + (1 - w) ** 0.72 * 9.2;
    const y = (i / (n - 1) - 0.5) * 11.5;
    return { x: Math.cos(angle) * radius, y, z: Math.sin(angle) * radius };
  });
}

export function orthogonalPositions(): Vec3[] {
  const maxW = maxWeight();
  const along = [0, 0, 0, 0, 0, 0];
  return ACCOUNTS.map((account, i) => {
    const ray = i % RAYS.length;
    const step = along[ray];
    along[ray] += 1;
    const w = account.value / maxW;
    const dist = 1.7 + (1 - w) * 2.4 + step * 1.35;
    const axis = RAYS[ray];
    return { x: axis.x * dist, y: axis.y * dist, z: axis.z * dist };
  });
}

export function symmetricPositions(): Vec3[] {
  const maxW = maxWeight();
  const base: Vec3[] = [];
  for (let i = 0; i < HALF; i++) {
    const w = ACCOUNTS[i].value / maxW;
    const angle = i * PHI;
    const radius = 2.6 + (1 - w) ** 0.72 * 6.4;
    const y = (i / Math.max(1, HALF - 1) - 0.5) * 10;
    base.push({
      x: Math.abs(Math.cos(angle)) * radius + 1.1,
      y,
      z: Math.sin(angle) * radius * 0.9,
    });
  }
  return ACCOUNTS.map((_, i) => (i < HALF ? base[i] : reflectX(base[i - HALF])));
}

export function oppositePositions(): Vec3[] {
  const maxW = maxWeight();
  const base: Vec3[] = [];
  for (let i = 0; i < HALF; i++) {
    const w = ACCOUNTS[i].value / maxW;
    const yUnit = 1 - (i / Math.max(1, HALF - 1)) * 2;
    const ring = Math.sqrt(Math.max(0, 1 - yUnit * yUnit));
    const theta = i * PHI;
    const radius = 3.2 + (1 - w) ** 0.7 * 5.6;
    base.push({
      x: Math.cos(theta) * ring * radius,
      y: yUnit * radius * 0.82,
      z: Math.sin(theta) * ring * radius,
    });
  }
  return ACCOUNTS.map((_, i) => (i < HALF ? base[i] : negate(base[i - HALF])));
}

export function cliquePositions(): Vec3[] {
  const maxW = maxWeight();
  const n = LEAF_COUNT;
  return ACCOUNTS.map((account, i) => {
    const y = 1 - (i / (n - 1)) * 2;
    const ring = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = i * PHI;
    const radius = 6.4 + (1 - account.value / maxW) * 1.2;
    return {
      x: Math.cos(theta) * ring * radius,
      y: y * radius,
      z: Math.sin(theta) * ring * radius,
    };
  });
}

export function positionsFor(structure: Structure): Vec3[] {
  if (structure === "orthogonal") return orthogonalPositions();
  if (structure === "symmetric") return symmetricPositions();
  if (structure === "opposite") return oppositePositions();
  if (structure === "inverse") return cliquePositions();
  return helixPositions();
}

export function cliquePairs(): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];
  for (let i = 0; i < LEAF_COUNT; i++) {
    for (let j = i + 1; j < LEAF_COUNT; j++) pairs.push([i, j]);
  }
  return pairs;
}

export function isOnAxis(p: Vec3): boolean {
  const zeros = [p.x, p.y, p.z].filter((v) => Math.abs(v) < 1e-9).length;
  return zeros >= 2;
}
