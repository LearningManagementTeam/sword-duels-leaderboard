import type { PublishedRoundRef } from "@/lib/data/admin-queries";
import { AdminActionHint } from "@/components/admin/AdminActionHint";
import { SdButtonLink } from "@/components/ui/SdButtonLink";
import { ADMIN_WORKFLOW_HINTS } from "@/lib/admin-action-hints";

interface Props {
  advanceRound?: PublishedRoundRef | null;
}

export function AdminWorkflowCards({ advanceRound }: Props) {
  const latestPublished = advanceRound ?? null;
  const showAdvances = latestPublished != null;
  const ctaSize = "px-3 py-1.5 text-sm";

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="sd-neon-panel flex flex-col p-4">
        <h3 className="font-semibold text-white">Score the round</h3>
        <p className="mt-1 flex-1 text-sm text-sd-muted">
          Enter points, preview the board, then publish — fans see ranks instantly.
        </p>
        <div className="mt-3 space-y-1.5">
          <SdButtonLink href="/admin/rounds" className={ctaSize}>
            Open rounds
          </SdButtonLink>
          <AdminActionHint hint={ADMIN_WORKFLOW_HINTS.openRounds} />
        </div>
      </div>

      <div className="sd-neon-panel flex flex-col p-4">
        <h3 className="font-semibold text-white">Tie-breaker picks</h3>
        <p className="mt-1 flex-1 text-sm text-sd-muted">
          After publish, crown branches that tied at the cut line and earned a
          play-off spot.
        </p>
        <div className="mt-3 space-y-1.5">
          {showAdvances && latestPublished ? (
            <>
              <SdButtonLink
                href={`/admin/rounds/${latestPublished.id}/advances`}
                variant="fuchsia"
                className={ctaSize}
              >
                {latestPublished.name} picks
              </SdButtonLink>
              <AdminActionHint hint={ADMIN_WORKFLOW_HINTS.tieBreakerPicks} />
            </>
          ) : (
            <>
              <p className="text-xs text-sd-muted/60">
                Unlocks after a June or July round goes live.
              </p>
              <AdminActionHint hint={ADMIN_WORKFLOW_HINTS.tieBreakerPicks} />
            </>
          )}
        </div>
      </div>

      <div className="sd-neon-panel flex flex-col p-4">
        <h3 className="font-semibold text-white">Season journey</h3>
        <p className="mt-1 flex-1 text-sm text-sd-muted">
          Move the milestone on the home map when the competition hits a big beat.
        </p>
        <div className="mt-3 space-y-1.5">
          <SdButtonLink href="/admin/competition" variant="ghost" className={ctaSize}>
            Update journey map
          </SdButtonLink>
          <AdminActionHint hint={ADMIN_WORKFLOW_HINTS.competitionMap} />
        </div>
      </div>

      <div className="sd-neon-panel flex flex-col p-4">
        <h3 className="font-semibold text-white">Phase finale</h3>
        <p className="mt-1 flex-1 text-sm text-sd-muted">
          Lock June or July after Round 3 is live in every region — send survivors
          forward to July or The Nationals.
        </p>
        <div className="mt-3 space-y-1.5">
          <SdButtonLink href="/admin/advancement" variant="ghost" className={ctaSize}>
            Crown survivors
          </SdButtonLink>
          <AdminActionHint hint={ADMIN_WORKFLOW_HINTS.phaseLock} />
        </div>
      </div>
    </div>
  );
}
