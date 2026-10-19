"use client";

import { useCallback, useEffect, useState } from "react";

import { SIDEBAR_KEY } from "./sidebar-config";
export { SIDEBAR_KEY, NO_SIDEBAR, sidebarShownOn, SIDEBAR_BOOT_SCRIPT } from "./sidebar-config";

export function useSidebarCollapsed(): [boolean, () => void] {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try { setCollapsed(localStorage.getItem(SIDEBAR_KEY) === "collapsed"); } catch { /* storage off */ }
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      try { localStorage.setItem(SIDEBAR_KEY, next ? "collapsed" : "open"); } catch { /* storage off */ }
      document.documentElement.dataset.sidebar = next ? "collapsed" : "open";
      return next;
    });
  }, []);

  return [collapsed, toggle];
}
