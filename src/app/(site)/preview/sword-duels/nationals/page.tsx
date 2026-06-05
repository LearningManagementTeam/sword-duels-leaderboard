import { redirect } from "next/navigation";

/** Legacy preview URL → knockout placeholder bracket */
export default function PreviewNationalsRedirect() {
  redirect("/preview/sword-duels/nationals/knockout");
}
