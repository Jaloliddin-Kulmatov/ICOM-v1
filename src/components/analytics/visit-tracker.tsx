"use client";

import { useEffect } from "react";
import { captureRef } from "@/lib/invite";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

/**
 * Fires a single POST /api/track/visit per browser session.
 * Uses sessionStorage so repeated navigations within the same tab
 * don't inflate the count. Silently swallows any network errors.
 * Also keeps an invite ref (?ref=…) from the landing URL for sign-up.
 */
export default function VisitTracker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    captureRef();
    if (sessionStorage.getItem("icom_visited")) return;
    sessionStorage.setItem("icom_visited", "1");
    fetch(`${API}/track/visit`, { method: "POST" }).catch(() => {});
  }, []);

  return null;
}
