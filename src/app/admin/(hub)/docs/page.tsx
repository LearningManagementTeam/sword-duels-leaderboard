import Link from "next/link";
import { AdminDocBackLink } from "@/lib/admin-docs-markdown";
import { adminDocsPath, ADMIN_SYSTEM } from "@/lib/admin-routes";
import { getAdminDocCatalog, type DocAudience } from "@/lib/admin-system-catalog";

export const dynamic = "force-dynamic";

const AUDIENCE_LABEL: Record<DocAudience, string> = {
  operator: "Operators",
  technical: "Technical",
  both: "Everyone",
};

function formatUpdated(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminDocsIndexPage() {
  const docs = getAdminDocCatalog();
  const operatorDocs = docs.filter(
    (d) => d.audience === "operator" || d.audience === "both"
  );
  const technicalDocs = docs.filter((d) => d.audience === "technical");

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="sd-page-header">
        <h1>Documentation</h1>
        <p>
          Auto-indexed from the{" "}
          <code className="text-sd-glow">docs/</code> folder in the repo — new
          markdown files appear here after deploy. Stack and migrations:{" "}
          <Link href={ADMIN_SYSTEM} className="sd-link">
            Tech stack
          </Link>
          .
        </p>
      </div>

      <DocSection title="For operators" docs={operatorDocs} />
      <DocSection title="Technical & setup" docs={technicalDocs} />

      <section className="sd-neon-panel space-y-2 p-5 text-sm text-sd-muted">
        <h2 className="font-semibold text-white">How this stays current</h2>
        <p>
          Adding or editing a <code className="text-sd-glow">.md</code> file
          under <code className="text-sd-glow">docs/</code> updates this index
          on the next deploy. Titles come from the first{" "}
          <code className="text-sd-glow"># heading</code>; summaries from the
          first paragraph or overrides in{" "}
          <code className="text-sd-glow">admin-system-catalog.ts</code>.
        </p>
      </section>

      <AdminDocBackLink />
    </div>
  );
}

function DocSection({
  title,
  docs,
}: {
  title: string;
  docs: ReturnType<typeof getAdminDocCatalog>;
}) {
  if (docs.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <div className="grid gap-3">
        {docs.map((doc) => (
          <Link
            key={doc.slug}
            href={adminDocsPath(doc.slug)}
            className="sd-neon-panel block p-4 transition hover:ring-1 hover:ring-emerald-400/30"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="font-semibold text-sd-glow">{doc.title}</h3>
              <span className="rounded-full bg-sd-panel/80 px-2 py-0.5 text-[10px] uppercase tracking-wide text-sd-muted ring-1 ring-emerald-500/20">
                {AUDIENCE_LABEL[doc.audience]}
              </span>
            </div>
            <p className="mt-2 text-sm text-sd-muted">{doc.summary}</p>
            <p className="mt-2 text-xs text-sd-muted/50">
              {doc.filename}
              {doc.updatedAt
                ? ` · updated ${formatUpdated(doc.updatedAt)}`
                : ""}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
