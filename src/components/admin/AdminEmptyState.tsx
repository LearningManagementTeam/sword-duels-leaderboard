import Link from "next/link";
import type { ReactNode } from "react";

interface Props {
  title: string;
  detail: string;
  action?: ReactNode;
}

/** Centered anticipation-style empty state for admin lists and forms. */
export function AdminEmptyState({ title, detail, action }: Props) {
  return (
    <div className="sd-neon-panel px-4 py-8 text-center">
      <p className="font-medium text-sd-glow">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-sd-muted">{detail}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
