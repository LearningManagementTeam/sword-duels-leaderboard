import type { PublishedRoundRef } from "@/lib/data/admin-queries";
import { SdButtonLink } from "@/components/ui/SdButtonLink";

interface Props {
  advanceRound?: PublishedRoundRef | null;
}

export function AdminWorkflowCards({ advanceRound }: Props) {
  const latestPublished = advanceRound ?? null;
  const showAdvances = latestPublished != null;
  const ctaSize = "mt-3 px-3 py-1.5 text-sm";

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="sd-neon-panel p-4">
        <h3 className="font-semibold text-white">Score the round</h3>
        <p className="mt-1 text-sm text-sd-muted">
          Enter points, preview the board, then publish — fans see ranks instantly.
        </p>
        <SdButtonLink href="/admin/rounds" className={ctaSize}>
          Open rounds
        </SdButtonLink>
      </div>

      <div className="sd-neon-panel p-4">
        <h3 className="font-semibold text-white">Tie-breaker picks</h3>
        <p className="mt-1 text-sm text-sd-muted">
          After publish, crown branches that tied at the cut line and earned a
          play-off spot.
        </p>
        {showAdvances && latestPublished ? (
          <SdButtonLink
            href={`/admin/rounds/${latestPublished.id}/advances`}
            variant="fuchsia"
            className={ctaSize}
          >
            {latestPublished.name} picks
          </SdButtonLink>
        ) : (
          <p className="mt-3 text-xs text-sd-muted/60">
            Unlocks after a June or July round goes live.
          </p>
        )}
      </div>

      <div className="sd-neon-panel p-4">
        <h3 className="font-semibold text-white">Season journey</h3>
        <p className="mt-1 text-sm text-sd-muted">
          Move the milestone on the home map when the competition hits a big beat.
        </p>
        <SdButtonLink href="/admin/competition" variant="ghost" className={ctaSize}>
          Update journey map
        </SdButtonLink>
      </div>

      <div className="sd-neon-panel p-4">
        <h3 className="font-semibold text-white">Phase finale</h3>
        <p className="mt-1 text-sm text-sd-muted">
          Lock June or July after Round 3 is live in every region — send survivors
          forward to July or The Nationals.
        </p>
        <SdButtonLink href="/admin/advancement" variant="ghost" className={ctaSize}>
          Crown survivors
        </SdButtonLink>
      </div>
    </div>
  );
}
