import { ImportParticipatingBranches } from "@/components/admin/ImportParticipatingBranches";
import { ImportBranchesButton } from "@/components/admin/ImportBranchesButton";
import { SetupBanner } from "@/components/SetupBanner";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default function AdminBranchesPage() {
  const configured = isSupabaseConfigured();

  return (
    <div className="space-y-8">
      <div className="sd-page-header">
        <h1>Branches & participants</h1>
        <p>
          Import all competing branches in one CSV — areas, regions, and
          optional representative names together.
        </p>
      </div>

      {!configured && <SetupBanner />}

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
