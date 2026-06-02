import type { Region } from "./scoring-config";

export interface BranchCsvRow {
  branch_code: string;
  branch_name: string;
  area: string;
  region: Region;
}

const REGION_SET = new Set<string>(["luzon", "ncr", "vismin"]);

/** Parse one CSV line respecting "quoted, fields" with commas inside. */
export function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  fields.push(current.trim());
  return fields;
}

function normalizeRegion(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/vismin/i, "vismin")
    .replace(/vis-min/i, "vismin");
}

function resolveHeaderIndex(
  header: string[],
  aliases: string[]
): number | undefined {
  for (const alias of aliases) {
    const i = header.indexOf(alias);
    if (i !== -1) return i;
  }
  return undefined;
}

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

  const header = parseCsvLine(lines[0]).map((h) =>
    h.toLowerCase().replace(/^\ufeff/, "")
  );

  const codeIdx = resolveHeaderIndex(header, [
    "branch_code",
    "branch code",
    "code",
    "id",
  ]);
  const nameIdx = resolveHeaderIndex(header, [
    "branch_name",
    "branch name",
    "name",
    "branch",
  ]);
  const areaIdx = resolveHeaderIndex(header, ["area"]);
  const regionIdx = resolveHeaderIndex(header, ["region"]);

  if (
    codeIdx === undefined ||
    nameIdx === undefined ||
    areaIdx === undefined ||
    regionIdx === undefined
  ) {
    return {
      rows: [],
      errors: [
        "Header must include: branch_code (or id), branch_name, area, region.",
      ],
    };
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = parseCsvLine(line);
    const branch_code = cols[codeIdx];
    const branch_name = cols[nameIdx];
    const area = cols[areaIdx];
    const region = normalizeRegion(cols[regionIdx] ?? "");

    if (!branch_code || !branch_name || !area || !region) {
      errors.push(`Line ${i + 1}: missing required fields`);
      continue;
    }
    if (!REGION_SET.has(region)) {
      errors.push(
        `Line ${i + 1}: invalid region "${cols[regionIdx]}" (expected luzon, ncr, or vismin). ` +
          `If the branch name contains a comma, save the CSV from Excel as UTF-8 and ensure the name is quoted, or remove commas from names.`
      );
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
