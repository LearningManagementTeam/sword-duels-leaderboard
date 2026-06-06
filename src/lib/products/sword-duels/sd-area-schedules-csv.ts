import type { SdAreaSchedulesConfig } from "./area-schedules";

export interface SdAreaScheduleCsvRow {
  area: string;
  groupA?: string;
  groupB?: string;
  areaFinal?: string;
}

export interface SdAreaScheduleCsvResult {
  rows: SdAreaScheduleCsvRow[];
  errors: string[];
}

function parseDateCell(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

export function parseSdAreaSchedulesCsv(text: string): SdAreaScheduleCsvResult {
  const errors: string[] = [];
  const rows: SdAreaScheduleCsvRow[] = [];
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { rows, errors: ["CSV is empty."] };
  }

  const header = splitCsvLine(lines[0]!).map((h) => h.toLowerCase());
  const areaIdx = header.indexOf("area");
  const gaIdx = header.findIndex((h) => h === "group_a" || h === "groupa");
  const gbIdx = header.findIndex((h) => h === "group_b" || h === "groupb");
  const finIdx = header.findIndex(
    (h) => h === "area_final" || h === "areafinal" || h === "final"
  );

  if (areaIdx === -1) {
    return {
      rows,
      errors: ['Header must include "area" column.'],
    };
  }

  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]!);
    const area = cells[areaIdx]?.trim();
    if (!area) {
      errors.push(`Row ${i + 1}: missing area name.`);
      continue;
    }

    const groupA = gaIdx >= 0 ? parseDateCell(cells[gaIdx] ?? "") : undefined;
    const groupB = gbIdx >= 0 ? parseDateCell(cells[gbIdx] ?? "") : undefined;
    const areaFinal =
      finIdx >= 0 ? parseDateCell(cells[finIdx] ?? "") : undefined;

    if (gaIdx >= 0 && cells[gaIdx]?.trim() && !groupA) {
      errors.push(`Row ${i + 1}: invalid group_a date for ${area}.`);
    }
    if (gbIdx >= 0 && cells[gbIdx]?.trim() && !groupB) {
      errors.push(`Row ${i + 1}: invalid group_b date for ${area}.`);
    }
    if (finIdx >= 0 && cells[finIdx]?.trim() && !areaFinal) {
      errors.push(`Row ${i + 1}: invalid area_final date for ${area}.`);
    }

    rows.push({ area, groupA, groupB, areaFinal });
  }

  return { rows, errors };
}

export function mergeCsvIntoSdAreaSchedules(
  current: SdAreaSchedulesConfig,
  rows: SdAreaScheduleCsvRow[]
): SdAreaSchedulesConfig {
  const byArea = { ...current.byArea };

  for (const row of rows) {
    const existing = byArea[row.area] ?? {};
    byArea[row.area] = {
      groupA: row.groupA ?? existing.groupA,
      groupB: row.groupB ?? existing.groupB,
      areaFinal: row.areaFinal ?? existing.areaFinal,
    };
  }

  return { ...current, byArea };
}

export const SD_AREA_SCHEDULE_CSV_TEMPLATE = `area,group_a,group_b,area_final
Area 1,2026-06-08T15:00,2026-06-09T15:00,2026-06-10T15:00
Area 2,2026-06-08T16:00,2026-06-09T16:00,2026-06-10T16:00`;
