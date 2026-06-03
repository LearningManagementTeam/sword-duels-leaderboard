import Link from "next/link";
import { AdminCallout } from "@/components/admin/AdminCallout";
import { InfoTip } from "@/components/admin/InfoTip";
import { getAdminDashboard } from "@/lib/data/admin-queries";
import { isSupabaseConfigured } from "@/lib/supabase/server";

type RoundRow = {
  id: string;
  name: string;
  status: string;
  seasons: { name: string; slug?: string } | { name: string; slug?: string }[] | null;
};

export default async function AdminRoundsPage() {
  const { rounds } = isSupabaseConfigured()
    ? await getAdminDashboard()
    : { rounds: [] as RoundRow[] };

  const grouped = (rounds as RoundRow[]).reduce(
    (acc, r) => {
      const season = Array.isArray(r.seasons) ? r.seasons[0] : r.seasons;
      const key = season?.name ?? "Unknown";
      if (!acc[key]) acc[key] = [];
      acc[key].push(r);
      return acc;
    },
    {} as Record<string, RoundRow[]>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Rounds</h1>
      <p className="text-sm text-slate-400">
        Enter results per round. Save as draft, then publish when ready.{" "}
        <InfoTip>
          Draft saves scores without updating the public site. Publish applies
          elimination for that round. After publish on June/July, use
          advancement picks if many branches tied at the cut.
        </InfoTip>
      </p>

      <AdminCallout title="Round status">
        <strong>Draft</strong> — only admins see scores.{" "}
        <strong>Published</strong> — public leaderboards and cut lines update.
      </AdminCallout>

      {Object.entries(grouped).map(([seasonName, seasonRounds]) => (
        <section key={seasonName}>
          <h2 className="mb-2 font-semibold text-amber-300">{seasonName}</h2>
          <ul className="space-y-1">
            {seasonRounds.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <Link
                  href={`/admin/rounds/${r.id}`}
                  className="text-slate-200 hover:text-amber-300"
                >
                  {r.name}
                </Link>{" "}
                <span className="text-xs text-slate-500">({r.status})</span>
                {r.status === "published" &&
                  (seasonName.includes("June") ||
                    seasonName.includes("July")) && (
                    <Link
                      href={`/admin/rounds/${r.id}/advances`}
                      className="text-xs text-amber-400/80 hover:text-amber-300"
                    >
                      · advancement picks
                    </Link>
                  )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
