import { parseSpreadsheetLine } from "./branches-csv";
import { optionalCsvCol } from "./csv-cells";
import { parseEmployeeDateHired } from "./employee-profile-fields";
import { provisionalEmployeeNo } from "./employee-numbers";

/** One row per employee — matches HR branch employee sheet layout. */
export interface EmployeeDirectoryCsvRow {
  employee_no: string;
  full_name: string;
  nickname?: string;
  position?: string;
  date_hired?: string;
  contact_number?: string;
  email?: string;
  branch_code?: string;
}

type ProfileFieldKey =
  | "full_name"
  | "nickname"
  | "position"
  | "employee_no"
  | "date_hired"
  | "contact_number"
  | "email"
  | "branch_code";

const FIELD_LABEL_ALIASES: Record<ProfileFieldKey, string[]> = {
  full_name: [
    "name",
    "full name",
    "full_name",
    "employee name",
    "employee_name",
    "employee",
  ],
  nickname: ["nickname", "nick name", "nick_name", "preferred name"],
  position: ["position", "job title", "job_title", "title", "designation"],
  employee_no: [
    "id number",
    "id_number",
    "id no",
    "id no.",
    "employee no",
    "employee no.",
    "employee_no",
    "employee number",
    "employee id",
    "emp no",
    "emp no.",
    "emp id",
    "emp id.",
  ],
  date_hired: [
    "date hired",
    "date_hired",
    "date of hire",
    "date of hiring",
    "hired",
    "hiring date",
  ],
  contact_number: [
    "contact number",
    "contact_number",
    "contact no",
    "contact no.",
    "contact",
    "phone",
    "mobile",
    "mobile no",
    "mobile no.",
    "cell",
    "cellphone",
  ],
  email: ["email", "e-mail", "email address", "email_address"],
  branch_code: [
    "branch_code",
    "branch code",
    "branch id",
    "branch no",
    "branch no.",
    "branch #",
  ],
};

const NAME_HEADER_ALIASES = new Set(FIELD_LABEL_ALIASES.full_name);

/** Full HR employee sheet — one row per person. */
export const EMPLOYEE_DIRECTORY_CSV_TEMPLATE_HEADER =
  "name,nickname,position,id_number,date_hired,contact_number,email,branch_code,branch,area";

/** Compact roster row (name, position, id, branch only). */
export const EMPLOYEE_SHEET_COMPACT_HEADER =
  "name,position,id_number,branch_code";

export const EMPLOYEE_DIRECTORY_CSV_TEMPLATE_SAMPLE = [
  EMPLOYEE_DIRECTORY_CSV_TEMPLATE_HEADER,
  "SENDAYEN, DARENCE MAE C.,DARA,SENIOR/BRANCH CASHIER,13986,1/11/2023,9679219459,sendayend@gmail.com,415,BAYAMBANG PANGASINAN,AREA 1",
].join("\n");

function normalizeHeaderLabel(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/^\ufeff/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[.:]+$/, "")
    .trim();
}

function resolveFieldFromLabel(label: string): ProfileFieldKey | null {
  const normalized = normalizeHeaderLabel(label);
  if (!normalized) return null;

  for (const [field, aliases] of Object.entries(FIELD_LABEL_ALIASES) as [
    ProfileFieldKey,
    string[],
  ][]) {
    if (aliases.includes(normalized)) return field;
  }
  return null;
}

function resolveHeaderIndex(
  header: string[],
  aliases: string[]
): number | undefined {
  const normalizedHeader = header.map(normalizeHeaderLabel);
  for (const alias of aliases) {
    const i = normalizedHeader.indexOf(alias);
    if (i !== -1) return i;
  }
  return undefined;
}

/** Excel often pastes dates and numbers in raw serial / float form. */
function normalizeExcelPastedValue(
  field: ProfileFieldKey,
  value: string
): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (field === "date_hired" && /^\d+(\.\d+)?$/.test(trimmed)) {
    const serial = Math.round(Number(trimmed));
    if (serial >= 1 && serial <= 60000) {
      const utc = Date.UTC(1899, 11, 30 + serial);
      const iso = new Date(utc).toISOString().slice(0, 10);
      if (parseEmployeeDateHired(iso)) return iso;
    }
  }

  if (field === "contact_number" || field === "employee_no") {
    if (/^\d+\.?\d*[eE][+-]?\d+$/.test(trimmed)) {
      return String(Math.round(Number(trimmed)));
    }
    if (/^\d+\.0+$/.test(trimmed)) {
      return trimmed.replace(/\.0+$/, "");
    }
  }

  if (field === "branch_code") {
    return trimmed.replace(/\.0+$/, "");
  }

  return trimmed;
}

function finalizeDirectoryRow(
  fields: Partial<Record<ProfileFieldKey, string>>,
  lineNo: number,
  warnings: string[]
): EmployeeDirectoryCsvRow | null {
  const full_name = fields.full_name?.trim() ?? "";
  if (!full_name) return null;

  const branch_code = fields.branch_code?.trim();
  let employee_no = fields.employee_no?.trim() ?? "";

  if (!employee_no) {
    employee_no = provisionalEmployeeNo(full_name, { branchCode: branch_code });
    warnings.push(
      `Line ${lineNo}: no id for ${full_name} — using provisional ${employee_no}`
    );
  }

  let date_hired = fields.date_hired;
  if (date_hired) {
    const parsedDate = parseEmployeeDateHired(date_hired);
    if (!parsedDate) {
      warnings.push(
        `Line ${lineNo}: could not parse date hired "${date_hired}" — left blank`
      );
      date_hired = "";
    } else {
      date_hired = parsedDate;
    }
  }

  const row: EmployeeDirectoryCsvRow = {
    employee_no,
    full_name,
  };

  if (fields.nickname) row.nickname = fields.nickname;
  if (fields.position) row.position = fields.position;
  if (date_hired) row.date_hired = date_hired;
  if (fields.contact_number) row.contact_number = fields.contact_number;
  if (fields.email) row.email = fields.email;
  if (branch_code) row.branch_code = branch_code;

  return row;
}

/** HR profile card layout: label in column A, value in column B. */
function parseVerticalLabelValuePaste(
  lines: string[]
): EmployeeDirectoryCsvRow | null {
  const fields: Partial<Record<ProfileFieldKey, string>> = {};
  let labeledRows = 0;

  for (const line of lines) {
    const cols = parseSpreadsheetLine(line);
    if (cols.length < 2) continue;

    const field = resolveFieldFromLabel(cols[0] ?? "");
    if (!field) continue;

    const rawValue = cols.slice(1).join(" ").trim();
    if (!rawValue) continue;

    fields[field] = normalizeExcelPastedValue(field, rawValue);
    labeledRows++;
  }

  if (labeledRows < 2) return null;
  return finalizeDirectoryRow(fields, 1, []);
}

function looksLikeVerticalLabelValue(lines: string[]): boolean {
  let labeledRows = 0;
  for (const line of lines) {
    const cols = parseSpreadsheetLine(line);
    if (cols.length < 2) continue;
    if (resolveFieldFromLabel(cols[0] ?? "")) labeledRows++;
  }
  return labeledRows >= 2 && labeledRows >= Math.ceil(lines.length * 0.5);
}

function lineLooksLikeHeader(line: string): boolean {
  const first = normalizeHeaderLabel(parseSpreadsheetLine(line)[0] ?? "");
  return NAME_HEADER_ALIASES.has(first);
}

function positionalHeaderForFieldCount(count: number): string {
  if (count <= 4) return EMPLOYEE_SHEET_COMPACT_HEADER;
  return EMPLOYEE_DIRECTORY_CSV_TEMPLATE_HEADER;
}

export function parseEmployeeDirectoryCsv(text: string): {
  rows: EmployeeDirectoryCsvRow[];
  errors: string[];
  warnings: string[];
} {
  const lines = text.trim().split(/\r?\n/);
  const errors: string[] = [];
  const warnings: string[] = [];
  const rows: EmployeeDirectoryCsvRow[] = [];

  if (lines.length < 2) {
    return {
      rows: [],
      errors: ["CSV must include a header and at least one row."],
      warnings: [],
    };
  }

  const header = parseSpreadsheetLine(lines[0]!).map(normalizeHeaderLabel);

  const nameIdx = resolveHeaderIndex(header, FIELD_LABEL_ALIASES.full_name);
  const nicknameIdx = resolveHeaderIndex(header, FIELD_LABEL_ALIASES.nickname);
  const positionIdx = resolveHeaderIndex(header, FIELD_LABEL_ALIASES.position);
  const idIdx = resolveHeaderIndex(header, FIELD_LABEL_ALIASES.employee_no);
  const hiredIdx = resolveHeaderIndex(header, FIELD_LABEL_ALIASES.date_hired);
  const contactIdx = resolveHeaderIndex(
    header,
    FIELD_LABEL_ALIASES.contact_number
  );
  const emailIdx = resolveHeaderIndex(header, FIELD_LABEL_ALIASES.email);
  const branchCodeIdx = resolveHeaderIndex(
    header,
    FIELD_LABEL_ALIASES.branch_code
  );

  if (nameIdx === undefined) {
    return {
      rows: [],
      errors: ["Header must include name (or full_name)."],
      warnings: [],
    };
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!.trim();
    if (!line) continue;

    const cols = parseSpreadsheetLine(line);
    const fields: Partial<Record<ProfileFieldKey, string>> = {
      full_name: optionalCsvCol(cols, nameIdx) ?? "",
    };

    const branchRaw = optionalCsvCol(cols, branchCodeIdx);
    if (branchRaw !== undefined) {
      fields.branch_code = normalizeExcelPastedValue(
        "branch_code",
        branchRaw
      );
    }

    const idRaw =
      idIdx !== undefined ? (optionalCsvCol(cols, idIdx) ?? "") : "";
    if (idRaw) {
      fields.employee_no = normalizeExcelPastedValue("employee_no", idRaw);
    }

    const nickname = optionalCsvCol(cols, nicknameIdx);
    if (nickname) fields.nickname = nickname;

    const position = optionalCsvCol(cols, positionIdx);
    if (position) fields.position = position;

    const hiredRaw = optionalCsvCol(cols, hiredIdx);
    if (hiredRaw) {
      fields.date_hired = normalizeExcelPastedValue("date_hired", hiredRaw);
    }

    const contactRaw = optionalCsvCol(cols, contactIdx);
    if (contactRaw) {
      fields.contact_number = normalizeExcelPastedValue(
        "contact_number",
        contactRaw
      );
    }

    const email = optionalCsvCol(cols, emailIdx);
    if (email) fields.email = email;

    if (!fields.full_name) {
      errors.push(`Line ${i + 1}: missing name`);
      continue;
    }

    const row = finalizeDirectoryRow(fields, i + 1, warnings);
    if (row) rows.push(row);
  }

  return { rows, errors, warnings };
}

/** Parse one employee row pasted from Excel (tab- or comma-separated). */
export function parseEmployeeProfilePaste(text: string): {
  row: EmployeeDirectoryCsvRow | null;
  errors: string[];
  warnings: string[];
} {
  const lines = text
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return {
      row: null,
      errors: ["Paste a row from Excel first."],
      warnings: [],
    };
  }

  if (looksLikeVerticalLabelValue(lines)) {
    const row = parseVerticalLabelValuePaste(lines);
    if (row) {
      return { row, errors: [], warnings: [] };
    }
  }

  let csvText: string;

  if (lines.length === 1) {
    if (lineLooksLikeHeader(lines[0]!)) {
      return {
        row: null,
        errors: [
          "Paste the employee data row too — copy header + row, label + value pairs, or just the data row.",
        ],
        warnings: [],
      };
    }
    const fieldCount = parseSpreadsheetLine(lines[0]!).length;
    csvText = `${positionalHeaderForFieldCount(fieldCount)}\n${lines[0]}`;
  } else if (lineLooksLikeHeader(lines[0]!)) {
    csvText = lines.join("\n");
  } else if (looksLikeVerticalLabelValue(lines)) {
    const row = parseVerticalLabelValuePaste(lines);
    return row
      ? { row, errors: [], warnings: [] }
      : {
          row: null,
          errors: ["Could not read label + value pairs from paste."],
          warnings: [],
        };
  } else {
    const fieldCount = parseSpreadsheetLine(lines[0]!).length;
    csvText = `${positionalHeaderForFieldCount(fieldCount)}\n${lines.join("\n")}`;
  }

  const { rows, errors, warnings } = parseEmployeeDirectoryCsv(csvText);
  if (errors.length) {
    return { row: null, errors, warnings };
  }
  if (!rows.length) {
    return {
      row: null,
      errors: ["No employee row found in paste."],
      warnings,
    };
  }

  const extraWarnings =
    rows.length > 1
      ? [
          `Using first of ${rows.length} pasted rows — paste one employee at a time for clarity.`,
        ]
      : [];

  return {
    row: rows[0]!,
    errors: [],
    warnings: [...warnings, ...extraWarnings],
  };
}
