import Link from "next/link";
import { RosterCapacityPreview } from "@/components/admin/RosterCapacityPreview";
import { getBranchesForRepresentatives } from "@/lib/data/admin-queries";
import { DEMO_BRANCHES } from "@/lib/demo/demo-branches";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import type { Branch } from "@/lib/types";

export default async function PublicRosterCapacityPage() {
  const configured = isSupabaseConfigured();
  let branches: Branch[] = [];

  if (configured) {
    const data = await getBranchesForRepresentatives();
    branches = (data.branches ?? []) as Branch[];
  }

  if (branches.length === 0) {
    branches = DEMO_BRANCHES as Branch[];
  }

  return (
    <div className="space-y-6">
      <div className="sd-page-header space-y-2">
        <h1>Full roster capacity (preview)</h1>
        <p className="max-w-2xl text-sd-muted">
          Temporary compiled layout — all regional slots with placeholders where
          participants are not seeded yet. Scores are not shown.
        </p>
        <Link href="/preview" className="sd-link text-sm">
          ← Preview hub
        </Link>
      </div>

      <RosterCapacityPreview branches={branches} />
    </div>
  );
}
