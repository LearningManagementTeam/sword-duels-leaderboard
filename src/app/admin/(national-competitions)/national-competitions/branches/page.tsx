import { BranchesRosterEditor } from "@/components/admin/BranchesRosterEditor";
import { ImportParticipatingBranches } from "@/components/admin/ImportParticipatingBranches";
import { ImportBranchesButton } from "@/components/admin/ImportBranchesButton";
import { SetupBanner } from "@/components/SetupBanner";
import { getBranchesForRosterAdmin } from "@/lib/data/admin-queries";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminBranchesPage() {
  const configured = isSupabaseConfigured();
  const roster = configured
    ? await getBranchesForRosterAdmin()
    : { branches: [], activeCount: 0, inactiveCount: 0, total: 0 };

  return (
    <div className="space-y-8">
      <div className="sd-page-header">
        <h1>Branches & participants</h1>
        <p>
          Manage the master branch list, import in bulk, or edit representatives
          on the next page.
        </p>
      </div>

      {!configured && <SetupBanner />}

      <BranchesRosterEditor
        key={`roster-${roster.total}-${roster.activeCount}-${roster.inactiveCount}`}
        branches={roster.branches}
        activeCount={roster.activeCount}
        inactiveCount={roster.inactiveCount}
      />

      <ImportParticipatingBranches />

      <details className="sd-glass rounded-xl p-4">
        <summary className="cursor-pointer text-sm text-sd-muted">
          Advanced: re-import bundled sample data (development only)
        </summary>
        <div className="mt-4 space-y-2">
          <p className="text-xs text-sd-muted/60">
            Uses <code className="text-sd-glow">data/branches.csv</code> from
            the server — not your uploaded file.
          </p>
          <ImportBranchesButton />
        </div>
      </details>
    </div>
  );
}
