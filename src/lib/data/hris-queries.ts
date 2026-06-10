import { TARGET_BRANCH_COUNT } from "@/lib/branch-targets";
import { isSupabaseServiceConfigured } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";

export interface HrisSetupOverview {
  branchTarget: number;
  activeBranches: number;
  totalBranches: number;
  employeeCount: number;
  employeesWithHomeBranch: number;
  branchesWithRep1: number;
  branchesWithRep2: number;
  /** Active branches missing Rep 1 */
  branchesMissingRep1: number;
}

export async function getHrisSetupOverview(): Promise<HrisSetupOverview | null> {
  if (!isSupabaseServiceConfigured()) return null;

  const service = await createServiceClient();

  const [branchResult, employeeResult] = await Promise.all([
    service
      .from("branches")
      .select(
        "id, is_active, representative_1, representative_2, representative_1_employee_id, representative_2_employee_id"
      ),
    service.from("employees").select("id, home_branch_id"),
  ]);

  if (branchResult.error) throw new Error(branchResult.error.message);
  if (employeeResult.error) throw new Error(employeeResult.error.message);

  const branches = branchResult.data ?? [];
  const employees = employeeResult.data ?? [];

  const activeBranches = branches.filter((b) => b.is_active !== false);
  const activeBranchCount = activeBranches.length;

  let branchesWithRep1 = 0;
  let branchesWithRep2 = 0;
  for (const branch of activeBranches) {
    const hasRep1 =
      Boolean(branch.representative_1_employee_id) ||
      Boolean(branch.representative_1?.trim());
    const hasRep2 =
      Boolean(branch.representative_2_employee_id) ||
      Boolean(branch.representative_2?.trim());
    if (hasRep1) branchesWithRep1++;
    if (hasRep2) branchesWithRep2++;
  }

  const employeesWithHomeBranch = employees.filter((e) =>
    Boolean(e.home_branch_id)
  ).length;

  return {
    branchTarget: TARGET_BRANCH_COUNT,
    activeBranches: activeBranchCount,
    totalBranches: branches.length,
    employeeCount: employees.length,
    employeesWithHomeBranch,
    branchesWithRep1,
    branchesWithRep2,
    branchesMissingRep1: activeBranchCount - branchesWithRep1,
  };
}
