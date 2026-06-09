import type { SdPublicJourneyState } from "./public-journey";
import {
  isRegionalAverageFormat,
  type SdTournamentFormat,
} from "./tournament-format";

/** One-line path shown under CTAs (home hero, etc.). */
export function sdJourneyShortPath(
  format: SdTournamentFormat | string | null | undefined
): string {
  return isRegionalAverageFormat(format)
    ? "Area battles → regional rounds → national finals"
    : "Area battles → wild card → nationals knockout";
}

export function sdJourneyHeadline(journey: SdPublicJourneyState): string {
  const isV2 = isRegionalAverageFormat(journey.tournamentFormat);
  if (journey.knockoutComplete) return "National champion crowned";
  if (journey.nationalsPhase === "knockout") {
    return isV2 ? "National finals" : "Nationals knockout";
  }
  if (journey.nationalsPhase === "regionals") return "Regional rounds";
  if (journey.areasComplete) {
    return isV2 ? "Regional rounds" : "Wild card phase";
  }
  if (journey.totalAreas > 0) return "Area representative battles";
  return "Area tournaments";
}

export function sdJourneySubline(journey: SdPublicJourneyState): string {
  const isV2 = isRegionalAverageFormat(journey.tournamentFormat);
  if (journey.knockoutComplete) {
    return "The national finals bracket is complete — see the champion on the live map.";
  }
  if (journey.nationalsPhase === "knockout") {
    return isV2
      ? "Semifinal and final — results update as each match is published."
      : "Area vs area knockout — results update as each match is published.";
  }
  if (journey.nationalsPhase === "regionals") {
    return "Luzon, NCR, and VisMin — three scored rounds each; highest average wins the region.";
  }
  if (journey.areasComplete) {
    return isV2
      ? "All area reps are locked. Regional three-round averages come next."
      : "All area reps are locked. Wild card and knockout follow on the nationals map.";
  }
  if (journey.totalAreas > 0) {
    return `${journey.areasPublished} of ${journey.totalAreas} area representatives crowned.`;
  }
  return "Two group battles per area — Spot 1 and Spot 2 fight for one area rep.";
}

export function sdProgressLine(journey: SdPublicJourneyState): string {
  const isV2 = isRegionalAverageFormat(journey.tournamentFormat);
  if (journey.knockoutComplete) return "National champion crowned";
  if (journey.nationalsPhase === "knockout") {
    return isV2 ? "National finals underway" : "Nationals knockout underway";
  }
  if (journey.nationalsPhase === "regionals") {
    return journey.regionalsComplete
      ? "Regional champions locked — finals next"
      : "Regional rounds — 3-day average standings";
  }
  if (journey.areasComplete) {
    return isV2
      ? "Regional rounds — area reps locked"
      : "Wild card phase — area reps locked";
  }
  if (journey.totalAreas > 0) {
    return `${journey.areasPublished} of ${journey.totalAreas} area reps locked`;
  }
  return "Area group battles — 2 spots fight for 1 area representative";
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

  const isV2 = isRegionalAverageFormat(journey.tournamentFormat);

  if (journey.knockoutComplete) {
    return {
      title: "Sword Duels — National Champion",
      description:
        "The national finals are complete. See who claimed the Sword Duels crown.",
    };
  }

  if (journey.nationalsPhase === "knockout") {
    return {
      title: isV2
        ? "Sword Duels — National Finals"
        : "Sword Duels — Nationals Knockout",
      description: isV2
        ? "Live national finals — semifinal winner faces VisMin for the championship."
        : "Live area vs area knockout — follow every published match to the national champion.",
    };
  }

  if (journey.nationalsPhase === "regionals") {
    return {
      title: "Sword Duels — Regional Rounds",
      description:
        "Area reps battle in Luzon, NCR, and VisMin — highest three-round average wins each region.",
    };
  }

  if (journey.areasComplete) {
    return {
      title: "Sword Duels — Nationals",
      description: isV2
        ? "All area reps are locked. Follow regional standings and the road to national finals."
        : "All area reps are locked. Watch the wild card and knockout bracket unfold live.",
    };
  }

  return {
    title: "Sword Duels — Area tournaments",
    description: `${journey.areasPublished} of ${journey.totalAreas} area representatives crowned — follow live bracket updates.`,
  };
}
