import Link from "next/link";

const migrations = [
  { file: "001_initial_schema.sql", note: "Core tables" },
  { file: "002_representatives.sql", note: "Rep columns on branches" },
  { file: "003_*.sql", note: "Representatives (if split)" },
  { file: "004_round_elimination.sql", note: "Per-round elimination columns" },
  { file: "005_manual_round_advances.sql", note: "Committee extra advancement picks" },
  { file: "006_site_content.sql", note: "Editable public mechanics content" },
  { file: "007_branding_storage.sql", note: "Logo upload bucket + branding row" },
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
        <p className="mt-1 text-sm text-sd-muted">
          Technical reference for setup and troubleshooting. Day-to-day scoring
          is on the Dashboard and Rounds pages.
        </p>
      </div>

      <section className="sd-neon-panel p-5 space-y-3">
        <h2 className="font-semibold text-sd-glow">Tech stack</h2>
        <ul className="space-y-2 text-sm text-sd-muted">
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
        <p className="text-xs text-sd-muted/60">
          Key code:{" "}
          <code className="text-sd-glow">src/lib/scoring.ts</code>,{" "}
          <code className="text-sd-glow">src/lib/scoring-config.ts</code>,{" "}
          <code className="text-sd-glow">src/lib/actions/admin.ts</code>
        </p>
      </section>

      <section className="sd-neon-panel p-5 space-y-3">
        <h2 className="font-semibold text-sd-glow">System map</h2>
        <pre className="overflow-x-auto rounded sd-inset p-4 text-xs text-sd-muted leading-relaxed">
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
        <p className="text-sm text-sd-muted">
          Publishing a round runs the scoring engine, applies regional cuts,
          then re-applies manual advancement picks before writing{" "}
          <code className="text-sd-muted">published_standings</code>.
        </p>
      </section>

      <section className="sd-neon-panel p-5 space-y-3">
        <h2 className="font-semibold text-sd-glow">Environment variables</h2>
        <p className="text-sm text-sd-muted">
          Set in Vercel → Project → Settings → Environment Variables (never commit
          secrets to GitHub):
        </p>
        <ul className="list-inside list-disc text-sm text-sd-muted">
          {envVars.map((v) => (
            <li key={v}>
              <code className="text-sd-glow">{v}</code>
            </li>
          ))}
        </ul>
      </section>

      <section className="sd-neon-panel p-5 space-y-3">
        <h2 className="font-semibold text-sd-glow">Migration checklist</h2>
        <p className="text-sm text-sd-muted">
          Run each file once in Supabase → SQL Editor (skip any already applied):
        </p>
        <ul className="space-y-2 text-sm">
          {migrations.map((m) => (
            <li key={m.file} className="flex gap-2 text-sd-muted">
              <code className="shrink-0 text-sd-glow">
                supabase/migrations/{m.file}
              </code>
              <span className="text-sd-muted/60">— {m.note}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="sd-neon-panel p-5 space-y-4">
        <h2 className="font-semibold text-sd-glow">Documentation</h2>
        <div className="space-y-3 text-sm text-sd-muted">
          <div>
            <h3 className="font-medium text-white">Daily operations</h3>
            <p className="mt-1 text-sd-muted">
              Weekly rounds: enter scores as draft → preview → publish. After
              publish, use advancement picks if many tied max scores. End of
              phase: Lock & advance on the Advancement page.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-white">Public mechanics</h3>
            <p className="mt-1 text-sd-muted">
              Edit intro and announcements under{" "}
              <Link href="/admin/mechanics" className="sd-link">
                Admin → Mechanics
              </Link>
              . Rule tables on{" "}
              <Link href="/mechanics" className="sd-link">
                /mechanics
              </Link>{" "}
              are auto-generated.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-white">Repo docs</h3>
            <ul className="mt-1 list-inside list-disc text-sd-muted">
              <li>docs/DAILY-OPERATIONS.md</li>
              <li>docs/mechanics.md</li>
              <li>docs/SETUP-FOR-BEGINNERS.md</li>
            </ul>
          </div>
        </div>
      </section>

      <p className="text-xs text-sd-muted/60">
        <Link href="/admin" className="hover:text-sd-muted">
          ← Back to dashboard
        </Link>
      </p>
    </div>
  );
}
