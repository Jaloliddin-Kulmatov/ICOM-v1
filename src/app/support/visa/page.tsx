"use client";

import React, { useState } from "react";
import Navbar from "@/components/layout/navbar";
import Link from "next/link";
import { FileText, ChevronDown, ChevronRight, ExternalLink, AlertCircle, CheckCircle2, ArrowLeft, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const sections = [
  {
    title: "D-2 Student Visa",
    color: "text-blue-500 dark:text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    items: [
      {
        q: "What is a D-2 visa?",
        a: "The D-2 (Student) visa is for international students enrolled in a degree program (undergraduate, graduate, doctoral) at a Korean university accredited by the Korean government. It is typically valid for 1–2 years and can be renewed."
      },
      {
        q: "How do I extend my D-2 visa?",
        a: "Apply at your local Immigration Office (출입국·외국인청) at least 4 weeks before expiry. Bring: passport, ARC card, enrollment certificate (재학증명서), tuition payment receipt, and application fee (₩60,000). At JBNU the nearest office is Jeonju Immigration Office (전주출입국·외국인사무소)."
      },
      {
        q: "What documents does JBNU require for D-2?",
        a: "Standard documents: acceptance letter, proof of tuition payment, passport copy, photo, health certificate, and financial statement showing at least USD 10,000 (or equivalent). Contact the JBNU International Office at +82-63-270-2023 for the latest checklist."
      },
      {
        q: "Can I work part-time on a D-2 visa?",
        a: "Yes, but you need a part-time work permit (시간제취업허가). You can work up to 20 hours/week during semester and full-time during vacation. Apply at the Immigration Office with your ARC, enrollment certificate, and permission letter from your university."
      },
    ]
  },
  {
    title: "D-4 Language Visa",
    color: "text-indigo-500 dark:text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    items: [
      {
        q: "Who needs a D-4 visa?",
        a: "Students enrolled in a Korean language program (어학당) at a university or language institute. Typically valid for 6 months to 1 year, renewable. Most students upgrade to D-2 once they enter a degree program."
      },
      {
        q: "Can I convert D-4 to D-2?",
        a: "Yes. Once you are accepted into a degree program, apply for a visa status change at the Immigration Office. You'll need your acceptance letter, enrollment proof, and financial documents. This can usually be done in Korea without leaving."
      },
    ]
  },
  {
    title: "ARC (Alien Registration Card)",
    color: "text-violet-500 dark:text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    items: [
      {
        q: "When do I need to register for an ARC?",
        a: "If you stay in Korea for more than 90 days, you must register within 90 days of arrival. Apply at the Immigration Office with your passport, visa, enrollment certificate, 1 photo, and application fee (₩30,000)."
      },
      {
        q: "Why is the ARC important?",
        a: "The ARC acts as your Korean ID. You need it to open a bank account, sign up for mobile plans, get health insurance, sign a rental contract, and many other essential tasks."
      },
      {
        q: "What if I lose my ARC?",
        a: "Report to the nearest police station first, then go to the Immigration Office with your passport and a police report to apply for a replacement. Fee is ₩30,000."
      },
    ]
  },
  {
    title: "Visa Status Changes & Re-entry",
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    items: [
      {
        q: "Can I travel outside Korea and come back on my student visa?",
        a: "Yes. As long as your visa is still valid and you have an ARC, you can re-enter. If your visa expires while abroad, you'll need a new visa from a Korean consulate in your home country before returning."
      },
      {
        q: "What is a re-entry permit?",
        a: "If you leave Korea for more than 1 year, your ARC is automatically cancelled. For stays abroad less than 1 year, your ARC remains valid. You do not need a formal re-entry permit for short trips."
      },
    ]
  },
];

const quickLinks = [
  { label: "Jeonju Immigration Office", url: "https://www.hikorea.go.kr", note: "전북 전주시 완산구" },
  { label: "Hi Korea (Online Application)", url: "https://www.hikorea.go.kr", note: "hikorea.go.kr" },
  { label: "JBNU International Office", url: "https://international.jbnu.ac.kr", note: "+82-63-270-2023" },
];

export default function VisaPage() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <div className="border-b border-border bg-gradient-to-b from-blue-500/5 to-transparent">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
            <Link href="/support" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors">
              <ArrowLeft size={13} /> Back to Support
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                <FileText size={18} className="text-blue-500" />
              </div>
              <div>
                <Badge variant="violet" className="text-[10px] mb-1">12 guides</Badge>
                <h1 className="text-2xl font-bold text-foreground">Visa & Immigration</h1>
              </div>
            </div>
            <p className="text-muted-foreground text-sm mt-2">Everything about D-2, D-4, ARC registration, extensions, and status changes in Korea.</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {sections.map(section => (
              <div key={section.title} className={`rounded-2xl border ${section.border} ${section.bg} overflow-hidden`}>
                <div className="px-5 py-3.5 border-b border-inherit">
                  <h2 className={`text-sm font-bold ${section.color}`}>{section.title}</h2>
                </div>
                <div className="divide-y divide-border/50">
                  {section.items.map(item => (
                    <div key={item.q} className="bg-card/60">
                      <button
                        className="w-full flex items-center justify-between px-5 py-3.5 text-left gap-3 hover:bg-muted/30 transition-colors"
                        onClick={() => setOpen(open === item.q ? null : item.q)}
                      >
                        <span className="text-sm font-medium text-foreground">{item.q}</span>
                        <ChevronDown size={15} className={`text-muted-foreground shrink-0 transition-transform ${open === item.q ? "rotate-180" : ""}`} />
                      </button>
                      {open === item.q && (
                        <div className="px-5 pb-4">
                          <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex gap-3">
              <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-foreground/70 leading-relaxed">
                <strong className="text-foreground">Disclaimer:</strong> Immigration rules change frequently. Always verify current requirements at the official Hi Korea website or your university&apos;s international office before applying.
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                <Clock size={12} className="text-muted-foreground" /> Processing Times
              </h3>
              <div className="space-y-2 text-xs">
                {[
                  { label: "D-2 Extension", time: "2–4 weeks" },
                  { label: "ARC Registration", time: "3–7 days" },
                  { label: "Status Change", time: "2–3 weeks" },
                  { label: "Part-time Permit", time: "1–2 weeks" },
                ].map(r => (
                  <div key={r.label} className="flex justify-between text-muted-foreground">
                    <span>{r.label}</span>
                    <span className="text-foreground font-medium">{r.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-xs font-semibold text-foreground mb-3">Quick Links</h3>
              <div className="space-y-2">
                {quickLinks.map(l => (
                  <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-start justify-between gap-2 group">
                    <div>
                      <p className="text-xs font-medium text-indigo-500 dark:text-indigo-400 group-hover:underline">{l.label}</p>
                      <p className="text-[10px] text-muted-foreground">{l.note}</p>
                    </div>
                    <ExternalLink size={11} className="text-muted-foreground/40 mt-0.5 shrink-0" />
                  </a>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
              <CheckCircle2 size={16} className="text-emerald-500 mb-2" />
              <h3 className="text-xs font-semibold text-foreground mb-1">Need personal help?</h3>
              <p className="text-xs text-muted-foreground mb-3">Ask the AI assistant or browse the FAQ for quick answers.</p>
              <Link href="/support/faq" className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 hover:bg-emerald-500/15 transition-colors">
                Go to FAQ <ChevronRight size={11} />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
