export type ScorePasteRow = {
  branch_code: string;
  points: number;
};

export type ScorePasteResult = {
  rows: ScorePasteRow[];
  errors: string[];
};

const HEADER_ALIASES = new Set([
  "branch_code",
  "code",
  "branch",
  "points",
  "score",
  "pts",
]);

function parsePoints(raw: string, maxPoints: number): number | null {
  const trimmed = raw.trim().replace(/%$/, "");
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return null;
  const rounded = Math.round(value);
  if (rounded < 0 || rounded > maxPoints) return null;
  return rounded;
}

/** Parse pasted CSV/TSV lines: branch_code + points (one row per line). */
export function parseScorePaste(
  text: string,
  maxPoints: number
): ScorePasteResult {
  const lines = text
    .trim()
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const errors: string[] = [];
  const rows: ScorePasteRow[] = [];

  if (lines.length === 0) {
    return { rows: [], errors: ["Paste at least one line with branch code and score."] };
  }

  let start = 0;
  const firstFields = lines[0].split(/[,\t]/).map((f) => f.trim().toLowerCase());
  if (
    firstFields.length >= 2 &&
    HEADER_ALIASES.has(firstFields[0]) &&
    HEADER_ALIASES.has(firstFields[1])
  ) {
    start = 1;
  }

  for (let i = start; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(/[,\t]/).map((p) => p.trim().replace(/^"|"$/g, ""));
    if (parts.length < 2) {
      errors.push(`Line ${i + 1}: need branch code and score separated by comma or tab.`);
      continue;
    }
    const branch_code = parts[0].toUpperCase();
    const points = parsePoints(parts[1], maxPoints);
    if (!branch_code) {
      errors.push(`Line ${i + 1}: missing branch code.`);
      continue;
    }
    if (points == null) {
      errors.push(
        `Line ${i + 1}: score must be a number from 0 to ${maxPoints} for ${branch_code}.`
      );
      continue;
    }
    rows.push({ branch_code, points });
  }

  return { rows, errors };
}
