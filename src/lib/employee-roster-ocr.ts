import { parseSpreadsheetLine } from "./branches-csv";
import {
  EMPLOYEE_SHEET_COMPACT_HEADER,
  parseEmployeeDirectoryCsv,
  type EmployeeDirectoryCsvRow,
} from "./employees-csv";

const NAME_HEADER = new Set([
  "name",
  "full name",
  "full_name",
  "employee name",
  "employee_name",
  "employee",
]);

const ID_HEADER = new Set([
  "id number",
  "id_number",
  "id no",
  "employee no",
  "employee_no",
  "employee number",
  "employee id",
  "emp no",
  "emp id",
]);

const POSITION_HEADER = new Set([
  "position",
  "job title",
  "title",
  "designation",
]);

const BRANCH_HEADER = new Set([
  "branch_code",
  "branch code",
  "branch id",
  "branch no",
  "code",
]);

/** Job titles common on branch rep roster screenshots. Longest first for matching. */
const KNOWN_POSITIONS = [
  "Senior/Branch Cashier",
  "Operations Supervisor",
  "Senior Cashier",
  "Gaming Attendant",
  "Card Custodian",
  "Bingo Technician",
  "Cashier",
] as const;

function normalizeHeaderLabel(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/^\ufeff/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[.:]+$/, "")
    .trim();
}

function normalizeOcrLine(line: string): string {
  return line
    .replace(/\|/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Split an OCR table line on tabs, pipes, or wide column gaps. */
export function splitOcrTableLine(line: string): string[] {
  if (line.includes("\t")) {
    return parseSpreadsheetLine(line);
  }
  if (line.includes("|")) {
    return line
      .split("|")
      .map((part) => part.trim())
      .filter(Boolean);
  }
  if (/\s{2,}/.test(line)) {
    return line
      .split(/\s{2,}/)
      .map((part) => part.trim())
      .filter(Boolean);
  }
  return [line.trim()].filter(Boolean);
}

function isTableHeaderRow(cols: string[]): boolean {
  const normalized = cols.map(normalizeHeaderLabel);
  const hasName = normalized.some((cell) => NAME_HEADER.has(cell));
  const hasId = normalized.some((cell) => ID_HEADER.has(cell));
  const hasPosition = normalized.some((cell) => POSITION_HEADER.has(cell));
  return hasName && (hasId || hasPosition);
}

function isLikelyNoiseLine(line: string): boolean {
  const lower = line.toLowerCase();
  if (!line.trim()) return true;
  if (/^(area\s*\d+|region|varsity|rep\s*[12]|page\s+\d+)/i.test(line)) {
    return true;
  }
  if (/^(branch|code|name|position|id)\s*$/i.test(line)) return true;
  if (lower.length < 4 && !/\d/.test(line)) return true;
  return false;
}

function parseCompactOcrLine(line: string): {
  full_name: string;
  position?: string;
  employee_no?: string;
  branch_code?: string;
} | null {
  const trimmed = normalizeOcrLine(line);
  if (isLikelyNoiseLine(trimmed)) return null;

  const cols = splitOcrTableLine(trimmed);
  if (cols.length >= 4) {
    const branch = cols[cols.length - 1]!.replace(/[^\d]/g, "");
    const idRaw = cols[cols.length - 2]!.replace(/[^\dA-Za-z-]/g, "");
    const employee_no = /^\d+$/.test(idRaw) ? idRaw : "";
    return {
      full_name: cols[0]!.trim(),
      position: cols[1]?.trim() || undefined,
      employee_no: employee_no || undefined,
      branch_code: /^\d{3,4}$/.test(branch) ? branch : undefined,
    };
  }

  const tokens = trimmed.split(/\s+/);
  if (tokens.length < 3) return null;

  const branchToken = tokens[tokens.length - 1]!;
  if (!/^\d{3,4}$/.test(branchToken)) return null;

  let endIdx = tokens.length - 1;
  let employee_no: string | undefined;

  const idToken = tokens[tokens.length - 2]!;
  if (/^\d{4,6}$/.test(idToken)) {
    employee_no = idToken;
    endIdx = tokens.length - 2;
  }

  const textBeforeIds = tokens.slice(0, endIdx).join(" ");
  for (const position of KNOWN_POSITIONS) {
    const pattern = new RegExp(`(.+)\\s+${position.replace(/\//g, "\\/")}$`, "i");
    const match = textBeforeIds.match(pattern);
    if (match?.[1]?.trim()) {
      return {
        full_name: match[1].trim(),
        position,
        employee_no,
        branch_code: branchToken,
      };
    }
  }

  if (tokens.length >= 4) {
    return {
      full_name: tokens.slice(0, 2).join(" "),
      position: tokens.slice(2, endIdx).join(" ") || undefined,
      employee_no,
      branch_code: branchToken,
    };
  }

  return null;
}

function ocrTextToSpreadsheetCsv(lines: string[]): string | null {
  const splitLines = lines.map(splitOcrTableLine);

  let headerIdx = -1;
  for (let i = 0; i < splitLines.length; i++) {
    if (isTableHeaderRow(splitLines[i]!)) {
      headerIdx = i;
      break;
    }
  }

  if (headerIdx >= 0) {
    const header = splitLines[headerIdx]!.join("\t");
    const dataRows = splitLines
      .slice(headerIdx + 1)
      .filter((cols) => cols.length >= 2 && !isTableHeaderRow(cols))
      .map((cols) => cols.join("\t"));
    if (dataRows.length > 0) {
      return [header, ...dataRows].join("\n");
    }
  }

  const compactRows = lines
    .map(parseCompactOcrLine)
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .map((row) =>
      [
        row.full_name,
        row.position ?? "",
        row.employee_no ?? "",
        row.branch_code ?? "",
      ].join("\t")
    );

  if (compactRows.length >= 2) {
    return `${EMPLOYEE_SHEET_COMPACT_HEADER}\n${compactRows.join("\n")}`;
  }

  return null;
}

/** Parse bulk employee roster text from OCR (many rows). */
export function parseEmployeeRosterFromOcrText(raw: string): {
  rows: EmployeeDirectoryCsvRow[];
  errors: string[];
  warnings: string[];
} {
  const lines = raw
    .split(/\r?\n/)
    .map(normalizeOcrLine)
    .filter(Boolean);

  if (lines.length === 0) {
    return {
      rows: [],
      errors: ["No text found in the screenshot."],
      warnings: [],
    };
  }

  const csvText = ocrTextToSpreadsheetCsv(lines);
  if (csvText) {
    const result = parseEmployeeDirectoryCsv(csvText);
    if (result.rows.length > 0) {
      return result;
    }
  }

  const warnings: string[] = [];
  const errors: string[] = [];
  const rows: EmployeeDirectoryCsvRow[] = [];

  for (let i = 0; i < lines.length; i++) {
    const parsed = parseCompactOcrLine(lines[i]!);
    if (!parsed?.full_name) continue;

    const pseudoCsv = `${EMPLOYEE_SHEET_COMPACT_HEADER}\n${[
      parsed.full_name,
      parsed.position ?? "",
      parsed.employee_no ?? "",
      parsed.branch_code ?? "",
    ].join("\t")}`;

    const { rows: oneRow, errors: rowErrors } = parseEmployeeDirectoryCsv(pseudoCsv);
    if (rowErrors.length) {
      errors.push(`Line ${i + 1}: ${rowErrors.join(" ")}`);
      continue;
    }
    if (oneRow[0]) rows.push(oneRow[0]);
  }

  if (!rows.length) {
    return {
      rows: [],
      errors: [
        "Could not read employee rows from screenshot. Use a clear image of the roster table (name, position, id, branch).",
        ...errors,
      ],
      warnings,
    };
  }

  if (errors.length) {
    warnings.push(...errors);
  }

  return { rows, errors: [], warnings };
}
