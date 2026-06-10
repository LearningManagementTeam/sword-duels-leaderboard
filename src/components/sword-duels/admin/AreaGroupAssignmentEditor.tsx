"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import {
  resetSdAreaAutoGroups,
  saveSdAreaGroupAssignment,
} from "@/lib/actions/sword-duels-admin";
import { SdAreaGroupModeBadge } from "@/components/sword-duels/SdAreaGroupModeBadge";
import {
  SD_GROUP_SORT_LABELS,
  type SdGroupSortMode,
} from "@/lib/products/sword-duels/area-groups";
import type { SdAreaBracket } from "@/lib/products/sword-duels/types";

export interface AreaGroupBranchRow {
  id: string;
  branch_code: string;
  branch_name: string;
  representative_1?: string | null;
  representative_2?: string | null;
}

type GroupKey = "a" | "b" | "none";

interface DragPayload {
  branchId: string;
  source: GroupKey;
}

interface Props {
  area: string;
  areaBranches: AreaGroupBranchRow[];
  bracket: SdAreaBracket;
  groupSortMode: SdGroupSortMode;
  isManual: boolean;
  lockedReason?: string | null;
}

const DRAG_MIME = "application/x-sd-area-branch";

function parseDragPayload(dataTransfer: DataTransfer): DragPayload | null {
  const raw = dataTransfer.getData(DRAG_MIME);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as DragPayload;
    if (
      typeof parsed.branchId === "string" &&
      (parsed.source === "a" || parsed.source === "b" || parsed.source === "none")
    ) {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function BranchRow({
  branch,
  group,
  locked,
  isDragging,
  isDropBefore,
  onMoveToA,
  onMoveToB,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: {
  branch: AreaGroupBranchRow;
  group: GroupKey;
  locked: boolean;
  isDragging?: boolean;
  isDropBefore?: boolean;
  onMoveToA?: () => void;
  onMoveToB?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  const rep = branch.representative_1?.trim() || branch.representative_2?.trim();

  return (
    <li
      draggable={!locked}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`relative border-b border-emerald-500/10 py-2 last:border-0 ${
        isDragging ? "opacity-40" : ""
      } ${!locked ? "cursor-grab active:cursor-grabbing" : ""}`}
    >
      {isDropBefore && (
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-cyan-400 shadow-[0_0_8px_rgb(34_211_238/0.6)]"
          aria-hidden
        />
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white">
            {!locked && (
              <span className="mr-1.5 text-sd-muted/50" aria-hidden>
                ⠿
              </span>
            )}
            {branch.branch_name}
            <span className="ml-1.5 text-xs text-sd-muted/70">
              ({branch.branch_code})
            </span>
          </p>
          {rep && (
            <p className="text-[10px] text-sd-muted/60">{rep}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap gap-1">
          {group !== "none" && (
            <>
              <button
                type="button"
                disabled={!canMoveUp}
                onClick={onMoveUp}
                className="rounded px-2 py-1 text-[10px] text-sd-muted ring-1 ring-emerald-500/20 hover:text-white disabled:opacity-30"
                title="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                disabled={!canMoveDown}
                onClick={onMoveDown}
                className="rounded px-2 py-1 text-[10px] text-sd-muted ring-1 ring-emerald-500/20 hover:text-white disabled:opacity-30"
                title="Move down"
              >
                ↓
              </button>
            </>
          )}
          {group === "a" && onMoveToB && (
            <button
              type="button"
              onClick={onMoveToB}
              className="rounded px-2 py-1 text-[10px] text-amber-200 ring-1 ring-amber-400/25 hover:bg-amber-500/10"
            >
              → B
            </button>
          )}
          {group === "b" && onMoveToA && (
            <button
              type="button"
              onClick={onMoveToA}
              className="rounded px-2 py-1 text-[10px] text-cyan-200 ring-1 ring-cyan-400/25 hover:bg-cyan-500/10"
            >
              → A
            </button>
          )}
          {group === "none" && onMoveToA && onMoveToB && (
            <>
              <button
                type="button"
                onClick={onMoveToA}
                className="rounded px-2 py-1 text-[10px] text-cyan-200 ring-1 ring-cyan-400/25"
              >
                + A
              </button>
              <button
                type="button"
                onClick={onMoveToB}
                className="rounded px-2 py-1 text-[10px] text-amber-200 ring-1 ring-amber-400/25"
              >
                + B
              </button>
            </>
          )}
        </div>
      </div>
    </li>
  );
}

function GroupList({
  title,
  accent,
  groupKey,
  branchIds,
  branchById,
  locked,
  dragOver,
  draggingId,
  onReorder,
  onMoveToOther,
  onApplyDrop,
  onDragHover,
  onDragClear,
  onDragStartBranch,
  otherLabel,
}: {
  title: string;
  accent: "cyan" | "amber";
  groupKey: "a" | "b";
  branchIds: string[];
  branchById: Map<string, AreaGroupBranchRow>;
  locked: boolean;
  dragOver: { target: GroupKey; index: number } | null;
  draggingId: string | null;
  onReorder: (ids: string[]) => void;
  onMoveToOther: (id: string) => void;
  onApplyDrop: (payload: DragPayload, target: GroupKey, index: number) => void;
  onDragHover: (target: GroupKey, index: number) => void;
  onDragClear: () => void;
  onDragStartBranch: (id: string) => void;
  otherLabel: string;
}) {
  const ring =
    accent === "cyan"
      ? "ring-cyan-400/30 border-cyan-500/20"
      : "ring-amber-400/30 border-amber-500/20";

  function handleListDragOver(e: React.DragEvent) {
    if (locked) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    onDragHover(groupKey, branchIds.length);
  }

  function handleListDrop(e: React.DragEvent) {
    if (locked) return;
    e.preventDefault();
    const payload = parseDragPayload(e.dataTransfer);
    if (!payload) return;
    onApplyDrop(payload, groupKey, branchIds.length);
    onDragClear();
  }

  return (
    <div className={`sd-inset rounded-lg border p-3 ring-1 ${ring}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <span className="text-[10px] tabular-nums text-sd-muted">
          {branchIds.length} branches
        </span>
      </div>
      <ol
        className="min-h-[4rem]"
        onDragOver={handleListDragOver}
        onDrop={handleListDrop}
      >
        {branchIds.map((id, index) => {
          const branch = branchById.get(id);
          if (!branch) return null;
          return (
            <BranchRow
              key={id}
              branch={branch}
              group={groupKey}
              locked={locked}
              isDragging={draggingId === id}
              isDropBefore={
                dragOver?.target === groupKey && dragOver.index === index
              }
              canMoveUp={index > 0}
              canMoveDown={index < branchIds.length - 1}
              onMoveUp={() => {
                const next = [...branchIds];
                [next[index - 1], next[index]] = [next[index]!, next[index - 1]!];
                onReorder(next);
              }}
              onMoveDown={() => {
                const next = [...branchIds];
                [next[index], next[index + 1]] = [next[index + 1]!, next[index]!];
                onReorder(next);
              }}
              onMoveToA={
                accent === "amber" ? () => onMoveToOther(id) : undefined
              }
              onMoveToB={
                accent === "cyan" ? () => onMoveToOther(id) : undefined
              }
              onDragStart={(e) => {
                if (locked) return;
                onDragStartBranch(id);
                e.dataTransfer.setData(
                  DRAG_MIME,
                  JSON.stringify({ branchId: id, source: groupKey })
                );
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragEnd={onDragClear}
              onDragOver={(e) => {
                if (locked) return;
                e.preventDefault();
                e.stopPropagation();
                e.dataTransfer.dropEffect = "move";
                onDragHover(groupKey, index);
              }}
              onDrop={(e) => {
                if (locked) return;
                e.preventDefault();
                e.stopPropagation();
                const payload = parseDragPayload(e.dataTransfer);
                if (!payload) return;
                onApplyDrop(payload, groupKey, index);
                onDragClear();
              }}
            />
          );
        })}
        {branchIds.length === 0 && (
          <li className="py-4 text-center text-xs text-sd-muted">
            Drop branches here or assign from the list below.
          </li>
        )}
        {dragOver?.target === groupKey && dragOver.index === branchIds.length && (
          <li
            className="h-0.5 bg-cyan-400 shadow-[0_0_8px_rgb(34_211_238/0.6)]"
            aria-hidden
          />
        )}
      </ol>
      <p className="mt-2 text-[10px] text-sd-muted/60">
        Drag branches between groups or use {otherLabel}. Order sets battle
        display order.
      </p>
    </div>
  );
}

export function AreaGroupAssignmentEditor({
  area,
  areaBranches,
  bracket,
  groupSortMode,
  isManual,
  lockedReason,
}: Props) {
  const router = useRouter();
  const branchById = useMemo(
    () => new Map(areaBranches.map((b) => [b.id, b])),
    [areaBranches]
  );

  const [groupAIds, setGroupAIds] = useState(() =>
    bracket.groupA.map((b) => b.branch_id)
  );
  const [groupBIds, setGroupBIds] = useState(() =>
    bracket.groupB.map((b) => b.branch_id)
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<{
    target: GroupKey;
    index: number;
  } | null>(null);

  const assigned = useMemo(
    () => new Set([...groupAIds, ...groupBIds]),
    [groupAIds, groupBIds]
  );

  const unassignedIds = useMemo(
    () => areaBranches.map((b) => b.id).filter((id) => !assigned.has(id)),
    [areaBranches, assigned]
  );

  const locked = Boolean(lockedReason);
  const dirty =
    JSON.stringify(groupAIds) !==
      JSON.stringify(bracket.groupA.map((b) => b.branch_id)) ||
    JSON.stringify(groupBIds) !==
      JSON.stringify(bracket.groupB.map((b) => b.branch_id));

  const applyDrop = useCallback(
    (payload: DragPayload, target: GroupKey, dropIndex: number) => {
      if (locked) return;

      const { branchId } = payload;
      let a = groupAIds.filter((id) => id !== branchId);
      let b = groupBIds.filter((id) => id !== branchId);

      if (target === "none") {
        setGroupAIds(a);
        setGroupBIds(b);
        setDragOver(null);
        return;
      }

      const targetList = target === "a" ? a : b;
      const idx = Math.max(0, Math.min(dropIndex, targetList.length));
      const next = [...targetList];
      next.splice(idx, 0, branchId);

      if (target === "a") {
        setGroupAIds(next);
        setGroupBIds(b);
      } else {
        setGroupAIds(a);
        setGroupBIds(next);
      }
    },
    [groupAIds, groupBIds, locked]
  );

  function moveToGroup(id: string, target: "a" | "b") {
    applyDrop({ branchId: id, source: "none" }, target, target === "a" ? groupAIds.length : groupBIds.length);
  }

  async function handleSave() {
    setBusy(true);
    setMessage("");
    setError(false);
    try {
      const result = await saveSdAreaGroupAssignment(area, groupAIds, groupBIds);
      if (!result.ok) {
        setError(true);
        setMessage(result.error);
        return;
      }
      setMessage(result.message ?? "Groups saved.");
      router.refresh();
    } catch (e) {
      setError(true);
      setMessage(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleResetAuto() {
    if (
      !window.confirm(
        `Reset ${area} to automatic split (${SD_GROUP_SORT_LABELS[groupSortMode]})? Draft group scores will be cleared.`
      )
    ) {
      return;
    }
    setBusy(true);
    setMessage("");
    setError(false);
    try {
      const result = await resetSdAreaAutoGroups(area);
      if (!result.ok) {
        setError(true);
        setMessage(result.error);
        return;
      }
      setMessage(result.message ?? "Reset to automatic split.");
      router.refresh();
    } catch (e) {
      setError(true);
      setMessage(e instanceof Error ? e.message : "Reset failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="sd-neon-panel space-y-4 p-4 sm:p-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold text-white">Assign groups</h2>
          {isManual && <SdAreaGroupModeBadge isManual />}
        </div>
        <p className="mt-1 text-sm text-sd-muted">
          Choose which branches battle in <strong className="text-white">Set 1 (Group A)</strong> vs{" "}
          <strong className="text-white">Set 2 (Group B)</strong>. Every branch in
          this area must be in exactly one group before scoring.
        </p>
        {locked && (
          <p className="mt-2 text-sm text-amber-200/90">{lockedReason}</p>
        )}
        {!locked && (
          <p className="mt-2 text-xs text-sd-muted/70">
            Drag branches between columns, or use the arrow buttons. Dashboard{" "}
            <strong className="text-sd-muted">Sync from branches</strong> will not
            overwrite this area while it is marked manual.
          </p>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <GroupList
          title="Group A — Set 1 battle"
          accent="cyan"
          groupKey="a"
          branchIds={groupAIds}
          branchById={branchById}
          locked={locked}
          dragOver={dragOver}
          draggingId={draggingId}
          onReorder={setGroupAIds}
          onMoveToOther={(id) => moveToGroup(id, "b")}
          onApplyDrop={applyDrop}
          onDragHover={(target, index) => setDragOver({ target, index })}
          onDragClear={() => {
            setDraggingId(null);
            setDragOver(null);
          }}
          onDragStartBranch={setDraggingId}
          otherLabel="→ B"
        />
        <GroupList
          title="Group B — Set 2 battle"
          accent="amber"
          groupKey="b"
          branchIds={groupBIds}
          branchById={branchById}
          locked={locked}
          dragOver={dragOver}
          draggingId={draggingId}
          onReorder={setGroupBIds}
          onMoveToOther={(id) => moveToGroup(id, "a")}
          onApplyDrop={applyDrop}
          onDragHover={(target, index) => setDragOver({ target, index })}
          onDragClear={() => {
            setDraggingId(null);
            setDragOver(null);
          }}
          onDragStartBranch={setDraggingId}
          otherLabel="→ A"
        />
      </div>

      {unassignedIds.length > 0 && (
        <div
          className="sd-inset rounded-lg border border-rose-400/20 p-3 ring-1 ring-rose-400/15"
          onDragOver={(e) => {
            if (locked) return;
            e.preventDefault();
            setDragOver({ target: "none", index: 0 });
          }}
          onDragLeave={() => setDragOver(null)}
          onDrop={(e) => {
            if (locked) return;
            e.preventDefault();
            const payload = parseDragPayload(e.dataTransfer);
            if (!payload) return;
            applyDrop(payload, "none", 0);
            setDraggingId(null);
          }}
        >
          <h3 className="text-sm font-semibold text-rose-100">
            Unassigned ({unassignedIds.length})
          </h3>
          <p className="mt-1 text-xs text-sd-muted">
            Assign every branch to Group A or B before saving. Drop here to
            unassign.
          </p>
          <ol className="mt-2">
            {unassignedIds.map((id) => {
              const branch = branchById.get(id);
              if (!branch) return null;
              return (
                <BranchRow
                  key={id}
                  branch={branch}
                  group="none"
                  locked={locked}
                  isDragging={draggingId === id}
                  onMoveToA={() => moveToGroup(id, "a")}
                  onMoveToB={() => moveToGroup(id, "b")}
                  onDragStart={(e) => {
                    if (locked) return;
                    setDraggingId(id);
                    e.dataTransfer.setData(
                      DRAG_MIME,
                      JSON.stringify({ branchId: id, source: "none" })
                    );
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragEnd={() => {
                    setDraggingId(null);
                    setDragOver(null);
                  }}
                  onDragOver={(e) => {
                    if (locked) return;
                    e.preventDefault();
                  }}
                  onDrop={(e) => e.preventDefault()}
                />
              );
            })}
          </ol>
        </div>
      )}

      {!locked && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy || unassignedIds.length > 0 || !dirty}
            onClick={() => void handleSave()}
            className="sd-btn-primary rounded-lg px-4 py-2 text-sm disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save group assignment"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleResetAuto()}
            className="sd-btn-ghost rounded-lg px-4 py-2 text-sm disabled:opacity-50"
          >
            Reset to auto split
          </button>
        </div>
      )}

      {message && (
        <p className={`text-sm ${error ? "text-rose-200" : "text-emerald-300"}`}>
          {message}
        </p>
      )}
    </section>
  );
}
