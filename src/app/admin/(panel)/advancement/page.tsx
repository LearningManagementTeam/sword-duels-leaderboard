import { AdminCallout } from "@/components/admin/AdminCallout";
import { PhaseLockPanel } from "@/components/admin/PhaseLockPanel";
import { InfoTip } from "@/components/admin/InfoTip";
import { getPhaseLockOverview } from "@/lib/data/admin-queries";
import { SetupBanner } from "@/components/SetupBanner";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default async function AdvancementPage() {
  const configured = isSupabaseConfigured();
  const phases = configured ? await getPhaseLockOverview() : [];

  return (
    <div className="space-y-6">
      <div className="sd-page-header">
        <h1>Phase advancement</h1>
        <p>
          Run after publishing final standings for a phase. This records a phase
          lock and copies advancing branches to the next season.{" "}
          <InfoTip>
            Use only after Round 3 is published for all regions. This step seeds
            the next phase (June → July, July → August) and cannot be undone from
            this screen.
          </InfoTip>
        </p>
      </div>
      {!configured && <SetupBanner />}

      <AdminCallout title="Before you lock">
        Confirm public boards show the correct survivors (8 per region after June
        R3, 1 champion per region after July R3). The panel below shows seed
        counts and lock status before you confirm.
      </AdminCallout>

      <PhaseLockPanel phases={phases} />
    </div>
  );
}
