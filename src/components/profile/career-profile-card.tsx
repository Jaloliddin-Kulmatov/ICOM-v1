"use client";

import React, { useEffect, useState } from "react";
import { Briefcase, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { CITIES, JOB_FIELDS, TOPIK_LEVELS, daysUntil } from "@/lib/profile-options";

const inputCls =
  "w-full h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

/** Visa expiry, TOPIK, field and city: used for job matching and visa reminders. */
export default function CareerProfileCard() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ visa_expiry: "", topik_level: "", job_field: "", city: "" });
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    setForm({
      visa_expiry: user.visa_expiry || "",
      topik_level: user.topik_level == null ? "" : String(user.topik_level),
      job_field: user.job_field || "",
      city: user.city || "",
    });
  }, [user]);

  if (!user) return null;
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));
  const days = daysUntil(form.visa_expiry);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("saving"); setError("");
    const { error: err } = await api.patch("/auth/me", {
      ...form,
      topik_level: form.topik_level === "" ? null : Number(form.topik_level),
    });
    if (err) { setError(err); setState("idle"); return; }
    refreshUser();
    setState("saved");
    setTimeout(() => setState("idle"), 2500);
  };

  return (
    <form onSubmit={save} className="p-5 rounded-2xl border border-border bg-card space-y-4" aria-labelledby="career-title">
      <div className="flex items-start gap-3">
        <span className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0">
          <Briefcase size={17} />
        </span>
        <div>
          <h2 id="career-title" className="text-sm font-bold text-foreground">Career & visa</h2>
          <p className="text-xs text-muted-foreground">Used to match internships to you and to remind you before your visa expires. Only you see this.</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="block text-xs font-semibold text-foreground/80 mb-1">Visa expiry date</span>
          <input id="career-visa-expiry" type="date" className={inputCls} value={form.visa_expiry} onChange={set("visa_expiry")} />
          {days != null && (
            <span className={`block text-xs mt-1 ${days < 0 ? "text-red-600" : days <= 60 ? "text-coral-600" : "text-muted-foreground"}`}>
              {days < 0 ? "This date has passed." : `${days} days left. We'll email you at 90, 60, 30 and 7 days.`}
            </span>
          )}
        </label>
        <label className="block">
          <span className="block text-xs font-semibold text-foreground/80 mb-1">Korean level</span>
          <select id="career-topik" className={inputCls} value={form.topik_level} onChange={set("topik_level")}>
            <option value="">Not set</option>
            {TOPIK_LEVELS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="block text-xs font-semibold text-foreground/80 mb-1">Field you want to work in</span>
          <select id="career-field" className={inputCls} value={form.job_field} onChange={set("job_field")}>
            <option value="">Any field</option>
            {JOB_FIELDS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="block text-xs font-semibold text-foreground/80 mb-1">City you want to work in</span>
          <select id="career-city" className={inputCls} value={form.city} onChange={set("city")}>
            <option value="">Anywhere in Korea</option>
            {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={state === "saving"} className="gap-1.5">
          {state === "saving" ? <Loader2 size={14} className="animate-spin" /> : state === "saved" ? <Check size={14} /> : null}
          {state === "saved" ? "Saved" : "Save"}
        </Button>
        {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
      </div>
    </form>
  );
}
