import { MarkdownContent } from "@/components/MarkdownContent";
import { MechanicsAutoRules } from "@/components/MechanicsAutoRules";
import type { MechanicsPublicBody } from "@/lib/mechanics-content";

interface Props {
  content: MechanicsPublicBody;
  branchCount?: number;
}

export function MechanicsPageContent({ content, branchCount = 0 }: Props) {
  return (
    <div className="space-y-10">
      {content.intro.trim() && (
        <section className="sd-neon-panel p-5">
          <MarkdownContent source={content.intro} />
        </section>
      )}

      {content.announcements.trim() && (
        <section>
          <h2 className="text-xl font-semibold text-sd-glow">Announcements</h2>
          <div className="sd-inset mt-3 rounded-xl p-4">
            <MarkdownContent source={content.announcements} />
          </div>
        </section>
      )}

      <MechanicsAutoRules branchCount={branchCount} />

      {content.custom_sections.map((section) => (
        <section key={section.id} id={`section-${section.id}`}>
          <h2 className="text-xl font-semibold text-sd-glow">{section.title}</h2>
          <div className="sd-glass mt-3 rounded-xl p-4">
            <MarkdownContent source={section.body} />
          </div>
        </section>
      ))}
    </div>
  );
}
