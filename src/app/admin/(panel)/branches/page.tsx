import { ImportParticipatingBranches } from "@/components/admin/ImportParticipatingBranches";
import { ImportBranchesButton } from "@/components/admin/ImportBranchesButton";
import { SetupBanner } from "@/components/SetupBanner";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default function AdminBranchesPage() {
  const configured = isSupabaseConfigured();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Branches & participants</h1>
        <p className="mt-1 text-sm text-slate-400">
          Import all competing branches in one CSV — areas, regions, and
          optional representative names together.
        </p>
      </div>

      {!configured && <SetupBanner />}

      <ImportParticipatingBranches />

      <details className="rounded-lg border border-slate-800 bg-slate-900/30 p-4">
        <summary className="cursor-pointer text-sm text-slate-400">
          Advanced: re-import bundled sample data (development only)
        </summary>
        <div className="mt-4 space-y-2">
          <p className="text-xs text-slate-500">
            Uses <code className="text-amber-200">data/branches.csv</code> from
            the server — not your uploaded file.
          </p>
          <ImportBranchesButton />
        </div>
      </details>
    </div>
  );
}
