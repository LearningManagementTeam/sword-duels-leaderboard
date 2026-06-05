import { redirect } from "next/navigation";
import { swordDuelsPath } from "@/lib/admin-routes";

export default function AdminPreviewNationalsRedirect() {
  redirect(swordDuelsPath("nationals"));
}
