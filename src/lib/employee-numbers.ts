export function legacyEmployeeNo(branchCode: string, slot: 1 | 2): string {
  return `LEGACY-${branchCode.trim()}-${slot}`;
}

/** Placeholder employee no. when HR id is not yet available. */
export function provisionalEmployeeNo(
  fullName: string,
  options?: { branchCode?: string; slot?: 1 | 2 }
): string {
  if (options?.branchCode?.trim() && options?.slot) {
    return legacyEmployeeNo(options.branchCode, options.slot);
  }

  const branch = options?.branchCode?.trim() || "UNK";
  const slug = fullName
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);

  return `PENDING-${branch}-${slug || "EMPLOYEE"}`;
}
