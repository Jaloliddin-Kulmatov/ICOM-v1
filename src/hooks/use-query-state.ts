"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Keep a piece of UI state (a filter, a tab, a search box) in the URL query
 * string, so the back button, refreshes and shared links keep it.
 *
 *   const [field, setField] = useQueryState("field", "All");
 *
 * Uses history.replaceState instead of the Next router so typing in a search
 * box doesn't trigger navigations, and so pages don't need a Suspense
 * boundary for useSearchParams. Default values are left out of the URL.
 */
export function useQueryState(key: string, defaultValue: string) {
  const [value, setValue] = useState(defaultValue);

  // Read the initial value after mount (the server render has no URL).
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get(key);
    if (v !== null) setValue(v);
  }, [key]);

  const update = useCallback(
    (next: string) => {
      setValue(next);
      const params = new URLSearchParams(window.location.search);
      if (!next || next === defaultValue) params.delete(key);
      else params.set(key, next);
      const qs = params.toString();
      window.history.replaceState(window.history.state, "", `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`);
    },
    [key, defaultValue]
  );

  return [value, update] as const;
}

/** Same as useQueryState, for multi-select filters stored as "a,b,c". */
export function useQueryListState(key: string) {
  const [raw, setRaw] = useQueryState(key, "");
  const list = raw ? raw.split(",").filter(Boolean) : [];
  const setList = useCallback((next: string[]) => setRaw(next.join(",")), [setRaw]);
  const toggle = useCallback(
    (item: string) => setList(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]),
    [list, setList]
  );
  return [list, setList, toggle] as const;
}
