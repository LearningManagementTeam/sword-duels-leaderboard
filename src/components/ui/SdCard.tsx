import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  inset?: boolean;
}

export function SdCard({ children, className = "", inset }: Props) {
  return (
    <div
      className={
        inset
          ? `sd-inset rounded-xl p-4 ${className}`
          : `sd-neon-panel p-4 sm:p-5 ${className}`
      }
    >
      {children}
    </div>
  );
}
