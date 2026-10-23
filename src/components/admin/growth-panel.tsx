"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Check, Copy, Loader2, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";

type Growth = {
  dau: number; wau: number; mau: number; total_users: number; new_this_week: number;
  weekly_active: { week_ending: string; active: number }[];
  signups_by_ref: { ref: string; total: number; last_7_days: number }[];
  top_inviters: { name: string; university: string; code: string; joined: number }[];
};

/** Active users, where sign-ups come from, and a campaign link maker. Admin analytics tab. */
export default function GrowthPanel() {
  const [g, setG] = useState<Growth | null>(null);
  const [error, setError] = useState("");
  const [tag, setTag] = useState("");
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setError("");
    const { data, error: e } = await api.get<Growth>("/admin/growth");
    if (data) setG(data); else setError(e || "Could not load growth numbers.");
  }, []);
  useEffect(() => { load(); }, [load]);

  const clean = tag.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9_-]/g, "").slice(0, 40);
  const link = `https://icom.ai.kr/?ref=${clean}`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* blocked */ }
  };

  if (!g) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground flex items-center gap-2">
        {error ? <>{error} <button onClick={load} className="text-indigo-500 hover:underline">Try again</button></> : <><Loader2 size={14} className="animate-spin" /> Loading active users…</>}
      </div>
    );
  }
  const max = Math.max(1, ...g.weekly_active.map((w) => w.active));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          ["Active today", g.dau], ["Active this week", g.wau], ["Active this month", g.mau],
          ["New this week", g.new_this_week], ["All members", g.total_users],
        ].map(([label, value]) => (
          <div key={label} className="p-4 rounded-xl border border-border bg-card text-center">
            <p className="text-2xl font-bold text-foreground tabular-nums">{Number(value).toLocaleString()}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-semibold text-foreground">Weekly active students</p>
          <button onClick={load} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"><RefreshCw size={11} /> Refresh</button>
        </div>
        <p className="text-[11px] text-muted-foreground mb-4">Signed-in students who opened ICOM (website or app) in each 7-day week.</p>
        <div className="flex items-end gap-2 h-32">
          {g.weekly_active.map((w, i) => {
            const last = i === g.weekly_active.length - 1;
            return (
              <div key={w.week_ending} className="flex-1 flex flex-col items-center gap-1 h-full justify-end" title={`Week ending ${w.week_ending}: ${w.active}`}>
                <span className="text-[10px] font-semibold text-foreground tabular-nums">{w.active}</span>
                <div className={`w-full rounded-t-md ${last ? "bg-indigo-500" : "bg-indigo-500/40"}`} style={{ height: `${Math.max(3, (w.active / max) * 100)}%` }} />
                <span className="text-[9px] text-muted-foreground">{last ? "This week" : w.week_ending.slice(5).replace("-", "/")}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card">
          <p className="text-sm font-semibold text-foreground">Make a campaign link</p>
          <p className="text-[11px] text-muted-foreground mb-3">Use a different tag for each group chat or poster, then see below how many people signed up from it.</p>
          <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="e.g. kakao-jbnu-uzbek"
            className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40" />
          {clean && (
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 truncate text-xs bg-muted/60 rounded-lg px-2.5 py-2">{link}</code>
              <button onClick={copy} className="h-8 px-3 rounded-lg bg-indigo-600 text-white text-xs font-semibold flex items-center gap-1">
                {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
              </button>
            </div>
          )}

          <p className="text-sm font-semibold text-foreground mt-5 mb-2">Sign-ups by link</p>
          {g.signups_by_ref.length ? (
            <table className="w-full text-xs">
              <thead><tr className="text-muted-foreground text-left"><th className="py-1 font-medium">Link tag</th><th className="py-1 font-medium text-right">Last 7 days</th><th className="py-1 font-medium text-right">All time</th></tr></thead>
              <tbody>
                {g.signups_by_ref.map((r) => (
                  <tr key={r.ref} className="border-t border-border"><td className="py-1.5 font-mono">{r.ref}</td><td className="py-1.5 text-right tabular-nums">{r.last_7_days}</td><td className="py-1.5 text-right tabular-nums font-semibold">{r.total}</td></tr>
                ))}
              </tbody>
            </table>
          ) : <p className="text-xs text-muted-foreground">No sign-ups from invite links yet.</p>}
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card">
          <p className="text-sm font-semibold text-foreground mb-2">Top inviters</p>
          {g.top_inviters.length ? (
            <ol className="space-y-1.5">
              {g.top_inviters.map((t, i) => (
                <li key={t.code || i} className="flex items-center gap-2 text-xs">
                  <span className="w-5 text-muted-foreground tabular-nums">{i + 1}.</span>
                  <span className="flex-1 truncate text-foreground font-medium">{t.name}{t.university && <span className="text-muted-foreground font-normal"> · {t.university.toUpperCase()}</span>}</span>
                  <span className="font-semibold tabular-nums">{t.joined} joined</span>
                </li>
              ))}
            </ol>
          ) : <p className="text-xs text-muted-foreground">Nobody has joined through a friend&apos;s link yet. Students find their link on their dashboard.</p>}
        </div>
      </div>
    </div>
  );
}
