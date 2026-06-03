import { ArBackdrop } from "@/components/ui/ArBackdrop";
import { PublicNav } from "@/components/nav/PublicNav";
import { getCompetitionMap } from "@/lib/data/content-queries";
import {
  resolvePublicPhaseHref,
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
  const phaseHref = resolvePublicPhaseHref(mapConfig);
  const standingsLabel = standingsNavLabel(mapConfig);

  return (
    <>
      <ArBackdrop />
      <PublicNav
        standingsHref={standingsHref}
        phaseHref={phaseHref}
        standingsLabel={standingsLabel}
      />
      <main className="relative mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-6 md:pb-8 md:pt-[4.5rem]">
        {children}
      </main>
      <footer className="sd-glass relative mb-20 mt-8 py-4 text-center text-xs text-sd-muted/70 md:mb-0">
        Sword Duels · June–August competition
      </footer>
    </>
  );
}
