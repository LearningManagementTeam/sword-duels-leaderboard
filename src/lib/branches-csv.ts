import type { Region } from "./scoring-config";
import type { BranchRepresentativeFields } from "./representative-fields";

export interface BranchCsvRow extends BranchRepresentativeFields {
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

/** Parse one pasted spreadsheet line — Excel uses tabs; CSV uses commas. */
export function parseSpreadsheetLine(line: string): string[] {
  if (line.includes("\t")) {
    return line.split("\t").map((p) => p.trim().replace(/^"|"$/g, ""));
  }
  return parseCsvLine(line);
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
  const rep1Idx = resolveHeaderIndex(header, [
    "representative_1",
    "representative 1",
    "representative1",
    "rep1",
    "representative",
    "representative_name",
    "representative name",
  ]);
  const rep2Idx = resolveHeaderIndex(header, [
    "representative_2",
    "representative 2",
    "representative2",
    "rep2",
  ]);
  const rep1EmpIdx = resolveHeaderIndex(header, [
    "representative_1_employee_no",
    "representative 1 employee no",
    "rep1_employee_no",
  ]);
  const rep1PosIdx = resolveHeaderIndex(header, [
    "representative_1_position",
    "representative 1 position",
    "rep1_position",
  ]);
  const rep2EmpIdx = resolveHeaderIndex(header, [
    "representative_2_employee_no",
    "representative 2 employee no",
    "rep2_employee_no",
  ]);
  const rep2PosIdx = resolveHeaderIndex(header, [
    "representative_2_position",
    "representative 2 position",
    "rep2_position",
  ]);

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
      representative_1:
        rep1Idx !== undefined ? cols[rep1Idx]?.trim() || undefined : undefined,
      representative_2:
        rep2Idx !== undefined ? cols[rep2Idx]?.trim() || undefined : undefined,
      representative_1_employee_no:
        rep1EmpIdx !== undefined ? cols[rep1EmpIdx]?.trim() || undefined : undefined,
      representative_1_position:
        rep1PosIdx !== undefined ? cols[rep1PosIdx]?.trim() || undefined : undefined,
      representative_2_employee_no:
        rep2EmpIdx !== undefined ? cols[rep2EmpIdx]?.trim() || undefined : undefined,
      representative_2_position:
        rep2PosIdx !== undefined ? cols[rep2PosIdx]?.trim() || undefined : undefined,
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
