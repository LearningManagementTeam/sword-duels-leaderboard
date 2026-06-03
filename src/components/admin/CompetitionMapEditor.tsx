"use client";

import { useState } from "react";
import { CompetitionMapDisplay } from "@/components/competition/CompetitionMapDisplay";
import {
  saveCompetitionMap,
  suggestCompetitionMilestone,
} from "@/lib/actions/admin";
import {
  COMPETITION_MILESTONES,
  type CompetitionMapConfig,
  type CompetitionMilestoneId,
  type RegionHighlight,
} from "@/lib/competition-map";
import type { RemainingContestantsResult } from "@/lib/data/competition-map-queries";
import { REGIONS, REGION_LABELS } from "@/lib/scoring-config";

interface Props {
  initial: CompetitionMapConfig;
  initialRemaining: RemainingContestantsResult;
}

const GROUP_LABELS: Record<string, string> = {
  setup: "Setup",
  june: "June",
  transition: "Transitions",
  july: "July",
  august: "August",
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-sd-muted">
          Set where the competition is on the journey map shown on the home page.
          Remaining contestants update automatically from published standings.
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
        <CompetitionMapDisplay config={config} remaining={remaining} />
      ) : (
        <div className="sd-neon-panel space-y-5 p-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-sd-muted">
              Milestone (you are here)
            </label>
            <select
              value={config.milestoneId}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  milestoneId: e.target.value as CompetitionMilestoneId,
                }))
              }
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

          <label className="flex items-center gap-2 text-sm text-sd-muted">
            <input
              type="checkbox"
              checked={config.showContestantList}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  showContestantList: e.target.checked,
                }))
              }
              className="rounded border-emerald-500/40"
            />
            Show remaining contestants list on home page
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={handleSave}
              className="sd-btn-primary rounded-lg px-4 py-2 text-sm disabled:opacity-50"
            >
              {loading ? "Saving…" : "Save competition map"}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleSuggest}
              className="sd-btn-secondary rounded-lg px-4 py-2 text-sm disabled:opacity-50"
            >
              Suggest from latest June round
            </button>
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
