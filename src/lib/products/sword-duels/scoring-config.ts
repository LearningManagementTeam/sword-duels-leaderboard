/**
 * Sword Duels area tournament — rules encoded in the app.
 * @see docs/sword-duels-mechanics.md
 */

import type { SdGroupSortMode } from "./area-groups";

export const SD_GROUP_SPLIT_RULES: Record<SdGroupSortMode, string> = {
  branch_code:
    "Branches in the same area are sorted by branch code. The first half forms Group A; the second half forms Group B.",
  branch_name:
    "Branches in the same area are sorted alphabetically by branch name (A–Z). The first half forms Group A; the second half forms Group B.",
};

/** @deprecated use SD_GROUP_SPLIT_RULES with sort mode */
export const SD_GROUP_SPLIT_RULE = SD_GROUP_SPLIT_RULES.branch_code;

export const SD_SPOTS_PER_AREA = 2;
export const SD_AREA_REP_COUNT = 1;

export const SD_SCORING_MODE_LABELS = {
  high_score: {
    label: "High score wins",
    short: "Highest points",
    description:
      "All branches in the group compete in one battle. The branch with the highest score wins the group spot.",
  },
  survival: {
    label: "Best 2 survivors win",
    short: "Top 2 survivors",
    description:
      "Track hearts and eliminations. The last two standing are the survivors; the spot goes to the higher scorer between those two.",
  },
} as const;

export const SD_SET_FLOW = [
  {
    key: "group_a" as const,
    title: "Set 1 — Group A battle",
    spotLabel: "Spot 1",
    description:
      "Branches 1 through N in the first half of the area roster fight for Spot 1.",
  },
  {
    key: "group_b" as const,
    title: "Set 2 — Group B battle",
    spotLabel: "Spot 2",
    description:
      "The remaining branches in the area fight for Spot 2.",
  },
  {
    key: "area_final" as const,
    title: "Area final",
    spotLabel: "Area representative",
    description:
      "Spot 1 and Spot 2 face off. One branch becomes the area representative.",
  },
];

export const SD_MECHANICS_SUMMARY = [
  "Each area splits its branches into two groups (A and B) based on uploaded branch data.",
  "Group A and Group B each run one battle set. The winner of each set earns one of two spots.",
  "Quiz-style sets use highest score. Survival sets use the best two survivors, then highest score breaks ties.",
  "The two spot holders fight in the area final for the single area representative slot.",
  "Enter two representatives per branch before battles. Names appear on the public tournament map.",
];
