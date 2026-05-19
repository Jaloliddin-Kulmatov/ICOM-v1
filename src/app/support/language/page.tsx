"use client";

import React, { useState } from "react";
import Navbar from "@/components/layout/navbar";
import Link from "next/link";
import {
  BookOpen, ChevronDown, ExternalLink, AlertCircle,
  CheckCircle2, ArrowLeft, ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const sections = [
  {
    title: "Learning Hangul (한글) — Start Here",
    color: "text-cyan-500 dark:text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    items: [
      {
        q: "How long does it take to learn Hangul (the Korean alphabet)?",
        a: "Most people can learn to read and write Hangul in 2–7 days with focused practice. Hangul is phonetic and very logical — each block represents a syllable. Start with the 14 basic consonants and 10 basic vowels, then practice combining them. By the end of the week you'll be able to read menus, bus signs, and basic words even if you don't understand the meaning yet."
      },
      {
        q: "What is the best resource to learn Hangul quickly?",
        a: "Top free resources: (1) Talk To Me In Korean (talktomeinkorean.com) — Level 1 Hangul lessons, very clear and fun. (2) Sejong Hakdang (sejonghakdang.org) — free government-sponsored Korean lessons from A1 to C2, entirely free. (3) How to Study Korean (howtostudykorean.com) — comprehensive written lessons. (4) YouTube: 'Korean with Miss Oh' and 'Go Billy Korean' for beginner Hangul."
      },
      {
        q: "What are the essential survival Korean phrases?",
        a: "Hello: 안녕하세요 (annyeonghaseyo). Thank you: 감사합니다 (gamsahamnida). Excuse me: 저기요 (jeogiyo). How much is this?: 얼마예요? (eolmayeyo?). Where is the toilet?: 화장실이 어디예요? (hwajangsiri eodiyeyo?). I don't understand: 모르겠어요 (moreugesseoyo). Please give me this: 이거 주세요 (igeo juseyo). Help!: 도와주세요! (dowajuseyo)."
      },
    ]
  },
  {
    title: "TOPIK Exam (한국어능력시험)",
    color: "text-indigo-500 dark:text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    items: [
      {
        q: "What is TOPIK and why does it matter?",
        a: "TOPIK (Test of Proficiency in Korean) is the official Korean language certification exam. Levels: TOPIK I (beginner, Levels 1–2) and TOPIK II (intermediate-advanced, Levels 3–6). Why it matters: some universities require TOPIK 3+ for degree programs, Korean employers value TOPIK 4–5+, and it helps with certain visa applications and residency."
      },
      {
        q: "How do I register for the TOPIK exam?",
        a: "Register at the official TOPIK website: topik.go.kr. Steps: (1) Create an account, (2) Select your exam location (Jeonju has a test center), (3) Choose the exam date, (4) Pay the registration fee (₩35,000 for TOPIK I, ₩45,000 for TOPIK II). Exams are held approximately 6 times per year globally. Registration opens 2–3 months before each exam."
      },
      {
        q: "How do I prepare for TOPIK?",
        a: "Best TOPIK prep resources: (1) TOPIK GUIDE (topikguide.com) — free past papers, vocabulary lists, and study plans. (2) Korean TOPIK (koreantopik.com) — past papers with answer explanations. (3) JBNU Language Center (한국어교육원) — prep courses offered each semester. (4) Anki flashcards for TOPIK vocabulary — search 'TOPIK 어휘' on Anki web. Practice past papers under timed conditions."
      },
      {
        q: "What TOPIK level do I need for my degree program?",
        a: "Requirements vary by university and program: JBNU Korean-language programs generally require TOPIK 3 (intermediate). Graduate programs often require TOPIK 4. English-medium programs at JBNU may not require TOPIK at all. Check your specific program requirements at international.jbnu.ac.kr. Some programs allow English proficiency (TOEFL/IELTS) instead."
      },
    ]
  },
  {
    title: "Free Korean Courses & Classes",
    color: "text-emerald-500 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    items: [
      {
        q: "What free Korean classes are available at or near JBNU?",
        a: "1) JBNU Language Education Center (한국어교육원) — credit and non-credit Korean courses for international students. Registration at the start of each semester. 2) Jeonju Multicultural Family Support Center (다문화가족지원센터) — free Korean classes for foreigners, all levels. 3) Community Service Learning Korean courses — some offer free tutoring by Korean students. Ask the International Student Office for the latest schedule."
      },
      {
        q: "What is Sejong Hakdang and is it really free?",
        a: "Yes — Sejong Hakdang (세종학당, sejong.kr) is funded by the Korean government and offers 100% free online Korean courses from complete beginner (A1) to advanced (C2). Courses include video lessons, interactive exercises, and instructor feedback. Sign up at sejonghakdang.org. There are also physical Sejong Institute locations worldwide if you want in-person classes back home."
      },
      {
        q: "Are there free Korean courses on YouTube?",
        a: "Excellent free YouTube channels: (1) Talk To Me In Korean (TTMIK) — most popular, beginner to advanced, very fun. (2) Go Billy Korean — detailed grammar explanations, great for self-study. (3) 안녕하세요 Korean (Korean Language Lab) — grammar-focused. (4) Motivate Korean — conversational Korean for daily life. (5) Prof. Oh's Korean — academic and formal Korean for students."
      },
    ]
  },
  {
    title: "Language Apps",
    color: "text-violet-500 dark:text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    items: [
      {
        q: "What are the best apps to learn Korean?",
        a: "Top apps: (1) Duolingo (free) — great for Hangul and beginner vocabulary, gamified and fun. (2) Pimsleur (paid, ~$15/month) — audio-based, perfect for speaking and listening. (3) Drops (partly free) — vocabulary with spaced repetition and beautiful UI. (4) LingoDeer (partly free) — best grammar explanation of any app. (5) Anki (free) — flashcards with spaced repetition, download Korean decks for TOPIK vocab."
      },
      {
        q: "What translation apps work best in Korea?",
        a: "1) Naver Papago (파파고) — best Korean ↔ any language translator, specifically trained on Korean. Has camera translation for menus and signs, voice translation, and conversation mode. 2) Google Translate — good but not as accurate as Papago for Korean nuances. 3) Kakao Translate — good for quick lookups. Install Papago first — it's the gold standard in Korea."
      },
      {
        q: "What is the best Korean dictionary app?",
        a: "1) Naver Dictionary (네이버 사전) — best overall: Korean-English, hanja, example sentences, pronunciation. Tap any word in the app for instant lookup. 2) Daum Dictionary (다음 사전) — similar quality, good alternative. 3) KO-Dictionary — simple and clean UI for quick lookups. 4) NAVER's 'Papago' app combines translation + dictionary."
      },
    ]
  },
  {
    title: "Language Exchange & Practice",
    color: "text-rose-500 dark:text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    items: [
      {
        q: "How do I find a Korean language exchange partner?",
        a: "Best ways to find a partner: (1) JBNU Korean Language Exchange Club (언어교환 동아리) — join on the Community page. (2) Tandem app (tandem.net) — find native Korean speakers wanting to learn your language. (3) HelloTalk app — similar to Tandem, built-in translation features. (4) Reddit r/languagelearning exchange. (5) Post on JBNU international student Facebook groups. Most Korean university students are eager to practice English."
      },
      {
        q: "Where can I practice speaking Korean in Jeonju?",
        a: "1) JBNU campus cafeteria and convenience stores — order in Korean for daily practice. 2) Hanok Village (한옥마을) — vendors are patient with foreigners. 3) Jeonju Multicultural Center hosts language exchange events — check their schedule. 4) Join clubs where Korean students participate. 5) Convenience store staff (GS25, CU) are usually friendly practice partners for simple phrases."
      },
    ]
  },
];

const quickLinks = [
  { label: "TOPIK Official Registration", url: "https://www.topik.go.kr", note: "Register for Korean proficiency exam" },
  { label: "Sejong Hakdang (Free Courses)", url: "https://www.sejonghakdang.org", note: "Govt-funded A1–C2 Korean courses" },
  { label: "Talk To Me In Korean", url: "https://talktomeinkorean.com", note: "Best beginner-to-advanced resource" },
  { label: "How to Study Korean", url: "https://www.howtostudykorean.com", note: "Free comprehensive Korean grammar" },
  { label: "TOPIK GUIDE (Past Papers)", url: "https://www.topikguide.com", note: "Free past papers & study guides" },
  { label: "Naver Dictionary", url: "https://dict.naver.com/korendict", note: "Best Korean-English dictionary" },
  { label: "Tandem Language Exchange", url: "https://www.tandem.net", note: "Find Korean conversation partners" },
  { label: "Anki (Flashcards)", url: "https://apps.ankiweb.net", note: "Spaced repetition for TOPIK vocab" },
];

const levels = [
  { level: "TOPIK 1–2", desc: "Beginner — basic daily life topics" },
  { level: "TOPIK 3–4", desc: "Intermediate — most programs require 3+" },
  { level: "TOPIK 5–6", desc: "Advanced — academic & professional use" },
  { level: "Level 4+", desc: "For Korean-medium degree programs" },
  { level: "Level 5–6", desc: "For Korean government jobs / F-2 visa" },
];

export default function LanguagePage() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <div className="border-b border-border bg-gradient-to-b from-cyan-500/5 to-transparent">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
            <Link href="/support" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors">
              <ArrowLeft size={13} /> Back to Support
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 flex items-center justify-center">
                <BookOpen size={18} className="text-cyan-500" />
              </div>
              <div>
                <Badge variant="cyan" className="text-[10px] mb-1">9 guides</Badge>
                <h1 className="text-2xl font-bold text-foreground">Korean Language</h1>
              </div>
            </div>
            <p className="text-muted-foreground text-sm mt-2">Learn Hangul, ace the TOPIK exam, find language exchange partners, and discover the best free apps and websites for learning Korean.</p>
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

            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 flex gap-3">
              <AlertCircle size={16} className="text-cyan-500 shrink-0 mt-0.5" />
              <p className="text-xs text-foreground/70 leading-relaxed">
                <strong className="text-foreground">Quick start:</strong> Learn Hangul this week → Download Duolingo + Papago → Join JBNU Language Exchange Club → Take Sejong Hakdang A1 course (all free!). You&apos;ll have conversational basics within 3 months.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-xs font-semibold text-foreground mb-3">TOPIK Level Reference</h3>
              <div className="space-y-2.5 text-xs">
                {levels.map(r => (
                  <div key={r.level}>
                    <span className="font-semibold text-foreground">{r.level}</span>
                    <p className="text-muted-foreground">{r.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-xs font-semibold text-foreground mb-3">Free Resources</h3>
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
              <h3 className="text-xs font-semibold text-foreground mb-1">Best free Korean resource</h3>
              <p className="text-xs text-muted-foreground mb-3">Sejong Hakdang offers structured A1–C2 courses funded by the Korean government — completely free. Start at sejonghakdang.org today.</p>
              <Link href="/community" className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 hover:bg-emerald-500/15 transition-colors">
                Join Language Exchange <ChevronRight size={11} />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
