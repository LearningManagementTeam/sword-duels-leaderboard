import Link from "next/link";
import { redirect } from "next/navigation";
import { PreviewBanner } from "@/components/PreviewBanner";
import { NationalsKnockoutMap } from "@/components/sword-duels/NationalsKnockoutMap";
import { SWORD_DUELS_PUBLIC } from "@/lib/admin-routes";
import { buildPlaceholderKnockoutModel } from "@/lib/products/sword-duels/nationals-knockout-bracket";
import { getSdNationalsContext } from "@/lib/products/sword-duels/nationals-queries";
import { getSdEvent } from "@/lib/products/sword-duels/queries";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata = {
  title: "Preview · Nationals knockout bracket",
};

export default async function PreviewNationalsKnockoutPage() {
  if (isSupabaseConfigured()) {
    const event = await getSdEvent();
    if (event) {
      try {
        const ctx = await getSdNationalsContext(event.id);
        if (ctx.model.allFieldLocked) {
          redirect(`${SWORD_DUELS_PUBLIC}/nationals#knockout`);
        }
      } catch {
        /* nationals tables optional — keep placeholder preview */
      }
    }
  }

  const model = buildPlaceholderKnockoutModel();

  return (
    <div className="space-y-6">
      <PreviewBanner />
      <div className="sd-alert-warning border-emerald-500/30 bg-emerald-950/30 text-emerald-100">
        <p className="font-medium">Placeholder knockout bracket</p>
        <p className="mt-1 text-sm opacity-90">
          Sample reps with branch, employee no., and position. Once the nationals
          field is locked, this preview redirects to the live bracket.
        </p>
      </div>

      <NationalsKnockoutMap model={model} preview />

      <div className="rounded-xl bg-sd-deep/40 p-4 text-sm text-sd-muted/85 ring-1 ring-emerald-900/30">
        <h3 className="font-semibold text-white">About participant details</h3>
        <p className="mt-2">
          Branch, employee number, and position come from the{" "}
          <strong className="text-emerald-200/90">competing representative</strong>{" "}
          recorded when each area final is scored — the same rep fields used in
          area group battles. You do not re-enter them for nationals; they carry
          forward automatically from the branch roster + active rep selection.
        </p>
      </div>

      <p className="text-center text-sm text-sd-muted">
        <Link href={`${SWORD_DUELS_PUBLIC}/nationals`} className="sd-link">
          Live nationals map →
        </Link>
        {" · "}
        <Link href={SWORD_DUELS_PUBLIC} className="sd-link">
          Sword Duels home
        </Link>
      </p>
    </div>
  );
}
