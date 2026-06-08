import { AdminPhaseStatusStrip } from "@/components/admin/AdminPhaseStatusStrip";
import { AdminRecentRounds } from "@/components/admin/AdminRecentRounds";
import { AdminRosterCards } from "@/components/admin/AdminRosterCards";
import { AdminWorkflowCards } from "@/components/admin/AdminWorkflowCards";
import { SetupBanner } from "@/components/SetupBanner";
import { getAdminDashboard } from "@/lib/data/admin-queries";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const configured = isSupabaseConfigured();
  const {
    phaseStatuses,
    recentRounds,
    latestPublishedRoundForAdvances,
    nextDraftRound,
  } = configured
    ? await getAdminDashboard()
    : {
        phaseStatuses: [],
        recentRounds: [],
        latestPublishedRoundForAdvances: null,
        nextDraftRound: null,
      };

  return (
    <div className="space-y-6">
      <div className="sd-page-header">
        <h1>National Competitions</h1>
        <p>
          June area-wide → July regional → The Nationals. Score rounds, track
          phase locks, and keep the public site in sync.
        </p>
      </div>
      {!configured && <SetupBanner />}

      <AdminPhaseStatusStrip phases={phaseStatuses} />

      <AdminWorkflowCards
        advanceRound={latestPublishedRoundForAdvances}
        nextDraftRound={nextDraftRound}
      />

      <AdminRosterCards />

      <AdminRecentRounds rounds={recentRounds} />
    </div>
  );
}
