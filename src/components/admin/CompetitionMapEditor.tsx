"use client";

import { useState } from "react";
import { AdminActionRow } from "@/components/admin/AdminActionHint";
import { CompetitionMapDisplay } from "@/components/competition/CompetitionMapDisplay";
import {
  saveCompetitionMap,
  suggestCompetitionMilestone,
} from "@/lib/actions/admin";
import {
  COMPETITION_MILESTONES,
  getMilestoneMeta,
  milestoneShowsContestantList,
  type CompetitionMapConfig,
  type CompetitionMilestoneId,
  type RegionHighlight,
} from "@/lib/competition-map";
import type { RemainingContestantsResult } from "@/lib/data/competition-map-queries";
import { REGIONS, REGION_LABELS } from "@/lib/scoring-config";
import { ADMIN_SITE_HINTS } from "@/lib/admin-action-hints";

interface Props {
  initial: CompetitionMapConfig;
  initialRemaining: RemainingContestantsResult;
}

const GROUP_LABELS: Record<string, string> = {
  setup: "Setup",
  june: "June",
  transition: "Transitions",
  july: "July",
  august: "The Nationals",
  end: "End",
};

export function CompetitionMapEditor({
  initial,
  initialRemaining,
}: Props) {
  const [config, setConfig] = useState(initial);
  const [remaining] = useState(initialRemaining);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<"edit" | "preview">("edit");

  const meta = getMilestoneMeta(config.milestoneId);
  const listAllowed = milestoneShowsContestantList(config.milestoneId);
  const anyTruncated = remaining.groups.some((g) => g.truncated);

  async function handleSave() {
    setLoading(true);
    setMessage("");
    try {
      await saveCompetitionMap(config);
      setMessage("Saved. Home page competition map updated.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSuggest() {
    setLoading(true);
    setMessage("");
    try {
      const suggestion = await suggestCompetitionMilestone();
      setConfig((c) => ({
        ...c,
        milestoneId: suggestion.milestoneId,
        publicCaption: suggestion.publicCaption,
      }));
      setMessage("Suggestion applied — review and save when ready.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Suggest failed");
    } finally {
      setLoading(false);
    }
  }

  const grouped = COMPETITION_MILESTONES.reduce(
    (acc, m) => {
      if (!acc[m.group]) acc[m.group] = [];
      acc[m.group].push(m);
      return acc;
    },
    {} as Record<string, typeof COMPETITION_MILESTONES>
  );

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-emerald-500/25 bg-emerald-950/25 px-4 py-3 text-sm text-emerald-100/90">
        Caption is manual. Round bars on regional pages update automatically when
        you publish. Remaining contestants on home refresh from published
        standings.
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-sd-muted">
          Set where the competition is on the journey map shown on the home page.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab("edit")}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              tab === "edit"
                ? "sd-btn-primary"
                : "sd-btn-ghost border border-emerald-500/20"
            }`}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setTab("preview")}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              tab === "preview"
                ? "sd-btn-primary"
                : "sd-btn-ghost border border-emerald-500/20"
            }`}
          >
            Preview
          </button>
        </div>
      </div>

      {tab === "preview" ? (
        <div className="space-y-2">
          {anyTruncated && (
            <p className="text-xs text-amber-200/90 rounded-lg border border-amber-500/30 bg-amber-950/30 px-3 py-2">
              Preview: at least one region has more than 50 remaining branches —
              the home page will show the first 50 with a link to the full board.
            </p>
          )}
          <CompetitionMapDisplay config={config} remaining={remaining} />
        </div>
      ) : (
        <div className="sd-neon-panel space-y-5 p-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-sd-muted">
              Milestone (you are here)
            </label>
            <select
              value={config.milestoneId}
              onChange={(e) => {
                const milestoneId = e.target.value as CompetitionMilestoneId;
                setConfig((c) => ({
                  ...c,
                  milestoneId,
                  showContestantList: milestoneShowsContestantList(milestoneId)
                    ? c.showContestantList
                    : false,
                }));
              }}
              className="sd-input w-full max-w-lg px-3 py-2 text-sm"
            >
              {Object.entries(grouped).map(([group, items]) => (
                <optgroup key={group} label={GROUP_LABELS[group] ?? group}>
                  {items.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-sd-muted">
              Region highlight
            </label>
            <select
              value={config.regionHighlight}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  regionHighlight: e.target.value as RegionHighlight,
                }))
              }
              className="sd-input w-full max-w-xs px-3 py-2 text-sm"
              disabled={!meta.usesRegions}
            >
              <option value="all">All regions</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {REGION_LABELS[r]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-sd-muted">
              Public caption
            </label>
            <textarea
              value={config.publicCaption}
              onChange={(e) =>
                setConfig((c) => ({ ...c, publicCaption: e.target.value }))
              }
              rows={3}
              className="sd-input w-full px-3 py-2 text-sm"
              placeholder="e.g. You are here: after June Round 2 — top 16 per region advance."
            />
          </div>

          <div className="space-y-1">
            <label
              className={`flex items-center gap-2 text-sm ${
                listAllowed ? "text-sd-muted" : "text-sd-muted/50"
              }`}
            >
              <input
                type="checkbox"
                checked={config.showContestantList && listAllowed}
                disabled={!listAllowed}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    showContestantList: e.target.checked,
                  }))
                }
                className="rounded border-emerald-500/40 disabled:opacity-40"
              />
              Show remaining contestants list on home page
            </label>
            {!listAllowed && (
              <p className="text-xs text-sd-muted/70 pl-6">
                Not available for {meta.label} — no round cohort for this
                milestone.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-start gap-4">
            <AdminActionRow hint={ADMIN_SITE_HINTS.saveCompetitionMap}>
              <button
                type="button"
                disabled={loading}
                onClick={handleSave}
                className="sd-btn-primary rounded-lg px-4 py-2 text-sm disabled:opacity-50"
              >
                {loading ? "Saving…" : "Save competition map"}
              </button>
            </AdminActionRow>
            <AdminActionRow hint={ADMIN_SITE_HINTS.suggestCompetitionMap}>
              <button
                type="button"
                disabled={loading}
                onClick={handleSuggest}
                className="sd-btn-secondary rounded-lg px-4 py-2 text-sm disabled:opacity-50"
              >
                Suggest from latest published round
              </button>
            </AdminActionRow>
          </div>

          <p className="text-xs text-sd-muted/70">
            Preview tab shows the home layout. Contestant counts reflect data at
            page load — refresh after publishing rounds.
          </p>
        </div>
      )}

      {message && <p className="text-sm text-sd-glow">{message}</p>}
    </div>
  );
}
