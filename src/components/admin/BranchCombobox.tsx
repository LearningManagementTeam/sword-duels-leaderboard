"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { HrisBranchOption } from "@/lib/employee-types";

interface Props {
  branches: HrisBranchOption[];
  value: string;
  onChange: (branchId: string) => void;
  disabled?: boolean;
  placeholder?: string;
  emptyLabel?: string;
  className?: string;
}

function branchLabel(b: HrisBranchOption): string {
  return `${b.branch_code} · ${b.branch_name}${b.area ? ` (${b.area})` : ""}`;
}

export function BranchCombobox({
  branches,
  value,
  onChange,
  disabled = false,
  placeholder = "Search branches…",
  emptyLabel = "None / Unassigned",
  className = "",
}: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = branches.find((b) => b.id === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return branches;
    return branches.filter(
      (b) =>
        b.branch_code.toLowerCase().includes(q) ||
        b.branch_name.toLowerCase().includes(q) ||
        (b.area?.toLowerCase().includes(q) ?? false)
    );
  }, [branches, query]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  function openList() {
    if (disabled) return;
    setOpen(true);
    setQuery("");
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function pick(branchId: string) {
    onChange(branchId);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        className="flex w-full items-center justify-between gap-2 rounded-lg sd-input px-3 py-2.5 text-left text-sm disabled:opacity-50"
      >
        <span className={selected ? "text-white" : "text-sd-muted"}>
          {selected ? branchLabel(selected) : emptyLabel}
        </span>
        <span className="shrink-0 text-sd-muted/60" aria-hidden>
          {open ? "▴" : "▾"}
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-emerald-500/20 bg-sd-deep/98 shadow-xl shadow-black/40 backdrop-blur-md">
          <div className="border-b border-emerald-500/10 p-2">
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full rounded-lg sd-input px-3 py-2 text-sm"
              aria-controls={listId}
            />
          </div>
          <ul
            id={listId}
            role="listbox"
            className="max-h-56 overflow-y-auto py-1"
          >
            <li>
              <button
                type="button"
                role="option"
                aria-selected={!value}
                onClick={() => pick("")}
                className={`block w-full px-3 py-2 text-left text-sm hover:bg-emerald-500/10 ${
                  !value ? "bg-emerald-500/15 text-emerald-100" : "text-sd-muted"
                }`}
              >
                {emptyLabel}
              </button>
            </li>
            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-sm text-sd-muted">No branches match.</li>
            ) : (
              filtered.map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={b.id === value}
                    onClick={() => pick(b.id)}
                    className={`block w-full px-3 py-2 text-left text-sm hover:bg-emerald-500/10 ${
                      b.id === value
                        ? "bg-emerald-500/15 text-emerald-100"
                        : "text-white"
                    }`}
                  >
                    {branchLabel(b)}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
