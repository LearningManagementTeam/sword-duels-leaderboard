import Link from "next/link";
import { WildcardPreviewAdmin } from "@/components/sword-duels/WildcardPreviewAdmin";
import { swordDuelsPath } from "@/lib/admin-routes";

export const metadata = {
  title: "Admin · Nationals wildcard preview",
};

export default function AdminNationalsWildcardPreviewPage() {
  return (
    <div className="space-y-6">
      <div className="sd-page-header">
        <h1>Nationals wildcard preview</h1>
        <p>
          Temporary map with 15 placeholder area reps and slot-16 wildcard rules.
          Scores save to this browser only.
        </p>
        <p className="mt-2">
          <Link
            href="/preview/sword-duels/nationals"
            className="sd-link text-sm"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open public preview →
          </Link>
          {" · "}
          <Link href={swordDuelsPath()} className="sd-link text-sm">
            Dashboard
          </Link>
        </p>
      </div>
      <WildcardPreviewAdmin />
    </div>
  );
}
