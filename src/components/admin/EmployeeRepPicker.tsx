"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EmploymentStatusBadge } from "@/components/admin/EmploymentStatusBadge";
import { RepAvatar } from "@/components/ui/RepAvatar";
import { resolveEmployeePhotoUrl } from "@/lib/employee-photo-storage";
import type { EmployeePickerRow } from "@/lib/employee-types";

interface Props {
  employees: EmployeePickerRow[];
  employeeId: string | null;
  employeeNo: string;
  name: string;
  position: string;
  photoPath: string | null;
  employmentStatus: import("@/lib/employee-types").EmploymentStatus | null;
  disabled?: boolean;
  onApply: (employee: EmployeePickerRow | null) => void;
  onEmployeeNoChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onPositionChange: (value: string) => void;
}

export function EmployeeRepPicker({
  employees,
  employeeId,
  employeeNo,
  name,
  position,
  photoPath,
  employmentStatus,
  disabled = false,
  onApply,
  onEmployeeNoChange,
  onNameChange,
  onPositionChange,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const byEmployeeNo = useMemo(() => {
    const map = new Map<string, EmployeePickerRow>();
    for (const row of employees) {
      map.set(row.employee_no.trim().toLowerCase(), row);
    }
    return map;
  }, [employees]);

  const linked = employeeId
    ? employees.find((e) => e.id === employeeId) ?? null
    : employeeNo.trim()
      ? byEmployeeNo.get(employeeNo.trim().toLowerCase()) ?? null
      : null;

  const directoryLinked = Boolean(linked);
  const photoUrl = resolveEmployeePhotoUrl(linked?.photo_path ?? photoPath);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return employees.slice(0, 12);
    return employees
      .filter(
        (e) =>
          e.full_name.toLowerCase().includes(q) ||
          e.employee_no.toLowerCase().includes(q) ||
          (e.position?.toLowerCase().includes(q) ?? false)
      )
      .slice(0, 12);
  }, [employees, query]);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function selectEmployee(employee: EmployeePickerRow) {
    onApply(employee);
    setQuery("");
    setOpen(false);
  }

  function clearSelection() {
    onApply(null);
    setQuery("");
    setOpen(false);
  }

  function handleEmployeeNoBlur() {
    const trimmed = employeeNo.trim();
    if (!trimmed) return;
    const match = byEmployeeNo.get(trimmed.toLowerCase());
    if (match) {
      onApply(match);
    }
  }

  const unknownEmployeeNo =
    employeeNo.trim().length > 0 && !linked && name.trim().length > 0;

  return (
    <div ref={rootRef} className="space-y-2">
      <div className="relative">
        <input
          type="search"
          value={open ? query : linked?.full_name ?? query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          disabled={disabled}
          placeholder="Search employee directory…"
          className="w-full rounded sd-input px-2 py-1.5 text-sm disabled:opacity-50"
        />
        {open && !disabled && (
          <ul
            role="listbox"
            className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-emerald-500/25 bg-sd-deep shadow-lg"
          >
            {matches.length === 0 ? (
              <li className="px-3 py-2 text-xs text-sd-muted">
                No employees match. Add them in HRIS → Employee directory first.
              </li>
            ) : (
              matches.map((employee) => (
                <li key={employee.id}>
                  <button
                    type="button"
                    role="option"
                    onClick={() => selectEmployee(employee)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-emerald-500/10"
                  >
                    <RepAvatar
                      name={employee.full_name}
                      photoUrl={resolveEmployeePhotoUrl(employee.photo_path)}
                      size="sm"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-white">
                        {employee.full_name}
                      </span>
                      <span className="block truncate text-[10px] text-sd-muted">
                        {employee.employee_no}
                        {employee.position ? ` · ${employee.position}` : ""}
                      </span>
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {(directoryLinked || name.trim() || employeeNo.trim()) && (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-500/15 bg-sd-deep/30 px-2 py-2">
          <RepAvatar name={name || linked?.full_name || "?"} photoUrl={photoUrl} size="md" />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-medium text-white">
                {directoryLinked ? "Linked from directory" : "Manual entry"}
              </p>
              <EmploymentStatusBadge
                status={linked?.employment_status ?? employmentStatus}
              />
            </div>
            {directoryLinked && (
              <p className="text-[10px] text-emerald-200/80">
                Photo and profile details will appear on leaderboards.
              </p>
            )}
            {unknownEmployeeNo && (
              <p className="text-[10px] text-amber-200/90">
                Employee no. not found in directory — pick from search or add in
                HRIS first.
              </p>
            )}
            {(directoryLinked || name.trim() || employeeNo.trim()) && (
              <button
                type="button"
                disabled={disabled}
                onClick={clearSelection}
                className="text-[10px] text-rose-300/80 hover:text-rose-200 disabled:opacity-50"
              >
                Clear rep
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block text-xs">
          <span className="text-sd-muted/70">Employee no.</span>
          <input
            value={employeeNo}
            onChange={(e) => onEmployeeNoChange(e.target.value)}
            onBlur={handleEmployeeNoBlur}
            disabled={disabled}
            placeholder="e.g. 102345"
            className="mt-1 w-full rounded sd-input px-2 py-1.5 text-sm disabled:opacity-50"
          />
        </label>
        <label className="block text-xs">
          <span className="text-sd-muted/70">Position</span>
          <input
            value={position}
            onChange={(e) => onPositionChange(e.target.value)}
            disabled={disabled || directoryLinked}
            placeholder="Job title"
            className="mt-1 w-full rounded sd-input px-2 py-1.5 text-sm disabled:opacity-50"
          />
        </label>
      </div>
      <label className="block text-xs">
        <span className="text-sd-muted/70">Name</span>
        <input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          disabled={disabled || directoryLinked}
          placeholder="Full name"
          className="mt-1 w-full rounded sd-input px-2 py-1.5 text-sm disabled:opacity-50"
        />
      </label>
    </div>
  );
}
