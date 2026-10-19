"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./sidebar";
import { sidebarShownOn } from "@/lib/sidebar-config";

/** Renders the sidebar on every page that should have it (see sidebar-state.ts). */
export default function AppSidebar() {
  const pathname = usePathname() || "/";
  const shown = sidebarShownOn(pathname);
  useEffect(() => {
    document.documentElement.dataset.hasSidebar = shown ? "1" : "0";
  }, [shown]);
  return shown ? <Sidebar /> : null;
}
