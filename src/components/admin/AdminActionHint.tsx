import type { ReactNode } from "react";

interface Props {
  hint: string;
  className?: string;
}

/** Visible one-line explainer under an admin action button. */
export function AdminActionHint({ hint, className = "" }: Props) {
  return (
    <p className={`text-xs leading-relaxed text-sd-muted/75 ${className}`}>
      {hint}
    </p>
  );
}

interface RowProps {
  hint: string;
  children: ReactNode;
  className?: string;
  hintClassName?: string;
}

/** Button (or link) plus operator hint stacked below. */
export function AdminActionRow({
  hint,
  children,
  className = "",
  hintClassName = "",
}: RowProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {children}
      <AdminActionHint hint={hint} className={hintClassName} />
    </div>
  );
}
