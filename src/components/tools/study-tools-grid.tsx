"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Calculator, CalendarDays, ListChecks, Timer, UserCheck } from "lucide-react";
import {
  DAYS, attendanceOf, byTime, daysLeft, dayKey, gpaOf, streak, todayIndex, useDeviceState, whenLabel,
  type AttendanceCourse, type ClassSlot, type Course, type FocusLog, type Scale, type Task,
} from "@/lib/study-tools";

// Cards for the study tools. Each shows the student's own data from this
// device, or a faded example until they add something.

const Box = ({ children, example }: { children: React.ReactNode; example?: boolean }) => (
  <div className="relative rounded-xl border border-border bg-background/60 p-4">
    {example && <span className="absolute top-2 right-2 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground/70">Example</span>}
    <div className={example ? "opacity-55" : ""}>{children}</div>
  </div>
);

const EXAMPLE_SLOTS: ClassSlot[] = [
  { id: "a", name: "Economics", day: 0, start: "09:00", end: "10:30", room: "", color: "bg-blue-500" },
  { id: "b", name: "Korean", day: 0, start: "13:00", end: "14:30", room: "", color: "bg-emerald-500" },
  { id: "c", name: "Statistics", day: 1, start: "10:30", end: "12:00", room: "", color: "bg-pink-500" },
  { id: "d", name: "Economics", day: 2, start: "09:00", end: "10:30", room: "", color: "bg-blue-500" },
  { id: "e", name: "Marketing", day: 2, start: "15:00", end: "16:30", room: "", color: "bg-orange-500" },
  { id: "f", name: "Statistics", day: 3, start: "10:30", end: "12:00", room: "", color: "bg-pink-500" },
  { id: "g", name: "Korean", day: 3, start: "13:00", end: "14:30", room: "", color: "bg-emerald-500" },
  { id: "h", name: "Seminar", day: 4, start: "11:00", end: "13:00", room: "", color: "bg-sky-500" },
];

function TimetablePreview() {
  const [slots] = useDeviceState<ClassSlot[]>("timetable", []);
  const shown = slots.length ? slots : EXAMPLE_SLOTS;
  const days = shown.some((s) => s.day === 5) ? DAYS : DAYS.slice(0, 5);
  const [today, setToday] = useState(-1);
  useEffect(() => setToday(todayIndex()), []);
  return (
    <Box example={!slots.length}>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
        {days.map((d, i) => (
          <div key={d} className="min-w-0">
            <p className={`text-[10px] font-semibold text-center mb-1.5 ${i === today ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground"}`}>{d}</p>
            <div className={`rounded-lg p-1 space-y-1 min-h-[76px] ${i === today ? "bg-indigo-500/8" : "bg-muted/40"}`}>
              {shown.filter((s) => s.day === i).sort(byTime).slice(0, 3).map((s) => (
                <div key={s.id} title={`${s.name} ${s.start}`} className={`${s.color} rounded-md h-5 px-1.5 text-[9px] leading-5 text-white font-semibold truncate`}>{s.name}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Box>
  );
}

function GpaPreview() {
  const [courses] = useDeviceState<Course[]>("gpa_courses", []);
  const [scale] = useDeviceState<Scale>("gpa_scale", "4.5");
  const [target] = useDeviceState<number>("gpa_target", 4.0);
  const { gpa } = gpaOf(courses, scale);
  const example = gpa === null;
  const value = example ? 3.82 : gpa!;
  const max = Number(example ? "4.5" : scale);
  const r = 28, c = 2 * Math.PI * r;
  return (
    <Box example={example}>
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 68 68" className="h-[68px] w-[68px] shrink-0 -rotate-90" aria-hidden>
          <circle cx="34" cy="34" r={r} fill="none" strokeWidth="7" className="stroke-muted" />
          <circle cx="34" cy="34" r={r} fill="none" strokeWidth="7" strokeLinecap="round" className="stroke-fuchsia-500" strokeDasharray={`${(value / max) * c} ${c}`} />
        </svg>
        <div>
          <p className="text-3xl font-extrabold text-foreground leading-none tabular-nums">{value.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">out of {max} · goal {(example ? 4.0 : target).toFixed(1)}</p>
        </div>
      </div>
    </Box>
  );
}

const EXAMPLE_TASKS: Task[] = [
  { id: "a", title: "Marketing report", due: "", kind: "assignment", done: false },
  { id: "b", title: "Statistics midterm", due: "", kind: "exam", done: false },
  { id: "c", title: "Korean quiz", due: "", kind: "exam", done: true },
];

function DeadlinesPreview() {
  const [tasks] = useDeviceState<Task[]>("tasks", []);
  const open = tasks.filter((t) => !t.done).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 3);
  const example = !open.length;
  const rows = example ? EXAMPLE_TASKS : open;
  return (
    <Box example={example}>
      <div className="space-y-2">
        {rows.map((t, i) => (
          <div key={t.id} className="flex items-center gap-2.5">
            <span className={`h-4 w-4 shrink-0 rounded-full ${t.done ? "bg-orange-500" : "border-2 border-muted-foreground/30"}`} />
            <span className={`flex-1 text-xs truncate ${t.done ? "line-through text-muted-foreground" : "text-foreground"}`}>{t.title}</span>
            <span className="text-[10px] text-muted-foreground shrink-0">{example ? ["Today", "In 4 days", "Done"][i] : whenLabel(daysLeft(t.due))}</span>
          </div>
        ))}
      </div>
    </Box>
  );
}

function FocusPreview() {
  const [log] = useDeviceState<FocusLog>("focus_log", {});
  const today = log[dayKey()] || 0;
  const days = streak(log);
  const example = !Object.keys(log).length;
  const r = 26, c = 2 * Math.PI * r;
  return (
    <Box example={example}>
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 64 64" className="h-16 w-16 shrink-0 -rotate-90" aria-hidden>
          <circle cx="32" cy="32" r={r} fill="none" strokeWidth="6" className="stroke-muted" />
          <circle cx="32" cy="32" r={r} fill="none" strokeWidth="6" strokeLinecap="round" className="stroke-teal-500"
            strokeDasharray={`${Math.min(1, (example ? 75 : today) / 120) * c} ${c}`} />
        </svg>
        <div>
          <p className="text-2xl font-extrabold text-foreground leading-none">{example ? 3 : days} {(example ? 3 : days) === 1 ? "day" : "days"}</p>
          <p className="text-xs text-muted-foreground mt-1">in a row · {example ? 75 : today} min today</p>
        </div>
      </div>
    </Box>
  );
}

const EXAMPLE_ATT: AttendanceCourse[] = [
  { id: "a", name: "Economics", total: 30, absent: 1, late: 0 },
  { id: "b", name: "Statistics", total: 30, absent: 5, late: 0 },
  { id: "c", name: "Korean", total: 30, absent: 7, late: 0 },
];

function AttendancePreview() {
  const [courses] = useDeviceState<AttendanceCourse[]>("attendance", []);
  const example = !courses.length;
  const rows = (example ? EXAMPLE_ATT : courses).slice(0, 3);
  return (
    <Box example={example}>
      <div className="space-y-2.5">
        {rows.map((c) => {
          const a = attendanceOf(c);
          const bar = a.used >= 1 ? "bg-red-500" : a.used >= 0.6 ? "bg-amber-500" : "bg-emerald-500";
          return (
            <div key={c.id}>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="font-medium text-foreground truncate">{c.name}</span>
                <span className="text-muted-foreground shrink-0">{a.counted} of {a.limit} allowed</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className={`h-full rounded-full ${bar}`} style={{ width: `${Math.max(4, a.used * 100)}%` }} /></div>
            </div>
          );
        })}
      </div>
    </Box>
  );
}

const TOOLS = [
  { slug: "timetable", title: "Class timetable", icon: CalendarDays, tile: "bg-blue-500", wide: true, preview: <TimetablePreview />,
    text: "Your weekly classes, with the class happening now and the next one." },
  { slug: "gpa", title: "GPA calculator", icon: Calculator, tile: "bg-fuchsia-500", preview: <GpaPreview />,
    text: "Korean 4.5 (or 4.3) scale. See what grades you need for your goal." },
  { slug: "deadlines", title: "Assignments & exams", icon: ListChecks, tile: "bg-orange-500", preview: <DeadlinesPreview />,
    text: "Due dates and how many days are left." },
  { slug: "focus", title: "Focus timer", icon: Timer, tile: "bg-teal-500", preview: <FocusPreview />,
    text: "25-minute study sessions, minutes per day and your streak." },
  { slug: "attendance", title: "Attendance", icon: UserCheck, tile: "bg-rose-500", preview: <AttendancePreview />,
    text: "Absences per class. Missing ¼ of classes usually means an F." },
];

export default function StudyToolsGrid({ compact }: { compact?: boolean }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${compact ? "gap-4" : "gap-5"}`}>
      {TOOLS.map((tool) => {
        const Icon = tool.icon;
        return (
          <Link key={tool.slug} href={`/dashboard/tools/${tool.slug}`}
            className={`group flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 sm:p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:border-foreground/15 ${tool.wide ? "md:col-span-2" : ""}`}>
            <div className="flex items-center gap-3">
              <span className={`h-10 w-10 rounded-2xl ${tool.tile} text-white flex items-center justify-center shadow-sm shrink-0`}><Icon size={19} /></span>
              <h3 className="flex-1 text-base font-bold text-foreground">{tool.title}</h3>
              <ArrowRight size={17} className="text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
            </div>
            <div className="flex-1">{tool.preview}</div>
            <p className="text-sm text-muted-foreground leading-relaxed">{tool.text}</p>
          </Link>
        );
      })}
      <div className="rounded-3xl border border-dashed border-border p-6 flex flex-col items-center justify-center text-center gap-1.5">
        <p className="text-sm font-semibold text-foreground">Saved on this device only</p>
        <p className="text-xs text-muted-foreground max-w-[16rem]">Your classes, grades and deadlines never leave this browser. No account needed.</p>
      </div>
    </div>
  );
}
