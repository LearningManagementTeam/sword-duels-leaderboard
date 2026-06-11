/**
 * Fill-only import: Areas 4–15 branch representatives from reference sheet CSV.
 * Run: npx tsx scripts/import-areas-4-15-reps.ts
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { parseRepresentativesCsv } from "../src/lib/representatives-csv";
import { BRANCH_WITH_REPS_SELECT } from "../src/lib/representative-fields";
import { createServiceClient } from "../src/lib/supabase/server";
import { linkBranchRepresentativesMergedFromCsvRow } from "../src/lib/employees";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

async function main() {
  loadEnvLocal();

  const csvPath = resolve(
    process.cwd(),
    "data/imports/areas-4-15-representatives.csv"
  );
  const csvText = readFileSync(csvPath, "utf8");
  const { rows, errors: parseErrors } = parseRepresentativesCsv(csvText);

  if (parseErrors.length) {
    console.error("CSV parse errors:", parseErrors);
    process.exit(1);
  }

  const service = await createServiceClient();
  const { data: branches, error: branchError } = await service
    .from("branches")
    .select(BRANCH_WITH_REPS_SELECT)
    .eq("is_active", true);

  if (branchError) {
    console.error("Failed to load branches:", branchError.message);
    process.exit(1);
  }

  const codeToBranch = new Map(
    (branches ?? []).map((b) => [b.branch_code.toLowerCase(), b])
  );

  const notFound: string[] = [];
  const importErrors: string[] = [];
  let updated = 0;
  let skipped = 0;
  const now = new Date().toISOString();

  for (const row of rows) {
    const branch = codeToBranch.get(row.branch_code.toLowerCase());
    if (!branch) {
      notFound.push(row.branch_code);
      continue;
    }

    try {
      const result = await linkBranchRepresentativesMergedFromCsvRow(
        service,
        branch.id,
        branch.branch_code,
        branch,
        row,
        now
      );
      if (result === "updated") updated++;
      else skipped++;
    } catch (e) {
      importErrors.push(
        `${row.branch_code}: ${e instanceof Error ? e.message : "import failed"}`
      );
    }
  }

  console.log(
    `Import complete — updated ${updated}, skipped ${skipped} (already complete), ${rows.length} CSV rows.`
  );
  if (notFound.length) {
    console.warn(
      `Unknown branch codes (${notFound.length}): ${notFound.slice(0, 10).join(", ")}${notFound.length > 10 ? "…" : ""}`
    );
  }
  if (importErrors.length) {
    console.error("Errors:");
    for (const err of importErrors) console.error(" ", err);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
