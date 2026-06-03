import type { Region } from "@/lib/scoring-config";

export interface DemoBranch {
  id: string;
  branch_code: string;
  branch_name: string;
  area: string;
  region: Region;
  representative_1: string;
  representative_2: string;
}

const FIRST_NAMES = [
  "Juan",
  "Maria",
  "Jose",
  "Ana",
  "Mark",
  "Grace",
  "Carlo",
  "Joy",
  "Miguel",
  "Rosa",
  "Paolo",
  "Liza",
  "Ryan",
  "Kim",
  "Aaron",
  "Bea",
];

const LAST_NAMES = [
  "Dela Cruz",
  "Santos",
  "Reyes",
  "Garcia",
  "Ramos",
  "Torres",
  "Flores",
  "Mendoza",
  "Aquino",
  "Bautista",
  "Castillo",
  "Navarro",
];

/** Area assignment matches data/branches.csv (12 in Area 1, then 10 per area). */
function areaForIndex(i: number): string {
  if (i <= 12) return "Area 1";
  const areaNum = Math.min(14, Math.ceil((i - 12) / 10) + 1);
  return `Area ${areaNum}`;
}

/** 142 sample branches matching data/branches.csv distribution */
export const DEMO_BRANCHES: DemoBranch[] = (() => {
  const rows: DemoBranch[] = [];
  for (let i = 1; i <= 142; i++) {
    const region: Region =
      i % 3 === 0 ? "vismin" : i % 3 === 1 ? "luzon" : "ncr";

    const code = `BR${String(i).padStart(4, "0")}`;
    rows.push({
      id: `demo-${code}`,
      branch_code: code,
      branch_name: `Branch ${i}`,
      area: areaForIndex(i),
      region,
      representative_1: `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[(i * 3) % LAST_NAMES.length]}`,
      representative_2:
        i % 4 === 0
          ? `${FIRST_NAMES[(i + 5) % FIRST_NAMES.length]} ${LAST_NAMES[(i * 7) % LAST_NAMES.length]}`
          : "",
    });
  }
  return rows;
})();
