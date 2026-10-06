"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";

// The first things almost every new international student has to do.
// Progress is stored on this device only (localStorage), so it works signed out.
const STEPS = [
  { id: "arc",       title: "Apply for your ARC",              note: "Within 90 days of arriving. Book on HiKorea.",       href: "/guide/visa" },
  { id: "bank",      title: "Open a bank account",             note: "Bring your passport and student ID.",               href: "/guide/banking" },
  { id: "insurance", title: "Check your health insurance",     note: "Students are enrolled in NHIS. Know how to pay.",   href: "/guide/insurance" },
  { id: "phone",     title: "Get a Korean phone number",       note: "Needed for banking apps and verification.",         href: "/guide/living" },
  { id: "tmoney",    title: "Get a T-money card",              note: "Buses, subway and convenience stores.",             href: "/guide/transport" },
  { id: "housing",   title: "Sort out housing",                note: "Dorm, goshiwon or one-room. Know your deposit.",    href: "/guide/housing" },
];
const KEY = "icom_arrival_checklist";

export default function ArrivalChecklist() {
  const [done, setDone] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try { setDone(JSON.parse(localStorage.getItem(KEY) || "{}")); } catch { /* storage unavailable */ }
  }, []);

  const toggle = (id: string) => {
    setDone((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
      return next;
    });
  };

  const count = STEPS.filter((s) => done[s.id]).length;
  const pct = Math.round((count / STEPS.length) * 100);

  return (
    <section className="mb-12 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-end justify-between gap-4 mb-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">Arrival checklist</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Your first weeks in Korea, in order. Tick each step when it&apos;s done.</p>
        </div>
        <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 tabular-nums shrink-0">
          {count}/{STEPS.length}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted mb-4 overflow-hidden" aria-hidden>
        <div className="h-full rounded-full bg-indigo-500 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <ol className="grid sm:grid-cols-2 gap-2">
        {STEPS.map((s) => {
          const isDone = !!done[s.id];
          return (
            <li key={s.id} className="min-w-0 flex items-center gap-3 rounded-xl border border-border px-3 py-2.5 hover:bg-accent/60 transition-colors">
              <button
                type="button"
                onClick={() => toggle(s.id)}
                aria-pressed={isDone}
                aria-label={isDone ? `Mark "${s.title}" as not done` : `Mark "${s.title}" as done`}
                className={`h-6 w-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  isDone ? "bg-indigo-500 border-indigo-500 text-white" : "border-indigo-500/50"
                }`}
              >
                {isDone && <Check size={13} strokeWidth={3} />}
              </button>
              <Link href={s.href} className="flex-1 min-w-0 group">
                <span className={`block text-sm font-semibold ${isDone ? "text-muted-foreground line-through" : "text-foreground"}`}>{s.title}</span>
                <span className="block text-xs text-muted-foreground truncate">{s.note}</span>
              </Link>
              <ChevronRight size={14} className="text-muted-foreground shrink-0" />
            </li>
          );
        })}
      </ol>
    </section>
  );
}
