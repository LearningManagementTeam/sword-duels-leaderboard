"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveRoundResults, publishRound } from "@/lib/actions/admin";
import { DraftStandingsPreview } from "@/components/admin/DraftStandingsPreview";
import {
  AdminOperationPanel,
  patchOperationStep,
  type OperationStep,
} from "@/components/admin/AdminOperationPanel";
import { AdminConfirmPanel } from "@/components/admin/AdminConfirmPanel";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminPostPublishChecklist } from "@/components/admin/AdminPostPublishChecklist";
import { InfoTip } from "@/components/admin/InfoTip";
import { SdButtonLink } from "@/components/ui/SdButtonLink";
import {
  checkPublishReadiness,
} from "@/lib/publish-readiness";
import { seasonSlugToPublicPath } from "@/lib/competition-map";
import {
  getRoundMechanics,
  requiredSurvivorsPerRegion,
  type Region,
} from "@/lib/scoring-config";
import type { Branch } from "@/lib/types";
import type { SeasonSlug } from "@/lib/scoring-config";
import { REGIONS, REGION_LABELS } from "@/lib/scoring-config";

interface RowValue {
  branch_id: string;
  branch_name: string;
  region: Region;
  points: number;
  survived: boolean;
  finish_order: number | null;
}

interface Props {
  roundId: string;
  roundName: string;
  roundNumber: number;
  status: string;
  seasonSlug: SeasonSlug;
  branches: Branch[];
  tieBreakerBranches?: Branch[];
  eliminatedBranches?: Branch[];
  priorRoundNumber?: number | null;
  supportsManualAdvances?: boolean;
  participantGateMessage?: string | null;
  initial: Map<
    string,
    { points: number; wins: number; losses: number; finish_order?: number | null }
  >;
}

function publishStandingsDetail(seasonSlug: SeasonSlug): string {
  if (seasonSlug === "august_finals") {
    return "Recomputes The Nationals championship board";
  }
  return "Recomputes Luzon, NCR, and VisMin boards with cut lines and statuses";
}

function publishRefreshDetail(): string {
  return "Refreshes home, standings pages, and competition map data";
}

export function RoundResultsForm({
  roundId,
  roundName,
  roundNumber,
  status,
  seasonSlug,
  branches,
  tieBreakerBranches = [],
  eliminatedBranches = [],
  priorRoundNumber,
  supportsManualAdvances = false,
  participantGateMessage = null,
  initial,
}: Props) {
  const router = useRouter();
  const mechanics = getRoundMechanics(seasonSlug, roundNumber);
  const kind = mechanics?.kind ?? "quiz";
  const maxPoints =
    mechanics?.kind === "quiz"
      ? mechanics.maxPoints
      : mechanics?.kind === "race_to_correct"
        ? mechanics.maxCorrect
        : 1;

  const [showOut, setShowOut] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [operationTitle, setOperationTitle] = useState<string | null>(null);
  const [operationSteps, setOperationSteps] = useState<OperationStep[] | null>(
    null
  );
  const [operationError, setOperationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [values, setValues] = useState<RowValue[]>(() =>
    branches.map((b) => {
      const init = initial.get(b.id);
      const points = init?.points ?? 0;
      return {
        branch_id: b.id,
        branch_name: b.branch_name,
        region: b.region,
        points,
        survived: points >= 1,
        finish_order: init?.finish_order ?? null,
      };
    })
  );

  const survivorCounts = useMemo(() => {
    const counts: Record<Region, number> = { luzon: 0, ncr: 0, vismin: 0 };
    if (kind !== "last_man_standing") return counts;
    for (const row of values) {
      if (row.survived) counts[row.region]++;
    }
    return counts;
  }, [values, kind]);

  const getDraftResults = useCallback(() => {
    return values.map((v) => {
      if (kind === "last_man_standing") {
        return {
          branch_id: v.branch_id,
          points: v.survived ? 1 : 0,
          finish_order: null as number | null,
        };
      }
      if (kind === "race_to_correct") {
        return {
          branch_id: v.branch_id,
          points: v.points,
          finish_order: v.points === maxPoints ? v.finish_order : null,
        };
      }
      return {
        branch_id: v.branch_id,
        points: v.points,
        finish_order: null as number | null,
      };
    });
  }, [values, kind, maxPoints]);

  function clearOperation() {
    setOperationTitle(null);
    setOperationSteps(null);
    setOperationError(null);
    setSuccessMessage(null);
  }

  function dismissSuccess() {
    clearOperation();
    setMessage("");
  }

  async function handleSave() {
    clearOperation();
    setBusy(true);
    setMessage("");
    setOperationTitle("Saving draft");
    setOperationSteps([
      { id: "save", label: "Writing scores to draft", status: "active" },
    ]);

    try {
      await saveRoundResults(roundId, getDraftResults());
      setOperationSteps([
        { id: "save", label: "Writing scores to draft", status: "done" },
      ]);
      setSuccessMessage("Draft saved — nothing is live yet.");
      setMessage("Draft saved.");
    } catch (e) {
      const err = e instanceof Error ? e.message : "Save failed";
      setOperationSteps([
        { id: "save", label: "Writing scores to draft", status: "error" },
      ]);
      setOperationError(err);
      setMessage(err);
    } finally {
      setBusy(false);
    }
  }

  const publishReadiness = useMemo(
    () =>
      checkPublishReadiness(
        seasonSlug,
        roundNumber,
        values,
        tieBreakerBranches.length
      ),
    [seasonSlug, roundNumber, values, tieBreakerBranches.length]
  );

  function requestPublish() {
    if (publishReadiness.blockers.length > 0) {
      setMessage(`Cannot publish: ${publishReadiness.blockers.join(" ")}`);
      return;
    }
    setPublishConfirmOpen(true);
  }

  async function executePublish() {
    setPublishConfirmOpen(false);
    clearOperation();
    setBusy(true);
    setMessage("");
    setOperationTitle("Publishing round");

    const publishSteps: OperationStep[] = [
      { id: "save", label: "Saving round scores", status: "pending" },
      {
        id: "mark",
        label: "Marking round as published",
        status: "pending",
      },
      {
        id: "standings",
        label: "Recomputing live standings",
        detail: publishStandingsDetail(seasonSlug),
        status: "pending",
      },
      {
        id: "refresh",
        label: "Updating public site",
        detail: publishRefreshDetail(),
        status: "pending",
      },
    ];
    setOperationSteps(publishSteps);

    try {
      setOperationSteps((s) =>
        patchOperationStep(s ?? [], "save", "active")
      );
      await saveRoundResults(roundId, getDraftResults());
      setOperationSteps((s) => {
        let next = patchOperationStep(s ?? [], "save", "done");
        for (const id of ["mark", "standings", "refresh"] as const) {
          next = patchOperationStep(next, id, "active");
        }
        return next;
      });

      await publishRound(roundId);

      setOperationSteps((s) => {
        let next = s ?? [];
        next = patchOperationStep(next, "mark", "done");
        next = patchOperationStep(next, "standings", "done");
        next = patchOperationStep(next, "refresh", "done");
        return next;
      });
      setSuccessMessage(`${roundName} is now live on the public site.`);
      setMessage(
        "Round published. Consider updating the Competition map on the home page."
      );
      router.refresh();
    } catch (e) {
      const err = e instanceof Error ? e.message : "Publish failed";
      setOperationSteps((s) => {
        const next = (s ?? []).map((step) =>
          step.status === "active" || step.status === "pending"
            ? { ...step, status: "error" as const }
            : step
        );
        return next;
      });
      setOperationError(err);
      setMessage(err);
    } finally {
      setBusy(false);
    }
  }

  function updateRow(index: number, patch: Partial<RowValue>) {
    setValues((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }

  const liveBoardHref = seasonSlugToPublicPath(seasonSlug, "luzon");
  const showOperationPanel =
    operationTitle != null && operationSteps != null && operationSteps.length > 0;

  return (
    <div className="space-y-6 pb-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold text-white">{roundName}</h2>
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            status === "published"
              ? "bg-emerald-800 text-emerald-100"
              : "bg-sd-panel text-sd-muted"
          }`}
        >
          {status}
        </span>
        {busy && (
          <span className="text-xs text-sd-muted/80">Please wait…</span>
        )}
      </div>

      {participantGateMessage && (
        <div className="sd-alert-warning text-sm">
          <p className="font-medium">Roster not ready</p>
          <p className="mt-1">{participantGateMessage}</p>
          <Link
            href="/admin/advancement"
            className="mt-2 inline-block text-xs font-medium text-amber-200 underline hover:text-white"
          >
            Go to Advancement → Lock &amp; advance
          </Link>
        </div>
      )}

      {showOperationPanel && (
        <AdminOperationPanel
          title={operationTitle!}
          steps={operationSteps!}
          error={operationError}
          successMessage={successMessage}
          successDetail={
            successMessage ? (
              <AdminPostPublishChecklist
                seasonSlug={seasonSlug}
                roundId={roundId}
                supportsManualAdvances={supportsManualAdvances}
                liveBoardHref={liveBoardHref}
              />
            ) : undefined
          }
          onDismiss={successMessage ? dismissSuccess : undefined}
        />
      )}

      {mechanics && (
        <div className="sd-alert-info text-sm">
          <p className="font-medium text-sd-glow">{mechanics.label}</p>
          <p className="mt-1">{mechanics.description}</p>
        </div>
      )}

      {kind === "last_man_standing" && (
        <div className="flex flex-wrap gap-2 text-xs">
          {REGIONS.map((region) => {
            const required =
              requiredSurvivorsPerRegion(seasonSlug, roundNumber, region) ?? 0;
            const count = survivorCounts[region];
            const ok = count === required;
            return (
              <span
                key={region}
                className={`rounded-lg px-3 py-1.5 ${
                  ok
                    ? "bg-emerald-500/20 text-emerald-100"
                    : "bg-amber-500/15 text-amber-100"
                }`}
              >
                {REGION_LABELS[region]}: {count}/{required} survived
              </span>
            );
          })}
        </div>
      )}

      {supportsManualAdvances && (
        <SdButtonLink
          href={`/admin/rounds/${roundId}/advances`}
          variant="fuchsia"
          className="px-3 py-1.5 text-sm"
        >
          Manage advancement picks →
        </SdButtonLink>
      )}

      {(eliminatedBranches.length > 0 || tieBreakerBranches.length > 0) &&
        priorRoundNumber && (
          <div className="rounded-lg border border-sd-glow/15 bg-sd-panel/50">
            <button
              type="button"
              onClick={() => setShowOut(!showOut)}
              disabled={busy}
              className="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-sd-muted hover:text-white disabled:opacity-50"
            >
              <span>
                Not competing this round ({eliminatedBranches.length} eliminated
                {tieBreakerBranches.length > 0
                  ? `, ${tieBreakerBranches.length} tie breaker`
                  : ""}
                )
              </span>
              <span>{showOut ? "▲" : "▼"}</span>
            </button>
            {showOut && (
              <ul className="max-h-40 overflow-auto border-t border-sd-glow/10 px-4 py-2 text-xs text-sd-muted">
                {eliminatedBranches.map((b) => (
                  <li key={b.id}>{b.branch_name} — eliminated</li>
                ))}
              </ul>
            )}
          </div>
        )}

      <fieldset
        disabled={busy}
        className={`min-w-0 space-y-4 border-0 p-0 m-0 ${busy ? "opacity-75" : ""}`}
      >
        {values.length === 0 ? (
          <AdminEmptyState
            title={
              participantGateMessage
                ? "Roster not ready for scoring"
                : "No branches to score yet"
            }
            detail={
              participantGateMessage
                ? "Lock the prior phase on the Advancement page to seed participants, then return here."
                : "Import branches for June Round 1, or check that the correct phase is locked."
            }
            action={
              participantGateMessage ? (
                <SdButtonLink href="/admin/advancement" variant="ghost" className="px-3 py-1.5 text-sm">
                  Go to Advancement
                </SdButtonLink>
              ) : (
                <SdButtonLink href="/admin/branches" variant="ghost" className="px-3 py-1.5 text-sm">
                  Load roster
                </SdButtonLink>
              )
            }
          />
        ) : (
          <>
        <div className="max-h-[min(60vh,calc(100vh-14rem))] overflow-auto rounded-xl border border-sd-glow/20 sd-glass">
          <table className="sd-table min-w-[320px]">
            <thead className="sticky top-0 z-10 bg-sd-deep/95 shadow-[0_1px_0_rgb(74_222_128/0.25)] backdrop-blur-md">
              <tr>
                <th className="px-3 py-2 text-left text-sd-muted">Branch</th>
                {kind === "last_man_standing" && (
                  <th className="px-3 py-2 text-center text-sd-muted">Survived</th>
                )}
                {kind !== "last_man_standing" && (
                  <th className="px-3 py-2 text-right text-sd-muted">
                    {kind === "race_to_correct" ? "Correct (0–5)" : `Score (0–${maxPoints})`}
                  </th>
                )}
                {kind === "race_to_correct" && (
                  <th className="px-3 py-2 text-right text-sd-muted">Finish order</th>
                )}
              </tr>
            </thead>
            <tbody>
              {values.map((row, i) => (
                <tr
                  key={row.branch_id}
                  className="border-t border-sd-glow/10 transition hover:bg-emerald-500/5"
                >
                  <td className="px-3 py-2 text-white">{row.branch_name}</td>
                  {kind === "last_man_standing" && (
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={row.survived}
                        onChange={(e) =>
                          updateRow(i, { survived: e.target.checked })
                        }
                        className="h-4 w-4 rounded border-emerald-500/50"
                      />
                    </td>
                  )}
                  {kind !== "last_man_standing" && (
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        max={maxPoints}
                        step={1}
                        value={row.points}
                        onChange={(e) => {
                          const points = Math.min(
                            maxPoints,
                            Math.max(0, Number(e.target.value))
                          );
                          updateRow(i, {
                            points,
                            finish_order:
                              kind === "race_to_correct" && points !== maxPoints
                                ? null
                                : row.finish_order,
                          });
                        }}
                        className="sd-input w-28 rounded-lg px-2 py-1.5 text-right tabular-nums"
                      />
                    </td>
                  )}
                  {kind === "race_to_correct" && (
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={1}
                        max={32}
                        step={1}
                        disabled={row.points !== maxPoints}
                        value={row.finish_order ?? ""}
                        placeholder="—"
                        onChange={(e) =>
                          updateRow(i, {
                            finish_order: e.target.value
                              ? Number(e.target.value)
                              : null,
                          })
                        }
                        className="sd-input w-24 rounded-lg px-2 py-1.5 text-right tabular-nums disabled:opacity-40"
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <DraftStandingsPreview
          roundId={roundId}
          seasonSlug={seasonSlug}
          getDraftResults={getDraftResults}
        />
          </>
        )}
      </fieldset>

      {publishReadiness.blockers.length > 0 && (
        <div className="rounded-lg border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-100">
          <p className="font-medium">Publish blocked</p>
          <ul className="mt-1 list-inside list-disc text-red-200/90">
            {publishReadiness.blockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      )}

      {publishReadiness.warnings.length > 0 &&
        publishReadiness.blockers.length === 0 &&
        !publishConfirmOpen && (
          <div className="sd-alert-warning text-sm">
            <p className="font-medium">Review before publishing</p>
            <ul className="mt-1 list-inside list-disc opacity-90">
              {publishReadiness.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
        )}

      {publishConfirmOpen && (
        <AdminConfirmPanel
          title={`Publish ${roundName}?`}
          confirmLabel="Publish now"
          onConfirm={executePublish}
          onCancel={() => setPublishConfirmOpen(false)}
          busy={busy}
        >
          <p>This updates the public leaderboard immediately.</p>
          {publishReadiness.warnings.length > 0 && (
            <ul className="mt-2 list-inside list-disc opacity-90">
              {publishReadiness.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}
        </AdminConfirmPanel>
      )}

      <div
        className="sticky bottom-0 z-20 -mx-4 mt-2 space-y-3 border-t border-emerald-500/20 bg-sd-deep/95 px-4 py-3 backdrop-blur-xl sm:-mx-0 sm:rounded-xl sm:border sm:border-emerald-500/15"
        aria-label="Round actions"
      >
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={handleSave}
            className="sd-btn-ghost rounded-lg px-4 py-2 text-sm disabled:opacity-50"
          >
            {busy && operationTitle === "Saving draft"
              ? "Saving draft…"
              : "Save draft"}
          </button>
          <button
            type="button"
            disabled={
              busy || publishReadiness.blockers.length > 0 || publishConfirmOpen
            }
            onClick={requestPublish}
            className="sd-btn-primary rounded-lg px-4 py-2 text-sm disabled:opacity-50"
          >
            {busy && operationTitle === "Publishing round"
              ? "Publishing…"
              : "Save & publish"}
          </button>
          <InfoTip>
            Publishing applies the regional cut. Use advancement picks for tie
            breakers.
          </InfoTip>
        </div>
        {message && !showOperationPanel && (
          <p className="text-sm text-sd-glow">{message}</p>
        )}
      </div>
    </div>
  );
}
