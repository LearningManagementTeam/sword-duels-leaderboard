import type { EmployeeDirectoryCsvRow } from "@/lib/employees-csv";
import { provisionalEmployeeNo } from "@/lib/employee-numbers";

export interface VisionRosterEmployee {
  full_name: string;
  employee_no?: string | null;
  position?: string | null;
  branch_code: string;
}

export interface VisionRosterExtraction {
  employees: VisionRosterEmployee[];
}

export const ROSTER_VISION_SYSTEM_PROMPT = `You extract employee records from Sword Duels HR branch rep roster spreadsheet screenshots.

Typical layout:
- Column A: AREA (e.g. AREA 3)
- Column B: BRANCH CODE (numeric branch code — use this as branch_code on every employee from that row)
- Column C: BRANCH name
- Columns D–F: VARSITY 1 (BRANCH REP) — Employee No., Full Name, Position
- Columns G–I: VARSITY 2 (BRANCH REP) — Employee No., Full Name, Position

Rules:
1. Each filled Varsity 1 or Varsity 2 rep becomes ONE employee object.
2. Skip entirely empty rep slots (do not invent employees).
3. branch_code must be the BRANCH CODE from column B for that row (string, e.g. "65", "598").
4. employee_no: use the employee number when present; omit or null when blank.
5. full_name and position: copy exactly as shown; do not guess missing surname.
6. Ignore header rows, area-only rows, and branches with no reps filled.

Respond with ONLY valid JSON (no markdown):
{"employees":[{"full_name":"...","employee_no":"...","position":"...","branch_code":"..."}]}`;

export function parseVisionRosterJson(raw: string): VisionRosterExtraction {
  const trimmed = raw.trim();
  const jsonText = trimmed.startsWith("{")
    ? trimmed
    : trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

  const parsed = JSON.parse(jsonText) as VisionRosterExtraction;
  if (!parsed || !Array.isArray(parsed.employees)) {
    throw new Error("Vision response missing employees array.");
  }
  return parsed;
}

export function visionRosterToDirectoryRows(
  extraction: VisionRosterExtraction
): { rows: EmployeeDirectoryCsvRow[]; warnings: string[] } {
  const warnings: string[] = [];
  const rows: EmployeeDirectoryCsvRow[] = [];

  for (let i = 0; i < extraction.employees.length; i++) {
    const item = extraction.employees[i]!;
    const full_name = item.full_name?.trim() ?? "";
    const branch_code = String(item.branch_code ?? "").trim().replace(/\.0+$/, "");

    if (!full_name) {
      warnings.push(`Row ${i + 1}: skipped — missing name.`);
      continue;
    }
    if (!branch_code) {
      warnings.push(`Row ${i + 1} (${full_name}): skipped — missing branch code.`);
      continue;
    }

    let employee_no = String(item.employee_no ?? "").trim().replace(/\.0+$/, "");
    if (!employee_no) {
      employee_no = provisionalEmployeeNo(full_name, { branchCode: branch_code });
      warnings.push(
        `No id for ${full_name} — using provisional ${employee_no}.`
      );
    }

    const row: EmployeeDirectoryCsvRow = {
      employee_no,
      full_name,
      branch_code,
    };

    const position = item.position?.trim();
    if (position) row.position = position;

    rows.push(row);
  }

  return { rows, warnings };
}

/** Combine rows from multiple screenshots; later duplicates by employee no. are skipped. */
export function mergeRosterDirectoryRows(
  rowGroups: EmployeeDirectoryCsvRow[][]
): { rows: EmployeeDirectoryCsvRow[]; warnings: string[] } {
  const warnings: string[] = [];
  const byKey = new Map<string, EmployeeDirectoryCsvRow>();

  for (const group of rowGroups) {
    for (const row of group) {
      const isProvisional =
        row.employee_no.startsWith("PENDING-") ||
        row.employee_no.startsWith("LEGACY-");
      const key = isProvisional
        ? `${row.full_name.toLowerCase()}|${row.branch_code ?? ""}`
        : row.employee_no;

      if (byKey.has(key)) {
        warnings.push(
          `Duplicate skipped: ${row.full_name} (${row.employee_no}).`
        );
        continue;
      }
      byKey.set(key, row);
    }
  }

  return { rows: [...byKey.values()], warnings };
}
