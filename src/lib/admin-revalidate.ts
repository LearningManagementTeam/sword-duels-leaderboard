import { revalidatePath } from "next/cache";
import { ADMIN_HUB, nationalCompetitionsPath } from "@/lib/admin-routes";

/** Revalidate hub and National Competitions admin surfaces after mutations. */
export function revalidateAdminSurfaces(extraSegment?: string) {
  revalidatePath(ADMIN_HUB);
  revalidatePath(nationalCompetitionsPath());
  if (extraSegment) {
    revalidatePath(nationalCompetitionsPath(extraSegment));
  }
}
