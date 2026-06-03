export type PreviewRound = 1 | 2 | 3;

export const PREVIEW_ROUNDS: {
  round: PreviewRound;
  slug: string;
  name: string;
  approvedLayout?: boolean;
}[] = [
  {
    round: 1,
    slug: "1",
    name: "Bingo Phallanx",
  },
  {
    round: 2,
    slug: "2",
    name: "Last KaBingoPlus Standing",
  },
  {
    round: 3,
    slug: "3",
    name: "Clash of the Knowledge Swords",
    approvedLayout: true,
  },
];

export function parsePreviewRound(value?: string): PreviewRound {
  if (value === "1") return 1;
  if (value === "2") return 2;
  return 3;
}

export function previewRoundLabel(round: PreviewRound): string {
  const names: Record<PreviewRound, string> = {
    1: "Bingo Phallanx",
    2: "Last KaBingoPlus Standing",
    3: "Clash of the Knowledge Swords",
  };
  return names[round];
}
