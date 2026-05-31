"use client";

import { useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

/**
 * Fires a single POST /api/track/visit per browser session.
 * Uses sessionStorage so repeated navigations within the same tab
 * don't inflate the count. Silently swallows any network errors.
 */
export default function VisitTracker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("icom_visited")) return;
    sessionStorage.setItem("icom_visited", "1");
    fetch(`${API}/track/visit`, { method: "POST" }).catch(() => {});
  }, []);

  return null;
}
