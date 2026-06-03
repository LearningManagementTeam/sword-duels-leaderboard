import { ArBackdrop } from "@/components/ui/ArBackdrop";
import { PublicNav } from "@/components/nav/PublicNav";
import { SiteMain } from "@/components/nav/SiteMain";
import { getCompetitionMap } from "@/lib/data/content-queries";
import {
  resolvePublicStandingsHref,
  standingsNavLabel,
} from "@/lib/public-standings-route";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const mapConfig = await getCompetitionMap();
  const standingsHref = resolvePublicStandingsHref(mapConfig);
  const standingsLabel = standingsNavLabel(mapConfig);

  return (
    <>
      <ArBackdrop />
      <PublicNav
        standingsHref={standingsHref}
        standingsLabel={standingsLabel}
      />
      <SiteMain>{children}</SiteMain>
      <footer className="sd-glass relative mb-20 mt-8 py-4 text-center text-xs text-sd-muted/70 md:mb-0">
        Sword Duels · June–August competition
      </footer>
    </>
  );
}
