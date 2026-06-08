import Link from "next/link";
import { RevalidaMainMenu } from "@/components/admin/RevalidaMainMenu";
import { SetupBanner } from "@/components/SetupBanner";
import { ADMIN_HUB, HRIS_ADMIN } from "@/lib/admin-routes";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default async function RevalidaHubPage() {
  const configured = isSupabaseConfigured();

  return (
    <div className="space-y-8">
      <div className="sd-page-header">
        <h1>Revalida System</h1>
        <p>
          Operate competitions and events. Branch and employee master data lives
          in{" "}
          <Link href={HRIS_ADMIN} className="sd-link">
            HRIS
          </Link>
          — update roster there first, then score and publish here.
        </p>
        <p className="mt-2 text-sm">
          <Link
            href={ADMIN_HUB}
            className="text-sd-muted hover:text-white"
          >
            ← Back to main menu
          </Link>
        </p>
      </div>

      {!configured && <SetupBanner />}

      <RevalidaMainMenu />
    </div>
  );
}
