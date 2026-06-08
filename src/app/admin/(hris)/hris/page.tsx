import Link from "next/link";
import { HrisWorkflowCards } from "@/components/admin/HrisWorkflowCards";
import { SetupBanner } from "@/components/SetupBanner";
import { REVALIDA_HUB, nationalCompetitionsPath } from "@/lib/admin-routes";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default async function HrisDashboardPage() {
  const configured = isSupabaseConfigured();

  return (
    <div className="space-y-8">
      <div className="sd-page-header">
        <h1>HRIS</h1>
        <p>
          Organizational master data for branches and employees. Competition
          operations — scoring, rep assignment, publish — live in{" "}
          <Link href={REVALIDA_HUB} className="sd-link">
            Revalida System
          </Link>
          . Assign Rep 1 and Rep 2 per branch on{" "}
          <Link
            href={nationalCompetitionsPath("representatives")}
            className="sd-link"
          >
            National Competitions → Representatives
          </Link>
          .
        </p>
      </div>

      {!configured && <SetupBanner />}

      <HrisWorkflowCards />
    </div>
  );
}
