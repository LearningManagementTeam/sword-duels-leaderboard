import Link from "next/link";
import { RosterCapacityPreview } from "@/components/admin/RosterCapacityPreview";
import { SetupBanner } from "@/components/SetupBanner";
import { getBranchesForRepresentatives } from "@/lib/data/admin-queries";
import { DEMO_BRANCHES } from "@/lib/demo/demo-branches";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import type { Branch } from "@/lib/types";

export default async function AdminRosterCapacityPage() {
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
      <div className="sd-page-header">
        <h1>Full roster capacity</h1>
        <p>
          One compiled view of every leaderboard slot — real branches plus
          placeholders for empty July or Nationals seats. Use this to check layout
          before scores go live.
        </p>
        <p className="mt-2 text-sm">
          <Link href="/admin/national-competitions/preview" className="sd-link">
            ← Back to preview links
          </Link>
        </p>
      </div>

      {!configured && <SetupBanner />}

      <RosterCapacityPreview branches={branches} />
    </div>
  );
}
