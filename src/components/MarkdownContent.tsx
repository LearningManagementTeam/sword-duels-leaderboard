function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineFormat(text: string): string {
  let s = escapeHtml(text);
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="text-sd-glow underline hover:text-white">$1</a>'
  );
  return s;
}

/** Renders a small subset of markdown (paragraphs, lists, bold, links). */
export function MarkdownContent({
  source,
  className = "",
}: {
  source: string;
  className?: string;
}) {
  if (!source.trim()) return null;

  const blocks = source.trim().split(/\n\n+/);
  const elements = blocks.map((block, i) => {
    const lines = block.split("\n");
    if (lines.every((l) => /^[-*]\s+/.test(l.trim()))) {
      return (
        <ul key={i} className="list-inside list-disc space-y-1 text-sd-muted">
          {lines.map((line, j) => (
            <li
              key={j}
              dangerouslySetInnerHTML={{
                __html: inlineFormat(line.replace(/^[-*]\s+/, "")),
              }}
            />
          ))}
        </ul>
      );
    }
    if (lines.every((l) => /^\d+\.\s+/.test(l.trim()))) {
      return (
        <ol key={i} className="list-inside list-decimal space-y-1 text-sd-muted">
          {lines.map((line, j) => (
            <li
              key={j}
              dangerouslySetInnerHTML={{
                __html: inlineFormat(line.replace(/^\d+\.\s+/, "")),
              }}
            />
          ))}
        </ol>
      );
    }
    return (
      <p
        key={i}
        className="text-sd-muted leading-relaxed"
        dangerouslySetInnerHTML={{
          __html: inlineFormat(block.replace(/\n/g, " ")),
        }}
      />
    );
  });

  return <div className={`space-y-3 ${className}`.trim()}>{elements}</div>;
}
