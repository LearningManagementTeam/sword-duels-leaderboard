import Link from "next/link";
import { BranchesRosterEditor } from "@/components/admin/BranchesRosterEditor";
import { ImportParticipatingBranches } from "@/components/admin/ImportParticipatingBranches";
import { ImportBranchesButton } from "@/components/admin/ImportBranchesButton";
import { SetupBanner } from "@/components/SetupBanner";
import {
  REVALIDA_HUB,
  hrisPath,
  nationalCompetitionsPath,
} from "@/lib/admin-routes";
import { getBranchesForRosterAdmin } from "@/lib/data/admin-queries";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HrisBranchesPage() {
  const configured = isSupabaseConfigured();
  const roster = configured
    ? await getBranchesForRosterAdmin()
    : { branches: [], activeCount: 0, inactiveCount: 0, total: 0 };

  return (
    <div className="space-y-8">
      <div className="sd-page-header">
        <h1>Branches</h1>
        <p>
          Master branch list for all programs. Import or edit here before
          competition setup in{" "}
          <Link href={REVALIDA_HUB} className="sd-link">
            Revalida
          </Link>
          . Assign rep slots on{" "}
          <Link
            href={nationalCompetitionsPath("representatives")}
            className="sd-link"
          >
            Representatives
          </Link>
          ; employee profiles on{" "}
          <Link href={hrisPath("employees")} className="sd-link">
            Employee directory
          </Link>
          .
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
