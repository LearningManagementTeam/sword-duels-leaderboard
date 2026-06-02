import type { Region, SeasonSlug } from "./scoring-config";

export type BranchStatus =
  | "active"
  | "advanced"
  | "eliminated"
  | "regional_finalist"
  | "champion";

export type RoundStatus = "draft" | "published";

export interface Branch {
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

export interface StandingRow {
  branch_id: string;
  branch_code: string;
  branch_name: string;
  area: string;
  region: Region;
  rank: number;
  total_points: number;
  round1_points: number;
  round2_points: number;
  round3_points: number;
  total_wins: number;
  status: BranchStatus;
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
