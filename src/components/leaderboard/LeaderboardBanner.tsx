interface Props {
  subtitle?: string;
  tvMode?: boolean;
}

export function LeaderboardBanner({ subtitle, tvMode }: Props) {
  return (
    <div
      className={`sd-neon-panel relative mx-auto w-full overflow-hidden px-4 py-3 sm:px-6 sm:py-4 ${
        tvMode ? "max-w-4xl" : "max-w-3xl"
      }`}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-fuchsia-500/10"
        aria-hidden
      />
      <div className="relative text-center sm:text-left">
        <h2
          className={`font-bold tracking-[0.2em] text-sd-glow ${
            tvMode ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl"
          }`}
        >
          LEADERBOARD
        </h2>
        {subtitle && (
          <p
            className={`mt-1 text-sd-muted ${tvMode ? "text-base" : "text-sm"}`}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
