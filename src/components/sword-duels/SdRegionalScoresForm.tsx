"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AdminConfirmPanel } from "@/components/admin/AdminConfirmPanel";
import { RepAvatar } from "@/components/ui/RepAvatar";
import {
  publishSdSet,
  saveSdSetScores,
  unpublishSdSet,
} from "@/lib/actions/sword-duels-admin";
import type { NationalsAreaRep } from "@/lib/products/sword-duels/nationals-wildcard-data";
import {
  SD_REGIONAL_ROUND_DAY_HINTS,
  SD_REGIONAL_SET_LABELS,
  type SdRegionalSetType,
} from "@/lib/products/sword-duels/regional-rounds";
import type { SdSet, SdSetScore } from "@/lib/products/sword-duels/types";
import { SdButton } from "@/components/ui/SdButton";

interface Props {
  set: SdSet;
  setType: SdRegionalSetType;
  participants: NationalsAreaRep[];
  initialScores: SdSetScore[];
  canEdit: boolean;
  lockedReason?: string | null;
}

export function SdRegionalScoresForm({
  set,
  setType,
  participants,
  initialScores,
  canEdit,
  lockedReason,
}: Props) {
  const router = useRouter();
  const scoreByBranch = useMemo(
    () => new Map(initialScores.map((s) => [s.branch_id, s])),
    [initialScores]
  );

  const [points, setPoints] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const p of participants) {
      const s = scoreByBranch.get(p.branchId);
      init[p.branchId] = s ? String(s.points) : "0";
    }
    return init;
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);

  const published = set.status === "published";
  const label = SD_REGIONAL_SET_LABELS[setType];
  const dayHint = SD_REGIONAL_ROUND_DAY_HINTS[setType];

  async function handleSave() {
    if (!set.id) return;
    setBusy(true);
    setMessage("");
    setError(false);
    try {
      await saveSdSetScores(
        set.id,
        participants.map((p) => ({
          branch_id: p.branchId,
          points: Number(points[p.branchId] ?? 0),
          active_representative: 1,
        }))
      );
      setMessage("Draft saved.");
      router.refresh();
    } catch (e) {
      setError(true);
      setMessage(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handlePublish() {
    if (!set.id) return;
    setBusy(true);
    setMessage("");
    setError(false);
    try {
      await handleSave();
      await publishSdSet(set.id);
      setMessage(`${label} published.`);
      setConfirmPublish(false);
      router.refresh();
    } catch (e) {
      setError(true);
      setMessage(e instanceof Error ? e.message : "Publish failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleUnpublish() {
    if (!set.id) return;
    setBusy(true);
    try {
      const result = await unpublishSdSet(set.id);
      if (!result.ok) throw new Error(result.error);
      setMessage(`${label} reverted to draft.`);
      router.refresh();
    } catch (e) {
      setError(true);
      setMessage(e instanceof Error ? e.message : "Unpublish failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      id={`regional-${setType}`}
      className="scroll-mt-24 space-y-4 rounded-xl sd-inset p-4 ring-1 ring-emerald-500/10"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-sd-glow">
            {dayHint}
          </p>
          <h3 className="text-lg font-semibold text-white">{label}</h3>
          <p className="mt-1 text-sm text-sd-muted">
            One score per area representative in this region.
          </p>
        </div>
        <span
          className={`rounded-lg px-2 py-1 text-xs font-semibold uppercase ${
            published
              ? "bg-emerald-500/20 text-emerald-100"
              : "bg-amber-500/15 text-amber-100"
          }`}
        >
          {published ? "Published" : "Draft"}
        </span>
      </div>

      {lockedReason && !published && (
        <p className="text-sm text-amber-200/90">{lockedReason}</p>
      )}

      <div className="overflow-x-auto">
        <table className="sd-table min-w-[480px]">
          <thead>
            <tr>
              <th className="text-left">Area rep</th>
              <th className="text-left">Branch</th>
              <th className="text-right">Score</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((p) => (
              <tr key={p.branchId}>
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <RepAvatar
                      name={p.repName}
                      photoUrl={p.photoUrl}
                      size="sm"
                    />
                    <div>
                      <p className="text-sm font-medium text-white">
                        {p.repName}
                      </p>
                      <p className="text-[10px] text-sd-muted">{p.area}</p>
                    </div>
                  </div>
                </td>
                <td className="text-sm text-sd-muted">
                  {p.branchName}
                  <span className="text-sd-muted/60"> · {p.branchCode}</span>
                </td>
                <td className="text-right">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    disabled={!canEdit || published || busy}
                    value={points[p.branchId] ?? "0"}
                    onChange={(e) =>
                      setPoints((prev) => ({
                        ...prev,
                        [p.branchId]: e.target.value,
                      }))
                    }
                    className="w-24 rounded sd-input px-2 py-1 text-right text-sm"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {confirmPublish ? (
        <AdminConfirmPanel
          title={`Publish ${label}?`}
          confirmLabel="Publish round"
          busy={busy}
          onConfirm={() => void handlePublish()}
          onCancel={() => setConfirmPublish(false)}
        >
          <p>Scores will appear on the public regional leaderboard.</p>
        </AdminConfirmPanel>
      ) : (
        <div className="flex flex-wrap gap-2">
          {canEdit && !published && (
            <>
              <SdButton
                type="button"
                disabled={busy || !set.id}
                onClick={() => void handleSave()}
              >
                {busy ? "Saving…" : "Save draft"}
              </SdButton>
              <SdButton
                type="button"
                variant="primary"
                disabled={busy || !set.id}
                onClick={() => setConfirmPublish(true)}
              >
                Save & publish
              </SdButton>
            </>
          )}
          {published && (
            <SdButton
              type="button"
              disabled={busy}
              onClick={() => void handleUnpublish()}
            >
              Unpublish
            </SdButton>
          )}
        </div>
      )}

      {message && (
        <p
          role="status"
          className={`text-sm ${error ? "text-rose-200" : "text-emerald-200"}`}
        >
          {message}
        </p>
      )}
    </section>
  );
}
