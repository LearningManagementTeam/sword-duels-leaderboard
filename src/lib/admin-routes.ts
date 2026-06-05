/** Admin hub landing — product picker. */
export const ADMIN_HUB = "/admin";

/** Sword Duels June → July → Nationals operations. */
export const NATIONAL_COMPETITIONS_ADMIN = "/admin/national-competitions";

export const ADMIN_PRODUCTS = {
  quizDay: `${ADMIN_HUB}/quiz-day`,
  swordDuels: `${ADMIN_HUB}/sword-duels`,
  nationalCompetitions: NATIONAL_COMPETITIONS_ADMIN,
  generalQuiz: `${ADMIN_HUB}/general-quiz`,
} as const;

export function nationalCompetitionsPath(...segments: string[]): string {
  const suffix = segments.filter(Boolean).join("/");
  return suffix
    ? `${NATIONAL_COMPETITIONS_ADMIN}/${suffix}`
    : NATIONAL_COMPETITIONS_ADMIN;
}

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
