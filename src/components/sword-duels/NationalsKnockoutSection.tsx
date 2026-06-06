"use client";

import type { ReactNode } from "react";
import type { NationalsKnockoutModel } from "@/lib/products/sword-duels/nationals-knockout-bracket";
import { NationalsKnockoutMap } from "./NationalsKnockoutMap";
import { SdAnchorOpener } from "./SdAnchorOpener";
import { SdCollapsibleSection } from "./SdCollapsibleSection";

interface Props {
  model: NationalsKnockoutModel;
  preview: boolean;
  defaultOpen: boolean;
  subtitle: string;
  previewLink?: ReactNode;
}

export function NationalsKnockoutSection({
  model,
  preview,
  defaultOpen,
  subtitle,
  previewLink,
}: Props) {
  return (
    <>
      <SdAnchorOpener id="knockout" />
      <SdCollapsibleSection
      id="knockout"
      title="Area vs Area bracket"
      subtitle={subtitle}
      defaultOpen={defaultOpen}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sd-glow">
            Phase 3 · Nationals knockout
          </p>
          {previewLink}
        </div>
        <NationalsKnockoutMap model={model} preview={preview} />
      </div>
    </SdCollapsibleSection>
    </>
  );
}
