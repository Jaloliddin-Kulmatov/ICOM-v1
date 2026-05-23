"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search, X, Briefcase, Users, GraduationCap, Globe,
  Sparkles, ArrowRight, Loader2, Building2,
} from "lucide-react";
import { UNIVERSITIES } from "@/lib/constants";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

// ── Result types ──────────────────────────────────────────────────────────────

interface Result {
  type: "page" | "university" | "job" | "club" | "community" | "ai";
  label: string;
  sub?: string;
  href: string;
  icon: React.ReactNode;
}

// ── Static data (built once, never fetched) ───────────────────────────────────

const STATIC_PAGES: Result[] = [
  {
    type: "page",
    label: "Community & Clubs",
    sub: "Browse clubs and international communities",
    href: "/community",
    icon: <Users size={14} className="text-indigo-500 dark:text-indigo-400" />,
  },
  {
    type: "page",
    label: "Jobs & Internships",
    sub: "Find visa-compatible opportunities",
    href: "/jobs",
    icon: <Briefcase size={14} className="text-violet-500 dark:text-violet-400" />,
  },
  {
    type: "page",
    label: "Universities",
    sub: "Explore Korean universities",
    href: "/universities",
    icon: <GraduationCap size={14} className="text-cyan-500 dark:text-cyan-400" />,
  },
  {
    type: "page",
    label: "Daily Life Guide",
    sub: "Transport, food, banking tips",
    href: "/daily-life",
    icon: <Globe size={14} className="text-emerald-500 dark:text-emerald-400" />,
  },
  {
    type: "page",
    label: "Visa Guides",
    sub: "D-2, D-4 extensions and info",
    href: "/support/visa",
    icon: <Globe size={14} className="text-amber-500 dark:text-amber-400" />,
  },
  {
    type: "page",
    label: "Support & Resources",
    sub: "Housing, banking, insurance",
    href: "/support",
    icon: <Globe size={14} className="text-rose-500 dark:text-rose-400" />,
  },
  {
    type: "ai",
    label: "Ask AI Assistant",
    sub: "Chat with ICOM AI about Korea life",
    href: "/dashboard/ai",
    icon: <Sparkles size={14} className="text-violet-500 dark:text-violet-400" />,
  },
];

const UNI_RESULTS: Result[] = UNIVERSITIES.map((u) => ({
  type: "university" as const,
  label: `${u.shortName} — ${u.name}`,
  sub: `${u.city} · ${u.students.toLocaleString()} int'l students`,
  href: `/universities/${u.id}`,
  icon: <GraduationCap size={14} className="text-indigo-500 dark:text-indigo-400" />,
}));

const ALL_STATIC: Result[] = [...STATIC_PAGES, ...UNI_RESULTS];

// ── Icon / label helpers ──────────────────────────────────────────────────────

function iconForType(type: Result["type"]): React.ReactNode {
  switch (type) {
    case "job":
      return <Briefcase size={14} className="text-violet-500 dark:text-violet-400" />;
    case "club":
      return <Users size={14} className="text-indigo-500 dark:text-indigo-400" />;
    case "community":
      return <Globe size={14} className="text-emerald-500 dark:text-emerald-400" />;
    default:
      return <Building2 size={14} className="text-cyan-500 dark:text-cyan-400" />;
  }
}

function labelForType(type: Result["type"]): string {
  switch (type) {
    case "job": return "Job";
    case "club": return "Club";
    case "community": return "Community";
    case "university": return "University";
    case "ai": return "AI";
    default: return "Page";
  }
}

function scoreMatch(text: string, q: string): number {
  const t = text.toLowerCase();
  const query = q.toLowerCase();
  if (t === query) return 3;
  if (t.startsWith(query)) return 2;
  if (t.includes(query)) return 1;
  return 0;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SearchModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const [apiResults, setApiResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const router = useRouter();

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setCursor(0);
      setApiResults([]);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => { setCursor(0); }, [query]);

  // ── Instant static filter (no delay, runs on every keystroke) ────────────────
  const staticMatches = useMemo((): Result[] => {
    const trimmed = query.trim();
    if (!trimmed) return [];
    return ALL_STATIC
      .map((r) => {
        const s1 = scoreMatch(r.label, trimmed);
        const s2 = scoreMatch(r.sub || "", trimmed);
        return { r, score: Math.max(s1, s2) };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ r }) => r);
  }, [query]);

  // ── Debounced API search (100ms — much faster than before) ────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setApiResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      try {
        const res = await fetch(
          `${API}/search?q=${encodeURIComponent(trimmed)}&limit=12`,
          { signal: ctrl.signal }
        );
        if (!res.ok) throw new Error("search failed");
        const data = await res.json();

        const mapped: Result[] = (data.results || []).map(
          (r: { type: string; label: string; sub?: string; href: string }) => ({
            type: r.type as Result["type"],
            label: r.label,
            sub: r.sub,
            href: r.href,
            icon: iconForType(r.type as Result["type"]),
          })
        );
        setApiResults(mapped);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setApiResults([]);
      } finally {
        setLoading(false);
      }
    }, 100); // ← 100ms debounce (was 280ms)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // ── Merged results: API first (DB data), then deduplicated static extras ──────
  const results: Result[] = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return STATIC_PAGES.slice(0, 6);

    const seen = new Set(apiResults.map((r) => r.href + r.label));
    const extraStatic = staticMatches.filter((r) => !seen.has(r.href + r.label));

    return [...apiResults, ...extraStatic].slice(0, 10);
  }, [query, apiResults, staticMatches]);

  // Visible results: if API hasn't loaded yet, show static matches immediately
  const displayResults = apiResults.length > 0 || !loading
    ? results
    : staticMatches.slice(0, 6);

  const go = useCallback(
    (href: string) => {
      router.push(href);
      onClose();
    },
    [router, onClose]
  );

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, displayResults.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    }
    if (e.key === "Enter" && displayResults[cursor]) go(displayResults[cursor].href);
    if (e.key === "Escape") onClose();
  };

  if (!open) return null;

  const showSpinner = loading && apiResults.length === 0 && staticMatches.length === 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 bg-black/20 dark:bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden animate-fade-in
          bg-white/95 dark:bg-[#0e0e1a]
          border border-blue-100 dark:border-white/12
          rounded-2xl shadow-[0_8px_40px_rgba(99,102,241,0.15)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-blue-100 dark:border-white/8">
          {showSpinner ? (
            <Loader2 size={16} className="text-indigo-400 shrink-0 animate-spin" />
          ) : (
            <Search size={16} className="text-indigo-400 dark:text-white/40 shrink-0" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search clubs, communities, jobs, universities..."
            className="flex-1 bg-transparent text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/35 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => { setQuery(""); setApiResults([]); }}
              className="text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          )}
          <kbd className="hidden sm:inline-flex h-5 px-1.5 rounded border border-blue-200 dark:border-white/15 text-[10px] font-mono text-gray-400 dark:text-white/40 bg-blue-50 dark:bg-transparent">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="py-1.5 max-h-80 overflow-y-auto">
          {displayResults.length === 0 && query.trim().length >= 2 && !loading && (
            <p className="px-4 py-6 text-center text-sm text-gray-400 dark:text-white/50">
              No results for &quot;{query}&quot;
            </p>
          )}
          {displayResults.map((r, i) => (
            <button
              key={r.href + r.label + i}
              onClick={() => go(r.href)}
              onMouseEnter={() => setCursor(i)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 mx-1.5 rounded-xl text-left transition-colors ${
                cursor === i
                  ? "bg-indigo-50 dark:bg-indigo-500/15"
                  : "hover:bg-gray-50 dark:hover:bg-white/5"
              }`}
              style={{ width: "calc(100% - 12px)" }}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  cursor === i
                    ? "bg-indigo-100 dark:bg-indigo-500/20"
                    : "bg-gray-100 dark:bg-white/8"
                }`}
              >
                {r.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p
                    className={`text-xs font-semibold truncate transition-colors ${
                      cursor === i
                        ? "text-indigo-700 dark:text-white"
                        : "text-gray-700 dark:text-white"
                    }`}
                  >
                    {r.label}
                  </p>
                  {r.type !== "page" && (
                    <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 dark:bg-white/8 text-gray-500 dark:text-white/40 border border-gray-200 dark:border-white/10 uppercase tracking-wide font-medium">
                      {labelForType(r.type)}
                    </span>
                  )}
                  {/* Loading indicator: spinner on last item while API is fetching */}
                  {loading && i === displayResults.length - 1 && apiResults.length === 0 && (
                    <Loader2 size={10} className="text-indigo-400 animate-spin shrink-0 ml-auto" />
                  )}
                </div>
                {r.sub && (
                  <p className="text-[11px] text-gray-400 dark:text-white/45 truncate">
                    {r.sub}
                  </p>
                )}
              </div>
              <ArrowRight
                size={12}
                className={`shrink-0 transition-all ${
                  cursor === i
                    ? "opacity-100 text-indigo-400"
                    : "opacity-0"
                }`}
              />
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-blue-100 dark:border-white/8 flex items-center gap-4 text-[10px] text-gray-400 dark:text-white/30 bg-blue-50/50 dark:bg-transparent">
          <span><kbd className="font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono">↵</kbd> open</span>
          <span><kbd className="font-mono">Esc</kbd> close</span>
          {query.trim().length >= 2 && (
            <span className="ml-auto">
              {loading && apiResults.length === 0
                ? "Searching…"
                : `${displayResults.length} result${displayResults.length !== 1 ? "s" : ""}`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
