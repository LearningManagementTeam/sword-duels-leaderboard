import Link from "next/link";
import { RepresentativesEditor } from "@/components/admin/RepresentativesEditor";
import { SetupBanner } from "@/components/SetupBanner";
import { getBranchesForRepresentatives } from "@/lib/data/admin-queries";
import { hrisPath } from "@/lib/admin-routes";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default async function RepresentativesPage() {
  const configured = isSupabaseConfigured();
  const data = configured
    ? await getBranchesForRepresentatives()
    : { branches: [], withReps: 0, total: 0 };

  return (
    <div className="space-y-8">
      <div className="sd-page-header">
        <h1>Branch representatives</h1>
        <p>
          Assign Rep 1 and Rep 2 per branch for competitions. For bulk branch
          setup use the combined CSV on{" "}
          <Link href={hrisPath("branches")} className="sd-link">
            HRIS → Branches
          </Link>
          . Employee numbers and employment status are managed in{" "}
          <Link href={hrisPath("employees")} className="sd-link">
            HRIS → Employee directory
          </Link>
          .
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
