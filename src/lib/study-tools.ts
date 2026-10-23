"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";

// Study tools (GPA, timetable, deadlines, attendance, focus timer) keep their
// data in this browser only: nothing is sent to ICOM's server, and they work
// without an account. Every read and write is guarded, because storage can be
// off (private windows, blocked site data).

const PREFIX = "icom_tools_";

// One in-memory copy per key, so every component showing it agrees and quick
// back-to-back changes build on each other instead of racing.
const cache = new Map<string, unknown>();
const listeners = new Map<string, Set<() => void>>();

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function current<T>(key: string, fallback: T): T {
  if (!cache.has(key)) cache.set(key, read(key, fallback));
  return cache.get(key) as T;
}

function notify(key: string) {
  listeners.get(key)?.forEach((fn) => fn());
}

if (typeof window !== "undefined") {
  // another tab changed it
  window.addEventListener("storage", (e) => {
    if (!e.key?.startsWith(PREFIX)) return;
    const key = e.key.slice(PREFIX.length);
    cache.delete(key);
    notify(key);
  });
}

/** useState that is saved on this device and shared between components and tabs. */
export function useDeviceState<T>(key: string, initial: T): [T, (next: T | ((prev: T) => T)) => void] {
  const fallback = useRef(initial).current;
  const subscribe = useCallback((fn: () => void) => {
    if (!listeners.has(key)) listeners.set(key, new Set());
    listeners.get(key)!.add(fn);
    return () => { listeners.get(key)?.delete(fn); };
  }, [key]);
  // the server (and the first browser render) sees the fallback, so they match
  const value = useSyncExternalStore(subscribe, () => current(key, fallback), () => fallback);

  const update = useCallback((next: T | ((prev: T) => T)) => {
    const prev = current(key, fallback);
    const v = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
    cache.set(key, v);
    try { localStorage.setItem(PREFIX + key, JSON.stringify(v)); } catch { /* storage off: keep it for this visit */ }
    notify(key);
  }, [key, fallback]);

  return [value, update];
}

export const newId = () => Math.random().toString(36).slice(2, 10);

// ── GPA ──────────────────────────────────────────────────────────────────────

export type Scale = "4.5" | "4.3";
export type Course = { id: string; name: string; credits: number; grade: string };

/** Korean universities mostly use 4.5 (A+ = 4.5); some, like SNU, use 4.3. P/F courses don't count. */
export const GRADES: Record<Scale, [string, number][]> = {
  "4.5": [["A+", 4.5], ["A0", 4.0], ["B+", 3.5], ["B0", 3.0], ["C+", 2.5], ["C0", 2.0], ["D+", 1.5], ["D0", 1.0], ["F", 0]],
  "4.3": [["A+", 4.3], ["A0", 4.0], ["A-", 3.7], ["B+", 3.3], ["B0", 3.0], ["B-", 2.7], ["C+", 2.3], ["C0", 2.0], ["C-", 1.7], ["D+", 1.3], ["D0", 1.0], ["D-", 0.7], ["F", 0]],
};

export function gpaOf(courses: Course[], scale: Scale): { gpa: number | null; credits: number } {
  const points = Object.fromEntries(GRADES[scale]);
  let sum = 0, credits = 0;
  for (const c of courses) {
    if (!(c.grade in points) || !(c.credits > 0)) continue;
    sum += points[c.grade] * c.credits;
    credits += c.credits;
  }
  return { gpa: credits ? sum / credits : null, credits };
}

/** Average grade needed in the next `nextCredits` credits to reach `target`. */
export function neededFor(target: number, current: { gpa: number | null; credits: number }, nextCredits: number): number | null {
  if (!(nextCredits > 0)) return null;
  const have = (current.gpa ?? 0) * current.credits;
  return (target * (current.credits + nextCredits) - have) / nextCredits;
}

// ── Timetable ────────────────────────────────────────────────────────────────

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export const COLORS = ["bg-blue-500", "bg-emerald-500", "bg-orange-500", "bg-pink-500", "bg-sky-500", "bg-amber-500", "bg-teal-500", "bg-rose-500"];
export type ClassSlot = { id: string; name: string; day: number; start: string; end: string; room: string; color: string };

const minutes = (hhmm: string) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + (m || 0); };
/** Monday = 0 … Sunday = 6 */
export const todayIndex = (d = new Date()) => (d.getDay() + 6) % 7;

/** The class happening now, or the next one this week (wrapping to next week). */
export function nowAndNext(slots: ClassSlot[], at = new Date()): { now?: ClassSlot; next?: ClassSlot } {
  const day = todayIndex(at), t = at.getHours() * 60 + at.getMinutes();
  const now = slots.find((s) => s.day === day && minutes(s.start) <= t && t < minutes(s.end));
  const key = (s: ClassSlot) => (((s.day - day + 7) % 7) * 1440 + minutes(s.start) - t + 7 * 1440) % (7 * 1440);
  const next = slots.filter((s) => s !== now && key(s) > 0).sort((a, b) => key(a) - key(b))[0];
  return { now, next };
}

export const byTime = (a: ClassSlot, b: ClassSlot) => a.day - b.day || minutes(a.start) - minutes(b.start);

// ── Deadlines ────────────────────────────────────────────────────────────────

export type Task = { id: string; title: string; due: string; kind: "assignment" | "exam"; done: boolean };

export function daysLeft(due: string, from = new Date()): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const [y, m, d] = due.split("-").map(Number);
  return Math.round((new Date(y, m - 1, d).getTime() - a.getTime()) / 86_400_000);
}

export const whenLabel = (n: number) => (n < 0 ? `${-n}d late` : n === 0 ? "Today" : n === 1 ? "Tomorrow" : `In ${n} days`);

// ── Attendance ───────────────────────────────────────────────────────────────

/** Most Korean universities give an F at ¼ or more absences (1/4 이상 결석); often 3 lates = 1 absence.
 *  `limit` is the most absences still allowed, so it errs on the safe side. */
export type AttendanceCourse = { id: string; name: string; total: number; absent: number; late: number };

export function attendanceOf(c: AttendanceCourse) {
  const counted = c.absent + Math.floor(c.late / 3);
  const limit = Math.max(0, Math.ceil(c.total / 4) - 1);
  return { counted, limit, left: limit - counted, used: limit ? Math.min(1, counted / limit) : 0 };
}

// ── Focus timer ──────────────────────────────────────────────────────────────

export type FocusLog = Record<string, number>; // "2026-10-23" → focus minutes that day
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Days in a row (ending today, or yesterday if nothing yet today) with at least one focus session. */
export function streak(log: FocusLog, today = new Date()): number {
  const d = new Date(today);
  if (!log[dayKey(d)]) d.setDate(d.getDate() - 1);
  let n = 0;
  while (log[dayKey(d)]) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
