"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/navbar";
import {
  FileText, Home, CreditCard, Shield, Train, BookOpen,
  ArrowRight, Sparkles, Search, Clock, ThumbsUp, ChevronRight, ChevronDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const categories = [
  {
    id: "visa",
    icon: FileText,
    title: "Visa & Immigration",
    description: "D-2, D-4, extensions, ARC card, and status changes",
    color: "from-blue-500 to-indigo-500",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    guides: 12,
    popular: true,
  },
  {
    id: "housing",
    icon: Home,
    title: "Housing & Accommodation",
    description: "Dormitory applications, gosiwon, monthly rent, real estate",
    color: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    guides: 8,
    popular: true,
  },
  {
    id: "banking",
    icon: CreditCard,
    title: "Banking & Finance",
    description: "Open accounts, remittance, Kakao Pay, Naver Pay, credit cards",
    color: "from-violet-500 to-purple-500",
    bg: "bg-violet-500/10",
    text: "text-violet-400",
    guides: 6,
    popular: false,
  },
  {
    id: "insurance",
    icon: Shield,
    title: "Health Insurance",
    description: "NHIS enrollment, hospital guide, international clinics",
    color: "from-rose-500 to-pink-500",
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    guides: 7,
    popular: true,
  },
  {
    id: "transport",
    icon: Train,
    title: "Transportation",
    description: "T-money, subway, bus, KTX student discounts",
    color: "from-amber-500 to-orange-500",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    guides: 5,
    popular: false,
  },
  {
    id: "language",
    icon: BookOpen,
    title: "Korean Language",
    description: "TOPIK prep, free language exchange programs, apps",
    color: "from-cyan-500 to-blue-500",
    bg: "bg-cyan-500/10",
    text: "text-cyan-400",
    guides: 9,
    popular: false,
  },
];

const popularGuides = [
  {
    title: "How to Open a Kakao Bank Account as a Foreigner",
    category: "Banking", readTime: 4, helpful: 1240, href: "/support/banking",
    answer: "Download the Kakao Bank app → Select '외국인' (Foreigner) → Enter your ARC number and scan it → Verify with your Korean phone number (SMS) → Set your PIN. Your debit card arrives by post in 3–5 days. Requirements: ARC card + Korean phone number. No branch visit needed. Free domestic transfers, ₩5,000 international transfers.",
  },
  {
    title: "D-2 Visa Extension: Complete Step-by-Step Guide 2025",
    category: "Visa", readTime: 8, helpful: 2890, href: "/support/visa",
    answer: "Apply at Jeonju Immigration Office (전주출입국·외국인사무소) at least 4 weeks before expiry. Bring: ① Passport ② ARC card ③ Certificate of enrollment (재학증명서) from JBNU ④ Tuition payment receipt ⑤ Application fee ₩60,000 (revenue stamp). Fill in the 체류기간연장허가신청서 form at the office. Processing: 2–4 weeks. Apply online at hikorea.go.kr to avoid the queue.",
  },
  {
    title: "How to Register for NHIS Health Insurance",
    category: "Insurance", readTime: 5, helpful: 1560, href: "/support/insurance",
    answer: "As a full-time international student, you are automatically enrolled in NHIS. You'll receive a health insurance card by mail. Check your enrollment at nhis.or.kr/nhis/english. If not enrolled, visit the nearest NHIS branch with your ARC + enrollment certificate. Monthly premium: ₩80,000–130,000. Set up auto-debit from your bank to avoid missed payments.",
  },
  {
    title: "Finding Housing Near JBNU: Complete Guide",
    category: "Housing", readTime: 10, helpful: 980, href: "/support/housing",
    answer: "Options near JBNU: ① Dorm (cheapest, apply at dorm.jbnu.ac.kr each semester) ② Gosiwon: ₩250,000–450,000/month, tiny furnished rooms, use Naver Maps search '고시원 전주' ③ Monthly rent studio: ₩300,000–600,000 + deposit, use Zigbang (zigbang.com) or Dabang apps. Always sign a written lease and get 확정일자 stamp at the district office within 30 days.",
  },
  {
    title: "Getting Your ARC (Alien Registration Card)",
    category: "Visa", readTime: 6, helpful: 2100, href: "/support/visa",
    answer: "Register within 90 days of arrival at Jeonju Immigration Office. Bring: ① Passport ② D-2/D-4 visa ③ Enrollment certificate from JBNU ④ 1 passport-size photo ⑤ Application fee ₩30,000 ⑥ Proof of address (dorm contract). Processing: 3–7 days — they mail the card to your address. The ARC is your Korean ID: essential for opening a bank account, getting a SIM card, and health insurance.",
  },
  {
    title: "Setting Up T-money Card and Using Jeonju Buses",
    category: "Transport", readTime: 3, helpful: 740, href: "/support/transport",
    answer: "Buy a T-money card at any convenience store (CU, GS25) for ₩2,500–4,000. Charge it at the counter: say '만원 충전해주세요' (charge ₩10,000). Board the bus at the front, tap T-money on the yellow reader. Press the stop button before your stop. Exit rear door and tap again (activates free transfer within 30 min). Use Naver Maps for real-time bus routes and arrival times in Jeonju.",
  },
];

const categoryLabels: Record<string, "default" | "success" | "cyan" | "warning" | "violet"> = {
  Banking: "violet",
  Visa: "default",
  Insurance: "default",
  Housing: "success",
  Transport: "warning",
};

export default function SupportPage() {
  const router = useRouter();
  const [openGuide, setOpenGuide] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const askAI = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    router.push(`/dashboard/ai?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        {/* Hero — AI-first ask box */}
        <div className="relative bg-gradient-to-b from-indigo-950/30 via-violet-950/20 to-transparent border-b border-border">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14 text-center">
            <Badge variant="default" className="mb-4 text-xs px-3 py-1 gap-1.5">
              <Sparkles size={11} className="text-violet-400" /> AI-powered Student Support
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              Ask anything about
              <span className="gradient-text"> life in Korea</span>
            </h1>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto text-sm sm:text-base">
              Visa, banking, housing, insurance, transport. Get instant, personalised answers
              from our AI — or browse our hand-written guides below.
            </p>

            {/* AI search box — actually routes to /dashboard/ai */}
            <form
              onSubmit={(e) => { e.preventDefault(); askAI(query); }}
              className="max-w-2xl mx-auto"
            >
              <div className="flex items-center gap-2 bg-card border border-border focus-within:border-indigo-500/50 rounded-2xl p-2 transition-colors">
                <div className="pl-2 text-muted-foreground">
                  <Sparkles size={18} className="text-indigo-500" />
                </div>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder='Ask ICOM AI… e.g. "How do I extend my D-2 visa?"'
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none px-2 h-10"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="gap-1.5 shrink-0"
                  disabled={!query.trim()}
                >
                  Ask AI <ArrowRight size={13} />
                </Button>
              </div>
            </form>

            {/* Quick example chips */}
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {[
                "Extend my D-2 visa",
                "Open a Kakao Bank account",
                "Find a dormitory",
                "NHIS health insurance",
                "T-money card",
              ].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => askAI(q)}
                  className="text-[11px] px-3 py-1.5 rounded-full border border-border bg-card text-muted-foreground hover:border-indigo-500/30 hover:text-foreground transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          {/* Categories */}
          <h2 className="text-lg font-bold text-foreground mb-5">Browse by Category</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.id}
                  href={`/support/${cat.id}`}
                  className="group p-5 rounded-2xl border border-white/8 bg-white/3 hover:border-white/15 hover:bg-white/5 transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`h-10 w-10 rounded-xl ${cat.bg} flex items-center justify-center`}>
                      <Icon size={18} className={cat.text} />
                    </div>
                    {cat.popular && (
                      <Badge variant="new" className="text-[10px] px-1.5">Popular</Badge>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1 group-hover:text-indigo-300 transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{cat.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground/70">{cat.guides} guides</span>
                    <ChevronRight size={13} className="text-muted-foreground group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Popular guides */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-foreground">Most Helpful Guides</h2>
              <Button variant="ghost" size="sm" className="text-indigo-400 gap-1">
                View all <ArrowRight size={13} />
              </Button>
            </div>
            <div className="space-y-2">
              {popularGuides.map((guide) => (
                <div
                  key={guide.title}
                  className="rounded-xl border border-white/8 bg-white/3 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenGuide(openGuide === guide.title ? null : guide.title)}
                    className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/5 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-foreground group-hover:text-indigo-300 transition-colors">
                        {guide.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <Badge
                          variant={categoryLabels[guide.category] ?? "default"}
                          className="text-[10px]"
                        >
                          {guide.category}
                        </Badge>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock size={10} />
                          {guide.readTime} min read
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <ThumbsUp size={10} />
                          {guide.helpful.toLocaleString()} found helpful
                        </span>
                      </div>
                    </div>
                    <ChevronDown size={15} className={`text-muted-foreground shrink-0 transition-transform ${openGuide === guide.title ? "rotate-180" : ""}`} />
                  </button>

                  {openGuide === guide.title && (
                    <div className="px-4 pb-4 border-t border-white/8 bg-muted/20">
                      <p className="text-sm text-muted-foreground leading-relaxed pt-3">{guide.answer}</p>
                      <Link
                        href={guide.href}
                        className="mt-3 inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
                      >
                        See full {guide.category} guide <ChevronRight size={12} />
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Emergency contacts */}
          <div className="mt-12 p-6 rounded-2xl border border-red-500/20 bg-red-500/5">
            <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
              🚨 Emergency Contacts in Korea
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Police", number: "112", icon: "👮" },
                { label: "Fire / Ambulance", number: "119", icon: "🚒" },
                { label: "Immigration", number: "1345", icon: "🛂" },
                { label: "Foreign Help", number: "1330", icon: "🌍" },
              ].map(({ label, number, icon }) => (
                <a
                  key={label}
                  href={`tel:${number}`}
                  className="flex flex-col items-center p-4 rounded-xl bg-white/3 border border-white/8 hover:border-red-500/30 hover:bg-red-500/5 transition-all text-center"
                >
                  <span className="text-2xl mb-1">{icon}</span>
                  <span className="text-lg font-bold text-red-400">{number}</span>
                  <span className="text-xs text-muted-foreground">{label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
