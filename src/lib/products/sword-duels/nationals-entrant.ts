import type { Region } from "@/lib/scoring-config";
import type { NationalsAreaRep } from "./nationals-wildcard-data";

/** One slot in the nationals knockout field (area rep or wild card). */
export interface NationalsEntrant {
  id: string;
  area: string;
  slotLabel: string;
  region: Region;
  repName: string;
  branchName: string;
  branchCode: string;
  employeeNo: string | null;
  position: string | null;
  isWildcard?: boolean;
  areaFinalScore?: number;
}

export function entrantFromAreaRep(rep: NationalsAreaRep): NationalsEntrant {
  return {
    id: rep.branchId,
    area: rep.area,
    slotLabel: rep.area,
    region: rep.region,
    repName: rep.repName,
    branchName: rep.branchName,
    branchCode: rep.branchCode,
    employeeNo: rep.employeeNo,
    position: rep.position,
    areaFinalScore: rep.finalScore,
  };
}

export function entrantFromWildcard(input: {
  branchId: string;
  area: string;
  region: Region;
  repName: string;
  branchName: string;
  branchCode?: string;
  employeeNo?: string | null;
  position?: string | null;
}): NationalsEntrant {
  return {
    id: input.branchId,
    area: input.area,
    slotLabel: "Wild card",
    region: input.region,
    repName: input.repName,
    branchName: input.branchName,
    branchCode: input.branchCode ?? "",
    employeeNo: input.employeeNo ?? null,
    position: input.position ?? null,
    isWildcard: true,
  };
}

const PLACEHOLDER_REPS = [
  "Marck Santos",
  "Via Reyes",
  "Ruby Cruz",
  "Mich Tan",
  "Jill Ramos",
  "Sheila Lim",
  "Charm Velasco",
  "Nico Garcia",
  "Ella Mendoza",
  "Kai Torres",
  "Luna Aquino",
  "Owen Castillo",
  "Pia Navarro",
  "Rex Villanueva",
  "Sage Dela Rosa",
];

function regionForArea(n: number): Region {
  if (n <= 6) return "luzon";
  if (n <= 12) return "ncr";
  return "vismin";
}

/** Full placeholder field for knockout bracket preview (15 areas + wild card). */
export function buildPlaceholderNationalsEntrants(): NationalsEntrant[] {
  const areas: NationalsEntrant[] = [];

  for (let i = 1; i <= 15; i++) {
    const area = `Area ${i}`;
    areas.push({
      id: `placeholder-area-${i}`,
      area,
      slotLabel: area,
      region: regionForArea(i),
      repName: PLACEHOLDER_REPS[i - 1] ?? `Rep ${i}`,
      branchName: `${area} Branch · ${671 + i}`,
      branchCode: String(671 + i),
      employeeNo: `EMP-${String(1000 + i).padStart(4, "0")}`,
      position: "Branch Manager",
      areaFinalScore: 5 + (i % 4),
    });
  }

  areas.push({
    id: "placeholder-wildcard",
    area: "Wild card",
    slotLabel: "Wild card",
    region: "ncr",
    repName: "Alex Rivera",
    branchName: "Area 3 Branch · 674",
    branchCode: "674",
    employeeNo: "EMP-2042",
    position: "Sales Officer",
    isWildcard: true,
    areaFinalScore: 6,
  });

  return areas;
}
