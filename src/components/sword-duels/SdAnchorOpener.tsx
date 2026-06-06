"use client";

import { useEffect } from "react";

interface Props {
  id: string;
}

/** Opens a `<details id="…">` and scrolls when the URL hash matches. */
export function SdAnchorOpener({ id }: Props) {
  useEffect(() => {
    if (window.location.hash !== `#${id}`) return;

    const el = document.getElementById(id);
    if (el instanceof HTMLDetailsElement) {
      el.open = true;
    }
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [id]);

  return null;
}
