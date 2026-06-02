import { ImportRepresentativesCsv } from "@/components/admin/ImportRepresentativesCsv";
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Branch representatives</h1>
        <p className="mt-1 text-sm text-slate-400">
          Add or change competitor names for any branch at any time — import a
          CSV or edit the table below, then save. Stored in admin (not on the
          public leaderboard unless enabled later).
        </p>
        <p className="mt-2 text-sm">
          <Link href="/admin/branches" className="text-amber-400 hover:underline">
            ← Branch import
          </Link>
        </p>
      </div>

      {!configured && <SetupBanner />}

      <ImportRepresentativesCsv />

      <RepresentativesEditor
        key={`reps-${data.total}-${data.withReps}`}
        branches={data.branches}
        initialWithReps={data.withReps}
      />
    </div>
  );
}
