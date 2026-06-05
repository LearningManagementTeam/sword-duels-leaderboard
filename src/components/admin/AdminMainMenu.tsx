"use client";

import Link from "next/link";
import { SdButtonLink } from "@/components/ui/SdButtonLink";
import { ADMIN_PRODUCTS } from "@/lib/admin-routes";

const MENU_ITEMS = [
  {
    title: "Quiz Day",
    description: "Single-day quiz operations — scoring, rounds, and live boards.",
    href: ADMIN_PRODUCTS.quizDay,
    variant: "primary" as const,
  },
  {
    title: "Sword Duels",
    description: "Branch duel events and area-wide competition runs.",
    href: ADMIN_PRODUCTS.swordDuels,
    variant: "ghost" as const,
  },
  {
    title: "National Competitions",
    description:
      "June area-wide → July regional → The Nationals leaderboard and phase advancement.",
    href: ADMIN_PRODUCTS.nationalCompetitions,
    variant: "primary" as const,
    featured: true,
  },
  {
    title: "General Quiz",
    description: "General quiz programs outside the main competition calendar.",
    href: ADMIN_PRODUCTS.generalQuiz,
    variant: "ghost" as const,
  },
];

export function AdminMainMenu() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {MENU_ITEMS.map((item) => (
        <div
          key={item.title}
          className={`sd-neon-panel flex flex-col p-6 ${
            item.featured ? "ring-1 ring-emerald-400/35" : ""
          }`}
        >
          <h2 className="text-lg font-semibold text-white">{item.title}</h2>
          <p className="mt-2 flex-1 text-sm text-sd-muted">{item.description}</p>
          <div className="mt-4">
            <SdButtonLink
              href={item.href}
              variant={item.featured ? "primary" : item.variant}
              className="inline-flex px-4 py-2 text-sm"
            >
              {item.featured ? "Open dashboard →" : "Enter →"}
            </SdButtonLink>
          </div>
        </div>
      ))}
    </div>
  );
}
