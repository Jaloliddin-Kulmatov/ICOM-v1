"use client";

import React, { useEffect, useState } from "react";
import { CalendarDays, MapPin, Plus, Trash2 } from "lucide-react";
import ToolPage, { card, field } from "@/components/tools/tool-page";
import { COLORS, DAYS, byTime, newId, nowAndNext, todayIndex, useDeviceState, type ClassSlot } from "@/lib/study-tools";

const EMPTY = { name: "", day: 0, start: "09:00", end: "10:30", room: "" };

export default function TimetablePage() {
  const [slots, setSlots] = useDeviceState<ClassSlot[]>("timetable", []);
  const [draft, setDraft] = useState(EMPTY);
  const [error, setError] = useState("");
  const [clock, setClock] = useState<Date | null>(null);

  useEffect(() => {   // after mount only, so the server render and the browser agree
    setClock(new Date());
    const t = setInterval(() => setClock(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) { setError("Add the class name."); return; }
    if (draft.end <= draft.start) { setError("The class has to end after it starts."); return; }
    // same name keeps the same colour, so one course looks the same every day
    const same = slots.find((s) => s.name.toLowerCase() === draft.name.trim().toLowerCase());
    const color = same?.color || COLORS[new Set(slots.map((s) => s.name.toLowerCase())).size % COLORS.length];
    setSlots((ss) => [...ss, { ...draft, id: newId(), name: draft.name.trim(), room: draft.room.trim(), color }]);
    setDraft((d) => ({ ...EMPTY, day: d.day, start: d.end, end: addMinutes(d.end, 90) }));
    setError("");
  };

  const { now, next } = clock ? nowAndNext(slots, clock) : {};
  const days = slots.some((s) => s.day === 5) ? DAYS : DAYS.slice(0, 5);
  const today = clock ? todayIndex(clock) : -1;

  return (
    <ToolPage icon={CalendarDays} tile="bg-blue-500" title="Class timetable"
      intro="Add each class once and it repeats every week. The class happening now and the next one show at the top.">
      {slots.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 mb-5">
          <Status label="Now" slot={now} empty="No class right now" />
          <Status label="Next" slot={next} empty="Nothing else this week" />
        </div>
      )}

      <div className={`${card} overflow-x-auto`}>
        <div className="grid gap-2 min-w-[560px]" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
          {days.map((d, i) => (
            <div key={d}>
              <p className={`text-xs font-bold text-center mb-2 ${i === today ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`}>{d}</p>
              <div className={`rounded-xl p-1.5 space-y-1.5 min-h-[140px] ${i === today ? "bg-blue-500/8" : "bg-muted/40"}`}>
                {slots.filter((s) => s.day === i).sort(byTime).map((s) => (
                  <div key={s.id} className={`group relative ${s.color} rounded-lg px-2 py-1.5 text-white`}>
                    <p className="text-xs font-bold truncate pr-4">{s.name}</p>
                    <p className="text-[10px] opacity-90">{s.start}–{s.end}</p>
                    {s.room && <p className="text-[10px] opacity-90 truncate">{s.room}</p>}
                    <button aria-label={`Remove ${s.name} on ${d}`} onClick={() => setSlots((ss) => ss.filter((x) => x.id !== s.id))}
                      className="absolute top-1 right-1 p-0.5 rounded opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-black/20"><Trash2 size={12} /></button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={add} className={`${card} mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_0.7fr_0.7fr_1fr_auto] items-end`}>
        <label className="text-xs text-muted-foreground">Class
          <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Economics" className={`${field} mt-1`} />
        </label>
        <label className="text-xs text-muted-foreground">Day
          <select value={draft.day} onChange={(e) => setDraft({ ...draft, day: Number(e.target.value) })} className={`${field} mt-1`}>
            {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
          </select>
        </label>
        <label className="text-xs text-muted-foreground">Starts
          <input type="time" value={draft.start} onChange={(e) => setDraft({ ...draft, start: e.target.value })} className={`${field} mt-1`} />
        </label>
        <label className="text-xs text-muted-foreground">Ends
          <input type="time" value={draft.end} onChange={(e) => setDraft({ ...draft, end: e.target.value })} className={`${field} mt-1`} />
        </label>
        <label className="text-xs text-muted-foreground">Room
          <input value={draft.room} onChange={(e) => setDraft({ ...draft, room: e.target.value })} placeholder="e.g. 상과대학 201" className={`${field} mt-1`} />
        </label>
        <button type="submit" className="h-10 px-4 rounded-xl bg-blue-500 text-white text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-blue-600">
          <Plus size={15} /> Add
        </button>
        {error && <p role="alert" className="text-xs text-red-600 sm:col-span-2 lg:col-span-6">{error}</p>}
      </form>
    </ToolPage>
  );
}

function Status({ label, slot, empty }: { label: string; slot?: ClassSlot; empty: string }) {
  return (
    <div className={card}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      {slot ? (
        <div className="flex items-center gap-3 mt-2">
          <span className={`h-9 w-1.5 rounded-full ${slot.color}`} />
          <div>
            <p className="text-base font-bold text-foreground">{slot.name}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {DAYS[slot.day]} {slot.start}–{slot.end}{slot.room && <><MapPin size={11} className="ml-1" />{slot.room}</>}
            </p>
          </div>
        </div>
      ) : <p className="text-sm text-muted-foreground mt-2">{empty}</p>}
    </div>
  );
}

function addMinutes(hhmm: string, mins: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  const t = Math.min(23 * 60 + 59, h * 60 + m + mins);
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}
