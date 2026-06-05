import type { Region, SeasonSlug } from "./scoring-config";
import type { BranchRepresentativeFields } from "./representative-fields";

export type BranchStatus =
  | "active"
  | "advanced"
  | "tie_breaker"
  | "eliminated"
  | "regional_finalist"
  | "champion";

export type RoundStatus = "draft" | "published";

export interface Branch extends BranchRepresentativeFields {
  id: string;
  branch_code: string;
  branch_name: string;
  area: string;
  region: Region;
}

export interface Season {
  id: string;
  slug: SeasonSlug;
  name: string;
  advancement_count: number | null;
}

export interface Round {
  id: string;
  season_id: string;
  round_number: number;
  name: string;
  status: RoundStatus;
  published_at: string | null;
}

export interface RoundResult {
  id: string;
  round_id: string;
  branch_id: string;
  points: number;
  wins: number;
  losses: number;
}

export interface StandingRow extends BranchRepresentativeFields {
  branch_id: string;
  branch_code: string;
  branch_name: string;
  area: string;
  region: Region;
  rank: number;
  total_points: number;
  round1_points: number | null;
  round2_points: number | null;
  round3_points: number | null;
  total_wins: number;
  status: BranchStatus;
  /** Set when tied at the cut line and must play a tie-breaker for remaining slots. */
  tie_breaker_in_round?: number | null;
  eliminated_in_round?: number | null;
  last_active_round?: number | null;
  advancing_to_round?: number | null;
  latest_published_round?: number;
  manually_advanced_after_round?: number | null;
  /** R3 qualification sequence (1 = first to 5 correct). */
  round3_finish_order?: number | null;
  /** Layout preview row — not a real branch. */
  is_placeholder?: boolean;
}

export interface AuditEntry {
  id: string;
  admin_email: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}
