interface Props {
  name: string | null | undefined;
  /** Compact single-line for area hub cards. */
  compact?: boolean;
}

export function SdAreaHostTrainerLine({ name, compact = false }: Props) {
  const label = name?.trim();
  if (!label) return null;

  if (compact) {
    return (
      <p className="mt-2 text-xs text-emerald-200/85">
        <span className="font-medium uppercase tracking-wide text-sd-muted/75">
          Host / Trainer
        </span>
        <span className="text-sd-muted/50"> · </span>
        {label}
      </p>
    );
  }

  return (
    <p className="mt-3 inline-flex flex-wrap items-center gap-2 rounded-lg bg-emerald-950/40 px-3 py-2 text-sm ring-1 ring-emerald-500/15">
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-300/85">
        Host / Trainer
      </span>
      <span className="font-medium text-white">{label}</span>
    </p>
  );
}
