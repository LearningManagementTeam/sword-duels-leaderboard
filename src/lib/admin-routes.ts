/** Admin hub landing — product picker. */
export const ADMIN_HUB = "/admin";

/** National Competitions — June → July → The Nationals. */
export const NATIONAL_COMPETITIONS_ADMIN = "/admin/national-competitions";

/** Sword Duels — area group tournaments for branch representatives. */
export const SWORD_DUELS_ADMIN = "/admin/sword-duels";

export const ADMIN_PRODUCTS = {
  quizDay: `${ADMIN_HUB}/quiz-day`,
  swordDuels: SWORD_DUELS_ADMIN,
  nationalCompetitions: NATIONAL_COMPETITIONS_ADMIN,
  generalQuiz: `${ADMIN_HUB}/general-quiz`,
} as const;

export function nationalCompetitionsPath(...segments: string[]): string {
  const suffix = segments.filter(Boolean).join("/");
  return suffix
    ? `${NATIONAL_COMPETITIONS_ADMIN}/${suffix}`
    : NATIONAL_COMPETITIONS_ADMIN;
}

export function swordDuelsPath(...segments: string[]): string {
  const suffix = segments.filter(Boolean).join("/");
  return suffix ? `${SWORD_DUELS_ADMIN}/${suffix}` : SWORD_DUELS_ADMIN;
}

/** Public Sword Duels routes */
export const SWORD_DUELS_PUBLIC = "/sword-duels";

/** Legacy panel paths → redirect targets in next.config. */
export const LEGACY_ADMIN_PANEL_PATHS = [
  "rounds",
  "advancement",
  "branches",
  "representatives",
  "competition",
  "mechanics",
  "branding",
  "preview",
  "audit",
  "export",
  "system",
] as const;
