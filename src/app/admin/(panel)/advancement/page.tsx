import { lockPhaseAndAdvance } from "@/lib/actions/admin";
import { AdminCallout } from "@/components/admin/AdminCallout";
import { InfoTip } from "@/components/admin/InfoTip";
import { SCORING_CONFIG } from "@/lib/scoring-config";
import type { SeasonSlug } from "@/lib/scoring-config";
import { SetupBanner } from "@/components/SetupBanner";
import { isSupabaseConfigured } from "@/lib/supabase/server";

const phases: { slug: SeasonSlug; description: string }[] = [
  {
    slug: "june_area",
    description:
      "Lock June and seed the top 24 branches into July regional competition.",
  },
  {
    slug: "july_region",
    description:
      "Lock July and seed regional champions (Luzon, NCR, VisMin) into August finals.",
  },
];

export default function AdvancementPage() {
  const configured = isSupabaseConfigured();

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
        Confirm public boards show the correct survivors (8 per region after
        June R3, 1 champion per region after July R3).
      </AdminCallout>

      <div className="space-y-4">
        {phases.map((phase) => (
          <div key={phase.slug} className="sd-neon-panel p-4">
            <h2 className="font-semibold text-sd-glow">
              {SCORING_CONFIG[phase.slug].name}
            </h2>
            <p className="mt-1 text-sm text-sd-muted">{phase.description}</p>
            <form
              className="mt-3"
              action={async () => {
                "use server";
                await lockPhaseAndAdvance(phase.slug);
              }}
            >
              <button type="submit" className="sd-btn-ghost rounded-lg px-4 py-2 text-sm">
                Lock & advance
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
