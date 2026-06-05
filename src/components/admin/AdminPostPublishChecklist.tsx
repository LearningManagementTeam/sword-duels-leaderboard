import Link from "next/link";
import type { SeasonSlug } from "@/lib/scoring-config";
import { seasonPhaseLabel } from "@/lib/season-labels";

interface Props {
  seasonSlug: SeasonSlug;
  roundId: string;
  supportsManualAdvances: boolean;
  liveBoardHref: string;
}

function tvHref(seasonSlug: SeasonSlug): string {
  if (seasonSlug === "august_finals") return "/tv?phase=august";
  if (seasonSlug === "july_region") return "/tv?phase=july&region=luzon";
  return "/tv?phase=june&region=luzon";
}

type ChecklistItem = {
  label: string;
  href: string;
  external?: boolean;
  hint?: string;
};

export function AdminPostPublishChecklist({
  seasonSlug,
  roundId,
  supportsManualAdvances,
  liveBoardHref,
}: Props) {
  const phaseLabel = seasonPhaseLabel(seasonSlug);

  const items: ChecklistItem[] = [
    {
      label: `View live ${phaseLabel} board`,
      href: liveBoardHref,
      external: true,
      hint: "Confirm ranks and cut lines on the public site",
    },
    {
      label: "Update competition map on home",
      href: "/admin/national-competitions/competition",
      hint: "Move the journey milestone if this was a major beat",
    },
  ];

  if (supportsManualAdvances) {
    items.push({
      label: "Review advancement picks",
      href: `/admin/national-competitions/rounds/${roundId}/advances`,
      hint: "Add committee picks if many branches tied at the cut",
    });
  }

  items.push({
    label: "Open TV mode for events",
    href: tvHref(seasonSlug),
    external: true,
    hint: "Fullscreen board for venue screens",
  });

  return (
    <div className="mt-2 rounded-lg border border-emerald-500/25 bg-sd-deep/50 px-3 py-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-sd-glow/90">
        Next up
      </p>
      <ul className="mt-2 space-y-2.5">
        {items.map((item) => (
          <li key={item.href + item.label} className="text-sm">
            <Link
              href={item.href}
              className="sd-link font-medium"
              {...(item.external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              {item.label} →
            </Link>
            {item.hint && (
              <p className="mt-0.5 text-xs text-sd-muted/70">{item.hint}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
