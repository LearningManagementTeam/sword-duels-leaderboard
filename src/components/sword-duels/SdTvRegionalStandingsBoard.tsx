import { RegionalStandingsPanel } from "@/components/sword-duels/RegionalStandingsPanel";
import type { RegionalStandingsModel } from "@/lib/products/sword-duels/regional-standings";

interface Props {
  models: RegionalStandingsModel[];
  tvMode?: boolean;
}

export function SdTvRegionalStandingsBoard({ models, tvMode }: Props) {
  return (
    <div
      className={`grid gap-4 ${tvMode ? "lg:grid-cols-3" : "lg:grid-cols-1"}`}
    >
      {models.map((model) => (
        <RegionalStandingsPanel key={model.region} model={model} />
      ))}
    </div>
  );
}
