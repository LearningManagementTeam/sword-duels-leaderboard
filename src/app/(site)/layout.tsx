import { ArBackdrop } from "@/components/ui/ArBackdrop";
import { PublicNav } from "@/components/nav/PublicNav";
import { SiteMain } from "@/components/nav/SiteMain";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ArBackdrop />
      <PublicNav />
      <SiteMain>{children}</SiteMain>
      <footer className="sd-glass relative mb-20 mt-8 py-4 text-center text-xs text-sd-muted/70 md:mb-0">
        Sword Duels · June–August competition
      </footer>
    </>
  );
}
