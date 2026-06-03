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
          Edit names in the table below anytime. For bulk setup, use the{" "}
          <strong>combined CSV</strong> on{" "}
          <Link href="/admin/branches" className="text-amber-400 hover:underline">
            Admin → Branches
          </Link>{" "}
          (same file includes branch_code, branch_name, area, region, and
          representative columns).
        </p>
      </div>

      {!configured && <SetupBanner />}

      <RepresentativesEditor
        key={`reps-${data.total}-${data.withReps}`}
        branches={data.branches}
        initialWithReps={data.withReps}
      />
    </div>
  );
}
