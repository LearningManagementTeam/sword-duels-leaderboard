/** Normalize a single CSV cell — blank, whitespace, and Excel placeholders become empty. */
export function normalizeCsvCell(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^(n\/a|na|#n\/a|null|none|-+|—+)$/i.test(trimmed)) return "";
  return trimmed;
}

/** Read a column when the header exists; returns "" for a blank cell. */
export function csvCol(cols: string[], idx: number | undefined): string {
  if (idx === undefined) return "";
  return normalizeCsvCell(cols[idx] ?? "");
}

/** Read a column only when present in the header; undefined means "do not update". */
export function optionalCsvCol(
  cols: string[],
  idx: number | undefined
): string | undefined {
  if (idx === undefined) return undefined;
  return normalizeCsvCell(cols[idx] ?? "");
}
