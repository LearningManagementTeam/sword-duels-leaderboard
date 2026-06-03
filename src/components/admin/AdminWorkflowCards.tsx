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
    <div className="grid gap-4 md:grid-cols-3">
        <div className="sd-glass rounded-lg p-4">
        <h3 className="font-semibold text-white">Weekly round</h3>
        <p className="mt-1 text-sm text-slate-400">
          Enter scores → save draft → preview → publish.
        </p>
        <Link
          href="/admin/rounds"
          className="mt-3 inline-block rounded-lg bg-sd-glow px-3 py-1.5 text-sm font-medium text-sd-deep hover:bg-emerald-300"
        >
          Open rounds
        </Link>
      </div>

        <div className="sd-glass rounded-lg p-4">
        <h3 className="font-semibold text-white">Extra advancement</h3>
        <p className="mt-1 text-sm text-slate-400">
          After publish, add branches that tied at the cut (e.g. many 10/10
          scores).
        </p>
        {showAdvances && latestPublished ? (
          <Link
            href={`/admin/rounds/${latestPublished.id}/advances`}
            className="mt-3 inline-block rounded-lg border border-sd-glow/40 px-3 py-1.5 text-sm text-sd-glow hover:bg-emerald-500/10"
          >
            {latestPublished.name} picks
          </Link>
        ) : (
          <p className="mt-3 text-xs text-slate-500">
            Available after a June/July round is published.
          </p>
        )}
      </div>

        <div className="sd-glass rounded-lg p-4">
        <h3 className="font-semibold text-white">End of phase</h3>
        <p className="mt-1 text-sm text-slate-400">
          Lock June or July after Round 3 is published for all regions.
        </p>
        <Link
          href="/admin/advancement"
          className="mt-3 inline-block rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
        >
          Lock & advance
        </Link>
      </div>
    </div>
  );
}
