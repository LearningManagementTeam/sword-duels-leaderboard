import type { Region } from "./scoring-config";

export interface BranchCsvRow {
  branch_code: string;
  branch_name: string;
  area: string;
  region: Region;
}

const REGION_SET = new Set<string>(["luzon", "ncr", "vismin"]);

export function parseBranchesCsv(text: string): {
  rows: BranchCsvRow[];
  errors: string[];
} {
  const lines = text.trim().split(/\r?\n/);
  const errors: string[] = [];
  const rows: BranchCsvRow[] = [];

  if (lines.length < 2) {
    return { rows: [], errors: ["CSV must include a header and at least one row."] };
  }

  const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
  const expected = ["branch_code", "branch_name", "area", "region"];
  if (expected.some((col) => !header.includes(col))) {
    return {
      rows: [],
      errors: [`Header must include: ${expected.join(", ")}`],
    };
  }

  const idx = Object.fromEntries(header.map((h, i) => [h, i]));

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(",").map((c) => c.trim());
    const branch_code = cols[idx.branch_code];
    const branch_name = cols[idx.branch_name];
    const area = cols[idx.area];
    const region = cols[idx.region]?.toLowerCase();

    if (!branch_code || !branch_name || !area || !region) {
      errors.push(`Line ${i + 1}: missing required fields`);
      continue;
    }
    if (!REGION_SET.has(region)) {
      errors.push(`Line ${i + 1}: invalid region "${region}"`);
      continue;
    }
    rows.push({
      branch_code,
      branch_name,
      area,
      region: region as Region,
    });
  }

  const codes = new Set<string>();
  for (const row of rows) {
    if (codes.has(row.branch_code)) {
      errors.push(`Duplicate branch_code: ${row.branch_code}`);
    }
    codes.add(row.branch_code);
  }

  return { rows, errors };
}
