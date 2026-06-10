import Link from "next/link";
import { HrisSetupProgress } from "@/components/admin/HrisSetupProgress";
import { HrisWorkflowCards } from "@/components/admin/HrisWorkflowCards";
import { SetupBanner } from "@/components/SetupBanner";
import { REVALIDA_HUB, hrisPath, nationalCompetitionsPath } from "@/lib/admin-routes";
import { getHrisSetupOverview } from "@/lib/data/hris-queries";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HrisDashboardPage() {
  const configured = isSupabaseConfigured();
  const setupOverview = configured ? await getHrisSetupOverview().catch(() => null) : null;

  return (
    <div className="space-y-8">
      <div className="sd-page-header">
        <h1>HRIS</h1>
        <p>
          Organizational master data for branches and employees. Competition
          operations — scoring and publish — live in{" "}
          <Link href={REVALIDA_HUB} className="sd-link">
            Revalida System
          </Link>
          . Assign Sword Duels Rep 1 and Rep 2 from{" "}
          <Link href={hrisPath("employees")} className="sd-link">
            Employee directory
          </Link>{" "}
          (open a profile) or scan all branches on{" "}
          <Link
            href={nationalCompetitionsPath("representatives")}
            className="sd-link"
          >
            Representatives
          </Link>
          .
        </p>
      </div>

      {!configured && <SetupBanner />}

      {setupOverview && <HrisSetupProgress overview={setupOverview} />}

      <HrisWorkflowCards />
    </div>
  );
}
