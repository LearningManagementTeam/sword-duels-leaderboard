import fs from "node:fs";
import path from "node:path";
import packageJson from "../../package.json";

const DOCS_DIR = path.join(process.cwd(), "docs");
const MIGRATIONS_DIR = path.join(process.cwd(), "supabase/migrations");

export type DocAudience = "operator" | "technical" | "both";

export interface AdminDocEntry {
  slug: string;
  filename: string;
  title: string;
  summary: string;
  audience: DocAudience;
  sortOrder: number;
  updatedAt: string | null;
}

export interface MigrationEntry {
  file: string;
  note: string;
}

export interface TechStackEntry {
  label: string;
  value: string;
}

const DOC_OVERRIDES: Record<
  string,
  { audience?: DocAudience; sortOrder?: number; summary?: string }
> = {
  "DAILY-OPERATIONS.md": {
    audience: "operator",
    sortOrder: 1,
    summary: "Weekly NC scoring, HRIS vs Revalida, branding, and phase locks.",
  },
  "SD-DAILY-OPERATIONS.md": {
    audience: "operator",
    sortOrder: 2,
    summary: "Sword Duels area battles, publish flow, and nationals sequence.",
  },
  "OPERATOR-QUICK-REFERENCE.md": {
    audience: "operator",
    sortOrder: 3,
    summary: "One-page cheat sheet for common admin tasks.",
  },
  "SYSTEM-BUILD-JOURNAL.md": {
    audience: "both",
    sortOrder: 10,
    summary: "Plain-language history of what shipped and when.",
  },
  "SETUP-FOR-BEGINNERS.md": {
    audience: "technical",
    sortOrder: 20,
    summary: "First-time Supabase, Vercel, and admin user setup.",
  },
  "mechanics.md": {
    audience: "both",
    sortOrder: 11,
    summary: "Public competition rules reference (source for auto-generated tables).",
  },
  "sword-duels-mechanics.md": {
    audience: "both",
    sortOrder: 12,
    summary: "Sword Duels program rules and structure.",
  },
  "CHECKLIST.md": {
    audience: "technical",
    sortOrder: 30,
    summary: "Pre-go-live and deployment checklist.",
  },
  "DEFAULT-ADMIN.md": {
    audience: "technical",
    sortOrder: 31,
    summary: "Default admin account notes.",
  },
  "GITHUB-PUSH.md": {
    audience: "technical",
    sortOrder: 40,
  },
  "PUSH-NOW.md": {
    audience: "technical",
    sortOrder: 41,
  },
  "VERCEL-ENV-FIX.md": {
    audience: "technical",
    sortOrder: 42,
    summary: "Fix missing or wrong Vercel environment variables.",
  },
  "SUPABASE-MCP.md": {
    audience: "technical",
    sortOrder: 43,
    summary: "Supabase MCP integration for agents.",
  },
};

function slugFromFilename(filename: string): string {
  return filename.replace(/\.md$/i, "").toLowerCase();
}

function parseDocTitle(content: string, filename: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  if (match?.[1]) return match[1].trim();
  return filename.replace(/\.md$/i, "").replace(/-/g, " ");
}

function parseDocSummary(content: string): string {
  const lines = content.split("\n");
  let passedTitle = false;
  for (const line of lines) {
    if (line.startsWith("# ")) {
      passedTitle = true;
      continue;
    }
    if (!passedTitle) continue;
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    if (trimmed.startsWith("|") || trimmed.startsWith("```")) continue;
    return trimmed.replace(/\*\*/g, "").slice(0, 220);
  }
  return "Operator or technical reference in the docs folder.";
}

function parseMigrationNote(content: string, file: string): string {
  const firstComment = content
    .split("\n")
    .find((line) => line.trim().startsWith("--"));
  if (firstComment) {
    return firstComment.replace(/^--\s?/, "").trim();
  }
  return file.replace(/\.sql$/i, "").replace(/_/g, " ");
}

export function getTechStackEntries(): TechStackEntry[] {
  const deps = packageJson.dependencies ?? {};
  const devDeps = packageJson.devDependencies ?? {};
  return [
    { label: "App version", value: packageJson.version ?? "0.0.0" },
    { label: "Next.js", value: deps.next ?? "—" },
    { label: "React", value: deps.react ?? "—" },
    { label: "Tailwind CSS", value: devDeps.tailwindcss ?? "4" },
    { label: "TypeScript", value: devDeps.typescript ?? "—" },
    { label: "Supabase client", value: deps["@supabase/supabase-js"] ?? "—" },
    { label: "Hosting", value: "Vercel (GitHub auto-deploy)" },
    { label: "Database & auth", value: "Supabase Postgres + RLS + email login" },
    { label: "Storage buckets", value: "branding, employee-photos" },
  ];
}

export function getMigrationCatalog(): MigrationEntry[] {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((file) => {
      const content = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
      return { file, note: parseMigrationNote(content, file) };
    });
}

export function getAdminDocCatalog(): AdminDocEntry[] {
  if (!fs.existsSync(DOCS_DIR)) return [];
  return fs
    .readdirSync(DOCS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((filename) => {
      const fullPath = path.join(DOCS_DIR, filename);
      const content = fs.readFileSync(fullPath, "utf8");
      const override = DOC_OVERRIDES[filename];
      const stat = fs.statSync(fullPath);
      return {
        slug: slugFromFilename(filename),
        filename,
        title: parseDocTitle(content, filename),
        summary: override?.summary ?? parseDocSummary(content),
        audience: override?.audience ?? "technical",
        sortOrder: override?.sortOrder ?? 100,
        updatedAt: stat.mtime.toISOString(),
      };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
}

export function getAdminDocBySlug(slug: string): {
  entry: AdminDocEntry;
  content: string;
} | null {
  const catalog = getAdminDocCatalog();
  const entry = catalog.find((d) => d.slug === slug.toLowerCase());
  if (!entry) return null;
  const fullPath = path.join(DOCS_DIR, entry.filename);
  if (!fs.existsSync(fullPath)) return null;
  return {
    entry,
    content: fs.readFileSync(fullPath, "utf8"),
  };
}

export const ADMIN_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SITE_URL",
] as const;

export const ADMIN_CODE_PATHS = [
  { path: "src/lib/scoring.ts", note: "NC publish scoring engine" },
  { path: "src/lib/actions/admin.ts", note: "NC + HRIS server actions" },
  { path: "src/lib/actions/sword-duels-admin.ts", note: "SD publish & brackets" },
  { path: "src/lib/employees.ts", note: "Employee profiles & rep linking" },
  { path: "src/lib/admin-system-catalog.ts", note: "This page — auto-synced metadata" },
] as const;
