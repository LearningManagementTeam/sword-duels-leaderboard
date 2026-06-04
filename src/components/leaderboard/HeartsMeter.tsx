interface Props {
  hearts: number;
  maxHearts?: number;
  tvMode?: boolean;
}

export function HeartsMeter({ hearts, maxHearts = 3, tvMode = false }: Props) {
  const size = tvMode ? "text-base" : "text-sm";
  return (
    <span
      className={`inline-flex items-center gap-0.5 tabular-nums ${size}`}
      aria-label={`${hearts} of ${maxHearts} hearts remaining`}
    >
      {Array.from({ length: maxHearts }, (_, i) => (
        <span
          key={i}
          className={
            i < hearts
              ? "text-red-400 drop-shadow-[0_0_6px_rgb(248_113_113/0.5)]"
              : "text-sd-muted/25"
          }
          aria-hidden
        >
          ♥
        </span>
      ))}
    </span>
  );
}
