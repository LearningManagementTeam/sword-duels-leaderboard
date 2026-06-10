import {
  ADMIN_HUB,
  HRIS_ADMIN,
  REVALIDA_HUB,
  hrisPath,
  nationalCompetitionsPath,
} from "@/lib/admin-routes";

/** Operator-facing hints for admin buttons and nav — plain language, when-to-use. */

export const HRIS_NAV_HINTS: Record<string, string> = {
  [HRIS_ADMIN]:
    "HRIS home: import branches, load employees, then assign Sword Duels rep slots from profiles.",
  [hrisPath("branches")]:
    "Master branch list: add or edit branches, deactivate closed ones, or bulk-import CSV.",
  [hrisPath("employees")]:
    "Employee directory: search profiles, upload photos, CSV or screenshot import, and assign Rep 1 / Rep 2 per branch from each profile.",
};

export const ADMIN_NAV_HINTS: Record<string, string> = {
  [ADMIN_HUB]:
    "Choose HRIS (org data) or Revalida System (competitions and events).",
  [REVALIDA_HUB]:
    "Pick a competition: Sword Duels, National Competitions, Quiz Day, or General Quiz.",
  [nationalCompetitionsPath()]:
    "Start here each week: see phase status (June / July / Nationals), shortcuts to score or lock, and what published last.",
  [nationalCompetitionsPath("rounds")]:
    "Enter branch scores for the current round. Save draft while checking; Save & publish when fans should see new ranks.",
  [nationalCompetitionsPath("advancement")]:
    "End of June or July: after Round 3 is live everywhere, lock the phase to seed survivors into the next stage (24 → July, 3 → Nationals).",
  [nationalCompetitionsPath("representatives")]:
    "Branch-by-branch rep review: assign Rep 1 and Rep 2, or use HRIS → Employee directory → open a profile to assign from the employee side.",
  [nationalCompetitionsPath("competition")]:
    "Update the home page journey map (“you are here”) after major beats — not needed for every score change.",
  [nationalCompetitionsPath("mechanics")]:
    "Edit the public How to win intro and announcements. Rule tables update automatically from scoring rules.",
  [nationalCompetitionsPath("branding")]:
    "Hero logo, home photo carousel, and partner logo strip above Live ranks.",
  [nationalCompetitionsPath("preview")]:
    "Open sample leaderboards with demo data — safe to show stakeholders before go-live.",
  [nationalCompetitionsPath("audit")]:
    "See who changed what (imports, publishes, locks). Useful for troubleshooting.",
  [nationalCompetitionsPath("export")]:
    "Download published standings CSV for reports — same data fans see, not draft scores.",
};

export const ADMIN_WORKFLOW_HINTS = {
  openRounds:
    "Weekly core task: pick the round, enter points for every eligible branch, then publish when ready.",
  continueScoring:
    "Jump straight to the earliest round that is still draft — usually the one you should score next.",
  tieBreakerPicks:
    "After publish only: if many branches tied at the cut (e.g. 35 scored 10/10 but only 32 advance), add committee picks here.",
  competitionMap:
    "After a big beat (new round live, phase change, finals week): set the home map milestone so fans know where the event is.",
  phaseLock:
    "Once June or July Round 3 is published in all regions: lock to send 24 survivors to July or 3 champions to Nationals.",
  employeeDirectory:
    "HR profiles, photos, home branch, and Sword Duels rep assignment (Rep 1 / Rep 2) — open a row to edit. Bulk load via roster screenshots or Excel paste in the profile drawer.",
  representatives:
    "Same rep slots as the employee directory — use this table to scan all branches at once, or assign from HRIS profiles when you start from a person.",
  branches:
    "Master list of ~135 branches: codes, areas, regions, and active/inactive status.",
  hrisSetup:
    "HRIS owns branches and employee profiles, including Sword Duels rep slots from the employee directory. Use Revalida to score and publish events.",
};

export const ADMIN_ROUND_HINTS = {
  saveDraft:
    "Keeps scores in admin only — public site stays unchanged. Use while double-checking or between sessions.",
  publish:
    "Writes live standings, applies regional cut lines, and refreshes the public site. Fans see results immediately.",
  republish:
    "This round is already live. Saving or publishing again immediately updates what fans see — double-check every score first.",
  markTopSurvivors:
    "Sets exactly the required survivor count for this region. Hearts rounds keep the highest heart counts; survival rounds pick alphabetically.",
  pasteScores:
    "Paste branch_code and score columns from Excel (comma or tab). Only codes in this round's roster are applied.",
  clearRoundScores:
    "Resets every score in this round to zero. If the round was published, it reverts to draft and updates public boards — use when scores were entered in the wrong phase (e.g. July R1 during June).",
  advancementPicks:
    "Only if ties at the cut need extra survivors beyond the automatic top N per region.",
  previewDraft:
    "See how the board would look with current draft scores — still not public until you publish.",
};

export const ADMIN_ROSTER_HINTS = {
  downloadTemplate:
    "Blank CSV with the correct columns. Fill in Excel, then Save As → CSV UTF-8.",
  editRepresentatives:
    "Jump to the table editor if you skipped rep names in the import file.",
  goToRounds:
    "After import succeeds, open June Round 1 to enter first-week scores.",
  importJune:
    "Loads all branches into the database and seeds June Round 1 entry rows. Run once before competition starts (or to refresh the full list).",
  importJuneBlocked:
    "June scores are already live. Re-importing can overwrite branch data and Round 1 seed rows — only proceed if you intend to reset the roster.",
  importJunePreview:
    "Review row counts and regions before importing. Fix CSV errors here instead of discovering them after upload.",
  createBranch:
    "Adds one branch to the roster and seeds June Round 1 with zero points if that round exists.",
  saveBranchRoster:
    "Saves edited code, name, area, or region for changed rows. Does not remove branches — use Deactivate.",
  saveRepresentatives:
    "Writes changed rows only. Public boards show updated representatives after save.",
  unsavedRepresentatives:
    "You have unsaved name edits — save before leaving or your changes will be lost.",
  devImport:
    "Development only: reload bundled sample branches from the server — not your uploaded CSV.",
  employeeCsvTemplate:
    "Sample row with all HR columns. Fill in Excel, then File → Save As → CSV UTF-8.",
  importEmployeesCsv:
    "Upserts employee profiles by employee number. Optional branch_code sets home branch when it matches the master list.",
};

export const ADMIN_ADVANCEMENT_HINTS = {
  saveRegionPicks:
    "Saves extra survivors for this region only. Repeat for Luzon, NCR, and VisMin if needed. Public board updates after each save.",
  saveAllPicks:
    "Writes Luzon, NCR, and VisMin picks in one step — faster when several regions need tie-breaker survivors.",
  scoreRound3:
    "Final round for the phase — publish before locking and seeding the next stage.",
  lockPhase:
    "Records phase lock and copies advancing branches into the next season’s participant list. Required before scoring July or Nationals.",
  relockPhase:
    "Re-runs seeding if something was wrong — wipes and rebuilds the next phase roster. Use only when you mean to reset survivors.",
};

export const ADMIN_SITE_HINTS = {
  saveSiteHomeConfig:
    "Chooses whether Sword Duels or National Competitions owns the large hero on the public home page.",
  saveEventSchedule:
    "Planned event dates on the home page Upcoming column. Past rows are removed on save. Recent results still come from published scores automatically.",
  saveEventsCalendar:
    "Full month calendar for Sword Duels — prep weeks, branch duels, selections, and July area/regional dates. Only published rows appear on /sword-duels/calendar.",
  saveNcPhaseSchedules:
    "Round dates for June, July, and The Nationals on the home Upcoming column until each round is published.",
  saveCompetitionMap:
    "Updates the home page milestone, caption, and optional contestant list visibility.",
  suggestCompetitionMap:
    "Pre-fills milestone from the latest published round — always review before saving.",
  saveMechanics:
    "Pushes intro text and custom sections to the public /mechanics page.",
  uploadLogo:
    "Hero splash on home and boards plus small header icon. PNG/SVG with transparent background works best.",
  removeLogo: "Clears the custom logo; site falls back until you upload again.",
  uploadCarousel:
    "Adds or replaces one home photo slot. Up to 4 photos rotate on the home page.",
  removeCarousel: "Removes this slot from the public carousel.",
  uploadPartnerLogo:
    "Logo appears in the scrolling partner strip above Live ranks on home. Use 320×80 px for even sizing.",
  removePartnerLogo: "Removes this slot from the home partner strip.",
  brandingSectionPartner: "Marquee above Live ranks — up to 3 logos, same recommended size.",
  brandingSectionCarousel: "Full-width photo rotation on home — landscape 1920×1080 recommended.",
  brandingSectionLogo: "Large hero title treatment on home and leaderboard headers.",
};

export const ADMIN_PREVIEW_HINTS = {
  rosterCapacity:
    "See every slot on each regional board — real branches plus dashed placeholders for seats not seeded yet. No scores.",
};

export const ADMIN_TOOLS_HINTS = {
  exportRegional:
    "CSV of published standings for that phase and region — for spreadsheets and reports.",
  exportNationals:
    "CSV of The Nationals championship board after rounds are published.",
  auditFilter: "Filter by action type to find imports, publishes, or locks quickly.",
  auditEmail: "Narrow to one admin email (partial match).",
  auditEntity: "Filter by what was changed — round, season, branches, branding, etc.",
};

export const ADMIN_CONFIRM_HINTS = {
  publish:
    "Confirm only when every eligible branch has scores and survivor counts match the round rules.",
  republish:
    "Check the box to confirm you mean to overwrite the live board with these scores.",
  clearRound:
    "Confirm only if this round should have no scores. Published rounds become draft again on the public site.",
  lockPhase:
    "Confirm only after public boards show the correct survivors (8 per region after June R3, 1 champion per region after July R3).",
  removeAsset: "This removes the file from the public site immediately.",
};
