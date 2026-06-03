import Link from "next/link";
import { HeroLogo } from "@/components/branding/HeroLogo";
import { MechanicsPageContent } from "@/components/MechanicsPageContent";
import { getBranding, getMechanicsContent } from "@/lib/data/content-queries";

export const metadata = {
  title: "How it works — Sword Duels",
};

export default async function MechanicsPage() {
  const [content, branding] = await Promise.all([
    getMechanicsContent(),
    getBranding(),
  ]);

  return (
    <div className="space-y-6">
      <HeroLogo branding={branding} />
      <div>
        <Link href="/" className="text-sm text-sd-muted hover:text-sd-glow">
          ← Leaderboard
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-white">How it works</h1>
        <p className="mt-2 max-w-2xl text-sd-muted">
          Sword Duels competition mechanics — June area-wide, July regional, and
          August finals.
        </p>
      </div>
      <MechanicsPageContent content={content} />
    </div>
  );
}
