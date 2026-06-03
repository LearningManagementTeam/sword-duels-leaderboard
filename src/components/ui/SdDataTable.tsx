import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
}

export function SdDataTable({ children, className = "" }: Props) {
  return (
    <div className={`sd-table-wrap sd-inset ${className}`}>
      <table className="sd-table">{children}</table>
    </div>
  );
}
