"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Timer } from "lucide-react";
import ToolPage, { card } from "@/components/tools/tool-page";
import { dayKey, streak, useDeviceState, type FocusLog } from "@/lib/study-tools";

const LENGTHS = [25, 50];
const BREAK = { 25: 5, 50: 10 } as Record<number, number>;
type Phase = "focus" | "break";

export default function FocusPage() {
  const [log, setLog] = useDeviceState<FocusLog>("focus_log", {});
  const [length, setLength] = useDeviceState<number>("focus_length", 25);
  const [phase, setPhase] = useState<Phase>("focus");
  const [endsAt, setEndsAt] = useState<number | null>(null);    // running: when this phase ends
  const [left, setLeft] = useState(length * 60);                 // seconds left (shown while paused too)
  const [days, setDays] = useState<string[]>([]);
  const finishing = useRef(false);
  const pageTitle = useRef("");

  const phaseSeconds = (p: Phase) => (p === "focus" ? length : BREAK[length] || 5) * 60;

  useEffect(() => {   // dates after mount only, so the server render and the browser agree
    const out: string[] = [];
    for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); out.push(dayKey(d)); }
    setDays(out);
  }, []);

  useEffect(() => { if (endsAt === null) setLeft(phaseSeconds(phase)); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [length]);

  const finish = useCallback(() => {
    if (finishing.current) return;
    finishing.current = true;
    beep();
    if (phase === "focus") setLog((l) => ({ ...l, [dayKey()]: (l[dayKey()] || 0) + length }));
    const next: Phase = phase === "focus" ? "break" : "focus";
    setPhase(next);
    setEndsAt(null);
    setLeft((next === "focus" ? length : BREAK[length] || 5) * 60);
    document.title = next === "break" ? "Break time!" : pageTitle.current;
  }, [phase, length, setLog]);

  useEffect(() => {
    if (endsAt === null) return;
    finishing.current = false;
    // counts down from the end time, so a sleeping tab still finishes on time
    const tick = () => {
      const s = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      setLeft(s);
      document.title = `${fmt(s)} · ${phase === "focus" ? "Focus" : "Break"}`;
      if (s === 0) finish();
    };
    tick();
    const t = setInterval(tick, 500);
    return () => clearInterval(t);
  }, [endsAt, phase, finish]);

  useEffect(() => {   // the countdown shows in the tab title; put the real title back when leaving
    pageTitle.current = document.title;
    return () => { document.title = pageTitle.current; };
  }, []);

  const running = endsAt !== null;
  const start = () => setEndsAt(Date.now() + left * 1000);
  const pause = () => { setEndsAt(null); document.title = pageTitle.current; };
  const reset = () => { pause(); setPhase("focus"); setLeft(length * 60); };

  const total = phaseSeconds(phase);
  const r = 88, c = 2 * Math.PI * r;
  const today = days.length ? log[days[6]] || 0 : 0;
  const best = Math.max(60, ...days.map((d) => log[d] || 0));

  return (
    <ToolPage icon={Timer} tile="bg-teal-500" title="Focus timer"
      intro="Study for 25 minutes, then take a 5-minute break. Each finished session counts toward today and your streak.">
      <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
        <div className={`${card} flex flex-col items-center py-8`}>
          <div className="inline-flex p-0.5 rounded-lg border border-border text-xs font-semibold mb-6" role="radiogroup" aria-label="Session length">
            {LENGTHS.map((m) => (
              <button key={m} role="radio" aria-checked={length === m} disabled={running} onClick={() => { setLength(m); setPhase("focus"); }}
                className={`px-3 py-1 rounded-md disabled:opacity-60 ${length === m ? "bg-teal-500 text-white" : "text-muted-foreground hover:text-foreground"}`}>
                {m} / {BREAK[m]} min
              </button>
            ))}
          </div>
          <div className="relative h-52 w-52">
            <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90" aria-hidden>
              <circle cx="100" cy="100" r={r} fill="none" strokeWidth="12" className="stroke-muted" />
              <circle cx="100" cy="100" r={r} fill="none" strokeWidth="12" strokeLinecap="round"
                className={phase === "focus" ? "stroke-teal-500" : "stroke-sky-400"} strokeDasharray={`${(left / total) * c} ${c}`} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-5xl font-extrabold tabular-nums text-foreground" aria-live="off">{fmt(left)}</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-1">{phase === "focus" ? "Focus" : "Break"}</p>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={running ? pause : start}
              className="h-11 px-6 rounded-xl bg-teal-500 text-white font-semibold flex items-center gap-2 hover:bg-teal-600">
              {running ? <><Pause size={16} /> Pause</> : <><Play size={16} /> {left < total ? "Resume" : phase === "focus" ? "Start focus" : "Start break"}</>}
            </button>
            <button onClick={reset} aria-label="Reset timer" className="h-11 w-11 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground">
              <RotateCcw size={16} />
            </button>
            {phase === "break" && !running && (
              <button onClick={() => { setPhase("focus"); setLeft(length * 60); }} className="h-11 px-4 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground">Skip break</button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Stat value={`${today}`} label="min today" />
            <Stat value={`${streak(log)}`} label={streak(log) === 1 ? "day in a row" : "days in a row"} />
          </div>
          <div className={card}>
            <p className="text-sm font-bold text-foreground mb-3">Last 7 days</p>
            <div className="flex items-end gap-2 h-28">
              {days.map((d) => {
                const m = log[d] || 0;
                return (
                  <div key={d} className="flex-1 flex flex-col items-center gap-1 h-full justify-end" title={`${d}: ${m} min`}>
                    <div className="w-full rounded-md bg-teal-500/80" style={{ height: `${Math.max(m ? 6 : 2, (m / best) * 100)}%`, opacity: m ? 1 : 0.25 }} />
                    <span className="text-[10px] text-muted-foreground">{["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"][new Date(d + "T12:00").getDay()]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </ToolPage>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className={`${card} text-center`}>
      <p className="text-3xl font-extrabold text-foreground tabular-nums">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

function beep() {
  try {
    const ctx = new AudioContext();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = 880; g.gain.setValueAtTime(0.2, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.8);
  } catch { /* no sound available */ }
}
