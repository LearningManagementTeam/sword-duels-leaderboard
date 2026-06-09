import type { Metadata } from "next";
import { getPublicSiteUrl } from "@/lib/site-url";
import { journeyShareCopy as buildJourneyShareCopy } from "./journey-copy";
import type { SdPublicJourneyState } from "./public-journey";

export function sdShareUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getPublicSiteUrl()}${normalized}`;
}

export function buildSdPageMetadata(opts: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const url = sdShareUrl(opts.path);

  return {
    title: opts.title,
    description: opts.description,
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      type: "website",
      siteName: "Sword Duels Leaderboard",
    },
    twitter: {
      card: "summary",
      title: opts.title,
      description: opts.description,
    },
  };
}

export function journeyShareCopy(
  journey: SdPublicJourneyState | null
): { title: string; description: string } {
  return buildJourneyShareCopy(journey);
}

export function areaShareCopy(
  area: string,
  statusLabel: string,
  championName: string | null
): { title: string; description: string } {
  if (championName) {
    return {
      title: `${area} — Sword Duels Champion`,
      description: `${championName} is the ${area} representative. Follow the live tournament map and standings.`,
    };
  }

  return {
    title: `${area} — Sword Duels`,
    description: `Live ${area} bracket — ${statusLabel.toLowerCase()}. Updates when the committee publishes each set.`,
  };
}
