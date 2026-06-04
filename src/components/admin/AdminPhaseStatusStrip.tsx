import Link from "next/link";
import type { DashboardPhaseStatus } from "@/lib/data/admin-queries";

interface Props {
  phases: DashboardPhaseStatus[];
}

function rosterTone(count: number, target: number): string {
  if (count === 0) return "text-amber-200";
  if (count === target) return "text-emerald-200";
  return "text-amber-200";
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AdminPhaseStatusStrip({ phases }: Props) {
  if (phases.length === 0) return null;

  return (
    <section className="space-y-3" aria-label="Competition phase status">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="font-semibold text-sd-glow">Season status</h2>
        <p className="text-xs text-sd-muted/70">
          Roster counts, latest publish, and lock state
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {phases.map((phase) => (
          <div
            key={phase.seasonSlug}
            className={`sd-neon-panel p-4 ${
              phase.needsAttention ? "ring-1 ring-amber-400/35" : ""
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-white">{phase.label}</h3>
                <p className="text-xs text-sd-muted/80">{phase.subtitle}</p>
              </div>
              {phase.lockedAt ? (
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-100 ring-1 ring-emerald-400/40">
                  Locked
                </span>
              ) : phase.seasonSlug !== "august_finals" ? (
                <span className="rounded-full bg-sd-panel px-2.5 py-0.5 text-xs text-sd-muted/80 ring-1 ring-emerald-500/15">
                  Open
                </span>
              ) : null}
            </div>

            <dl className="mt-3 space-y-1.5 text-xs">
              <div className="flex justify-between gap-2">
                <dt className="text-sd-muted/70">{phase.rosterLabel}</dt>
                <dd className={`font-medium tabular-nums ${rosterTone(phase.rosterCount, phase.rosterTarget)}`}>
                  {phase.rosterCount}
                  <span className="text-sd-muted/50"> / {phase.rosterTarget}</span>
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-sd-muted/70">Round 3</dt>
                <dd className={phase.round3Published ? "text-emerald-200" : "text-sd-muted/60"}>
                  {phase.round3Published ? (
                    "Published"
                  ) : phase.round3Round ? (
                    <Link
                      href={`/admin/rounds/${phase.round3Round.id}`}
                      className="sd-link text-amber-200"
                    >
                      Score →
                    </Link>
                  ) : (
                    "Not yet"
                  )}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-sd-muted/70">Latest live round</dt>
                <dd className="text-right text-sd-muted">
                  {phase.latestPublishedRound ? (
                    <Link
                      href={`/admin/rounds/${phase.latestPublishedRound.id}`}
                      className="sd-link"
                    >
                      {phase.latestPublishedRound.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              {phase.latestPublishedRound && (
                <div className="flex justify-between gap-2">
                  <dt className="text-sd-muted/70">Published</dt>
                  <dd className="text-sd-muted/60">
                    {formatWhen(phase.latestPublishedRound.published_at)}
                  </dd>
                </div>
              )}
            </dl>

            {phase.needsAttention && phase.attentionMessage && (
              <div className="sd-alert-warning mt-3 text-xs">
                <p>{phase.attentionMessage}</p>
                {phase.attentionHref && (
                  <Link
                    href={phase.attentionHref}
                    className="mt-1 inline-block font-medium text-amber-100 underline hover:text-white"
                  >
                    Go →
                  </Link>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
