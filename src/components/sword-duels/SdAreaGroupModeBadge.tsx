interface Props {
  isManual: boolean;
  className?: string;
}

export function SdAreaGroupModeBadge({ isManual, className = "" }: Props) {
  if (isManual) {
    return (
      <span
        className={`shrink-0 rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-100 ring-1 ring-violet-400/35 ${className}`}
        title="Group A/B assigned by committee on the area page"
      >
        Manual
      </span>
    );
  }

  return (
    <span
      className={`shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-200/80 ring-1 ring-emerald-400/20 ${className}`}
      title="Group A/B from dashboard sync sort mode"
    >
      Auto
    </span>
  );
}
