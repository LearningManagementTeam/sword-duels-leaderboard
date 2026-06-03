"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function BranchHighlightBlock({
  branchId,
  branchCode,
  highlightCode,
  children,
  className = "",
}: {
  branchId: string;
  branchCode: string;
  highlightCode: string | null;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isHighlighted =
    highlightCode &&
    branchCode.toLowerCase() === highlightCode.toLowerCase();

  useEffect(() => {
    if (isHighlighted && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isHighlighted]);

  return (
    <div
      ref={ref}
      id={isHighlighted ? `branch-${branchId}` : undefined}
      className={`${className} ${
        isHighlighted
          ? "animate-branch-pulse rounded-2xl ring-2 ring-sd-glow/80"
          : ""
      }`}
    >
      {children}
    </div>
  );
}

export function BranchHighlightRow({
  branchId,
  branchCode,
  highlightCode,
  children,
  rowClassName,
}: {
  branchId: string;
  branchCode: string;
  highlightCode: string | null;
  children: React.ReactNode;
  rowClassName: string;
}) {
  const ref = useRef<HTMLTableRowElement>(null);
  const isHighlighted =
    highlightCode &&
    branchCode.toLowerCase() === highlightCode.toLowerCase();

  useEffect(() => {
    if (isHighlighted && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isHighlighted]);

  return (
    <tr
      ref={ref}
      id={isHighlighted ? `branch-${branchId}` : undefined}
      className={`${rowClassName} ${
        isHighlighted ? "animate-branch-pulse ring-2 ring-sd-glow/80 ring-inset" : ""
      }`}
    >
      {children}
    </tr>
  );
}

export function BranchHighlightControls() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const highlight = searchParams.get("highlight");

  if (!highlight) return null;

  function clearHighlight() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("highlight");
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-sd-glow/40 bg-emerald-500/10 px-3 py-2 text-sm">
      <span className="text-sd-muted">
        Highlighting branch: <strong>{highlight}</strong>
      </span>
      <button
        type="button"
        onClick={clearHighlight}
        className="text-sd-glow underline hover:text-emerald-200"
      >
        Clear
      </button>
    </div>
  );
}
