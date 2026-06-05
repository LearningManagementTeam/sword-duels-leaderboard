import { NationalsWildcardPreviewClient } from "@/components/sword-duels/NationalsWildcardPreviewClient";

export const metadata = {
  title: "Sword Duels Nationals — Wildcard preview",
  description:
    "Temporary preview: 15 area representatives plus wildcard slot 16.",
};

export default function SwordDuelsNationalsPreviewPage() {
  return <NationalsWildcardPreviewClient />;
}
