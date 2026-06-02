import { lockPhaseAndAdvance } from "@/lib/actions/admin";
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
      <h1 className="text-2xl font-bold">Phase advancement</h1>
      {!configured && <SetupBanner />}

      <p className="text-sm text-slate-400">
        Run after publishing final standings for a phase. This records a phase
        lock and copies advancing branches to the next season.
      </p>

      <div className="space-y-4">
        {phases.map((phase) => (
          <div
            key={phase.slug}
            className="rounded-lg border border-slate-700 bg-slate-900 p-4"
          >
            <h2 className="font-semibold text-amber-300">
              {SCORING_CONFIG[phase.slug].name}
            </h2>
            <p className="mt-1 text-sm text-slate-400">{phase.description}</p>
            <form
              className="mt-3"
              action={async () => {
                "use server";
                await lockPhaseAndAdvance(phase.slug);
              }}
            >
              <button
                type="submit"
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-amber-400"
              >
                Lock & advance
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
