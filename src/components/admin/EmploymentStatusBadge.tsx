import type { EmploymentStatus } from "@/lib/employee-types";
import { employmentStatusLabel } from "@/lib/employee-types";

export function EmploymentStatusBadge({
  status,
}: {
  status: EmploymentStatus | null | undefined;
}) {
  if (!status || status === "active") return null;

  const styles =
    status === "resigned"
      ? "bg-rose-500/15 text-rose-100 ring-rose-400/35"
      : "bg-amber-500/15 text-amber-100 ring-amber-400/35";

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset ${styles}`}
    >
      {employmentStatusLabel(status)}
    </span>
  );
}
