import Link from "next/link";
import { EmployeesDirectoryEditor } from "@/components/admin/EmployeesDirectoryEditor";
import { ImportEmployeesDirectory } from "@/components/admin/ImportEmployeesDirectory";
import { SetupBanner } from "@/components/SetupBanner";
import { hrisPath } from "@/lib/admin-routes";
import { getBranchOptionsForHris, getEmployeesForAdmin } from "@/lib/employees";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HrisEmployeesPage() {
  const configured = isSupabaseConfigured();
  let employees: Awaited<ReturnType<typeof getEmployeesForAdmin>> = [];
  let branches: Awaited<ReturnType<typeof getBranchOptionsForHris>> = [];

  if (configured) {
    try {
      [employees, branches] = await Promise.all([
        getEmployeesForAdmin(),
        getBranchOptionsForHris(),
      ]);
    } catch {
      employees = [];
      branches = [];
    }
  }

  return (
    <div className="space-y-8">
      <div className="sd-page-header">
        <h1>Employee directory</h1>
        <p>
          Manage HR employee profiles — number, name, position, nickname, date
          hired, contact, email, optional home branch, photo, and employment
          status. Open a profile to assign Sword Duels rep slots (Rep 1 or Rep 2
          per branch). Home branch is where someone works; rep assignment is
          separate. Branches are managed on{" "}
          <Link href={hrisPath("branches")} className="sd-link">
            HRIS → Branches
          </Link>
          .
        </p>
      </div>

      {!configured && <SetupBanner />}

      <ImportEmployeesDirectory />

      <EmployeesDirectoryEditor employees={employees} branches={branches} />
    </div>
  );
}
