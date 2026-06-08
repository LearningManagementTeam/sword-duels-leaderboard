import Link from "next/link";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineMarkdown(text: string): string {
  let html = escapeHtml(text);
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="sd-link">$1</a>'
  );
  return html;
}

function isTableRow(line: string): boolean {
  return line.trim().startsWith("|") && line.trim().endsWith("|");
}

function parseTableRow(line: string): string[] {
  return line
    .trim()
    .slice(1, -1)
    .split("|")
    .map((cell) => cell.trim());
}

function renderTable(lines: string[]): string {
  if (lines.length < 2) return "";
  const header = parseTableRow(lines[0]);
  const bodyRows = lines.slice(2).map(parseTableRow);
  const thead = `<thead><tr>${header
    .map((h) => `<th class="px-3 py-2 text-left">${inlineMarkdown(h)}</th>`)
    .join("")}</tr></thead>`;
  const tbody = `<tbody>${bodyRows
    .map(
      (row) =>
        `<tr class="border-t border-emerald-500/10">${row
          .map(
            (cell) =>
              `<td class="px-3 py-2 align-top text-sd-muted">${inlineMarkdown(cell)}</td>`
          )
          .join("")}</tr>`
    )
    .join("")}</tbody>`;
  return `<div class="overflow-x-auto my-4"><table class="w-full text-sm border border-emerald-500/15 rounded-lg overflow-hidden">${thead}${tbody}</table></div>`;
}

/** Lightweight markdown for repo docs in admin (headings, lists, tables, code). */
export function markdownToAdminHtml(content: string): string {
  const lines = content.split("\n");
  const html: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    if (trimmed.startsWith("```")) {
      const fence = trimmed;
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      html.push(
        `<pre class="my-4 overflow-x-auto rounded-lg sd-inset p-4 text-xs text-sd-muted"><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`
      );
      i++;
      continue;
    }

    if (isTableRow(trimmed)) {
      const tableLines: string[] = [];
      while (i < lines.length && isTableRow(lines[i].trim())) {
        tableLines.push(lines[i].trim());
        i++;
      }
      html.push(renderTable(tableLines));
      continue;
    }

    if (trimmed.startsWith("### ")) {
      html.push(
        `<h3 class="mt-6 mb-2 text-base font-semibold text-white">${inlineMarkdown(trimmed.slice(4))}</h3>`
      );
      i++;
      continue;
    }
    if (trimmed.startsWith("## ")) {
      html.push(
        `<h2 class="mt-8 mb-3 text-lg font-semibold text-sd-glow">${inlineMarkdown(trimmed.slice(3))}</h2>`
      );
      i++;
      continue;
    }
    if (trimmed.startsWith("# ")) {
      html.push(
        `<h1 class="mb-4 text-2xl font-bold text-white">${inlineMarkdown(trimmed.slice(2))}</h1>`
      );
      i++;
      continue;
    }

    if (trimmed.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("- ")) {
        items.push(lines[i].trim().slice(2));
        i++;
      }
      html.push(
        `<ul class="my-3 list-disc space-y-1 pl-5 text-sm text-sd-muted">${items
          .map((item) => `<li>${inlineMarkdown(item)}</li>`)
          .join("")}</ul>`
      );
      continue;
    }

    const paraLines: string[] = [trimmed];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith("#") &&
      !lines[i].trim().startsWith("- ") &&
      !lines[i].trim().startsWith("```") &&
      !isTableRow(lines[i].trim())
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }
    html.push(
      `<p class="my-3 text-sm leading-relaxed text-sd-muted">${inlineMarkdown(paraLines.join(" "))}</p>`
    );
  }

  return html.join("\n");
}

export function AdminMarkdownDoc({ content }: { content: string }) {
  const html = markdownToAdminHtml(content);
  return (
    <article
      className="admin-doc-prose max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function AdminDocBackLink({ slug }: { slug?: string }) {
  return (
    <p className="text-xs text-sd-muted/60">
      <Link href="/admin/docs" className="hover:text-sd-muted">
        ← Documentation
      </Link>
      {slug && (
        <>
          {" · "}
          <Link href="/admin/system" className="hover:text-sd-muted">
            Tech stack
          </Link>
        </>
      )}
    </p>
  );
}
