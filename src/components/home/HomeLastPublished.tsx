import {
  getLastPublishedAt,
  getSeasonBySlug,
} from "@/lib/data/queries";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import type { SeasonSlug } from "@/lib/scoring-config";

const PHASES: { slug: SeasonSlug; label: string }[] = [
  { slug: "june_area", label: "June" },
  { slug: "july_region", label: "July" },
  { slug: "august_finals", label: "August" },
];

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export async function HomeLastPublished() {
  if (!isSupabaseConfigured()) return null;

  const lines = await Promise.all(
    PHASES.map(async ({ slug, label }) => {
      const season = await getSeasonBySlug(slug);
      if (!season) {
        return { label, text: "Not published yet" };
      }
      const at = await getLastPublishedAt(season.id);
      return {
        label,
        text: at ? `Last published ${formatWhen(at)}` : "Not published yet",
      };
    })
  );

  return (
    <section className="sd-glass rounded-xl px-4 py-3 text-sm text-sd-muted">
      <p className="text-xs font-semibold uppercase tracking-wider text-sd-muted/70 mb-2">
        Last published standings
      </p>
      <ul className="space-y-1">
        {lines.map((line) => (
          <li key={line.label}>
            <span className="font-medium text-white">{line.label}:</span>{" "}
            {line.text}
          </li>
        ))}
      </ul>
    </section>
  );
}
