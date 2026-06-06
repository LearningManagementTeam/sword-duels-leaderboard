import Link from "next/link";
import { EmployeesDirectoryEditor } from "@/components/admin/EmployeesDirectoryEditor";
import { SetupBanner } from "@/components/SetupBanner";
import { nationalCompetitionsPath } from "@/lib/admin-routes";
import { getEmployeesForAdmin } from "@/lib/employees";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
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
        <h1>Employees</h1>
        <p>
          Competition representative profiles with employment status. Rep
          assignments sync from{" "}
          <Link
            href={nationalCompetitionsPath("representatives")}
            className="sd-link"
          >
            Representatives
          </Link>{" "}
          and Sword Duels rep import.
        </p>
      </div>

      {!configured && <SetupBanner />}

      <EmployeesDirectoryEditor
        key={`employees-${employees.length}`}
        employees={employees}
      />
    </div>
  );
}
