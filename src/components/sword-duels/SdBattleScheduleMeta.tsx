import {
  formatAreaScheduleWhen,
  resolveBattleScheduleForSet,
  type SdAreaSchedulesConfig,
} from "@/lib/products/sword-duels/area-schedules";
import type { SdAreaSetType } from "@/lib/products/sword-duels/types";

interface Props {
  area: string;
  setType: SdAreaSetType;
  scheduleConfig?: SdAreaSchedulesConfig;
  compact?: boolean;
  align?: "left" | "right" | "center";
  className?: string;
}

export function SdBattleScheduleMeta({
  area,
  setType,
  scheduleConfig,
  compact = false,
  align = "left",
  className = "",
}: Props) {
  const { scheduledAt, hostTrainer } = resolveBattleScheduleForSet(
    scheduleConfig,
    area,
    setType
  );
  const when = scheduledAt ? formatAreaScheduleWhen(scheduledAt) : null;
  const host = hostTrainer?.trim();

  if (!when && !host) return null;

  const alignClass =
    align === "right"
      ? "text-right"
      : align === "center"
        ? "text-center"
        : "text-left";

  if (compact) {
    const parts = [
      when && when,
      host && `Host / Trainer: ${host}`,
    ].filter(Boolean);
    return (
      <p
        className={`text-[10px] leading-snug text-emerald-200/80 ${alignClass} ${className}`}
      >
        {parts.join(" · ")}
      </p>
    );
  }

  return (
    <div
      className={`space-y-0.5 text-xs leading-snug text-emerald-200/85 ${alignClass} ${className}`}
    >
      {when && (
        <p>
          <span className="font-medium uppercase tracking-wide text-sd-muted/70">
            When
          </span>
          <span className="text-sd-muted/45"> · </span>
          {when}
        </p>
      )}
      {host && (
        <p>
          <span className="font-medium uppercase tracking-wide text-sd-muted/70">
            Host / Trainer
          </span>
          <span className="text-sd-muted/45"> · </span>
          {host}
        </p>
      )}
    </div>
  );
}
