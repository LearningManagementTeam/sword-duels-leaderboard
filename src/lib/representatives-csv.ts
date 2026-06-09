import { parseCsvLine } from "./branches-csv";

export interface RepresentativeCsvProfileFields {
  nickname: string;
  date_hired: string;
  contact_number: string;
  email: string;
}

export interface RepresentativeCsvRow {
  branch_code: string;
  representative_1: string;
  representative_2: string;
  representative_1_employee_no: string;
  representative_1_position: string;
  representative_2_employee_no: string;
  representative_2_position: string;
  representative_1_nickname: string;
  representative_1_date_hired: string;
  representative_1_contact_number: string;
  representative_1_email: string;
  representative_2_nickname: string;
  representative_2_date_hired: string;
  representative_2_contact_number: string;
  representative_2_email: string;
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

function repProfileIndices(
  header: string[],
  slot: 1 | 2
): {
  nickname: number | undefined;
  dateHired: number | undefined;
  contact: number | undefined;
  email: number | undefined;
} {
  const prefix = slot === 1 ? "representative_1" : "representative_2";
  const short = slot === 1 ? "rep1" : "rep2";
  return {
    nickname: resolveHeaderIndex(header, [
      `${prefix}_nickname`,
      `${prefix} nickname`,
      `${short}_nickname`,
    ]),
    dateHired: resolveHeaderIndex(header, [
      `${prefix}_date_hired`,
      `${prefix} date hired`,
      `${short}_date_hired`,
    ]),
    contact: resolveHeaderIndex(header, [
      `${prefix}_contact_number`,
      `${prefix} contact number`,
      `${prefix}_contact`,
      `${short}_contact_number`,
    ]),
    email: resolveHeaderIndex(header, [
      `${prefix}_email`,
      `${prefix} email`,
      `${short}_email`,
    ]),
  };
}

export function parseRepresentativesCsv(text: string): {
  rows: RepresentativeCsvRow[];
  errors: string[];
} {
  const lines = text.trim().split(/\r?\n/);
  const errors: string[] = [];
  const rows: RepresentativeCsvRow[] = [];

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
    "employee_no_1",
    "employee no 1",
  ]);
  const rep1PosIdx = resolveHeaderIndex(header, [
    "representative_1_position",
    "representative 1 position",
    "rep1_position",
    "position_1",
    "position 1",
  ]);
  const rep2EmpIdx = resolveHeaderIndex(header, [
    "representative_2_employee_no",
    "representative 2 employee no",
    "rep2_employee_no",
    "employee_no_2",
    "employee no 2",
  ]);
  const rep2PosIdx = resolveHeaderIndex(header, [
    "representative_2_position",
    "representative 2 position",
    "rep2_position",
    "position_2",
    "position 2",
  ]);

  const rep1Profile = repProfileIndices(header, 1);
  const rep2Profile = repProfileIndices(header, 2);

  if (codeIdx === undefined || rep1Idx === undefined) {
    return {
      rows: [],
      errors: [
        "Header must include branch_code (or id) and representative_1 (or representative).",
      ],
    };
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = parseCsvLine(line);
    const branch_code = cols[codeIdx];
    const representative_1 = cols[rep1Idx] ?? "";

    if (!branch_code) {
      errors.push(`Line ${i + 1}: missing branch_code`);
      continue;
    }
    if (!representative_1.trim()) {
      errors.push(`Line ${i + 1}: missing representative name for ${branch_code}`);
      continue;
    }

    rows.push({
      branch_code,
      representative_1: representative_1.trim(),
      representative_2: col(cols, rep2Idx),
      representative_1_employee_no: col(cols, rep1EmpIdx),
      representative_1_position: col(cols, rep1PosIdx),
      representative_2_employee_no: col(cols, rep2EmpIdx),
      representative_2_position: col(cols, rep2PosIdx),
      representative_1_nickname: col(cols, rep1Profile.nickname),
      representative_1_date_hired: col(cols, rep1Profile.dateHired),
      representative_1_contact_number: col(cols, rep1Profile.contact),
      representative_1_email: col(cols, rep1Profile.email),
      representative_2_nickname: col(cols, rep2Profile.nickname),
      representative_2_date_hired: col(cols, rep2Profile.dateHired),
      representative_2_contact_number: col(cols, rep2Profile.contact),
      representative_2_email: col(cols, rep2Profile.email),
    });
  }

  return { rows, errors };
}

function formatCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export const REPRESENTATIVES_CSV_TEMPLATE_HEADER =
  "branch_code,branch_name,area,representative_1,representative_1_employee_no,representative_1_position,representative_1_nickname,representative_1_date_hired,representative_1_contact_number,representative_1_email,representative_2,representative_2_employee_no,representative_2_position,representative_2_nickname,representative_2_date_hired,representative_2_contact_number,representative_2_email";

/** Prefilled template for rep import — includes area and employee HR metadata. */
export function buildRepresentativesCsvTemplate(
  branches: Array<{
    branch_code: string;
    branch_name: string;
    area: string;
    representative_1?: string | null;
    representative_2?: string | null;
    representative_1_employee_no?: string | null;
    representative_1_position?: string | null;
    representative_2_employee_no?: string | null;
    representative_2_position?: string | null;
    representative_1_nickname?: string | null;
    representative_1_date_hired?: string | null;
    representative_1_contact_number?: string | null;
    representative_1_email?: string | null;
    representative_2_nickname?: string | null;
    representative_2_date_hired?: string | null;
    representative_2_contact_number?: string | null;
    representative_2_email?: string | null;
  }>
): string {
  const sorted = [...branches].sort((a, b) => {
    const areaCmp = a.area.localeCompare(b.area, undefined, { numeric: true });
    if (areaCmp !== 0) return areaCmp;
    return a.branch_code.localeCompare(b.branch_code, undefined, { numeric: true });
  });

  const lines = [REPRESENTATIVES_CSV_TEMPLATE_HEADER];
  for (const b of sorted) {
    lines.push(
      [
        formatCsvField(b.branch_code),
        formatCsvField(b.branch_name),
        formatCsvField(b.area),
        formatCsvField(b.representative_1?.trim() ?? ""),
        formatCsvField(b.representative_1_employee_no?.trim() ?? ""),
        formatCsvField(b.representative_1_position?.trim() ?? ""),
        formatCsvField(b.representative_1_nickname?.trim() ?? ""),
        formatCsvField(b.representative_1_date_hired?.trim() ?? ""),
        formatCsvField(b.representative_1_contact_number?.trim() ?? ""),
        formatCsvField(b.representative_1_email?.trim() ?? ""),
        formatCsvField(b.representative_2?.trim() ?? ""),
        formatCsvField(b.representative_2_employee_no?.trim() ?? ""),
        formatCsvField(b.representative_2_position?.trim() ?? ""),
        formatCsvField(b.representative_2_nickname?.trim() ?? ""),
        formatCsvField(b.representative_2_date_hired?.trim() ?? ""),
        formatCsvField(b.representative_2_contact_number?.trim() ?? ""),
        formatCsvField(b.representative_2_email?.trim() ?? ""),
      ].join(",")
    );
  }
  return lines.join("\n");
}

export function representativeCsvRowToPayload(
  row: RepresentativeCsvRow
): import("@/lib/representative-fields").RepresentativeSavePayload {
  return {
    branch_id: "",
    representative_1: row.representative_1,
    representative_2: row.representative_2,
    representative_1_employee_no: row.representative_1_employee_no,
    representative_1_position: row.representative_1_position,
    representative_2_employee_no: row.representative_2_employee_no,
    representative_2_position: row.representative_2_position,
    representative_1_nickname: row.representative_1_nickname,
    representative_1_date_hired: row.representative_1_date_hired,
    representative_1_contact_number: row.representative_1_contact_number,
    representative_1_email: row.representative_1_email,
    representative_2_nickname: row.representative_2_nickname,
    representative_2_date_hired: row.representative_2_date_hired,
    representative_2_contact_number: row.representative_2_contact_number,
    representative_2_email: row.representative_2_email,
  };
}

export function repSlotFromCsvRow(
  row: RepresentativeCsvRow,
  slot: 1 | 2
): import("@/lib/employees").RepSlotInput | null {
  const name = slot === 1 ? row.representative_1 : row.representative_2;
  const employeeNo =
    slot === 1 ? row.representative_1_employee_no : row.representative_2_employee_no;
  const position =
    slot === 1 ? row.representative_1_position : row.representative_2_position;
  const nickname =
    slot === 1 ? row.representative_1_nickname : row.representative_2_nickname;
  const date_hired =
    slot === 1 ? row.representative_1_date_hired : row.representative_2_date_hired;
  const contact_number =
    slot === 1
      ? row.representative_1_contact_number
      : row.representative_2_contact_number;
  const email = slot === 1 ? row.representative_1_email : row.representative_2_email;

  const fullName = name?.trim() ?? "";
  const no = employeeNo?.trim() ?? "";

  if (!fullName && !no) return null;

  return {
    full_name: fullName || no,
    employee_no: no,
    position: position?.trim() ?? "",
    nickname: nickname || undefined,
    date_hired: date_hired || undefined,
    contact_number: contact_number || undefined,
    email: email || undefined,
  };
}
