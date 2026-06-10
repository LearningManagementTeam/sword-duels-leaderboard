"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export type AdminUrlFilterField = {
  default: string;
  /** Debounce URL updates (use for search boxes). */
  debounce?: boolean;
};

export type AdminUrlFilterSchema = Record<string, AdminUrlFilterField>;

function readFiltersFromUrl(
  searchParams: URLSearchParams,
  schema: AdminUrlFilterSchema
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, cfg] of Object.entries(schema)) {
    out[key] = searchParams.get(key) ?? cfg.default;
  }
  return out;
}

function filtersToQuery(
  filters: Record<string, string>,
  schema: AdminUrlFilterSchema
): string {
  const params = new URLSearchParams();
  for (const [key, cfg] of Object.entries(schema)) {
    const val = filters[key] ?? cfg.default;
    if (val && val !== cfg.default) params.set(key, val);
  }
  return params.toString();
}

/** Sync admin table filters with URL query params (shareable, back-button friendly). */
export function useAdminUrlFilters(schema: AdminUrlFilterSchema) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const schemaRef = useRef(schema);
  schemaRef.current = schema;

  const [filters, setFilters] = useState(() =>
    readFiltersFromUrl(searchParams, schema)
  );
  const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    setFilters(readFiltersFromUrl(searchParams, schemaRef.current));
  }, [searchParams]);

  const pushUrl = useCallback(
    (next: Record<string, string>) => {
      const q = filtersToQuery(next, schemaRef.current);
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [router, pathname]
  );

  const setFilter = useCallback(
    (key: string, value: string) => {
      const cfg = schemaRef.current[key];
      if (!cfg) return;

      setFilters((prev) => {
        const next = { ...prev, [key]: value };

        if (cfg.debounce) {
          clearTimeout(debounceRef.current[key]);
          debounceRef.current[key] = setTimeout(() => pushUrl(next), 300);
        } else {
          pushUrl(next);
        }

        return next;
      });
    },
    [pushUrl]
  );

  useEffect(() => {
    const timers = debounceRef.current;
    return () => {
      for (const id of Object.values(timers)) clearTimeout(id);
    };
  }, []);

  return { filters, setFilter };
}
