"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Send } from "lucide-react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { CITIES } from "@/lib/profile-options";

const FIELD = "w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50";
const KOREAN = ["Not needed", "Basic", "Conversational", "Fluent"];
const EMPTY = { title: "", company: "", location: "", pay: "", schedule: "", korean: "", contact: "", description: "" };

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-foreground">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Students share a part-time job they know about; an admin checks it before it's shown. */
export default function SharePartTimeJob() {
  const { user, loading } = useAuth();
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));
  const ready = form.title.trim() && form.company.trim() && form.location && form.pay.trim() && form.contact.trim();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    const { data, error: err } = await api.post<{ message: string }>("/admin/jobs/submit", form);
    setBusy(false);
    if (data) setDone(data.message); else setError(err || "Couldn't send it. Please try again.");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16 pb-20 md:pb-0">
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-10">
          <Link href="/internships?kind=part-time" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft size={14} /> Part-time jobs
          </Link>
          <h1 className="text-2xl font-bold text-foreground mb-1">Share a part-time job</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Know a place that hires international students? Share it here. An ICOM admin checks every post before other students see it.
          </p>

          {loading ? null : !user ? (
            <div className="glass-card p-6 text-center space-y-3">
              <p className="text-sm text-foreground">Sign in to share a part-time job.</p>
              <Link href="/login?force=1"><Button>Sign in</Button></Link>
            </div>
          ) : done ? (
            <div className="glass-card p-6 text-center space-y-3">
              <CheckCircle2 size={28} className="mx-auto text-emerald-500" />
              <p className="text-sm text-foreground">{done}</p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => { setForm(EMPTY); setDone(""); }}>Share another</Button>
                <Link href="/internships?kind=part-time"><Button>Back to part-time jobs</Button></Link>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="glass-card p-6 space-y-4">
              {error && <div role="alert" className="px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-500">{error}</div>}
              <Field id="title" label="Job title *"><Input id="title" value={form.title} onChange={set("title")} maxLength={120} placeholder="e.g. Café staff (weekends)" required /></Field>
              <Field id="company" label="Place / employer *"><Input id="company" value={form.company} onChange={set("company")} maxLength={100} placeholder="e.g. Bean Café near JBNU" required /></Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field id="location" label="City *">
                  <select id="location" value={form.location} onChange={set("location")} className={`${FIELD} h-10`} required>
                    <option value="">Choose a city</option>
                    {CITIES.filter((c) => c !== "Remote").map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field id="pay" label="Pay *"><Input id="pay" value={form.pay} onChange={set("pay")} maxLength={60} placeholder="e.g. ₩10,500 / hour" required /></Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field id="schedule" label="Days and hours"><Input id="schedule" value={form.schedule} onChange={set("schedule")} maxLength={120} placeholder="e.g. Sat–Sun 10:00–18:00" /></Field>
                <Field id="korean" label="Korean needed">
                  <select id="korean" value={form.korean} onChange={set("korean")} className={`${FIELD} h-10`}>
                    <option value="">Not sure</option>
                    {KOREAN.map((k) => <option key={k} value={k}>{k}</option>)}
                  </select>
                </Field>
              </div>
              <Field id="contact" label="How to apply *" hint="A link (KakaoTalk open chat, job post, website) or short instructions like “Visit the shop and ask for the manager”.">
                <Input id="contact" value={form.contact} onChange={set("contact")} maxLength={300} placeholder="https://open.kakao.com/... or how to apply" required />
              </Field>
              <Field id="description" label="Details">
                <textarea id="description" value={form.description} onChange={set("description")} maxLength={2000} rows={5}
                  placeholder="What the work is, who it suits, anything students should know" className={FIELD} />
              </Field>
              <p className="text-[11px] text-muted-foreground">
                Please don&apos;t share personal phone numbers of other people. Posts that break the community rules are rejected.
              </p>
              <Button type="submit" size="lg" className="w-full gap-2" disabled={busy || !ready}>
                {busy ? "Sending…" : <><Send size={15} /> Send for review</>}
              </Button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
