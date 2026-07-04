"use client";

import React, { useEffect, useState, useMemo } from "react";
import { ExternalLink, Megaphone, Loader2 } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

interface Notice {
  id: number;
  category: string; // international | tuition | education
  title: string;
  title_ko: string;
  url: string;
  posted_date: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  international: "International",
  tuition: "Tuition & Scholarship",
  education: "Academic",
};
const CATEGORY_STYLES: Record<string, string> = {
  international: "bg-indigo-500/15 text-indigo-500",
  tuition: "bg-emerald-500/15 text-emerald-600",
  education: "bg-amber-500/15 text-amber-600",
};

const FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "international", label: "International" },
  { key: "tuition", label: "Tuition & Scholarship" },
  { key: "education", label: "Academic" },
];

export default function JbnuNotices() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`${API}/news`)
      .then((r) => (r.ok ? r.json() : { notices: [] }))
      .then((d) => { if (!cancelled) setNotices(d.notices || []); })
      .catch(() => { if (!cancelled) setNotices([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const shown = useMemo(
    () => (filter === "all" ? notices : notices.filter((n) => n.category === filter)),
    [notices, filter]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground">
        <Loader2 size={20} className="animate-spin" />
      </div>
    );
  }

  if (notices.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <Megaphone size={16} className="text-indigo-500" />
        <h2 className="text-sm font-bold text-foreground">JBNU Official Notices</h2>
        <span className="text-[11px] text-muted-foreground">· auto-translated to English</span>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 mb-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all border ${
              filter === f.key
                ? "bg-indigo-500/15 text-indigo-500 border-indigo-500/30"
                : "text-muted-foreground border-border hover:border-indigo-500/30"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {shown.map((n) => (
          <a
            key={n.id}
            href={n.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:border-indigo-500/30 hover:shadow-sm transition-all"
          >
            <span
              className={`shrink-0 mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                CATEGORY_STYLES[n.category] || "bg-white/10 text-muted-foreground"
              }`}
            >
              {CATEGORY_LABELS[n.category] || n.category}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground leading-snug">{n.title}</p>
              {n.posted_date && (
                <p className="text-[11px] text-muted-foreground mt-0.5">{n.posted_date}</p>
              )}
            </div>
            <ExternalLink size={13} className="shrink-0 mt-1 text-muted-foreground" />
          </a>
        ))}
      </div>
    </div>
  );
}
