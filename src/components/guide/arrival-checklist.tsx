"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ARRIVAL_STEPS } from "@/lib/profile-options";

// The first things almost every new international student has to do.
// Signed in: saved to the account (so it follows you to other devices).
// Signed out: saved in this browser. Ticks made before signing in are kept.
const KEY = "icom_arrival_checklist";

function readLocal(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}");
    return Object.keys(raw).filter((k) => raw[k]);
  } catch { return []; }
}

function writeLocal(done: string[]) {
  try { localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(done.map((d) => [d, true])))); } catch { /* storage unavailable */ }
}

export default function ArrivalChecklist({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const [done, setDone] = useState<string[]>([]);

  useEffect(() => {
    const local = readLocal();
    if (!user) { setDone(local); return; }
    const saved = user.checklist || [];
    const merged = Array.from(new Set([...saved, ...local]));
    setDone(merged);
    if (merged.length > saved.length) api.put("/auth/me/checklist", { done: merged });   // bring over signed-out ticks
  }, [user]);

  const toggle = async (id: string) => {
    const prev = done;
    const next = done.includes(id) ? done.filter((d) => d !== id) : [...done, id];
    setDone(next);
    writeLocal(next);
    if (user) {
      const { error } = await api.put("/auth/me/checklist", { done: next });
      if (error) { setDone(prev); writeLocal(prev); }
    }
  };

  const count = ARRIVAL_STEPS.filter((s) => done.includes(s.id)).length;
  const pct = Math.round((count / ARRIVAL_STEPS.length) * 100);
  const steps = compact ? ARRIVAL_STEPS.filter((s) => !done.includes(s.id)).slice(0, 3) : ARRIVAL_STEPS;

  return (
    <section id="arrival" className={`${compact ? "" : "mb-12 "}rounded-2xl border border-border bg-card p-5 sm:p-6 scroll-mt-20`}>
      <div className="flex items-end justify-between gap-4 mb-3">
        <div>
          <h2 className={`${compact ? "text-sm" : "text-lg"} font-bold text-foreground`}>Arrival checklist</h2>
          {!compact && <p className="text-xs text-muted-foreground mt-0.5">Your first weeks in Korea, in order. Tick each step when it&apos;s done.</p>}
        </div>
        <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 tabular-nums shrink-0">
          {count}/{ARRIVAL_STEPS.length}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted mb-4 overflow-hidden" aria-hidden>
        <div className="h-full rounded-full bg-indigo-500 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      {steps.length === 0 ? (
        <p className="text-sm text-muted-foreground">All done. Welcome to Korea.</p>
      ) : (
        <ol className={`grid gap-2 ${compact ? "" : "sm:grid-cols-2"}`}>
          {steps.map((s) => {
            const isDone = done.includes(s.id);
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
      )}
      {compact && steps.length > 0 && (
        <Link href="/guide#arrival" className="mt-3 inline-block text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:underline">
          See the full checklist
        </Link>
      )}
    </section>
  );
}
