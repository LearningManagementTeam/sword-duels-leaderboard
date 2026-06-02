import { RepresentativesEditor } from "@/components/admin/RepresentativesEditor";
import { SetupBanner } from "@/components/SetupBanner";
import { getBranchesForRepresentatives } from "@/lib/data/admin-queries";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import Link from "next/link";

export default async function RepresentativesPage() {
  const configured = isSupabaseConfigured();
  const data = configured
    ? await getBranchesForRepresentatives()
    : { branches: [], withReps: 0, total: 0 };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Branch representatives</h1>
        <p className="mt-1 text-sm text-slate-400">
          Enter competitor names for each branch before the competition starts.
          This is for your records in admin — not shown on the public
          leaderboard unless you add that later.
        </p>
        <p className="mt-2 text-sm">
          <Link href="/admin/branches" className="text-amber-400 hover:underline">
            ← Back to branch import
          </Link>
        </p>
      </div>

      {!configured && <SetupBanner />}

      <RepresentativesEditor
        branches={data.branches}
        initialWithReps={data.withReps}
      />
    </div>
  );
}
