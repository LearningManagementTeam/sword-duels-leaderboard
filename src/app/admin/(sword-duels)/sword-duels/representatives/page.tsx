import { RepresentativesEditor } from "@/components/admin/RepresentativesEditor";
import { getAllBranches } from "@/lib/products/sword-duels/queries";
export const dynamic = "force-dynamic";

export default async function SwordDuelsRepresentativesPage() {
  const branches = await getAllBranches();
  const withReps = branches.filter((b) => b.representative_1?.trim()).length;

  return (
    <div className="space-y-6">
      <div className="sd-page-header">
        <h1>Representatives</h1>
        <p>
          Two representatives per branch compete in area group battles. Names
          appear on the public tournament map.
        </p>
      </div>
      <RepresentativesEditor branches={branches} initialWithReps={withReps} />
    </div>
  );
}
