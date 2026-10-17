"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

/** Unread direct messages for the signed-in user; polls every 30 s while visible. */
export function useDmUnread(userId: number | undefined): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!userId) { setCount(0); return; }
    let cancelled = false;
    const check = async () => {
      if (document.hidden) return;
      const { data } = await api.get<{ unread: number }>("/messages/unread");
      if (!cancelled && data) setCount(data.unread);
    };
    check();
    const t = setInterval(check, 30000);
    const onVis = () => { if (!document.hidden) check(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { cancelled = true; clearInterval(t); document.removeEventListener("visibilitychange", onVis); };
  }, [userId]);
  return count;
}
