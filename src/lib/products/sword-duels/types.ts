import type { BranchRepresentativeFields } from "@/lib/representative-fields";
import type { SdGroupSortMode } from "./area-groups";

export type SdSetType = "group_a" | "group_b" | "area_final";
export type SdSetStatus = "draft" | "published";
export type SdScoringMode = "high_score" | "survival";

export interface SdEvent {
  id: string;
  slug: string;
  name: string;
  group_sort_mode: SdGroupSortMode;
}

export interface SdAreaGroupBranch extends BranchRepresentativeFields {
  branch_id: string;
  branch_code: string;
  branch_name: string;
  area: string;
  region: string;
  group_label: "a" | "b";
  sort_order: number;
}

export interface SdSet {
  id: string;
  event_id: string;
  area: string;
  set_type: SdSetType;
  scoring_mode: SdScoringMode;
  status: SdSetStatus;
  winner_branch_id: string | null;
  published_at: string | null;
}

export interface SdSetScore {
  branch_id: string;
  points: number;
  hearts_remaining: number | null;
  is_eliminated: boolean;
  active_representative?: 1 | 2;
}

export interface SdAreaBracket {
  area: string;
  region: string;
  groupA: SdAreaGroupBranch[];
  groupB: SdAreaGroupBranch[];
  branchCount: number;
}

export const SD_SET_LABELS: Record<SdSetType, string> = {
  group_a: "Group A battle",
  group_b: "Group B battle",
  area_final: "Area final",
};

export const SD_SET_ORDER: SdSetType[] = ["group_a", "group_b", "area_final"];
