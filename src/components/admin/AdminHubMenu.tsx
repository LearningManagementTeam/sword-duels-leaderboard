import Link from "next/link";
import { SdButtonLink } from "@/components/ui/SdButtonLink";
import {
  ADMIN_DOCS,
  ADMIN_SYSTEM,
  HRIS_ADMIN,
  REVALIDA_HUB,
} from "@/lib/admin-routes";

export function AdminHubMenu() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="sd-neon-panel flex flex-col p-8 ring-1 ring-violet-400/30">
          <h2 className="text-xl font-semibold text-white">HRIS</h2>
          <p className="mt-3 flex-1 text-sm text-sd-muted">
            Manage organizational data — the master branch list and employee
            profiles (employee number, position, employment status). Update here
            before competition season setup.
          </p>
          <div className="mt-6">
            <SdButtonLink href={HRIS_ADMIN} className="inline-flex px-5 py-2.5 text-sm">
              Open HRIS →
            </SdButtonLink>
          </div>
        </div>

        <div className="sd-neon-panel flex flex-col p-8 ring-1 ring-emerald-400/35">
          <h2 className="text-xl font-semibold text-white">Revalida System</h2>
          <p className="mt-3 flex-1 text-sm text-sd-muted">
            Operate competitions and events — Sword Duels, National Competitions,
            Quiz Day, and more. Score rounds, assign representatives, and publish
            results.
          </p>
          <div className="mt-6">
            <SdButtonLink
              href={REVALIDA_HUB}
              variant="primary"
              className="inline-flex px-5 py-2.5 text-sm"
            >
              Open Revalida →
            </SdButtonLink>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href={ADMIN_DOCS}
          className="sd-glass rounded-xl px-4 py-3 text-sm text-sd-muted transition hover:text-white"
        >
          <span className="font-medium text-white">Documentation</span>
          <span className="mt-1 block text-xs">
            Operator guides — auto-synced from the repo
          </span>
        </Link>
        <Link
          href={ADMIN_SYSTEM}
          className="sd-glass rounded-xl px-4 py-3 text-sm text-sd-muted transition hover:text-white"
        >
          <span className="font-medium text-white">Tech stack</span>
          <span className="mt-1 block text-xs">
            Versions, migrations, env vars — auto-synced on deploy
          </span>
        </Link>
      </div>
    </div>
  );
}
