import Link from "next/link";
import { AdminWorkflowCards } from "@/components/admin/AdminWorkflowCards";
import { SetupBanner } from "@/components/SetupBanner";
import { branchCountLabel } from "@/lib/branch-targets";
import { getAdminDashboard } from "@/lib/data/admin-queries";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const configured = isSupabaseConfigured();
  const { seasons, branchCount, rounds } = configured
    ? await getAdminDashboard()
    : { seasons: [], branchCount: 0, rounds: [] };

  return (
    <div className="space-y-6">
      <div className="sd-page-header">
        <h1>Dashboard</h1>
      </div>
      {!configured && <SetupBanner />}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sd-stat-card">
          <p className="sd-stat-label">Branches</p>
          <p className="sd-stat-value">{branchCount}</p>
        </div>
        <div className="sd-stat-card">
          <p className="sd-stat-label">Seasons</p>
          <p className="sd-stat-value">{seasons.length}</p>
        </div>
        <div className="sd-stat-card">
          <p className="sd-stat-label">Rounds</p>
          <p className="sd-stat-value">{rounds.length}</p>
        </div>
      </div>

      <AdminWorkflowCards rounds={rounds} />

      <section className="sd-neon-panel p-5">
        <h2 className="mb-2 font-semibold text-sd-glow">Quick links</h2>
        <ul className="list-inside list-disc text-sm text-sd-muted">
          <li>
            <Link href="/admin/branches" className="sd-link">
              Load the roster
            </Link>{" "}
            ({branchCountLabel(branchCount)})
          </li>
          <li>
            <Link href="/admin/representatives" className="sd-link">
              Assign branch champions
            </Link>
          </li>
          <li>
            <Link href="/admin/rounds" className="sd-link">
              Score the round &amp; publish standings
            </Link>
          </li>
          <li>
            <Link href="/admin/advancement" className="sd-link">
              Crown survivors — advance phase
            </Link>
          </li>
          <li>
            <Link href="/admin/competition" className="sd-link">
              Update the season journey map
            </Link>
          </li>
        </ul>
      </section>

      <section className="sd-neon-panel p-5">
        <h2 className="mb-2 font-semibold text-sd-glow">Recent rounds</h2>
        <ul className="space-y-1 text-sm">
          {rounds.map((r) => {
            const season = Array.isArray(r.seasons) ? r.seasons[0] : r.seasons;
            return (
              <li key={r.id}>
                <Link href={`/admin/rounds/${r.id}`} className="sd-link">
                  {season?.name} — {r.name}
                </Link>{" "}
                <span className="text-sd-muted/60">({r.status})</span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
