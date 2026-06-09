import type { BranchRepresentativeFields } from "@/lib/representative-fields";
import type { SdGroupSortMode } from "./area-groups";
import type { SdTournamentFormat } from "./tournament-format";
import type { SdRegionalSetType } from "./regional-rounds";

export type SdAreaSetType = "group_a" | "group_b" | "area_final";
export type SdSetType = SdAreaSetType | SdRegionalSetType;
export type SdSetStatus = "draft" | "published";
export type SdScoringMode = "high_score" | "survival";

export interface SdEvent {
  id: string;
  slug: string;
  name: string;
  group_sort_mode: SdGroupSortMode;
  tournament_format: SdTournamentFormat;
}

export interface SdAreaGroupBranch extends BranchRepresentativeFields {
  representative_1_employment_status?: import("@/lib/employees").EmploymentStatus | null;
  representative_2_employment_status?: import("@/lib/employees").EmploymentStatus | null;
  representative_1_photo_path?: string | null;
  representative_2_photo_path?: string | null;
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

/** Area bracket set row — excludes regional round types. */
export type SdAreaSet = Omit<SdSet, "set_type"> & { set_type: SdAreaSetType };

export interface SdSetScore {
  branch_id: string;
  points: number;
  hearts_remaining: number | null;
  is_eliminated: boolean;
  active_representative?: 1 | 2;
  active_employee_id?: string | null;
  active_employee_name?: string | null;
  active_employee_no?: string | null;
  active_employee_position?: string | null;
  active_employee_status?: import("@/lib/employees").EmploymentStatus | null;
  active_employee_photo_path?: string | null;
}

export interface SdAreaBracket {
  area: string;
  region: string;
  groupA: SdAreaGroupBranch[];
  groupB: SdAreaGroupBranch[];
  branchCount: number;
}

export const SD_AREA_SET_LABELS: Record<SdAreaSetType, string> = {
  group_a: "Group A battle",
  group_b: "Group B battle",
  area_final: "Area final",
};

export const SD_SET_ORDER: SdAreaSetType[] = ["group_a", "group_b", "area_final"];

/** @deprecated use SD_AREA_SET_LABELS — area sets only */
export const SD_SET_LABELS = SD_AREA_SET_LABELS;

export type SdWildcardStatus =
  | "pending"
  | "auto_resolved"
  | "tiebreak_draft"
  | "tiebreak_published";

export interface SdWildcardRound {
  id: string;
  event_id: string;
  status: SdWildcardStatus;
  tied_score: number | null;
  winner_branch_id: string | null;
  published_at: string | null;
}

export interface SdWildcardScore {
  branch_id: string;
  area: string;
  area_final_score: number;
  points: number;
}

export type SdKnockoutRound = "r16" | "qf" | "sf" | "final";
export type SdKnockoutBracketStatus = "pending" | "active" | "complete";

export interface SdKnockoutBracket {
  id: string;
  event_id: string;
  status: SdKnockoutBracketStatus;
  champion_branch_id: string | null;
}

export interface SdKnockoutMatch {
  id: string;
  event_id: string;
  round: SdKnockoutRound;
  match_index: number;
  entrant_a_branch_id: string | null;
  entrant_b_branch_id: string | null;
  winner_branch_id: string | null;
  status: SdSetStatus;
  published_at: string | null;
}

export interface SdKnockoutMatchScore {
  branch_id: string;
  points: number;
}
