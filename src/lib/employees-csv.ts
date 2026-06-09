import { parseCsvLine } from "./branches-csv";
import { parseEmployeeDateHired } from "./employee-profile-fields";

/** One row per employee — matches HR branch employee sheet layout. */
export interface EmployeeDirectoryCsvRow {
  employee_no: string;
  full_name: string;
  nickname: string;
  position: string;
  date_hired: string;
  contact_number: string;
  email: string;
  branch_code: string;
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

function col(cols: string[], idx: number | undefined): string {
  if (idx === undefined) return "";
  return (cols[idx] ?? "").trim();
}

export function parseEmployeeDirectoryCsv(text: string): {
  rows: EmployeeDirectoryCsvRow[];
  errors: string[];
} {
  const lines = text.trim().split(/\r?\n/);
  const errors: string[] = [];
  const rows: EmployeeDirectoryCsvRow[] = [];

  if (lines.length < 2) {
    return { rows: [], errors: ["CSV must include a header and at least one row."] };
  }

  const header = parseCsvLine(lines[0]).map((h) =>
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

  if (nameIdx === undefined || idIdx === undefined) {
    return {
      rows: [],
      errors: [
        "Header must include name (or full_name) and id_number (or employee_no).",
      ],
    };
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = parseCsvLine(line);
    const full_name = col(cols, nameIdx);
    const employee_no = col(cols, idIdx);

    if (!full_name) {
      errors.push(`Line ${i + 1}: missing name`);
      continue;
    }
    if (!employee_no) {
      errors.push(`Line ${i + 1}: missing id number for ${full_name}`);
      continue;
    }

    const dateRaw = col(cols, hiredIdx);
    const parsedDate = parseEmployeeDateHired(dateRaw);
    if (dateRaw && !parsedDate) {
      errors.push(`Line ${i + 1}: could not parse date hired "${dateRaw}"`);
    }

    rows.push({
      employee_no,
      full_name,
      nickname: col(cols, nicknameIdx),
      position: col(cols, positionIdx),
      date_hired: parsedDate ?? "",
      contact_number: col(cols, contactIdx),
      email: col(cols, emailIdx),
      branch_code: col(cols, branchCodeIdx),
    });
  }

  return { rows, errors };
}

export const EMPLOYEE_DIRECTORY_CSV_TEMPLATE_HEADER =
  "name,nickname,position,id_number,date_hired,contact_number,email,branch_code,branch,area";

export const EMPLOYEE_DIRECTORY_CSV_TEMPLATE_SAMPLE = [
  EMPLOYEE_DIRECTORY_CSV_TEMPLATE_HEADER,
  'SENDAYEN, DARENCE MAE C.,DARA,SENIOR/BRANCH CASHIER,13986,1/11/2023,9679219459,sendayend@gmail.com,415,BAYAMBANG PANGASINAN,AREA 1',
].join("\n");
