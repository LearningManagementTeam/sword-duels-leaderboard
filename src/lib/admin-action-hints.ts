/** Operator-facing hints for admin buttons and nav — plain language, when-to-use. */

export const ADMIN_NAV_HINTS: Record<string, string> = {
  "/admin":
    "Start here each week: see phase status (June / July / Nationals), shortcuts to score or lock, and what published last.",
  "/admin/rounds":
    "Enter branch scores for the current round. Save draft while checking; Save & publish when fans should see new ranks.",
  "/admin/advancement":
    "End of June or July: after Round 3 is live everywhere, lock the phase to seed survivors into the next stage (24 → July, 3 → Nationals).",
  "/admin/branches":
    "One-time (or refresh): upload the 130+ branch CSV before June Round 1. Creates the full competition roster.",
  "/admin/representatives":
    "Add or fix branch champion names anytime — for the public board and TV display.",
  "/admin/competition":
    "Update the home page journey map (“you are here”) after major beats — not needed for every score change.",
  "/admin/mechanics":
    "Edit the public How to win intro and announcements. Rule tables update automatically from scoring rules.",
  "/admin/branding":
    "Hero logo, home photo carousel, and partner logo strip above Live ranks.",
  "/admin/preview":
    "Open sample leaderboards with demo data — safe to show stakeholders before go-live.",
  "/admin/audit":
    "See who changed what (imports, publishes, locks). Useful for troubleshooting.",
  "/admin/export":
    "Download published standings CSV for reports — same data fans see, not draft scores.",
};

export const ADMIN_WORKFLOW_HINTS = {
  openRounds:
    "Weekly core task: pick the round, enter points for every eligible branch, then publish when ready.",
  tieBreakerPicks:
    "After publish only: if many branches tied at the cut (e.g. 35 scored 10/10 but only 32 advance), add committee picks here.",
  competitionMap:
    "After a big beat (new round live, phase change, finals week): set the home map milestone so fans know where the event is.",
  phaseLock:
    "Once June or July Round 3 is published in all regions: lock to send 24 survivors to July or 3 champions to Nationals.",
};

export const ADMIN_ROUND_HINTS = {
  saveDraft:
    "Keeps scores in admin only — public site stays unchanged. Use while double-checking or between sessions.",
  publish:
    "Writes live standings, applies regional cut lines, and refreshes the public site. Fans see results immediately.",
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
  saveRepresentatives:
    "Writes all name edits to the database. Public boards show updated representatives after save.",
  devImport:
    "Development only: reload bundled sample branches from the server — not your uploaded CSV.",
};

export const ADMIN_ADVANCEMENT_HINTS = {
  saveRegionPicks:
    "Saves extra survivors for this region only. Repeat for Luzon, NCR, and VisMin if needed. Public board updates after each save.",
  lockPhase:
    "Records phase lock and copies advancing branches into the next season’s participant list. Required before scoring July or Nationals.",
  relockPhase:
    "Re-runs seeding if something was wrong — wipes and rebuilds the next phase roster. Use only when you mean to reset survivors.",
};

export const ADMIN_SITE_HINTS = {
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

export const ADMIN_TOOLS_HINTS = {
  exportRegional:
    "CSV of published standings for that phase and region — for spreadsheets and reports.",
  exportNationals:
    "CSV of The Nationals championship board after rounds are published.",
  auditFilter: "Filter by action type to find imports, publishes, or locks quickly.",
};

export const ADMIN_CONFIRM_HINTS = {
  publish:
    "Confirm only when every eligible branch has scores and survivor counts match the round rules.",
  lockPhase:
    "Confirm only after public boards show the correct survivors (8 per region after June R3, 1 champion per region after July R3).",
  removeAsset: "This removes the file from the public site immediately.",
};
