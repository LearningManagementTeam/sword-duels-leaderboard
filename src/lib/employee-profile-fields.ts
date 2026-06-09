/** HR profile fields stored on employees — admin/HRIS only, not public leaderboards. */

export interface EmployeeHrisProfileFields {
  nickname?: string | null;
  date_hired?: string | null;
  contact_number?: string | null;
  email?: string | null;
}

export interface RepSlotProfileFields extends EmployeeHrisProfileFields {
  full_name: string;
  employee_no: string;
  position: string;
}

export function normalizeNickname(value: string | undefined | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function normalizeEmail(value: string | undefined | null): string | null {
  const trimmed = value?.trim().toLowerCase();
  if (!trimmed) return null;
  return trimmed;
}

export function normalizeContactNumber(
  value: string | undefined | null
): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/** Parse M/D/YYYY, D/M/YYYY ambiguous — prefer M/D/YYYY (US-style from HR sheets). Returns ISO date YYYY-MM-DD. */
export function parseEmployeeDateHired(
  value: string | undefined | null
): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const slash = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    const month = slash[1]!.padStart(2, "0");
    const day = slash[2]!.padStart(2, "0");
    const year = slash[3]!;
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return null;
}

export function employeeHrisDbPayload(
  fields: EmployeeHrisProfileFields
): Record<string, string | null> {
  return {
    nickname: normalizeNickname(fields.nickname),
    date_hired: parseEmployeeDateHired(fields.date_hired),
    contact_number: normalizeContactNumber(fields.contact_number),
    email: normalizeEmail(fields.email),
  };
}

/** Apply HRIS fields to a DB payload — undefined skips; blank string clears to null. */
export function applyHrisFieldsToPayload(
  payload: Record<string, unknown>,
  fields: EmployeeHrisProfileFields
): void {
  if (fields.nickname !== undefined) {
    payload.nickname = normalizeNickname(fields.nickname);
  }
  if (fields.date_hired !== undefined) {
    payload.date_hired = parseEmployeeDateHired(fields.date_hired);
  }
  if (fields.contact_number !== undefined) {
    payload.contact_number = normalizeContactNumber(fields.contact_number);
  }
  if (fields.email !== undefined) {
    payload.email = normalizeEmail(fields.email);
  }
}
