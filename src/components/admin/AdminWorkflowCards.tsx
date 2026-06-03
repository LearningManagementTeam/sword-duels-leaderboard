import Link from "next/link";

interface RoundRef {
  id: string;
  name: string;
  status: string;
  seasons: { name: string; slug?: string } | { name: string; slug?: string }[] | null;
}

interface Props {
  rounds: RoundRef[];
}

export function AdminWorkflowCards({ rounds }: Props) {
  const published = rounds.filter((r) => r.status === "published");
  const latestPublished = published[published.length - 1];
  const seasonName = latestPublished
    ? (Array.isArray(latestPublished.seasons)
        ? latestPublished.seasons[0]
        : latestPublished.seasons)?.name ?? ""
    : "";
  const showAdvances =
    latestPublished &&
    (seasonName.includes("June") || seasonName.includes("July"));

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="sd-neon-panel p-4">
        <h3 className="font-semibold text-white">Score the round</h3>
        <p className="mt-1 text-sm text-sd-muted">
          Enter points, preview the board, then publish — fans see ranks instantly.
        </p>
        <Link
          href="/admin/rounds"
          className="sd-btn-primary mt-3 inline-block rounded-lg px-3 py-1.5 text-sm"
        >
          Open rounds
        </Link>
      </div>

      <div className="sd-neon-panel p-4">
        <h3 className="font-semibold text-white">Tie-breaker picks</h3>
        <p className="mt-1 text-sm text-sd-muted">
          After publish, crown branches that tied at the cut line and earned a
          play-off spot.
        </p>
        {showAdvances && latestPublished ? (
          <Link
            href={`/admin/rounds/${latestPublished.id}/advances`}
            className="mt-3 inline-block rounded-lg border border-fuchsia-400/40 px-3 py-1.5 text-sm text-fuchsia-200 hover:bg-fuchsia-950/30"
          >
            {latestPublished.name} picks
          </Link>
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
        <Link
          href="/admin/competition"
          className="mt-3 inline-block rounded-lg border border-emerald-400/30 px-3 py-1.5 text-sm text-sd-glow hover:text-white"
        >
          Update journey map
        </Link>
      </div>

      <div className="sd-neon-panel p-4">
        <h3 className="font-semibold text-white">Phase finale</h3>
        <p className="mt-1 text-sm text-sd-muted">
          Lock June or July after Round 3 is live in every region — send survivors
          forward.
        </p>
        <Link
          href="/admin/advancement"
          className="mt-3 inline-block rounded-lg border border-emerald-400/30 px-3 py-1.5 text-sm text-sd-muted hover:text-white"
        >
          Crown survivors
        </Link>
      </div>
    </div>
  );
}
