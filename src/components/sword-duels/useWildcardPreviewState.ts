"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_WILDCARD_PREVIEW_STATE,
  WILDCARD_PREVIEW_STORAGE_KEY,
  type WildcardPreviewState,
} from "@/lib/products/sword-duels/nationals-wildcard-demo";

export function useWildcardPreviewState() {
  const [state, setState] = useState<WildcardPreviewState>(
    DEFAULT_WILDCARD_PREVIEW_STATE
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(WILDCARD_PREVIEW_STORAGE_KEY);
      if (raw) {
        setState({ ...DEFAULT_WILDCARD_PREVIEW_STATE, ...JSON.parse(raw) });
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const persist = useCallback((next: WildcardPreviewState) => {
    setState(next);
    try {
      localStorage.setItem(WILDCARD_PREVIEW_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const updateScores = useCallback(
    (wildcardScores: Record<string, number>) => {
      persist({ ...state, wildcardScores });
    },
    [persist, state]
  );

  const confirmWildcard = useCallback(
    (confirmedWildcardId: string) => {
      persist({ ...state, confirmedWildcardId });
    },
    [persist, state]
  );

  const resetPreview = useCallback(() => {
    persist(DEFAULT_WILDCARD_PREVIEW_STATE);
  }, [persist]);

  const setForceTiebreak = useCallback(
    (forceTiebreak: boolean) => {
      persist({ ...state, forceTiebreak, confirmedWildcardId: undefined });
    },
    [persist, state]
  );

  return {
    state,
    hydrated,
    updateScores,
    confirmWildcard,
    resetPreview,
    setForceTiebreak,
    persist,
  };
}
