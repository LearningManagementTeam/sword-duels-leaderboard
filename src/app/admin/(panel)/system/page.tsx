import Link from "next/link";

const migrations = [
  { file: "001_initial_schema.sql", note: "Core tables" },
  { file: "002_representatives.sql", note: "Rep columns on branches" },
  { file: "003_*.sql", note: "Representatives (if split)" },
  { file: "004_round_elimination.sql", note: "Per-round elimination columns" },
  { file: "005_manual_round_advances.sql", note: "Committee extra advancement picks" },
  { file: "006_site_content.sql", note: "Editable public mechanics content" },
];

const envVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SITE_URL",
];

export default function AdminSystemPage() {
  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">System & stack</h1>
        <p className="mt-1 text-sm text-slate-400">
          Technical reference for setup and troubleshooting. Day-to-day scoring
          is on the Dashboard and Rounds pages.
        </p>
      </div>

      <section className="rounded-lg border border-slate-700 bg-slate-900 p-5 space-y-3">
        <h2 className="font-semibold text-amber-300">Tech stack</h2>
        <ul className="space-y-2 text-sm text-slate-300">
          <li>
            <strong className="text-white">Frontend:</strong> Next.js 16, React
            19, Tailwind CSS 4
          </li>
          <li>
            <strong className="text-white">Data & auth:</strong> Supabase
            (Postgres, Row Level Security, email login for admins)
          </li>
          <li>
            <strong className="text-white">Hosting:</strong> Vercel (auto-deploy
            from GitHub)
          </li>
        </ul>
        <p className="text-xs text-slate-500">
          Key code:{" "}
          <code className="text-amber-200/80">src/lib/scoring.ts</code>,{" "}
          <code className="text-amber-200/80">src/lib/scoring-config.ts</code>,{" "}
          <code className="text-amber-200/80">src/lib/actions/admin.ts</code>
        </p>
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-900 p-5 space-y-3">
        <h2 className="font-semibold text-amber-300">System map</h2>
        <pre className="overflow-x-auto rounded bg-slate-950 p-4 text-xs text-slate-300 leading-relaxed">
{`┌─────────────────┐     ┌──────────────────┐
│  Public site    │     │  Admin panel     │
│  (leaderboards) │     │  (scores, lock)  │
└────────┬────────┘     └────────┬─────────┘
         │                       │
         ▼                       ▼
    data/queries            server actions
         │                       │
         └───────────┬───────────┘
                     ▼
              ┌─────────────┐
              │  Supabase   │
              │  Postgres   │
              └──────┬──────┘
                     │
         ┌───────────┼───────────┐
         ▼           ▼           ▼
   round_results  published_   manual_round_
                  standings    advances
                     │
              scoring.ts (on publish)`}
        </pre>
        <p className="text-sm text-slate-400">
          Publishing a round runs the scoring engine, applies regional cuts,
          then re-applies manual advancement picks before writing{" "}
          <code className="text-slate-300">published_standings</code>.
        </p>
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-900 p-5 space-y-3">
        <h2 className="font-semibold text-amber-300">Environment variables</h2>
        <p className="text-sm text-slate-400">
          Set in Vercel → Project → Settings → Environment Variables (never commit
          secrets to GitHub):
        </p>
        <ul className="list-inside list-disc text-sm text-slate-300">
          {envVars.map((v) => (
            <li key={v}>
              <code className="text-amber-200/80">{v}</code>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-900 p-5 space-y-3">
        <h2 className="font-semibold text-amber-300">Migration checklist</h2>
        <p className="text-sm text-slate-400">
          Run each file once in Supabase → SQL Editor (skip any already applied):
        </p>
        <ul className="space-y-2 text-sm">
          {migrations.map((m) => (
            <li key={m.file} className="flex gap-2 text-slate-300">
              <code className="shrink-0 text-amber-200/80">
                supabase/migrations/{m.file}
              </code>
              <span className="text-slate-500">— {m.note}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-900 p-5 space-y-4">
        <h2 className="font-semibold text-amber-300">Documentation</h2>
        <div className="space-y-3 text-sm text-slate-300">
          <div>
            <h3 className="font-medium text-white">Daily operations</h3>
            <p className="mt-1 text-slate-400">
              Weekly rounds: enter scores as draft → preview → publish. After
              publish, use advancement picks if many tied max scores. End of
              phase: Lock & advance on the Advancement page.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-white">Public mechanics</h3>
            <p className="mt-1 text-slate-400">
              Edit intro and announcements under{" "}
              <Link href="/admin/mechanics" className="text-amber-400 hover:underline">
                Admin → Mechanics
              </Link>
              . Rule tables on{" "}
              <Link href="/mechanics" className="text-amber-400 hover:underline">
                /mechanics
              </Link>{" "}
              are auto-generated.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-white">Repo docs</h3>
            <ul className="mt-1 list-inside list-disc text-slate-400">
              <li>docs/DAILY-OPERATIONS.md</li>
              <li>docs/mechanics.md</li>
              <li>docs/SETUP-FOR-BEGINNERS.md</li>
            </ul>
          </div>
        </div>
      </section>

      <p className="text-xs text-slate-500">
        <Link href="/admin" className="hover:text-slate-300">
          ← Back to dashboard
        </Link>
      </p>
    </div>
  );
}
