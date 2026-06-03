export interface MechanicsCustomSection {
  id: string;
  title: string;
  body: string;
}

export interface MechanicsPublicBody {
  intro: string;
  announcements: string;
  custom_sections: MechanicsCustomSection[];
}

export const MECHANICS_CONTENT_SLUG = "mechanics_public";

export const DEFAULT_MECHANICS_BODY: MechanicsPublicBody = {
  intro:
    "Welcome to Sword Duels 2026. Standings update after each published round. Rules below are kept in sync with the competition system.",
  announcements: "",
  custom_sections: [],
};

export function parseMechanicsBody(raw: unknown): MechanicsPublicBody {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_MECHANICS_BODY };
  const o = raw as Record<string, unknown>;
  const sections = Array.isArray(o.custom_sections)
    ? o.custom_sections
        .filter(
          (s): s is MechanicsCustomSection =>
            typeof s === "object" &&
            s !== null &&
            typeof (s as MechanicsCustomSection).id === "string" &&
            typeof (s as MechanicsCustomSection).title === "string" &&
            typeof (s as MechanicsCustomSection).body === "string"
        )
        .map((s) => ({
          id: s.id,
          title: s.title,
          body: s.body,
        }))
    : [];
  return {
    intro: typeof o.intro === "string" ? o.intro : DEFAULT_MECHANICS_BODY.intro,
    announcements:
      typeof o.announcements === "string" ? o.announcements : "",
    custom_sections: sections,
  };
}
