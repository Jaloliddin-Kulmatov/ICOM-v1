import React from "react";
import dates from "@/lib/guide-dates.json";

// "Updated" = when the guide's text last changed (backend/build_guide_index.py).
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function GuideUpdated({ slug, center = false }: { slug: string; center?: boolean }) {
  const iso = (dates as Record<string, string>)[slug];
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  return (
    <p className={`mt-2 text-xs text-muted-foreground ${center ? "text-center" : ""}`}>
      Updated {d} {MONTHS[m - 1]} {y}. Rules change, so confirm with your international office or HiKorea (call 1345).
    </p>
  );
}
