import { SiteHeader } from "@/components/SiteHeader";
import { ArBackdrop } from "@/components/ui/ArBackdrop";
import { getBranding } from "@/lib/data/content-queries";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const branding = await getBranding();

  return (
    <>
      <ArBackdrop />
      <SiteHeader branding={branding} />
      <main className="relative mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>
      <footer className="sd-glass relative mt-8 py-4 text-center text-xs text-sd-muted/70">
        Sword Duels · June–August competition
      </footer>
    </>
  );
}
