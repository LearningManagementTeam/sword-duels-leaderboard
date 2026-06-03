import Link from "next/link";
import { MechanicsPageContent } from "@/components/MechanicsPageContent";
import { getMechanicsContent } from "@/lib/data/content-queries";

export const metadata = {
  title: "How it works — Sword Duels",
};

export default async function MechanicsPage() {
  const content = await getMechanicsContent();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm text-slate-400 hover:text-white">
          ← Leaderboard
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-white">How it works</h1>
        <p className="mt-2 max-w-2xl text-slate-400">
          Sword Duels competition mechanics — June area-wide, July regional, and
          August finals.
        </p>
      </div>
      <MechanicsPageContent content={content} />
    </div>
  );
}
