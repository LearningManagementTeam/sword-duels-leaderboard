import Link from "next/link";
import { RepresentativesEditor } from "@/components/admin/RepresentativesEditor";
import { SetupBanner } from "@/components/SetupBanner";
import { getBranchesForRepresentatives } from "@/lib/data/admin-queries";
import { hrisPath } from "@/lib/admin-routes";
import { getEmployeesForRepresentativePicker } from "@/lib/employees";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default async function RepresentativesPage() {
  const configured = isSupabaseConfigured();
  const [data, employees] = configured
    ? await Promise.all([
        getBranchesForRepresentatives(),
        getEmployeesForRepresentativePicker(),
      ])
    : [{ branches: [], withReps: 0, total: 0 }, []];

  return (
    <div className="space-y-8">
      <div className="sd-page-header">
        <h1>Branch representatives</h1>
        <p>
          Assign Rep 1 and Rep 2 per branch for competitions. Search the{" "}
          <Link href={hrisPath("employees")} className="sd-link">
            HRIS employee directory
          </Link>{" "}
          when picking reps so photos and profiles appear on leaderboards. For
          bulk branch setup use the combined CSV on{" "}
          <Link href={hrisPath("branches")} className="sd-link">
            HRIS → Branches
          </Link>
          .
        </p>
      </div>

      {!configured && <SetupBanner />}

      <RepresentativesEditor
        key={`reps-${data.total}-${data.withReps}-${employees.length}`}
        branches={data.branches}
        employees={employees}
        initialWithReps={data.withReps}
      />
    </div>
  );
}
