import { parseEmployeeDateHired } from "@/lib/employee-profile-fields";

/** Fields we can pull from an HR screenshot / OCR text. */
export interface ExtractedEmployeeProfile {
  full_name?: string;
  nickname?: string;
  position?: string;
  employee_no?: string;
  date_hired?: string;
  contact_number?: string;
  email?: string;
  branch_code?: string;
}

type FieldKey = keyof ExtractedEmployeeProfile;

const LABEL_ALIASES: Record<FieldKey, string[]> = {
  full_name: ["name", "full name", "full_name", "employee name", "employee_name"],
  nickname: ["nickname", "nick name", "nick_name"],
  position: ["position", "job title", "job_title", "title"],
  employee_no: [
    "id number",
    "id_number",
    "id no",
    "employee no",
    "employee_no",
    "employee number",
    "emp no",
    "emp id",
  ],
  date_hired: ["date hired", "date_hired", "hired", "date of hire"],
  contact_number: [
    "contact number",
    "contact_number",
    "contact",
    "phone",
    "mobile",
    "cell",
  ],
  email: ["email", "e-mail", "email address", "email_address"],
  branch_code: ["branch code", "branch_code", "code", "branch id"],
};

function normalizeOcrLine(line: string): string {
  return line
    .replace(/\|/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function labelPattern(label: string): RegExp {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped}\\s*[:#\\-]?\\s*(.+)$`, "i");
}

function extractLabeledFields(lines: string[]): ExtractedEmployeeProfile {
  const result: ExtractedEmployeeProfile = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const lower = line.toLowerCase();

    for (const [field, aliases] of Object.entries(LABEL_ALIASES) as [
      FieldKey,
      string[],
    ][]) {
      if (result[field]) continue;

      for (const alias of aliases) {
        const match = line.match(labelPattern(alias));
        if (match?.[1]?.trim()) {
          result[field] = match[1].trim();
          break;
        }

        if (lower === alias || lower === `${alias}:`) {
          const next = lines[i + 1]?.trim();
          if (next && !looksLikeLabelLine(next)) {
            result[field] = next;
          }
          break;
        }
      }
    }
  }

  return result;
}

function looksLikeLabelLine(line: string): boolean {
  const lower = line.toLowerCase();
  return Object.values(LABEL_ALIASES).some((aliases) =>
    aliases.some((alias) => lower.startsWith(`${alias}:`) || lower === alias)
  );
}

function extractRegexFallbacks(text: string): ExtractedEmployeeProfile {
  const result: ExtractedEmployeeProfile = {};

  const email = text.match(
    /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i
  )?.[0];
  if (email) result.email = email.toLowerCase();

  const phone = text.match(
    /(?:\+?63[-\s]?)?(?:0)?9\d{2}[-\s]?\d{3}[-\s]?\d{4}\b|\b09\d{9}\b|\b\d{10,11}\b/
  )?.[0];
  if (phone) result.contact_number = phone.replace(/\s+/g, "");

  const date = text.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/)?.[0];
  if (date) {
    const parsed = parseEmployeeDateHired(date);
    if (parsed) result.date_hired = parsed;
  }

  return result;
}

/** Parse a single spreadsheet-style row when headers are present in OCR text. */
function extractFromHrSheetRow(text: string): ExtractedEmployeeProfile | null {
  const lines = text
    .split(/\r?\n/)
    .map(normalizeOcrLine)
    .filter(Boolean);

  const headerIdx = lines.findIndex((line) => {
    const lower = line.toLowerCase();
    return (
      lower.includes("name") &&
      (lower.includes("id") || lower.includes("employee")) &&
      (lower.includes("position") || lower.includes("branch"))
    );
  });

  if (headerIdx === -1) return null;

  const header = lines[headerIdx]!.toLowerCase();
  const dataLine = lines
    .slice(headerIdx + 1)
    .find((line) => line.length > 10 && /\d/.test(line));

  if (!dataLine) return null;

  const splitOnTabs = dataLine.split(/\t+/).map((s) => s.trim()).filter(Boolean);
  const cells =
    splitOnTabs.length >= 4
      ? splitOnTabs
      : dataLine.split(/\s{2,}|,(?=\s*\S)/).map((s) => s.trim()).filter(Boolean);

  if (cells.length < 3) return null;

  const result: ExtractedEmployeeProfile = {};
  const colIndex = (aliases: string[]): number =>
    aliases
      .map((alias) => header.split(/\s{2,}|\t|,/).findIndex((h) => h.includes(alias)))
      .find((i) => i >= 0) ?? -1;

  const nameIdx = colIndex(["name", "full"]);
  const nickIdx = colIndex(["nick"]);
  const posIdx = colIndex(["position", "title"]);
  const idIdx = colIndex(["id", "employee"]);
  const hiredIdx = colIndex(["hired", "date"]);
  const contactIdx = colIndex(["contact", "phone", "mobile"]);
  const emailIdx = colIndex(["email"]);
  const codeIdx = colIndex(["branch code", "code"]);

  if (nameIdx >= 0 && cells[nameIdx]) result.full_name = cells[nameIdx];
  if (nickIdx >= 0 && cells[nickIdx]) result.nickname = cells[nickIdx];
  if (posIdx >= 0 && cells[posIdx]) result.position = cells[posIdx];
  if (idIdx >= 0 && cells[idIdx]) result.employee_no = cells[idIdx].replace(/\D/g, "") || cells[idIdx];
  if (hiredIdx >= 0 && cells[hiredIdx]) {
    const parsed = parseEmployeeDateHired(cells[hiredIdx]);
    if (parsed) result.date_hired = parsed;
  }
  if (contactIdx >= 0 && cells[contactIdx]) result.contact_number = cells[contactIdx];
  if (emailIdx >= 0 && cells[emailIdx]) result.email = cells[emailIdx];
  if (codeIdx >= 0 && cells[codeIdx]) result.branch_code = cells[codeIdx];

  return Object.keys(result).length > 0 ? result : null;
}

function normalizeExtracted(
  raw: ExtractedEmployeeProfile
): ExtractedEmployeeProfile {
  const result: ExtractedEmployeeProfile = {};

  if (raw.full_name?.trim()) result.full_name = raw.full_name.trim();
  if (raw.nickname?.trim()) result.nickname = raw.nickname.trim();
  if (raw.position?.trim()) result.position = raw.position.trim();

  if (raw.employee_no?.trim()) {
    const digits = raw.employee_no.replace(/[^\dA-Za-z-]/g, "");
    if (digits) result.employee_no = digits;
  }

  if (raw.date_hired?.trim()) {
    const parsed = parseEmployeeDateHired(raw.date_hired);
    if (parsed) result.date_hired = parsed;
  }

  if (raw.contact_number?.trim()) {
    result.contact_number = raw.contact_number.replace(/\s+/g, "");
  }

  if (raw.email?.trim()) result.email = raw.email.trim().toLowerCase();

  if (raw.branch_code?.trim()) {
    result.branch_code = raw.branch_code.replace(/\D/g, "") || raw.branch_code.trim();
  }

  return result;
}

export function parseEmployeeProfileFromOcrText(
  text: string
): ExtractedEmployeeProfile {
  const lines = text
    .split(/\r?\n/)
    .map(normalizeOcrLine)
    .filter(Boolean);

  const fromSheet = extractFromHrSheetRow(text);
  const fromLabels = extractLabeledFields(lines);
  const fromRegex = extractRegexFallbacks(text);

  const merged: ExtractedEmployeeProfile = {
    ...fromRegex,
    ...fromLabels,
    ...(fromSheet ?? {}),
  };

  return normalizeExtracted(merged);
}

export function extractedFieldLabels(
  extracted: ExtractedEmployeeProfile
): string[] {
  const labels: string[] = [];
  if (extracted.full_name) labels.push("name");
  if (extracted.nickname) labels.push("nickname");
  if (extracted.position) labels.push("position");
  if (extracted.employee_no) labels.push("employee no.");
  if (extracted.date_hired) labels.push("date hired");
  if (extracted.contact_number) labels.push("contact");
  if (extracted.email) labels.push("email");
  if (extracted.branch_code) labels.push("branch code");
  return labels;
}
