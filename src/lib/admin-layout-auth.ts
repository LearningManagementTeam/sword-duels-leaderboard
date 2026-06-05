import { redirect } from "next/navigation";
import { AdminAuthError, requireAdminEmail } from "@/lib/admin-auth";

/** Shared admin auth gate for hub and product layouts. */
export async function requireAdminLayoutAccess() {
  try {
    await requireAdminEmail();
  } catch (err) {
    if (err instanceof AdminAuthError) {
      if (err.status === 503) {
        redirect("/admin/login?setup=1");
      }
      if (err.status === 403) {
        redirect(
          "/admin/login?error=" +
            encodeURIComponent("Not authorized for admin access")
        );
      }
      redirect("/admin/login");
    }
    throw err;
  }
}
