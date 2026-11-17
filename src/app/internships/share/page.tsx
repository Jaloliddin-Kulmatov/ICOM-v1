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
import { useQueryState } from "@/hooks/use-query-state";
import { CITIES } from "@/lib/profile-options";
import { SHAREABLE, kindInfo, kindOf, type Kind } from "@/lib/opportunity-kinds";

const FIELD = "w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50";
const KOREAN = ["Not needed", "Basic", "Conversational", "Fluent"];
const EMPTY = { title: "", company: "", location: "", pay: "", schedule: "", korean: "", contact: "", description: "", deadline: "", eligibility: "" };

// Words that change with the kind; part-time keeps its original form.
const COPY: Record<Kind, { title: string; titleHint: string; org: string; orgHint: string; pay: string; payHint: string }> = {
  "part-time": { title: "Job title", titleHint: "e.g. Café staff (weekends)", org: "Place / employer", orgHint: "e.g. Bean Café near JBNU", pay: "Pay", payHint: "e.g. ₩10,500 / hour" },
  scholarship: { title: "Scholarship name", titleHint: "e.g. International student excellence scholarship", org: "Offered by", orgHint: "e.g. JBNU Office of International Affairs", pay: "Amount", payHint: "e.g. 50% tuition, ₩2,000,000" },
  contest: { title: "Contest name", titleHint: "e.g. Korean speech contest for foreign students", org: "Organized by", orgHint: "e.g. Jeonbuk Global Center", pay: "Prize", payHint: "e.g. ₩1,000,000 first prize" },
  program: { title: "Program name", titleHint: "e.g. Startup camp for international students", org: "Run by", orgHint: "e.g. Jeonbuk Creative Economy Center", pay: "Cost or support", payHint: "e.g. Free, with certificate" },
  internship: { title: "Title", titleHint: "", org: "Company", orgHint: "", pay: "Pay", payHint: "" },
};

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-foreground">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Students share an opportunity they know about; an admin checks it before it's shown. */
export default function ShareOpportunity() {
  const { user, loading } = useAuth();
  const [kindParam, setKindParam] = useQueryState("kind", "part-time");
  const kind = SHAREABLE.includes(kindOf(kindParam)) ? kindOf(kindParam) : "part-time";
  const info = kindInfo(kind);
  const copy = COPY[kind];
  const partTime = kind === "part-time";
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));
  const ready = form.title.trim() && form.company.trim() && form.contact.trim() && (partTime ? form.location && form.pay.trim() : true);
  const back = `/opportunities?kind=${kind}`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    const { data, error: err } = await api.post<{ message: string }>("/admin/jobs/submit", { ...form, kind });
    setBusy(false);
    if (data) setDone(data.message); else setError(err || "Couldn't send it. Please try again.");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16 pb-20 md:pb-0">
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-10">
          <Link href={back} className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft size={14} /> {info.label}
          </Link>
          <h1 className="text-2xl font-bold text-foreground mb-1">Share an opportunity</h1>
          <p className="text-sm text-muted-foreground mb-5">
            Know something international students can apply for? Share it here. An ICOM admin checks every post before other students see it.
          </p>

          <div role="radiogroup" aria-label="What are you sharing?" className="flex flex-wrap gap-1.5 mb-5">
            {SHAREABLE.map((k) => (
              <button key={k} type="button" role="radio" aria-checked={k === kind} onClick={() => setKindParam(k)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  k === kind ? "bg-indigo-600 text-white border-indigo-600" : "bg-card text-muted-foreground border-border hover:text-foreground"}`}>
                {kindInfo(k).label === "Part-time" ? "Part-time job" : kindInfo(k).label.replace(/s$/, "")}
              </button>
            ))}
          </div>

          {loading ? null : !user ? (
            <div className="glass-card p-6 text-center space-y-3">
              <p className="text-sm text-foreground">Sign in to share {info.a}.</p>
              <Link href="/login?force=1"><Button>Sign in</Button></Link>
            </div>
          ) : done ? (
            <div className="glass-card p-6 text-center space-y-3">
              <CheckCircle2 size={28} className="mx-auto text-emerald-500" />
              <p className="text-sm text-foreground">{done}</p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => { setForm(EMPTY); setDone(""); }}>Share another</Button>
                <Link href={back}><Button>Back to {info.many}</Button></Link>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="glass-card p-6 space-y-4">
              {error && <div role="alert" className="px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-500">{error}</div>}
              <Field id="title" label={`${copy.title} *`}><Input id="title" value={form.title} onChange={set("title")} maxLength={120} placeholder={copy.titleHint} required /></Field>
              <Field id="company" label={`${copy.org} *`}><Input id="company" value={form.company} onChange={set("company")} maxLength={100} placeholder={copy.orgHint} required /></Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field id="location" label={partTime ? "City *" : "Where"}>
                  <select id="location" value={form.location} onChange={set("location")} className={`${FIELD} h-10`} required={partTime}>
                    <option value="">{partTime ? "Choose a city" : "Anywhere in Korea"}</option>
                    {CITIES.filter((c) => partTime ? c !== "Remote" : true).map((c) => <option key={c} value={c}>{c === "Remote" ? "Online" : c}</option>)}
                  </select>
                </Field>
                <Field id="pay" label={partTime ? `${copy.pay} *` : copy.pay}><Input id="pay" value={form.pay} onChange={set("pay")} maxLength={60} placeholder={copy.payHint} required={partTime} /></Field>
              </div>
              {partTime ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field id="schedule" label="Days and hours"><Input id="schedule" value={form.schedule} onChange={set("schedule")} maxLength={120} placeholder="e.g. Sat–Sun 10:00–18:00" /></Field>
                  <Field id="korean" label="Korean needed">
                    <select id="korean" value={form.korean} onChange={set("korean")} className={`${FIELD} h-10`}>
                      <option value="">Not sure</option>
                      {KOREAN.map((k) => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </Field>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field id="deadline" label="Deadline"><Input id="deadline" type="date" value={form.deadline} onChange={set("deadline")} /></Field>
                  <Field id="eligibility" label="Who can apply"><Input id="eligibility" value={form.eligibility} onChange={set("eligibility")} maxLength={120} placeholder="e.g. D-2 students, TOPIK 4+" /></Field>
                </div>
              )}
              <Field id="contact" label="How to apply *" hint={partTime
                ? "A link (KakaoTalk open chat, job post, website) or short instructions like “Visit the shop and ask for the manager”."
                : "The official page or application form, so students can check the details themselves."}>
                <Input id="contact" value={form.contact} onChange={set("contact")} maxLength={300} placeholder={partTime ? "https://open.kakao.com/... or how to apply" : "https://..."} required />
              </Field>
              <Field id="description" label="Details">
                <textarea id="description" value={form.description} onChange={set("description")} maxLength={2000} rows={5}
                  placeholder={partTime ? "What the work is, who it suits, anything students should know" : "What it offers, what you need to send, anything students should know"} className={FIELD} />
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
