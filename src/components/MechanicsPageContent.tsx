import { MarkdownContent } from "@/components/MarkdownContent";
import { MechanicsAutoRules } from "@/components/MechanicsAutoRules";
import type { MechanicsPublicBody } from "@/lib/mechanics-content";

interface Props {
  content: MechanicsPublicBody;
}

export function MechanicsPageContent({ content }: Props) {
  return (
    <div className="space-y-10">
      {content.intro.trim() && (
        <section className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
          <MarkdownContent source={content.intro} />
        </section>
      )}

      {content.announcements.trim() && (
        <section>
          <h2 className="text-xl font-semibold text-amber-300">Announcements</h2>
          <div className="mt-3 rounded-lg border border-slate-700 bg-slate-900/50 p-4">
            <MarkdownContent source={content.announcements} />
          </div>
        </section>
      )}

      <MechanicsAutoRules />

      {content.custom_sections.map((section) => (
        <section key={section.id} id={`section-${section.id}`}>
          <h2 className="text-xl font-semibold text-amber-300">
            {section.title}
          </h2>
          <div className="mt-3">
            <MarkdownContent source={section.body} />
          </div>
        </section>
      ))}
    </div>
  );
}
