export type SdTournamentFormat = "classic_v1" | "regional_average_v2";

export const SD_TOURNAMENT_FORMAT_LABELS: Record<SdTournamentFormat, string> = {
  classic_v1: "Version 1 — Wild card + 16-slot knockout",
  regional_average_v2:
    "Version 2 — Regional 3-round average, then national finals",
};

export const SD_TOURNAMENT_FORMAT_SUMMARY: Record<SdTournamentFormat, string> = {
  classic_v1:
    "Fifteen area representatives, wild card slot 16, then area-vs-area knockout to one champion.",
  regional_average_v2:
    "Fifteen area representatives, then Luzon / NCR / VisMin each battle three rounds (highest average wins the region). Three regional champions advance to finals — no wild card.",
};

export function normalizeSdTournamentFormat(
  value: string | null | undefined
): SdTournamentFormat {
  return value === "regional_average_v2" ? "regional_average_v2" : "classic_v1";
}

export function isRegionalAverageFormat(
  format: SdTournamentFormat | string | null | undefined
): boolean {
  return normalizeSdTournamentFormat(format) === "regional_average_v2";
}

/** Nationals TV rotator views for the active tournament format. */
export type SdNationalsTvView = "wildcard" | "regionals" | "knockout";

export function sdNationalsTvViews(
  format: SdTournamentFormat | string | null | undefined
): SdNationalsTvView[] {
  return isRegionalAverageFormat(format)
    ? ["regionals", "knockout"]
    : ["wildcard", "knockout"];
}

export function sdNationalsTvDefaultView(
  format: SdTournamentFormat | string | null | undefined
): SdNationalsTvView {
  return isRegionalAverageFormat(format) ? "regionals" : "wildcard";
}

export function parseNationalsTvView(
  raw: string | undefined,
  format: SdTournamentFormat | string | null | undefined
): SdNationalsTvView {
  const allowed = sdNationalsTvViews(format);
  if (raw && allowed.includes(raw as SdNationalsTvView)) {
    return raw as SdNationalsTvView;
  }
  return sdNationalsTvDefaultView(format);
}

export const SD_NATIONALS_TV_VIEW_LABELS: Record<SdNationalsTvView, string> = {
  wildcard: "Wild card",
  regionals: "Regional standings",
  knockout: "Knockout",
};
