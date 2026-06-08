import Link from "next/link";
import { EmployeesDirectoryEditor } from "@/components/admin/EmployeesDirectoryEditor";
import { SetupBanner } from "@/components/SetupBanner";
import { hrisPath, nationalCompetitionsPath } from "@/lib/admin-routes";
import { getEmployeesForAdmin } from "@/lib/employees";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HrisEmployeesPage() {
  const configured = isSupabaseConfigured();
  let employees: Awaited<ReturnType<typeof getEmployeesForAdmin>> = [];

  if (configured) {
    try {
      employees = await getEmployeesForAdmin();
    } catch {
      employees = [];
    }
  }

  return (
    <div className="space-y-8">
      <div className="sd-page-header">
        <h1>Employee directory</h1>
        <p>
          Manage competition rep profiles — employee number, name, position, and
          employment status. Assign reps per branch on{" "}
          <Link
            href={nationalCompetitionsPath("representatives")}
            className="sd-link"
          >
            Revalida → Representatives
          </Link>
          ; changes there sync here automatically. Branches are managed on{" "}
          <Link href={hrisPath("branches")} className="sd-link">
            HRIS → Branches
          </Link>
          .
        </p>
      </div>

      {!configured && <SetupBanner />}

      <EmployeesDirectoryEditor employees={employees} />
    </div>
  );
}
