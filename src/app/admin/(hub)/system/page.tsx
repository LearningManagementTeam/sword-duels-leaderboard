import Link from "next/link";
import { AdminDocBackLink } from "@/lib/admin-docs-markdown";
import {
  ADMIN_CODE_PATHS,
  ADMIN_ENV_VARS,
  getMigrationCatalog,
  getTechStackEntries,
} from "@/lib/admin-system-catalog";
import { ADMIN_DOCS, REVALIDA_HUB, HRIS_ADMIN } from "@/lib/admin-routes";

export const dynamic = "force-dynamic";

export default function AdminSystemPage() {
  const techStack = getTechStackEntries();
  const migrations = getMigrationCatalog();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="sd-page-header">
        <h1>Tech stack</h1>
        <p>
          Live reference synced from{" "}
          <code className="text-sd-glow">package.json</code> and{" "}
          <code className="text-sd-glow">supabase/migrations/</code>. Operator
          guides are on{" "}
          <Link href={ADMIN_DOCS} className="sd-link">
            Documentation
          </Link>
          .
        </p>
      </div>

      <section className="sd-neon-panel space-y-3 p-5">
        <h2 className="font-semibold text-sd-glow">Platform</h2>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          {techStack.map((row) => (
            <div key={row.label} className="sd-inset rounded-lg px-3 py-2">
              <dt className="text-xs uppercase tracking-wide text-sd-muted/60">
                {row.label}
              </dt>
              <dd className="mt-0.5 font-medium text-white">{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="sd-neon-panel space-y-3 p-5">
        <h2 className="font-semibold text-sd-glow">Admin architecture</h2>
        <pre className="sd-inset overflow-x-auto rounded-lg p-4 text-xs leading-relaxed text-sd-muted">
          {`┌──────────── Admin (/admin) ────────────┐
│  HRIS          │  Revalida System          │
│  branches      │  NC · SD · Quiz Day       │
│  employees     │  score · publish · lock   │
└────────┬─────────────────┬─────────────────┘
         │                 │
         ▼                 ▼
   src/lib/employees   product server actions
         │                 │
         └────────┬────────┘
                  ▼
           Supabase Postgres
         branches · employees
         rounds · sd_set_scores
         published_standings`}
        </pre>
        <p className="text-sm text-sd-muted">
          HRIS owns org data; Revalida reads it for competitions. See{" "}
          <Link href={HRIS_ADMIN} className="sd-link">
            HRIS
          </Link>{" "}
          and{" "}
          <Link href={REVALIDA_HUB} className="sd-link">
            Revalida
          </Link>
          .
        </p>
      </section>

      <section className="sd-neon-panel space-y-3 p-5">
        <h2 className="font-semibold text-sd-glow">Environment variables</h2>
        <p className="text-sm text-sd-muted">
          Set in Vercel → Project → Settings → Environment Variables (never
          commit secrets):
        </p>
        <ul className="list-inside list-disc text-sm text-sd-muted">
          {ADMIN_ENV_VARS.map((v) => (
            <li key={v}>
              <code className="text-sd-glow">{v}</code>
            </li>
          ))}
        </ul>
      </section>

      <section className="sd-neon-panel space-y-3 p-5">
        <h2 className="font-semibold text-sd-glow">
          Database migrations ({migrations.length})
        </h2>
        <p className="text-sm text-sd-muted">
          Auto-listed from{" "}
          <code className="text-sd-glow">supabase/migrations/</code>. Run each
          new file once in Supabase → SQL Editor after deploy.
        </p>
        <ul className="max-h-96 space-y-2 overflow-y-auto text-sm">
          {migrations.map((m) => (
            <li key={m.file} className="flex gap-2 text-sd-muted">
              <code className="shrink-0 text-sd-glow">{m.file}</code>
              <span className="text-sd-muted/60">— {m.note}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="sd-neon-panel space-y-3 p-5">
        <h2 className="font-semibold text-sd-glow">Key code paths</h2>
        <ul className="space-y-2 text-sm text-sd-muted">
          {ADMIN_CODE_PATHS.map((item) => (
            <li key={item.path}>
              <code className="text-sd-glow">{item.path}</code>
              <span className="text-sd-muted/60"> — {item.note}</span>
            </li>
          ))}
        </ul>
      </section>

      <AdminDocBackLink />
    </div>
  );
}
