import { RepresentativesEditor } from "@/components/admin/RepresentativesEditor";
import { ImportSwordDuelsRepresentatives } from "@/components/sword-duels/ImportSwordDuelsRepresentatives";
import { getAllBranches } from "@/lib/products/sword-duels/queries";

export const dynamic = "force-dynamic";

export default async function SwordDuelsRepresentativesPage() {
  const branches = await getAllBranches();
  const withReps = branches.filter((b) => b.representative_1?.trim()).length;

  return (
    <div className="space-y-8">
      <div className="sd-page-header">
        <h1>Representatives</h1>
        <p>
          Two representatives per branch compete in area group battles. Import
          from CSV for bulk setup, or edit individual rows below.
        </p>
      </div>

      <ImportSwordDuelsRepresentatives branches={branches} />

      <RepresentativesEditor
        key={`sd-reps-${branches.length}-${withReps}`}
        branches={branches}
        initialWithReps={withReps}
      />
    </div>
  );
}
