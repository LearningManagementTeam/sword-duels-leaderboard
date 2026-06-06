import {
  areaScheduleRows,
  formatAreaScheduleWhen,
  type SdAreaSchedulesConfig,
  type SdAreaSetPublishState,
} from "@/lib/products/sword-duels/area-schedules";

interface Props {
  area: string;
  config: SdAreaSchedulesConfig;
  publishState: SdAreaSetPublishState;
}

export function SdAreaSchedulePanel({ area, config, publishState }: Props) {
  const rows = areaScheduleRows(area, config, publishState);
  const hasAny = rows.some((r) => r.scheduledAt || r.status === "published");

  if (!hasAny) return null;

  return (
    <section className="sd-neon-panel p-5">
      <h2 className="text-lg font-semibold text-white">Schedule</h2>
      <p className="mt-1 text-sm text-sd-muted">
        Planned battle times for {area}. Live results appear when each set is
        published.
      </p>
      <ul className="mt-4 divide-y divide-emerald-500/10">
        {rows.map((row) => (
          <li
            key={row.setType}
            className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
          >
            <div>
              <p className="font-medium text-white">{row.title}</p>
              {row.scheduledAt && (
                <p className="mt-0.5 text-xs text-sd-muted">
                  {formatAreaScheduleWhen(row.scheduledAt)}
                </p>
              )}
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset ${
                row.status === "published"
                  ? "bg-lime-400/15 text-lime-100 ring-lime-400/35"
                  : row.scheduledAt
                    ? "bg-cyan-400/15 text-cyan-100 ring-cyan-400/35"
                    : "bg-sd-deep/50 text-sd-muted/70 ring-emerald-800/35"
              }`}
            >
              {row.status === "published"
                ? "Published"
                : row.scheduledAt
                  ? row.isPast
                    ? "Awaiting results"
                    : "Scheduled"
                  : "TBD"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
