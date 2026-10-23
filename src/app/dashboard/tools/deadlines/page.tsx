"use client";

import React, { useState } from "react";
import { Check, ListChecks, Plus, Trash2 } from "lucide-react";
import ToolPage, { card, field } from "@/components/tools/tool-page";
import { daysLeft, newId, useDeviceState, whenLabel, type Task } from "@/lib/study-tools";

export default function DeadlinesPage() {
  const [tasks, setTasks] = useDeviceState<Task[]>("tasks", []);
  const [draft, setDraft] = useState<{ title: string; due: string; kind: Task["kind"] }>({ title: "", due: "", kind: "assignment" });
  const [error, setError] = useState("");

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim() || !draft.due) { setError("Add a name and a due date."); return; }
    setTasks((ts) => [...ts, { id: newId(), title: draft.title.trim(), due: draft.due, kind: draft.kind, done: false }]);
    setDraft((d) => ({ ...d, title: "" }));
    setError("");
  };
  const toggle = (id: string) => setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const open = tasks.filter((t) => !t.done).sort((a, b) => a.due.localeCompare(b.due));
  const done = tasks.filter((t) => t.done).sort((a, b) => b.due.localeCompare(a.due));

  const row = (t: Task) => {
    const n = daysLeft(t.due);
    const urgent = !t.done && n <= 2;
    return (
      <li key={t.id} className="group flex items-center gap-3 py-2.5 border-t border-border first:border-0">
        <button role="checkbox" aria-checked={t.done} aria-label={`Mark ${t.title} ${t.done ? "not done" : "done"}`} onClick={() => toggle(t.id)}
          className={`h-5 w-5 shrink-0 rounded-full flex items-center justify-center ${t.done ? "bg-orange-500 text-white" : "border-2 border-muted-foreground/40 hover:border-orange-500"}`}>
          {t.done && <Check size={12} strokeWidth={3} />}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-sm truncate ${t.done ? "line-through text-muted-foreground" : "text-foreground font-medium"}`}>{t.title}</p>
          <p className="text-[11px] text-muted-foreground">{t.kind === "exam" ? "Exam" : "Assignment"} · {t.due}</p>
        </div>
        <span className={`text-xs font-semibold shrink-0 ${t.done ? "text-muted-foreground" : n < 0 ? "text-red-600" : urgent ? "text-orange-600" : "text-muted-foreground"}`}>
          {t.done ? "Done" : whenLabel(n)}
        </span>
        <button aria-label={`Delete ${t.title}`} onClick={() => setTasks((ts) => ts.filter((x) => x.id !== t.id))}
          className="p-1 rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-red-500"><Trash2 size={14} /></button>
      </li>
    );
  };

  return (
    <ToolPage icon={ListChecks} tile="bg-orange-500" title="Assignments & exams"
      intro="Write down every due date and exam. The closest ones stay on top.">
      <form onSubmit={add} className={`${card} grid gap-3 sm:grid-cols-[1fr_10rem_9rem_auto] items-end`}>
        <label className="text-xs text-muted-foreground">What
          <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="e.g. Marketing report" className={`${field} mt-1`} />
        </label>
        <label className="text-xs text-muted-foreground">Due
          <input type="date" value={draft.due} onChange={(e) => setDraft({ ...draft, due: e.target.value })} className={`${field} mt-1`} />
        </label>
        <label className="text-xs text-muted-foreground">Type
          <select value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as Task["kind"] })} className={`${field} mt-1`}>
            <option value="assignment">Assignment</option>
            <option value="exam">Exam</option>
          </select>
        </label>
        <button type="submit" className="h-10 px-4 rounded-xl bg-orange-500 text-white text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-orange-600">
          <Plus size={15} /> Add
        </button>
        {error && <p role="alert" className="text-xs text-red-600 sm:col-span-4">{error}</p>}
      </form>

      <div className={`${card} mt-5`}>
        <h2 className="text-sm font-bold text-foreground mb-1">To do ({open.length})</h2>
        {open.length ? <ul>{open.map(row)}</ul> : <p className="text-sm text-muted-foreground py-2">Nothing due. Nice.</p>}
      </div>
      {done.length > 0 && (
        <div className={`${card} mt-4`}>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-bold text-foreground">Done ({done.length})</h2>
            <button onClick={() => setTasks((ts) => ts.filter((t) => !t.done))} className="text-xs text-muted-foreground hover:text-foreground">Clear done</button>
          </div>
          <ul>{done.map(row)}</ul>
        </div>
      )}
    </ToolPage>
  );
}
