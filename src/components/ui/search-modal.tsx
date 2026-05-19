"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Briefcase, Users, GraduationCap, Globe, Sparkles, ArrowRight } from "lucide-react";
import { UNIVERSITIES } from "@/lib/constants";

interface Result {
  type: "page" | "university" | "job-link" | "ai";
  label: string;
  sub?: string;
  href: string;
  icon: React.ReactNode;
}

const STATIC_PAGES: Result[] = [
  { type: "page", label: "Community & Clubs", sub: "Browse JBNU clubs and student community", href: "/community", icon: <Users size={14} className="text-indigo-500 dark:text-indigo-400" /> },
  { type: "page", label: "Jobs & Internships", sub: "Find visa-compatible opportunities", href: "/jobs", icon: <Briefcase size={14} className="text-violet-500 dark:text-violet-400" /> },
  { type: "page", label: "Universities", sub: "Explore Korean universities", href: "/universities", icon: <GraduationCap size={14} className="text-cyan-500 dark:text-cyan-400" /> },
  { type: "page", label: "Daily Life Guide", sub: "Transport, food, banking tips", href: "/daily-life", icon: <Globe size={14} className="text-emerald-500 dark:text-emerald-400" /> },
  { type: "page", label: "Visa Guides", sub: "D-2, D-4 extensions and info", href: "/support/visa", icon: <Globe size={14} className="text-amber-500 dark:text-amber-400" /> },
  { type: "page", label: "Support & Resources", sub: "Housing, banking, insurance", href: "/support", icon: <Globe size={14} className="text-rose-500 dark:text-rose-400" /> },
  { type: "ai", label: "Ask AI Assistant", sub: "Chat with ICOM AI about Korea life", href: "/dashboard/ai", icon: <Sparkles size={14} className="text-violet-500 dark:text-violet-400" /> },
];

const UNI_RESULTS: Result[] = UNIVERSITIES.map(u => ({
  type: "university",
  label: `${u.shortName} — ${u.name}`,
  sub: `${u.city} · ${u.students.toLocaleString()} int'l students`,
  href: `/universities/${u.id}`,
  icon: <GraduationCap size={14} className="text-indigo-500 dark:text-indigo-400" />,
}));

const ALL: Result[] = [...STATIC_PAGES, ...UNI_RESULTS];

export default function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const results = query.trim()
    ? ALL.filter(r =>
        r.label.toLowerCase().includes(query.toLowerCase()) ||
        (r.sub || "").toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : STATIC_PAGES.slice(0, 6);

  useEffect(() => {
    if (open) { setQuery(""); setCursor(0); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  useEffect(() => { setCursor(0); }, [query]);

  const go = useCallback((href: string) => {
    router.push(href);
    onClose();
  }, [router, onClose]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(c + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    if (e.key === "Enter" && results[cursor]) go(results[cursor].href);
    if (e.key === "Escape") onClose();
  };

  if (!open) return null;

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
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-blue-100 dark:border-white/8">
          <Search size={16} className="text-indigo-400 dark:text-white/40 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search pages, universities, jobs..."
            className="flex-1 bg-transparent text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/35 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white transition-colors">
              <X size={14} />
            </button>
          )}
          <kbd className="hidden sm:inline-flex h-5 px-1.5 rounded border border-blue-200 dark:border-white/15 text-[10px] font-mono text-gray-400 dark:text-white/40 bg-blue-50 dark:bg-transparent">Esc</kbd>
        </div>

        {/* Results */}
        <div className="py-1.5 max-h-80 overflow-y-auto">
          {results.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-gray-400 dark:text-white/50">No results for &quot;{query}&quot;</p>
          )}
          {results.map((r, i) => (
            <button
              key={r.href + i}
              onClick={() => go(r.href)}
              onMouseEnter={() => setCursor(i)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 mx-1.5 rounded-xl text-left transition-colors ${
                cursor === i
                  ? "bg-indigo-50 dark:bg-indigo-500/15"
                  : "hover:bg-gray-50 dark:hover:bg-white/5"
              }`}
              style={{ width: "calc(100% - 12px)" }}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                cursor === i
                  ? "bg-indigo-100 dark:bg-indigo-500/20"
                  : "bg-gray-100 dark:bg-white/8"
              }`}>
                {r.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold truncate transition-colors ${
                  cursor === i ? "text-indigo-700 dark:text-white" : "text-gray-700 dark:text-white"
                }`}>{r.label}</p>
                {r.sub && <p className="text-[11px] text-gray-400 dark:text-white/45 truncate">{r.sub}</p>}
              </div>
              <ArrowRight size={12} className={`shrink-0 transition-all ${
                cursor === i ? "opacity-100 text-indigo-400" : "opacity-0"
              }`} />
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-blue-100 dark:border-white/8 flex items-center gap-4 text-[10px] text-gray-400 dark:text-white/30 bg-blue-50/50 dark:bg-transparent">
          <span><kbd className="font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono">↵</kbd> open</span>
          <span><kbd className="font-mono">Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
