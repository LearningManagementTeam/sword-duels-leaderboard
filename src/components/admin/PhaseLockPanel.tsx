"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminActionHint, AdminActionRow } from "@/components/admin/AdminActionHint";
import { AdminConfirmPanel } from "@/components/admin/AdminConfirmPanel";
import { ADMIN_ADVANCEMENT_HINTS, ADMIN_CONFIRM_HINTS } from "@/lib/admin-action-hints";
import { lockPhaseAndAdvance } from "@/lib/actions/admin";
import type { PhaseLockOverview } from "@/lib/data/admin-queries";

interface Props {
  phases: PhaseLockOverview[];
}

function nextPhaseLabel(seasonSlug: PhaseLockOverview["seasonSlug"]): string {
  return seasonSlug === "june_area" ? "July" : "The Nationals";
}

export function PhaseLockPanel({ phases }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"info" | "error">("info");
  const [pendingLock, setPendingLock] = useState<PhaseLockOverview | null>(
    null
  );

  function requestLock(phase: PhaseLockOverview) {
    if (!phase.round3Published) {
      setMessageTone("error");
      setMessage(`Publish Round 3 for ${phase.name} before locking.`);
      return;
    }
    setPendingLock(phase);
    setMessage("");
  }

  async function executeLock() {
    if (!pendingLock) return;
    const phase = pendingLock;
    setPendingLock(null);
    setLoading(phase.seasonSlug);
    setMessage("");
    try {
      await lockPhaseAndAdvance(phase.seasonSlug);
      setMessageTone("info");
      setMessage(`${phase.name} locked and ${nextPhaseLabel(phase.seasonSlug)} roster seeded.`);
      router.refresh();
    } catch (err) {
      setMessageTone("error");
      setMessage(err instanceof Error ? err.message : "Lock failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      {phases.map((phase) => {
        const isLocked = Boolean(phase.lockedAt);
        const seedOk =
          phase.seasonSlug === "june_area"
            ? phase.seedCount === 24
            : phase.seedCount === 3;
        const isPending = pendingLock?.seasonSlug === phase.seasonSlug;
        const nextPhase = nextPhaseLabel(phase.seasonSlug);

        return (
          <div key={phase.seasonSlug} className="sd-neon-panel p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h2 className="font-semibold text-sd-glow">{phase.name}</h2>
              {isLocked && (
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-100 ring-1 ring-emerald-400/40">
                  Locked
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-sd-muted">{phase.description}</p>

            <ul className="mt-3 space-y-1 text-xs text-sd-muted/80">
              <li>
                Round 3 published:{" "}
                <strong
                  className={
                    phase.round3Published ? "text-emerald-200" : "text-amber-200"
                  }
                >
                  {phase.round3Published ? "Yes" : "No — publish first"}
                </strong>
              </li>
              <li>
                Branches to seed:{" "}
                <strong className={seedOk ? "text-emerald-200" : "text-amber-200"}>
                  {phase.seedCount ?? "—"}
                  {phase.seasonSlug === "june_area" ? " (expect 24)" : " (expect 3)"}
                </strong>
              </li>
              {isLocked && phase.lockedAt && (
                <li>
                  Locked {new Date(phase.lockedAt).toLocaleString()}
                  {phase.lockedByEmail ? ` by ${phase.lockedByEmail}` : ""}
                </li>
              )}
            </ul>

            {isPending ? (
              <div className="mt-4">
                <AdminConfirmPanel
                  title={
                    isLocked
                      ? `Re-lock ${phase.name} and re-seed ${nextPhase}?`
                      : `Lock ${phase.name} and advance to ${nextPhase}?`
                  }
                  confirmLabel={isLocked ? "Re-lock & re-seed" : "Lock & advance"}
                  tone="danger"
                  busy={loading === phase.seasonSlug}
                  onConfirm={executeLock}
                  onCancel={() => setPendingLock(null)}
                >
                  {isLocked && phase.lockedAt && (
                    <p className="mb-2 opacity-90">
                      Last locked{" "}
                      {new Date(phase.lockedAt).toLocaleString()}
                      {phase.lockedByEmail
                        ? ` by ${phase.lockedByEmail}`
                        : ""}
                      . Re-running wipes and re-seeds the {nextPhase} participant
                      list.
                    </p>
                  )}
                  <p>
                    <strong>{phase.seedCount ?? 0}</strong> branches will seed into{" "}
                    {nextPhase}
                    {phase.seasonSlug === "june_area" ? " (expect 24)" : " (expect 3 champions)"}.
                  </p>
                  <p className="mt-2 opacity-90">
                    This cannot be undone from this screen.
                  </p>
                  <AdminActionHint
                    hint={ADMIN_CONFIRM_HINTS.lockPhase}
                    className="mt-2 text-sd-muted/90"
                  />
                </AdminConfirmPanel>
              </div>
            ) : (
              <AdminActionRow
                hint={
                  isLocked
                    ? ADMIN_ADVANCEMENT_HINTS.relockPhase
                    : ADMIN_ADVANCEMENT_HINTS.lockPhase
                }
                className="mt-4"
              >
                <button
                  type="button"
                  disabled={loading !== null || !phase.round3Published}
                  onClick={() => requestLock(phase)}
                  className="sd-btn-ghost rounded-lg px-4 py-2 text-sm disabled:opacity-50"
                >
                  {loading === phase.seasonSlug
                    ? "Locking…"
                    : isLocked
                      ? "Re-lock & re-seed"
                      : "Lock & advance"}
                </button>
              </AdminActionRow>
            )}
          </div>
        );
      })}
      {message && (
        <p
          className={
            messageTone === "error" ? "sd-alert-warning text-sm" : "sd-alert-info text-sm"
          }
          role="status"
        >
          {message}
        </p>
      )}
    </div>
  );
}
