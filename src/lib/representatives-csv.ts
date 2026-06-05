import { parseCsvLine } from "./branches-csv";

export interface RepresentativeCsvRow {
  branch_code: string;
  representative_1: string;
  representative_2: string;
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
    const representative_2 =
      rep2Idx !== undefined ? (cols[rep2Idx] ?? "") : "";

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
      representative_2: representative_2.trim(),
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

/** Prefilled template for Sword Duels rep import — includes area for verification. */
export function buildRepresentativesCsvTemplate(
  branches: Array<{
    branch_code: string;
    branch_name: string;
    area: string;
    representative_1?: string | null;
    representative_2?: string | null;
  }>
): string {
  const sorted = [...branches].sort((a, b) => {
    const areaCmp = a.area.localeCompare(b.area, undefined, { numeric: true });
    if (areaCmp !== 0) return areaCmp;
    return a.branch_code.localeCompare(b.branch_code, undefined, { numeric: true });
  });

  const lines = [
    "branch_code,branch_name,area,representative_1,representative_2",
  ];
  for (const b of sorted) {
    lines.push(
      [
        formatCsvField(b.branch_code),
        formatCsvField(b.branch_name),
        formatCsvField(b.area),
        formatCsvField(b.representative_1?.trim() ?? ""),
        formatCsvField(b.representative_2?.trim() ?? ""),
      ].join(",")
    );
  }
  return lines.join("\n");
}
