"use client";

import React, { useState } from "react";
import Navbar from "@/components/layout/navbar";
import Link from "next/link";
import { Home, ChevronDown, ChevronRight, ExternalLink, AlertCircle, ArrowLeft, MapPin, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const sections = [
  {
    title: "University Dormitories (기숙사)",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    items: [
      {
        q: "How do I apply for JBNU dormitory?",
        a: "Apply online through the JBNU Dormitory Office portal (https://dorm.jbnu.ac.kr) when applications open — usually 1–2 months before each semester. International students get priority in the first-year allocation. Required documents: enrollment certificate, passport copy, and dormitory application form."
      },
      {
        q: "What does the JBNU dorm cost?",
        a: "Approx. ₩250,000–₩450,000 per month depending on room type (2-person or single) and meal plan. Utilities are included. Rooms come furnished with a bed, desk, and wardrobe."
      },
      {
        q: "Are there dorm rules I should know?",
        a: "Quiet hours are typically 11pm–7am. Guests of the opposite gender are generally restricted to common areas. Cooking in rooms is not allowed — use the common kitchen. Curfews vary by dormitory — check the specific building's rules when you move in."
      },
      {
        q: "What if the dorm is full?",
        a: "If you don't get a dormitory spot, common alternatives near JBNU are: off-campus gosiwon (고시원, from ₩250,000/mo), one-room apartments (원룸, ₩300,000–₩600,000/mo + deposit), or goshitels (고시텔). The Deokjin-gu and Jeonju Station areas have many student-friendly housing options."
      },
    ]
  },
  {
    title: "Off-Campus Housing",
    color: "text-blue-500 dark:text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    items: [
      {
        q: "What is a one-room (원룸)?",
        a: "A one-room is a small studio apartment — the most common off-campus option for students. It typically includes a small kitchen, bathroom, and sleeping/living area. Rent ranges from ₩300,000–₩600,000/month, usually with a deposit (보증금) of ₩1,000,000–₩5,000,000."
      },
      {
        q: "What is jeonse (전세)?",
        a: "Jeonse is a uniquely Korean lease system where you pay a large lump-sum deposit (often 40–70% of property value) and live rent-free for 1–2 years, getting the deposit back at the end. It's common for longer stays but requires significant capital upfront."
      },
      {
        q: "What is a gosiwon (고시원)?",
        a: "A gosiwon is a small private room (often 3–5㎡) in a shared building with communal bathrooms and sometimes a shared kitchen. Very affordable (₩200,000–₩350,000/mo, often all-inclusive), popular with students on a tight budget."
      },
      {
        q: "How do I find housing near JBNU?",
        a: "Useful apps and sites: Naver Real Estate (네이버 부동산), Zigbang (직방), Dabang (다방). For English-friendly listings, check the JBNU International Student Facebook group and the ICOM community board. The area around JBNU's main gate (정문) has many options."
      },
    ]
  },
  {
    title: "Lease Contracts & Utilities",
    color: "text-violet-500 dark:text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    items: [
      {
        q: "What should I check before signing a lease?",
        a: "1) Verify the landlord actually owns the property (등기부등본 — property register, available at any government office for ₩1,000). 2) Confirm the deposit amount and refund conditions. 3) Check what utilities are included. 4) Confirm the move-in and move-out dates. If you don't read Korean, ask a Korean-speaking friend or the JBNU International Office for help."
      },
      {
        q: "How do I set up utilities (electricity, gas, internet)?",
        a: "Electricity and gas are usually set up by the landlord. Internet: KT, SKT, or LG Uplus all have plans from ₩20,000–₩30,000/mo. You'll need your ARC to sign up. Many gosiwons and one-room apartments include Wi-Fi in the rent."
      },
    ]
  },
];

const priceTable = [
  { type: "Dorm (JBNU)", range: "₩250K–₩450K/mo", note: "Utilities included, on-campus" },
  { type: "Gosiwon", range: "₩200K–₩350K/mo", note: "Tiny private room, shared bath" },
  { type: "One-room", range: "₩300K–₩600K/mo", note: "+ deposit ₩1M–₩5M" },
  { type: "Goshitel", range: "₩300K–₩500K/mo", note: "Better than gosiwon, small kitchen" },
  { type: "Two-room", range: "₩500K–₩800K/mo", note: "+ deposit, good for sharing" },
];

export default function HousingPage() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <div className="border-b border-border bg-gradient-to-b from-emerald-500/5 to-transparent">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
            <Link href="/support" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors">
              <ArrowLeft size={13} /> Back to Support
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <Home size={18} className="text-emerald-500" />
              </div>
              <div>
                <Badge variant="violet" className="text-[10px] mb-1">8 guides</Badge>
                <h1 className="text-2xl font-bold text-foreground">Housing & Accommodation</h1>
              </div>
            </div>
            <p className="text-muted-foreground text-sm mt-2">Dorms, one-rooms, gosiwons, lease contracts, and everything about finding a home near JBNU in Jeonju.</p>
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
                <strong className="text-foreground">Tip:</strong> Always get a Korean-speaking person to help review a lease contract before signing. The JBNU International Student Support Center can sometimes help.
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                <DollarSign size={12} className="text-muted-foreground" /> Price Guide (Jeonju)
              </h3>
              <div className="space-y-2.5">
                {priceTable.map(r => (
                  <div key={r.type}>
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-foreground">{r.type}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">{r.range}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{r.note}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                <MapPin size={12} className="text-muted-foreground" /> Useful Areas Near JBNU
              </h3>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                {[
                  "JBNU Main Gate (정문) area",
                  "Deokjin-gu (덕진구)",
                  "Hyoja-dong (효자동)",
                  "Jeonju Station area",
                  "Jeonju Hanok Village nearby",
                ].map(area => (
                  <div key={area} className="flex gap-2">
                    <span className="text-muted-foreground/40">·</span>
                    <span>{area}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-xs font-semibold text-foreground mb-3">Housing Apps</h3>
              <div className="space-y-2">
                {[
                  { name: "Zigbang (직방)", url: "https://www.zigbang.com" },
                  { name: "Dabang (다방)", url: "https://www.dabangapp.com" },
                  { name: "Naver Real Estate", url: "https://land.naver.com" },
                ].map(app => (
                  <a key={app.name} href={app.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between group">
                    <span className="text-xs text-indigo-500 dark:text-indigo-400 group-hover:underline">{app.name}</span>
                    <ExternalLink size={10} className="text-muted-foreground/40" />
                  </a>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">
              <h3 className="text-xs font-semibold text-foreground mb-1">JBNU Dorm Applications</h3>
              <p className="text-xs text-muted-foreground mb-3">Apply through the official JBNU dormitory portal.</p>
              <a href="https://dorm.jbnu.ac.kr" target="_blank" rel="noopener noreferrer"
                className="text-xs px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 inline-flex items-center gap-1 hover:bg-blue-500/15 transition-colors">
                JBNU Dorm Portal <ChevronRight size={11} />
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
