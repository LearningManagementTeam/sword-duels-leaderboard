import Link from "next/link";
import { AdminWorkflowCards } from "@/components/admin/AdminWorkflowCards";
import { SetupBanner } from "@/components/SetupBanner";
import { getAdminDashboard } from "@/lib/data/admin-queries";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const configured = isSupabaseConfigured();
  const { seasons, branchCount, rounds } = configured
    ? await getAdminDashboard()
    : { seasons: [], branchCount: 0, rounds: [] };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      {!configured && <SetupBanner />}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
          <p className="text-sm text-slate-400">Branches</p>
          <p className="text-2xl font-bold text-amber-300">{branchCount}</p>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
          <p className="text-sm text-slate-400">Seasons</p>
          <p className="text-2xl font-bold">{seasons.length}</p>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
          <p className="text-sm text-slate-400">Rounds</p>
          <p className="text-2xl font-bold">{rounds.length}</p>
        </div>
      </div>

      <AdminWorkflowCards rounds={rounds} />

      <section>
        <h2 className="mb-2 font-semibold">Quick links</h2>
        <ul className="list-inside list-disc text-sm text-slate-300">
          <li>
            <Link href="/admin/branches" className="text-amber-400 hover:underline">
              Import branches
            </Link>{" "}
            (142 in seed CSV)
          </li>
          <li>
            <Link
              href="/admin/representatives"
              className="text-amber-400 hover:underline"
            >
              Enter branch representatives
            </Link>
          </li>
          <li>
            <Link href="/admin/rounds" className="text-amber-400 hover:underline">
              Enter round results
            </Link>
          </li>
          <li>
            <Link
              href="/admin/advancement"
              className="text-amber-400 hover:underline"
            >
              Lock phase & advance
            </Link>
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Recent rounds</h2>
        <ul className="space-y-1 text-sm">
          {rounds.map((r) => {
            const season = Array.isArray(r.seasons) ? r.seasons[0] : r.seasons;
            return (
              <li key={r.id}>
                <Link
                  href={`/admin/rounds/${r.id}`}
                  className="text-amber-400 hover:underline"
                >
                  {season?.name} — {r.name}
                </Link>{" "}
                <span className="text-slate-500">({r.status})</span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
