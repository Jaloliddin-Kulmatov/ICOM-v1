import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

type State<T> = { data: T | null; error: string; loading: boolean; refreshing: boolean };

/**
 * GET a path and keep the result. `reload()` fetches again (keeps the old
 * data on screen), `pull()` is the same for pull-to-refresh. A null path waits.
 */
export function useApi<T>(path: string | null) {
  const [state, setState] = useState<State<T>>({ data: null, error: "", loading: !!path, refreshing: false });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!path) return;
    let alive = true;
    api.get<T>(path).then(({ data, error }) => {
      if (!alive) return;
      setState((s) => ({
        data: data ?? s.data,
        error: data ? "" : error || "Something went wrong. Please try again.",
        loading: false,
        refreshing: false,
      }));
    });
    return () => { alive = false; };
  }, [path, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const pull = useCallback(() => { setState((s) => ({ ...s, refreshing: true })); setNonce((n) => n + 1); }, []);
  const setData = useCallback((fn: (d: T | null) => T | null) => setState((s) => ({ ...s, data: fn(s.data) })), []);
  return { ...state, reload, pull, setData };
}
