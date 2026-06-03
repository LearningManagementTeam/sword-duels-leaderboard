import { NextResponse } from "next/server";
import { standingsToCsv } from "@/lib/export-csv";
import { getPublishedStandings, getSeasonBySlug } from "@/lib/data/queries";
import type { Region, SeasonSlug } from "@/lib/scoring-config";

const SLUGS: SeasonSlug[] = ["june_area", "july_region", "august_finals"];

export async function GET(
  request: Request,
  context: { params: Promise<{ season: string }> }
) {
  const { season: seasonParam } = await context.params;
  const slugMap: Record<string, SeasonSlug> = {
    june: "june_area",
    july: "july_region",
    august: "august_finals",
  };
  const slug = slugMap[seasonParam];
  if (!slug || !SLUGS.includes(slug)) {
    return NextResponse.json({ error: "Invalid season" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region") as Region | null;

  if ((slug === "june_area" || slug === "july_region") && !region) {
    return NextResponse.json(
      { error: "region query param required for june/july export" },
      { status: 400 }
    );
  }

  const season = await getSeasonBySlug(slug);
  if (!season) {
    return NextResponse.json({ error: "Season not found" }, { status: 404 });
  }

  const rows = await getPublishedStandings(
    season.id,
    slug === "august_finals" ? undefined : region ?? undefined
  );

  const csv = standingsToCsv(rows);
  const filename =
    slug === "august_finals"
      ? `sword-duels-${seasonParam}.csv`
      : `sword-duels-${seasonParam}-${region}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
