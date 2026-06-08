import Link from "next/link";
import type { DashboardRoundRow } from "@/lib/data/admin-queries";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { SdButtonLink } from "@/components/ui/SdButtonLink";
import { seasonPhaseLabel } from "@/lib/season-labels";
import type { SeasonSlug } from "@/lib/scoring-config";

interface Props {
  rounds: DashboardRoundRow[];
}

function seasonSlugFromRow(row: DashboardRoundRow): SeasonSlug | null {
  const raw = Array.isArray(row.seasons) ? row.seasons[0] : row.seasons;
  return (raw?.slug as SeasonSlug) ?? null;
}

function RoundStatusBadge({ status }: { status: string }) {
  const published = status === "published";
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        published
          ? "bg-emerald-800/80 text-emerald-100 ring-1 ring-emerald-400/30"
          : "bg-sd-panel text-sd-muted/80 ring-1 ring-emerald-500/10"
      }`}
    >
      {published ? "Live" : "Draft"}
    </span>
  );
}

function whenLabel(row: DashboardRoundRow): string | null {
  const iso = row.published_at ?? row.created_at;
  if (!iso) return null;
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AdminRecentRounds({ rounds }: Props) {
  return (
    <section className="sd-neon-panel p-5">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <h2 className="font-semibold text-sd-glow">Recent activity</h2>
        <Link
          href="/admin/national-competitions/rounds"
          className="text-xs text-sd-muted hover:text-sd-glow"
        >
          All rounds →
        </Link>
      </div>

      {rounds.length === 0 ? (
        <AdminEmptyState
          title="The arena opens soon"
          detail="Load the branch roster, then score June Round 1 — fans will see ranks as soon as you publish."
          action={
            <SdButtonLink
              href="/admin/hris/branches"
              className="px-3 py-1.5 text-sm"
            >
              Load roster
            </SdButtonLink>
          }
        />
      ) : (
        <ul className="space-y-2">
          {rounds.map((r) => {
            const slug = seasonSlugFromRow(r);
            const phaseLabel = slug ? seasonPhaseLabel(slug) : "Season";
            const when = whenLabel(r);
            return (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-500/10 bg-sd-deep/30 px-3 py-2"
              >
                <div className="min-w-0">
                  <Link
                    href={`/admin/national-competitions/rounds/${r.id}`}
                    className="sd-link font-medium"
                  >
                    {phaseLabel} — {r.name}
                  </Link>
                  {when && (
                    <p className="text-xs text-sd-muted/60">
                      {r.published_at ? "Published" : "Created"} {when}
                    </p>
                  )}
                </div>
                <RoundStatusBadge status={r.status} />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
