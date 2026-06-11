import { parseCsvLine } from "./branches-csv";
import { optionalCsvCol } from "./csv-cells";

export interface RepresentativeCsvProfileFields {
  nickname: string;
  date_hired: string;
  contact_number: string;
  email: string;
}

export interface RepresentativeCsvRow {
  branch_code: string;
  representative_1: string;
  representative_2?: string;
  representative_1_employee_no?: string;
  representative_1_position?: string;
  representative_2_employee_no?: string;
  representative_2_position?: string;
  representative_1_nickname?: string;
  representative_1_date_hired?: string;
  representative_1_contact_number?: string;
  representative_1_email?: string;
  representative_2_nickname?: string;
  representative_2_date_hired?: string;
  representative_2_contact_number?: string;
  representative_2_email?: string;
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

    const row: RepresentativeCsvRow = {
      branch_code,
      representative_1: representative_1.trim(),
    };

    const rep2 = optionalCsvCol(cols, rep2Idx);
    if (rep2 !== undefined) row.representative_2 = rep2;

    const rep1Emp = optionalCsvCol(cols, rep1EmpIdx);
    if (rep1Emp !== undefined) row.representative_1_employee_no = rep1Emp;

    const rep1Pos = optionalCsvCol(cols, rep1PosIdx);
    if (rep1Pos !== undefined) row.representative_1_position = rep1Pos;

    const rep2Emp = optionalCsvCol(cols, rep2EmpIdx);
    if (rep2Emp !== undefined) row.representative_2_employee_no = rep2Emp;

    const rep2Pos = optionalCsvCol(cols, rep2PosIdx);
    if (rep2Pos !== undefined) row.representative_2_position = rep2Pos;

    const rep1Nick = optionalCsvCol(cols, rep1Profile.nickname);
    if (rep1Nick !== undefined) row.representative_1_nickname = rep1Nick;

    const rep1Hired = optionalCsvCol(cols, rep1Profile.dateHired);
    if (rep1Hired !== undefined) row.representative_1_date_hired = rep1Hired;

    const rep1Contact = optionalCsvCol(cols, rep1Profile.contact);
    if (rep1Contact !== undefined) row.representative_1_contact_number = rep1Contact;

    const rep1Email = optionalCsvCol(cols, rep1Profile.email);
    if (rep1Email !== undefined) row.representative_1_email = rep1Email;

    const rep2Nick = optionalCsvCol(cols, rep2Profile.nickname);
    if (rep2Nick !== undefined) row.representative_2_nickname = rep2Nick;

    const rep2Hired = optionalCsvCol(cols, rep2Profile.dateHired);
    if (rep2Hired !== undefined) row.representative_2_date_hired = rep2Hired;

    const rep2Contact = optionalCsvCol(cols, rep2Profile.contact);
    if (rep2Contact !== undefined) row.representative_2_contact_number = rep2Contact;

    const rep2Email = optionalCsvCol(cols, rep2Profile.email);
    if (rep2Email !== undefined) row.representative_2_email = rep2Email;

    rows.push(row);
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
  const payload: import("@/lib/representative-fields").RepresentativeSavePayload = {
    branch_id: "",
    representative_1: row.representative_1,
    representative_2: row.representative_2 ?? "",
    representative_1_employee_no: row.representative_1_employee_no ?? "",
    representative_1_position: row.representative_1_position ?? "",
    representative_2_employee_no: row.representative_2_employee_no ?? "",
    representative_2_position: row.representative_2_position ?? "",
  };

  if (row.representative_1_nickname !== undefined) {
    payload.representative_1_nickname = row.representative_1_nickname;
  }
  if (row.representative_1_date_hired !== undefined) {
    payload.representative_1_date_hired = row.representative_1_date_hired;
  }
  if (row.representative_1_contact_number !== undefined) {
    payload.representative_1_contact_number = row.representative_1_contact_number;
  }
  if (row.representative_1_email !== undefined) {
    payload.representative_1_email = row.representative_1_email;
  }
  if (row.representative_2_nickname !== undefined) {
    payload.representative_2_nickname = row.representative_2_nickname;
  }
  if (row.representative_2_date_hired !== undefined) {
    payload.representative_2_date_hired = row.representative_2_date_hired;
  }
  if (row.representative_2_contact_number !== undefined) {
    payload.representative_2_contact_number = row.representative_2_contact_number;
  }
  if (row.representative_2_email !== undefined) {
    payload.representative_2_email = row.representative_2_email;
  }

  return payload;
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
  const no = isBlankEmployeeNo(employeeNo) ? "" : (employeeNo?.trim() ?? "");

  if (!fullName && !no) return null;

  const result: import("@/lib/employees").RepSlotInput = {
    full_name: fullName || no,
    employee_no: no,
    position: position?.trim() ?? "",
  };

  if (nickname !== undefined) result.nickname = nickname;
  if (date_hired !== undefined) result.date_hired = date_hired;
  if (contact_number !== undefined) result.contact_number = contact_number;
  if (email !== undefined) result.email = email;

  return result;
}

function isBlankEmployeeNo(value: string | undefined): boolean {
  const v = value?.trim().toLowerCase() ?? "";
  return !v || v === "n/a" || v === "na" || v === "pending";
}

export function repSlotInputFromBranchFields(
  branch: import("@/lib/representative-fields").BranchRepresentativeFields,
  slot: 1 | 2
): import("@/lib/employees").RepSlotInput | null {
  const name =
    slot === 1 ? branch.representative_1 : branch.representative_2;
  const employeeNo =
    slot === 1
      ? branch.representative_1_employee_no
      : branch.representative_2_employee_no;
  const position =
    slot === 1
      ? branch.representative_1_position
      : branch.representative_2_position;

  const fullName = name?.trim() ?? "";
  const no = isBlankEmployeeNo(employeeNo ?? undefined)
    ? ""
    : (employeeNo?.trim() ?? "");

  if (!fullName && !no) return null;

  return {
    full_name: fullName || no,
    employee_no: no,
    position: position?.trim() ?? "",
  };
}

/** Fill gaps only — keep existing rep fields when already set. */
export function mergeRepSlotInputs(
  existing: import("@/lib/employees").RepSlotInput | null,
  incoming: import("@/lib/employees").RepSlotInput | null
): import("@/lib/employees").RepSlotInput | null {
  if (!incoming) return existing;
  if (!existing) return incoming;
  return {
    full_name: existing.full_name.trim() || incoming.full_name.trim(),
    employee_no: existing.employee_no.trim() || incoming.employee_no.trim(),
    position: existing.position.trim() || incoming.position.trim(),
    nickname: existing.nickname?.trim() || incoming.nickname?.trim(),
    date_hired: existing.date_hired?.trim() || incoming.date_hired?.trim(),
    contact_number:
      existing.contact_number?.trim() || incoming.contact_number?.trim(),
    email: existing.email?.trim() || incoming.email?.trim(),
    home_branch_id: existing.home_branch_id ?? incoming.home_branch_id,
  };
}
