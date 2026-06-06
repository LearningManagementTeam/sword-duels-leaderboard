"use client";

import { useState } from "react";
import { AdminActionRow } from "@/components/admin/AdminActionHint";
import { saveSiteHomeConfig } from "@/lib/actions/admin";
import { ADMIN_SITE_HINTS } from "@/lib/admin-action-hints";
import {
  FEATURED_PROGRAM_LABELS,
  type FeaturedProgramMode,
  type SiteHomeConfig,
} from "@/lib/site-home-config";

interface Props {
  initial: SiteHomeConfig;
}

export function SiteHomeEditor({ initial }: Props) {
  const [config, setConfig] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSave() {
    setLoading(true);
    setMessage("");
    try {
      await saveSiteHomeConfig(config);
      setMessage("Saved. Public home hero updated.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="sd-neon-panel space-y-4 p-5">
      <div>
        <h2 className="text-lg font-semibold text-white">Featured program</h2>
        <p className="mt-1 text-sm text-sd-muted">
          Controls which program owns the large hero at the top of the public
          home page. National Competitions map settings below still apply when NC
          is featured or shown in the Programs strip.
        </p>
      </div>

      <label className="block text-sm">
        <span className="text-sd-muted">Featured on home</span>
        <select
          value={config.featuredProgram}
          onChange={(e) =>
            setConfig((c) => ({
              ...c,
              featuredProgram: e.target.value as FeaturedProgramMode,
            }))
          }
          className="mt-1 block w-full max-w-xl rounded sd-input px-3 py-2"
        >
          {(Object.keys(FEATURED_PROGRAM_LABELS) as FeaturedProgramMode[]).map(
            (mode) => (
              <option key={mode} value={mode}>
                {FEATURED_PROGRAM_LABELS[mode]}
              </option>
            )
          )}
        </select>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-sd-muted">Hero headline override (optional)</span>
          <input
            type="text"
            value={config.heroHeadlineOverride}
            onChange={(e) =>
              setConfig((c) => ({
                ...c,
                heroHeadlineOverride: e.target.value,
              }))
            }
            placeholder="Leave blank for automatic copy"
            className="mt-1 block w-full rounded sd-input px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="text-sd-muted">Hero subline override (optional)</span>
          <input
            type="text"
            value={config.heroSublineOverride}
            onChange={(e) =>
              setConfig((c) => ({
                ...c,
                heroSublineOverride: e.target.value,
              }))
            }
            placeholder="Leave blank for automatic copy"
            className="mt-1 block w-full rounded sd-input px-3 py-2"
          />
        </label>
      </div>

      <AdminActionRow hint={ADMIN_SITE_HINTS.saveSiteHomeConfig}>
        <button
          type="button"
          disabled={loading}
          onClick={() => void handleSave()}
          className="sd-btn-primary rounded-lg px-4 py-2 text-sm disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save home hero"}
        </button>
      </AdminActionRow>

      {message && <p className="text-sm text-emerald-300">{message}</p>}
    </section>
  );
}
