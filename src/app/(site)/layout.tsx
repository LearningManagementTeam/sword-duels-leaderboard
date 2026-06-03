import { ArBackdrop } from "@/components/ui/ArBackdrop";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ArBackdrop />
      <main className="relative mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>
      <footer className="sd-glass relative mt-8 py-4 text-center text-xs text-sd-muted/70">
        Sword Duels · June–August competition
      </footer>
    </>
  );
}
