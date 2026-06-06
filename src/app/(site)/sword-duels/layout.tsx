import { SwordDuelsPublicChrome } from "@/components/sword-duels/SwordDuelsPublicChrome";
import { loadPublicJourneyState } from "@/lib/products/sword-duels/public-journey";

export const revalidate = 30;

export default async function SwordDuelsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let journey = null;
  try {
    journey = await loadPublicJourneyState();
  } catch {
    journey = null;
  }

  return (
    <>
      <SwordDuelsPublicChrome journey={journey} />
      {children}
    </>
  );
}
