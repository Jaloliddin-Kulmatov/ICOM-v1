"use client";

import React, { useState } from "react";
import Navbar from "@/components/layout/navbar";
import Link from "next/link";
import {
  Shield, ChevronDown, ExternalLink, AlertCircle,
  CheckCircle2, ArrowLeft, Clock, ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const sections = [
  {
    title: "National Health Insurance (NHIS) Enrollment",
    color: "text-rose-500 dark:text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    items: [
      {
        q: "Am I automatically enrolled in Korean health insurance?",
        a: "Yes — all international students enrolled full-time at a Korean university are automatically enrolled in the National Health Insurance Service (NHIS / 국민건강보험) from March 2019 onward. You will receive a health insurance card by mail. Monthly premiums are around ₩80,000–130,000 and are deducted from your bank account. You can check your enrollment status at nhis.or.kr."
      },
      {
        q: "How much do I pay for NHIS as a student?",
        a: "The monthly premium for international students (지역가입자 foreign subscriber) is calculated based on income and assets. For most students with no Korean income, it's a fixed estimated premium of approximately ₩80,000–130,000/month. You may qualify for a reduction if you have low income — visit the NHIS office with your ARC and enrollment certificate to apply."
      },
      {
        q: "How do I pay my NHIS premiums?",
        a: "NHIS will send a payment notice (고지서) to your address or email. Pay at any convenience store (CU, GS25, 7-Eleven) using the payment slip, or set up automatic bank transfer (자동이체) through the NHIS website or your bank. Unpaid premiums accumulate — set up auto-pay to avoid issues."
      },
      {
        q: "What if I was disenrolled from NHIS?",
        a: "If you took a leave of absence or had a gap in enrollment, you may lose NHIS coverage. Re-enroll by visiting the local NHIS branch (국민건강보험공단) with your ARC, passport, and re-enrollment certificate from your university. Coverage resumes from the re-enrollment date."
      },
    ]
  },
  {
    title: "Using Korean Hospitals & Clinics",
    color: "text-pink-500 dark:text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-500/20",
    items: [
      {
        q: "How does the Korean healthcare system work?",
        a: "Korea uses a tiered system: (1) 의원 (Clinic/GP) — for minor issues like colds, basic check-ups. Cost with NHIS: ₩3,000–8,000. (2) 병원 (Hospital) — for more serious conditions, needs referral. (3) 대학병원 (University Hospital) — advanced treatment, specialist care. Always start at a local clinic and get a referral if needed to avoid higher co-pays."
      },
      {
        q: "What do I say at the doctor? Do they speak English?",
        a: "Most clinics near universities have some English ability. Download the 1339 Health Information app or call 1339 (Medical Tourism Helpline, available 24/7 in English, Chinese, Japanese). You can also use Naver Papago to translate symptoms. Show the doctor your NHIS card (건강보험증) or ARC, and they'll look up your insurance."
      },
      {
        q: "How much does a hospital visit cost with insurance?",
        a: "With NHIS, you pay only 20–30% of the total cost (co-payment). Example: a clinic visit for flu → total cost ₩15,000, you pay ₩3,000–5,000. Medicine at the pharmacy (약국): you pay ₩3,000–10,000 after insurance. Emergency room visits: ₩30,000–80,000 co-pay. Always bring your NHIS card and ARC."
      },
      {
        q: "Can I use NHIS at dental and eye clinics?",
        a: "NHIS covers basic dental treatments: tooth extraction, fillings, and cleanings. Cosmetic dental work (whitening, braces) is not covered. Eye exams are partially covered; glasses and contacts are not. For a basic dental check-up + cleaning, expect to pay ₩10,000–30,000 with insurance."
      },
    ]
  },
  {
    title: "English-Friendly Clinics in Jeonju",
    color: "text-indigo-500 dark:text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    items: [
      {
        q: "Which hospitals near JBNU have English support?",
        a: "1) Chonbuk National University Hospital (전북대학교병원) — JBNU's university hospital, has an international patient center. Tel: 063-250-1114. 2) Jeonju Jesus Hospital (예수병원) — English speakers on staff. Tel: 063-230-8114. 3) JBNU Health Center (건강관리소) — basic care on campus, cheapest option. For after-hours emergencies, go to any hospital's ER (응급실)."
      },
      {
        q: "What is the 1339 Health Helpline?",
        a: "Call 1339 (24/7, free) for medical advice, translation assistance, and hospital referrals in English, Chinese, Vietnamese, and more. They can connect you with an interpreter while you're at the hospital. Also available via the MOHW (Ministry of Health and Welfare) app."
      },
      {
        q: "Where do I fill a prescription in Korea?",
        a: "Take your prescription (처방전) from the doctor to any 약국 (pharmacy). In Korea, pharmacies are everywhere — look for the green cross sign. They dispense medication based on the prescription, explain dosage, and usually have someone who speaks basic English. No prescription is needed for common OTC medicines (pain relievers, cold medicine, antacids)."
      },
    ]
  },
  {
    title: "Mental Health & Emergency Care",
    color: "text-violet-500 dark:text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    items: [
      {
        q: "Are there English mental health resources in Korea?",
        a: "Yes. 1) Seoul Global Center — free English counseling: 02-2075-4180. 2) Korea Suicide Prevention Hotline (한국자살예방센터): 1393 (24/7). 3) Crisis Text Line Korea: text 'HELLO' to 741741. 4) JBNU Student Counseling Center (학생상담센터) — free sessions for enrolled students, some English support. 5) Mind Spa Korea — private English therapy online."
      },
      {
        q: "What do I do in a medical emergency?",
        a: "Call 119 (free, 24/7) — equivalent to 911. Say 'English please' — they have multilingual operators. If you can move, go to the nearest hospital 응급실 (Emergency Room). Bring your ARC and NHIS card. Emergency costs are covered by NHIS with a co-pay. For non-life-threatening issues, avoid the ER and visit a clinic the next day."
      },
      {
        q: "Does NHIS cover ambulance services?",
        a: "Yes. Calling 119 for an ambulance is free. The ambulance takes you to the nearest appropriate hospital. Emergency treatment is covered by NHIS (you pay 20–30% co-pay). Keep your NHIS card and ARC easily accessible in your phone case or wallet."
      },
    ]
  },
];

const quickLinks = [
  { label: "NHIS Official (English)", url: "https://www.nhis.or.kr/nhis/english/index.do", note: "Check coverage, premiums, enrollment" },
  { label: "MOHW Health Info (1339)", url: "https://www.mohw.go.kr/eng", note: "Medical helpline 24/7 in English" },
  { label: "JBNU University Hospital", url: "https://hosp.jbnu.ac.kr", note: "International patient center" },
  { label: "Korea Medical Tourism", url: "https://www.medicalkorea.or.kr/eng", note: "Find English-speaking hospitals" },
  { label: "Mind Spa Korea (English Therapy)", url: "https://www.mindspakorea.com", note: "Online therapy in English" },
];

const coverage = [
  { label: "GP / Clinic visit", cost: "₩3,000–8,000" },
  { label: "Hospital visit", cost: "₩10,000–30,000" },
  { label: "University hospital", cost: "₩30,000–80,000" },
  { label: "Emergency room", cost: "₩30,000–100,000" },
  { label: "Prescription medicine", cost: "₩3,000–15,000" },
  { label: "Basic dental", cost: "₩10,000–30,000" },
  { label: "Monthly NHIS premium", cost: "₩80,000–130,000" },
];

export default function InsurancePage() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <div className="border-b border-border bg-gradient-to-b from-rose-500/5 to-transparent">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
            <Link href="/support" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors">
              <ArrowLeft size={13} /> Back to Support
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                <Shield size={18} className="text-rose-500" />
              </div>
              <div>
                <Badge variant="default" className="text-[10px] mb-1">7 guides</Badge>
                <h1 className="text-2xl font-bold text-foreground">Health Insurance</h1>
              </div>
            </div>
            <p className="text-muted-foreground text-sm mt-2">NHIS enrollment, using Korean hospitals, English-friendly clinics, dental, mental health, and emergency care.</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
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

            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 flex gap-3">
              <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-foreground/70 leading-relaxed">
                <strong className="text-foreground">Emergency?</strong> Call <strong className="text-red-400">119</strong> for ambulance / fire. Call <strong className="text-red-400">1339</strong> for medical advice in English. Call <strong className="text-red-400">112</strong> for police.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                <Clock size={12} className="text-muted-foreground" /> Your Co-pay with NHIS
              </h3>
              <div className="space-y-2 text-xs">
                {coverage.map(r => (
                  <div key={r.label} className="flex justify-between text-muted-foreground">
                    <span>{r.label}</span>
                    <span className="text-foreground font-medium">{r.cost}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 pt-2 border-t border-border">*Approximate amounts with NHIS coverage</p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-xs font-semibold text-foreground mb-3">Official Links</h3>
              <div className="space-y-3">
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
              <h3 className="text-xs font-semibold text-foreground mb-1">Set up auto-pay for NHIS</h3>
              <p className="text-xs text-muted-foreground mb-3">Missed NHIS payments accumulate interest. Set up automatic payment from your bank account to stay covered.</p>
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
