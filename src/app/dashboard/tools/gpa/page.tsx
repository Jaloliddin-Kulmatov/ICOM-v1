"use client";

import React, { useState } from "react";
import { Calculator, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ToolPage, { card, field } from "@/components/tools/tool-page";
import { GRADES, gpaOf, neededFor, newId, useDeviceState, type Course, type Scale } from "@/lib/study-tools";

export default function GpaPage() {
  const [courses, setCourses] = useDeviceState<Course[]>("gpa_courses", []);
  const [scale, setScale] = useDeviceState<Scale>("gpa_scale", "4.5");
  const [target, setTarget] = useDeviceState<number>("gpa_target", 4.0);
  const [nextCredits, setNextCredits] = useDeviceState<number>("gpa_next_credits", 18);
  const [draft, setDraft] = useState({ name: "", credits: "3", grade: "A0" });

  const grades = GRADES[scale];
  const result = gpaOf(courses, scale);
  const max = Number(scale);
  const need = neededFor(target, result, nextCredits);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const credits = Number(draft.credits);
    if (!draft.name.trim() || !(credits > 0)) return;
    setCourses((cs) => [...cs, { id: newId(), name: draft.name.trim(), credits, grade: draft.grade }]);
    setDraft((d) => ({ ...d, name: "" }));
  };
  const update = (id: string, patch: Partial<Course>) => setCourses((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  return (
    <ToolPage icon={Calculator} tile="bg-fuchsia-500" title="GPA calculator"
      intro="Add your courses and grades. Most Korean universities use the 4.5 scale (A+ = 4.5); some, like Seoul National University, use 4.3. Pass/Fail courses don't count.">
      <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
        <div className={card}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-foreground">Courses</h2>
            <div role="radiogroup" aria-label="Scale" className="inline-flex p-0.5 rounded-lg border border-border text-xs font-semibold">
              {(["4.5", "4.3"] as Scale[]).map((s) => (
                <button key={s} role="radio" aria-checked={scale === s} onClick={() => setScale(s)}
                  className={`px-3 py-1 rounded-md ${scale === s ? "bg-fuchsia-500 text-white" : "text-muted-foreground hover:text-foreground"}`}>{s} scale</button>
              ))}
            </div>
          </div>

          {courses.length > 0 && (
            <div className="space-y-2 mb-4">
              {courses.map((c) => {
                // after switching scale, a grade the new scale lacks (A- on 4.5) stops counting until changed
                const valid = grades.some(([g]) => g === c.grade);
                return (
                  <div key={c.id} className="grid grid-cols-[1fr_4.5rem_5rem_2rem] gap-2 items-center">
                    <input aria-label="Course" value={c.name} onChange={(e) => update(c.id, { name: e.target.value })} className={field} />
                    <input aria-label="Credits" type="number" min={0.5} step={0.5} value={c.credits} onChange={(e) => update(c.id, { credits: Number(e.target.value) })} className={field} />
                    <select aria-label="Grade" value={valid ? c.grade : ""} onChange={(e) => update(c.id, { grade: e.target.value })} className={`${field} ${valid ? "" : "border-amber-500"}`}>
                      {!valid && <option value="">Pick</option>}
                      {grades.map(([g]) => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <button aria-label={`Remove ${c.name}`} onClick={() => setCourses((cs) => cs.filter((x) => x.id !== c.id))}
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10"><Trash2 size={15} /></button>
                  </div>
                );
              })}
            </div>
          )}

          <form onSubmit={add} className="grid grid-cols-[1fr_4.5rem_5rem_2rem] gap-2 items-center">
            <input aria-label="New course" placeholder="Course name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={field} />
            <input aria-label="New course credits" type="number" min={0.5} step={0.5} value={draft.credits} onChange={(e) => setDraft({ ...draft, credits: e.target.value })} className={field} />
            <select aria-label="New course grade" value={grades.some(([g]) => g === draft.grade) ? draft.grade : grades[1][0]} onChange={(e) => setDraft({ ...draft, grade: e.target.value })} className={field}>
              {grades.map(([g]) => <option key={g} value={g}>{g}</option>)}
            </select>
            <button type="submit" aria-label="Add course" className="h-8 w-8 rounded-lg flex items-center justify-center bg-fuchsia-500 text-white hover:bg-fuchsia-600"><Plus size={16} /></button>
          </form>
          {courses.length === 0 && <p className="text-xs text-muted-foreground mt-3">Add each course from your transcript, e.g. “Economics, 3 credits, A+”.</p>}
        </div>

        <div className="space-y-4">
          <div className={`${card} text-center`}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Your GPA</p>
            <p className="text-5xl font-extrabold text-foreground tabular-nums mt-2">{result.gpa === null ? "—" : result.gpa.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">out of {max} · {result.credits} credits</p>
          </div>
          <div className={card}>
            <p className="text-sm font-bold text-foreground mb-3">Reach a goal</p>
            <label className="text-xs text-muted-foreground">Goal GPA
              <input type="number" min={0} max={max} step={0.1} value={target} onChange={(e) => setTarget(Number(e.target.value))} className={`${field} mt-1`} />
            </label>
            <label className="text-xs text-muted-foreground block mt-3">Credits you'll take next
              <input type="number" min={1} step={1} value={nextCredits} onChange={(e) => setNextCredits(Number(e.target.value))} className={`${field} mt-1`} />
            </label>
            <p className="text-sm mt-4 text-foreground">
              {need === null ? "Enter the credits you'll take."
                : need <= 0 ? "You're already above this goal."
                : need > max ? `Not reachable next semester: you'd need ${need.toFixed(2)} on average.`
                : <>You need an average of <strong>{need.toFixed(2)}</strong> ({closestGrade(need, scale)} or better) on those credits.</>}
            </p>
          </div>
          {courses.length > 0 && (
            <Button variant="ghost" size="sm" className="w-full" onClick={() => { if (confirm("Remove all courses?")) setCourses([]); }}>Clear all courses</Button>
          )}
        </div>
      </div>
    </ToolPage>
  );
}

function closestGrade(points: number, scale: Scale): string {
  // the lowest grade whose points still reach the needed average
  const hit = [...GRADES[scale]].reverse().find(([, p]) => p >= points);
  return hit ? hit[0] : GRADES[scale][0][0];
}
