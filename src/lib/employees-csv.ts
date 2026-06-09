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

  const header = parseSpreadsheetLine(lines[0]!).map((h) =>
    h.toLowerCase().replace(/^\ufeff/, "").trim()
  );

  const nameIdx = resolveHeaderIndex(header, [
    "name",
    "full_name",
    "full name",
    "employee_name",
    "employee name",
  ]);
  const nicknameIdx = resolveHeaderIndex(header, ["nickname", "nick name"]);
  const positionIdx = resolveHeaderIndex(header, ["position", "job title"]);
  const idIdx = resolveHeaderIndex(header, [
    "id_number",
    "id number",
    "employee_no",
    "employee no",
    "employee number",
    "employee_no.",
  ]);
  const hiredIdx = resolveHeaderIndex(header, [
    "date_hired",
    "date hired",
    "hired",
    "date of hire",
  ]);
  const contactIdx = resolveHeaderIndex(header, [
    "contact_number",
    "contact number",
    "contact",
    "phone",
    "mobile",
    "contact numer",
  ]);
  const emailIdx = resolveHeaderIndex(header, [
    "email",
    "email_address",
    "email address",
    "e-mail",
  ]);
  const branchCodeIdx = resolveHeaderIndex(header, [
    "branch_code",
    "branch code",
    "code",
  ]);

  if (nameIdx === undefined) {
    return {
      rows: [],
      errors: ["Header must include name (or full_name)."],
      warnings: [],
    };
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = parseSpreadsheetLine(line);
    const full_name = optionalCsvCol(cols, nameIdx) ?? "";
    const branch_code = optionalCsvCol(cols, branchCodeIdx);
    let employee_no = idIdx !== undefined ? (optionalCsvCol(cols, idIdx) ?? "") : "";

    if (!full_name) {
      errors.push(`Line ${i + 1}: missing name`);
      continue;
    }

    if (!employee_no) {
      employee_no = provisionalEmployeeNo(full_name, {
        branchCode: branch_code,
      });
      warnings.push(
        `Line ${i + 1}: no id for ${full_name} — using provisional ${employee_no}`
      );
    }

    let date_hired = optionalCsvCol(cols, hiredIdx);
    if (date_hired !== undefined && date_hired) {
      const parsedDate = parseEmployeeDateHired(date_hired);
      if (!parsedDate) {
        warnings.push(
          `Line ${i + 1}: could not parse date hired "${date_hired}" — left blank`
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

    const nickname = optionalCsvCol(cols, nicknameIdx);
    if (nickname !== undefined) row.nickname = nickname;

    const position = optionalCsvCol(cols, positionIdx);
    if (position !== undefined) row.position = position;

    if (date_hired !== undefined) row.date_hired = date_hired;

    const contact_number = optionalCsvCol(cols, contactIdx);
    if (contact_number !== undefined) row.contact_number = contact_number;

    const email = optionalCsvCol(cols, emailIdx);
    if (email !== undefined) row.email = email;

    if (branch_code !== undefined) row.branch_code = branch_code;

    rows.push(row);
  }

  return { rows, errors, warnings };
}

export const EMPLOYEE_DIRECTORY_CSV_TEMPLATE_HEADER =
  "name,nickname,position,id_number,date_hired,contact_number,email,branch_code,branch,area";

export const EMPLOYEE_DIRECTORY_CSV_TEMPLATE_SAMPLE = [
  EMPLOYEE_DIRECTORY_CSV_TEMPLATE_HEADER,
  'SENDAYEN, DARENCE MAE C.,DARA,SENIOR/BRANCH CASHIER,13986,1/11/2023,9679219459,sendayend@gmail.com,415,BAYAMBANG PANGASINAN,AREA 1',
].join("\n");

const NAME_HEADER_ALIASES = new Set([
  "name",
  "full_name",
  "full name",
  "employee_name",
  "employee name",
]);

function lineLooksLikeHeader(line: string): boolean {
  const first = parseSpreadsheetLine(line)[0]?.toLowerCase().replace(/^\ufeff/, "").trim();
  return first !== undefined && NAME_HEADER_ALIASES.has(first);
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

  let csvText: string;

  if (lines.length === 1) {
    if (lineLooksLikeHeader(lines[0]!)) {
      return {
        row: null,
        errors: [
          "Paste the employee data row too — copy header + row, or just the data row.",
        ],
        warnings: [],
      };
    }
    csvText = `${EMPLOYEE_DIRECTORY_CSV_TEMPLATE_HEADER}\n${lines[0]}`;
  } else {
    csvText = lines.join("\n");
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
