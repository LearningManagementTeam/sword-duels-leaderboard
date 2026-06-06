import { MechanicsPageContent } from "@/components/MechanicsPageContent";
import { ProgramRulesCrossLink } from "@/components/ProgramRulesCrossLink";
import { getMechanicsContent } from "@/lib/data/content-queries";
import { getBranchCount } from "@/lib/data/queries";

export const metadata = {
  title: "How to win — Sword Duels",
};

export default async function MechanicsPage() {
  const [content, branchCount] = await Promise.all([
    getMechanicsContent(),
    getBranchCount(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">How to win</h1>
        <p className="mt-2 max-w-2xl text-sd-muted">
          Survive the cuts, climb the ranks, and claim the crown — June area-wide,
          July regional, August finals.
        </p>
      </div>
      <ProgramRulesCrossLink variant="national-competitions" />
      <MechanicsPageContent content={content} branchCount={branchCount} />
    </div>
  );
}
