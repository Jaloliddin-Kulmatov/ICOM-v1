"use client";

import React, { useState } from "react";
import { Minus, Plus, Trash2, UserCheck } from "lucide-react";
import ToolPage, { card, field } from "@/components/tools/tool-page";
import { attendanceOf, newId, useDeviceState, type AttendanceCourse } from "@/lib/study-tools";

export default function AttendancePage() {
  const [courses, setCourses] = useDeviceState<AttendanceCourse[]>("attendance", []);
  const [draft, setDraft] = useState({ name: "", total: "30" });

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const total = Number(draft.total);
    if (!draft.name.trim() || !(total > 0)) return;
    setCourses((cs) => [...cs, { id: newId(), name: draft.name.trim(), total, absent: 0, late: 0 }]);
    setDraft((d) => ({ ...d, name: "" }));
  };
  const bump = (id: string, key: "absent" | "late", by: number) =>
    setCourses((cs) => cs.map((c) => (c.id === id ? { ...c, [key]: Math.max(0, c[key] + by) } : c)));

  return (
    <ToolPage icon={UserCheck} tile="bg-rose-500" title="Attendance"
      intro="At most Korean universities, missing ¼ or more of a course's classes means an automatic F, and often 3 lates count as 1 absence. Rules differ, so check your syllabus. Low attendance can also cause problems when you extend your D-2 visa.">
      <form onSubmit={add} className={`${card} grid gap-3 sm:grid-cols-[1fr_11rem_auto] items-end`}>
        <label className="text-xs text-muted-foreground">Course
          <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Statistics" className={`${field} mt-1`} />
        </label>
        <label className="text-xs text-muted-foreground">Classes this semester
          <input type="number" min={1} value={draft.total} onChange={(e) => setDraft({ ...draft, total: e.target.value })} className={`${field} mt-1`} />
        </label>
        <button type="submit" className="h-10 px-4 rounded-xl bg-rose-500 text-white text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-rose-600">
          <Plus size={15} /> Add
        </button>
        <p className="text-[11px] text-muted-foreground sm:col-span-3">Two classes a week for 15 weeks is 30 classes.</p>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 mt-5">
        {courses.map((c) => {
          const a = attendanceOf(c);
          const tone = a.left < 0 ? "red" : a.left <= 1 ? "amber" : "emerald";
          const bar = { red: "bg-red-500", amber: "bg-amber-500", emerald: "bg-emerald-500" }[tone];
          const text = { red: "text-red-600", amber: "text-amber-600", emerald: "text-emerald-600" }[tone];
          return (
            <div key={c.id} className={card}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-base font-bold text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.total} classes · F at {a.limit + 1} absences</p>
                </div>
                <button aria-label={`Remove ${c.name}`} onClick={() => setCourses((cs) => cs.filter((x) => x.id !== c.id))}
                  className="p-1 rounded-lg text-muted-foreground hover:text-red-500"><Trash2 size={14} /></button>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden mt-3"><div className={`h-full rounded-full ${bar}`} style={{ width: `${Math.max(3, a.used * 100)}%` }} /></div>
              <p className={`text-sm font-semibold mt-2 ${text}`}>
                {a.left < 0 ? `Over the limit by ${-a.left}. Talk to your professor now.`
                  : a.left === 0 ? "At the limit: one more absence means F."
                  : `You can miss ${a.left} more ${a.left === 1 ? "class" : "classes"}.`}
              </p>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <Counter label="Absences" one="absence" value={c.absent} onChange={(by) => bump(c.id, "absent", by)} />
                <Counter label="Lates" one="late arrival" value={c.late} onChange={(by) => bump(c.id, "late", by)} />
              </div>
            </div>
          );
        })}
      </div>
      {courses.length === 0 && <p className="text-sm text-muted-foreground mt-5">Add your courses to start counting.</p>}
    </ToolPage>
  );
}

function Counter({ label, one, value, onChange }: { label: string; one: string; value: number; onChange: (by: number) => void }) {
  const btn = "h-8 w-8 rounded-lg border border-border flex items-center justify-center text-foreground hover:bg-muted disabled:opacity-40";
  return (
    <div className="rounded-xl bg-muted/40 p-2 flex items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground pl-1">{label}</span>
      <div className="flex items-center gap-2">
        <button aria-label={`Remove one ${one}`} className={btn} disabled={value === 0} onClick={() => onChange(-1)}><Minus size={14} /></button>
        <span className="w-5 text-center text-sm font-bold tabular-nums" aria-live="polite">{value}</span>
        <button aria-label={`Add one ${one}`} className={btn} onClick={() => onChange(1)}><Plus size={14} /></button>
      </div>
    </div>
  );
}
