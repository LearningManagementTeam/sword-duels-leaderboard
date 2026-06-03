"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { lockPhaseAndAdvance } from "@/lib/actions/admin";
import type { PhaseLockOverview } from "@/lib/data/admin-queries";

interface Props {
  phases: PhaseLockOverview[];
}

export function PhaseLockPanel({ phases }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function handleLock(phase: PhaseLockOverview) {
    if (!phase.round3Published) {
      setMessage(`Publish Round 3 for ${phase.name} before locking.`);
      return;
    }

    const seedNote =
      phase.seasonSlug === "june_area"
        ? `${phase.seedCount ?? 0} branches will seed into July (expect 24).`
        : `${phase.seedCount ?? 0} regional champion(s) will seed into August (expect 3).`;

    const confirmLines = [
      `Lock ${phase.name} and advance to the next phase?`,
      "",
      seedNote,
      "",
      "This re-seeds participants for the next season. It cannot be undone from this screen.",
    ];

    if (phase.lockedAt) {
      confirmLines.unshift(
        "This phase was already locked.",
        `Last locked ${new Date(phase.lockedAt).toLocaleString()} by ${phase.lockedByEmail ?? "unknown"}.`,
        "",
        "Re-running will wipe and re-seed the next season's participant list.",
        ""
      );
    }

    if (!confirm(confirmLines.join("\n"))) return;

    setLoading(phase.seasonSlug);
    setMessage("");
    try {
      await lockPhaseAndAdvance(phase.seasonSlug);
      setMessage(`${phase.name} locked and next phase seeded.`);
      router.refresh();
    } catch (err) {
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
                <strong className={phase.round3Published ? "text-emerald-200" : "text-amber-200"}>
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

            <button
              type="button"
              disabled={loading !== null || !phase.round3Published}
              onClick={() => handleLock(phase)}
              className="sd-btn-ghost mt-4 rounded-lg px-4 py-2 text-sm disabled:opacity-50"
            >
              {loading === phase.seasonSlug
                ? "Locking…"
                : isLocked
                  ? "Re-lock & re-seed"
                  : "Lock & advance"}
            </button>
          </div>
        );
      })}
      {message && <p className="text-sm text-sd-glow">{message}</p>}
    </div>
  );
}
