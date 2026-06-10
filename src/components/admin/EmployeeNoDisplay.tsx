import {
  formatEmployeeNoDisplay,
  isProvisionalEmployeeNo,
} from "@/lib/employee-numbers";

interface Props {
  employeeNo: string;
  className?: string;
  /** Show monospace styling for real employee numbers. */
  mono?: boolean;
}

export function EmployeeNoDisplay({ employeeNo, className = "", mono = false }: Props) {
  const provisional = isProvisionalEmployeeNo(employeeNo);
  const label = formatEmployeeNoDisplay(employeeNo);

  if (provisional) {
    return (
      <span
        className={`inline-flex rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-100 ring-1 ring-amber-400/25 ${className}`}
        title={`Official employee number not set yet (${employeeNo})`}
      >
        {label}
      </span>
    );
  }

  return (
    <span className={`${mono ? "font-mono" : ""} ${className}`.trim()}>
      {label}
    </span>
  );
}
