import { revalidatePath } from "next/cache";

/** Bust ISR/cache for home carousel and admin branding after logo/carousel changes. */
export function revalidateBrandingPublicPaths() {
  revalidatePath("/");
  revalidatePath("/admin/national-competitions/branding");
}
