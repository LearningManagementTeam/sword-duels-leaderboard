import { redirect } from "next/navigation";
import { SWORD_DUELS_PUBLIC } from "@/lib/admin-routes";
import { getSdNationalsContext } from "@/lib/products/sword-duels/nationals-queries";
import { getSdEvent } from "@/lib/products/sword-duels/queries";
import { isSupabaseConfigured } from "@/lib/supabase/server";

/** Legacy preview URL — live nationals when field is locked, else knockout placeholder. */
export default async function PreviewNationalsRedirect() {
  if (isSupabaseConfigured()) {
    const event = await getSdEvent();
    if (event) {
      try {
        const ctx = await getSdNationalsContext(event.id);
        if (ctx.model.allFieldLocked) {
          redirect(`${SWORD_DUELS_PUBLIC}/nationals`);
        }
      } catch {
        /* keep legacy knockout preview */
      }
    }
  }

  redirect("/preview/sword-duels/nationals/knockout");
}
