import type { Metadata } from "next";
import { getPublicSiteUrl } from "@/lib/site-url";
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
  if (!journey || journey.totalAreas === 0) {
    return {
      title: "Sword Duels — Area tournaments",
      description:
        "Follow area group battles live as branches fight for one representative per area.",
    };
  }

  if (journey.knockoutComplete) {
    return {
      title: "Sword Duels — National Champion",
      description:
        "The nationals knockout is complete. See who claimed the Sword Duels crown.",
    };
  }

  if (journey.nationalsPhase === "knockout") {
    return {
      title: "Sword Duels — Nationals Knockout",
      description:
        "Live area vs area knockout — follow every published match to the national champion.",
    };
  }

  if (journey.areasComplete) {
    return {
      title: "Sword Duels — Nationals",
      description:
        "All area reps are locked. Watch the wild card and knockout bracket unfold live.",
    };
  }

  return {
    title: "Sword Duels — Area tournaments",
    description: `${journey.areasPublished} of ${journey.totalAreas} area representatives crowned — follow live bracket updates.`,
  };
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
