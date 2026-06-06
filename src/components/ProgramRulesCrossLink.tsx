import Link from "next/link";

type Variant = "national-competitions" | "sword-duels";

const COPY: Record<
  Variant,
  { text: string; href: string; linkLabel: string }
> = {
  "national-competitions": {
    text: "Looking for Sword Duels area battles and nationals rules?",
    href: "/sword-duels/mechanics",
    linkLabel: "How Sword Duels works",
  },
  "sword-duels": {
    text: "Looking for National Competitions (June → July → August)?",
    href: "/mechanics",
    linkLabel: "How to win",
  },
};

interface Props {
  variant: Variant;
}

export function ProgramRulesCrossLink({ variant }: Props) {
  const { text, href, linkLabel } = COPY[variant];

  return (
    <div className="sd-alert-info text-sm">
      {text}{" "}
      <Link href={href} className="sd-link font-medium">
        {linkLabel} →
      </Link>
    </div>
  );
}
