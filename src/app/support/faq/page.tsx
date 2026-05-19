"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/navbar";
import { Search, ChevronDown, Sparkles, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface FAQ {
  q: string;
  a: string;
  category: string;
  tags?: string[];
}

const FAQS: FAQ[] = [
  // Visa
  {
    category: "Visa",
    q: "How do I extend my D-2 student visa in Korea?",
    a: "Visit the nearest immigration office (출입국관리사무소) before your current visa expires. Bring: your passport, ARC card, enrollment certificate (재학증명서) from your university's student portal, official transcript, and a fee of ₩60,000. JBNU students go to the Jeonju Immigration Office (전주출입국·외국인사무소) at 전주시 완산구 홍산로 111. You can also extend online via the HiKorea website (hikorea.go.kr) for D-2 visas.",
    tags: ["D-2", "extension", "immigration"],
  },
  {
    category: "Visa",
    q: "What is an ARC card and how do I get one?",
    a: "The Alien Registration Card (외국인등록증) is your Korean ID card for foreigners staying more than 90 days. Apply within 90 days of arrival at the immigration office. Bring your passport, application form, one passport photo, proof of accommodation (dormitory contract or lease), and ₩30,000. Processing takes about 2 weeks and it will be mailed to you.",
    tags: ["ARC", "registration"],
  },
  {
    category: "Visa",
    q: "Can I work part-time on a D-2 visa?",
    a: "Yes, but you must get a part-time work permit (시간제취업허가). Apply at the immigration office or online via HiKorea. You are allowed to work up to 20 hours per week during semesters, and up to 40 hours per week during vacation periods. Working without a permit is illegal and can result in visa cancellation.",
    tags: ["D-2", "work", "part-time"],
  },
  {
    category: "Visa",
    q: "What happens if my visa expires while in Korea?",
    a: "If your visa expires, you are considered an overstay (불법체류) and face fines, deportation, and a re-entry ban. If you realize your visa is about to expire, go to the immigration office immediately — even just 1–2 days before expiry. Explain your situation and they may grant a short extension. Never ignore an expiring visa.",
    tags: ["overstay", "expired", "emergency"],
  },
  // Banking
  {
    category: "Banking",
    q: "How do I open a bank account as a foreign student?",
    a: "Most international students use Kakao Bank or KEB Hana Bank. For Kakao Bank: download the Kakao Bank app, tap 'Open Account', complete identity verification with your ARC card and passport. For Hana Bank (recommended for international students): visit a branch with your ARC card, passport, and enrollment certificate. Hana Bank has English-speaking staff and a special international student account with no minimum balance.",
    tags: ["bank account", "Kakao Bank", "Hana Bank"],
  },
  {
    category: "Banking",
    q: "How do I send money home from Korea?",
    a: "The cheapest options are: (1) Wise (wise.com) — best exchange rates, transfers in 1–2 days, (2) Kakao Bank's overseas remittance feature (해외송금) — convenient if you already have Kakao Bank, (3) Western Union — available at some post offices. Avoid airport exchange booths and bank wire transfers as they have high fees.",
    tags: ["remittance", "transfer", "money"],
  },
  {
    category: "Banking",
    q: "Can I get a Korean credit card as a student?",
    a: "It's difficult to get a credit card without Korean credit history. Your options: (1) Apply for a Hana Bank check card (debit card with Visa/Mastercard) — this works everywhere, (2) After 6+ months of banking history, apply for a low-limit credit card at your bank, (3) Some banks offer special student credit cards — ask at your branch. Kakao Pay and Naver Pay are widely accepted alternatives.",
    tags: ["credit card", "debit card"],
  },
  // Insurance
  {
    category: "Insurance",
    q: "Do I need health insurance in Korea?",
    a: "Yes. All international students enrolled for more than 6 months must join the National Health Insurance Service (NHIS / 국민건강보험). Your university international office usually handles enrollment automatically. If not, register at nhis.or.kr or visit the nearest NHIS office. Monthly premiums are about ₩70,000–100,000 for students.",
    tags: ["NHIS", "health insurance", "enrollment"],
  },
  {
    category: "Insurance",
    q: "How do I see a doctor in Korea?",
    a: "For non-emergencies: visit a local clinic (의원) or hospital (병원). Show your ARC card and health insurance card (건강보험증 — download from the NHIS app). Consultation typically costs ₩3,000–10,000 after insurance. For emergencies: go to the ER (응급실) at a general hospital. The JBNU Hospital (전북대학교병원) at 전주시 덕진구 건지로 20 has an international patient center.",
    tags: ["hospital", "clinic", "doctor"],
  },
  {
    category: "Insurance",
    q: "What does NHIS cover?",
    a: "NHIS covers 70–80% of most medical costs including: hospital and clinic visits, prescription medications (from 의원/병원 pharmacies), dental care (basic), mental health consultations (at registered clinics). It does NOT cover: cosmetic procedures, private room upgrades, most traditional Korean medicine (한의원) treatments, and 100% coverage in top-tier hospitals (대학병원).",
    tags: ["NHIS", "coverage"],
  },
  // Housing
  {
    category: "Housing",
    q: "How do I apply for JBNU dormitory?",
    a: "JBNU has several dormitories on campus. International students must apply online through the JBNU student portal (portal.jbnu.ac.kr) during the application period (usually 2–3 months before each semester). Required documents: enrollment confirmation, passport photo, and payment. Monthly costs range from ₩200,000–350,000 including utilities. International students often get priority.",
    tags: ["JBNU", "dormitory", "housing"],
  },
  {
    category: "Housing",
    q: "What is a gosiwon and is it safe?",
    a: "A gosiwon (고시원) is a small, affordable single room with a shared kitchen and bathrooms. Rooms are typically 4–7 sqm. Monthly rent: ₩250,000–450,000 including utilities and sometimes breakfast. They are generally safe and located near universities. Downsides: very small rooms, thin walls, no private cooking. Good option if you want cheap, flexible month-to-month housing near campus.",
    tags: ["gosiwon", "cheap", "room"],
  },
  {
    category: "Housing",
    q: "What is a jeonse (전세) and should I use it?",
    a: "Jeonse is a uniquely Korean rental system where you deposit a large lump sum (typically 40–80% of the property value) with zero monthly rent — you get the deposit back when you leave. Not recommended for most international students: requires very large upfront capital and carries risk if the landlord cannot return the deposit. Stick to monthly rent (월세) instead.",
    tags: ["jeonse", "monthly rent", "rental"],
  },
  // Daily Life
  {
    category: "Daily Life",
    q: "How do I get a Korean phone plan?",
    a: "Visit any SK Telecom, KT, or LG U+ store with your ARC card and passport. Student plans start from ₩25,000/month for unlimited calls + 5GB data. Budget MVNOs (알뜰폰) like KT M-mobile or LG Hellomobile offer plans from ₩9,900/month. For the first 90 days (before ARC), you can get a foreigner SIM at the airport (Incheon or Gimpo) with only your passport.",
    tags: ["SIM", "phone", "plan"],
  },
  {
    category: "Daily Life",
    q: "How does public transport work in Jeonju?",
    a: "Jeonju has a city bus network. Get a T-money card (티머니) at any CU, GS25, or 7-Eleven convenience store and load it with cash. Bus fare: ₩1,250–1,450 per ride. Google Maps works for Jeonju bus routes, but Naver Map (네이버지도) or KakaoMap is more accurate. For KTX (high-speed rail) to Seoul (about 2 hours), use Jeonju Station — book at korail.com or the Korail app.",
    tags: ["bus", "T-money", "transport", "Jeonju"],
  },
  {
    category: "Daily Life",
    q: "What apps are essential for living in Korea?",
    a: "Must-have apps: KakaoTalk (messaging — everyone uses it), Naver Map / KakaoMap (navigation), Baemin or Coupang Eats (food delivery), Coupang (online shopping, next-day delivery), Papago (translation), Kakao Bank or Toss (banking), HiKorea (immigration services), NHIS (health insurance). Tip: set up your phone in English but learn a few Korean words — it helps a lot.",
    tags: ["apps", "KakaoTalk", "daily life"],
  },
  {
    category: "Daily Life",
    q: "Where can I buy groceries near JBNU?",
    a: "Near JBNU campus: Homeplus (홈플러스) at 전주 송천점 — large supermarket ~15 min by bus. Lotte Mart at 전주 덕진점. For quick items: convenience stores (CU, GS25, 7-Eleven) are everywhere on campus and open 24/7. Traditional market: Jeonju Jungang Market (전주중앙시장) for fresh produce and cheap Korean food. Online: Coupang Rocket Delivery delivers to dormitories next day.",
    tags: ["grocery", "shopping", "JBNU", "Jeonju"],
  },
  // Academics
  {
    category: "Academics",
    q: "How do I get my enrollment certificate (재학증명서)?",
    a: "Log in to the JBNU student portal (portal.jbnu.ac.kr) → Student Services → Certificate Issuance. You can print it on campus at the certificate kiosk (증명서 자동발급기) in the main administration building for ₩300 per copy. For official use abroad, you may need an apostille — available from the Ministry of Foreign Affairs or Minwon24 (minwon.go.kr).",
    tags: ["certificate", "enrollment", "portal"],
  },
  {
    category: "Academics",
    q: "What is TOPIK and should I take it?",
    a: "TOPIK (Test of Proficiency in Korean) is the official Korean language test with 6 levels. Level 2+ helps daily life. Level 3+ required for many jobs. Level 4+ required for most graduate programs taught in Korean. TOPIK is held 4–6 times per year in Korea. Register at topik.go.kr. JBNU's Language Education Center offers free Korean language classes to international students — highly recommended.",
    tags: ["TOPIK", "Korean", "language"],
  },
];

const CATEGORIES = ["All", "Visa", "Banking", "Insurance", "Housing", "Daily Life", "Academics"];

function FAQItem({ faq }: { faq: FAQ }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-2xl border transition-all duration-200 ${open ? "border-indigo-500/30 bg-indigo-500/4" : "border-white/8 bg-white/3 hover:border-white/12"}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-sm font-medium text-foreground leading-relaxed">{faq.q}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 mt-0.5 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180 text-indigo-400" : ""}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-5">
          <div className="h-px bg-white/6 mb-4" />
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{faq.a}</p>
          {faq.tags && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {faq.tags.map(tag => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [openAll, setOpenAll] = useState(false);

  const filtered = useMemo(() => {
    return FAQS.filter(f => {
      const matchCat = category === "All" || f.category === category;
      const q = search.toLowerCase();
      const matchSearch = !q || f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q) || (f.tags || []).some(t => t.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [search, category]);

  const grouped = useMemo(() => {
    const map: Record<string, FAQ[]> = {};
    for (const f of filtered) {
      if (!map[f.category]) map[f.category] = [];
      map[f.category].push(f);
    }
    return map;
  }, [filtered]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        {/* Header */}
        <div className="border-b border-white/8 bg-gradient-to-b from-indigo-950/20 to-transparent">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14 text-center">
            <Badge variant="default" className="mb-4 text-xs px-3 py-1">
              <MessageSquare size={10} className="mr-1" /> FAQ
            </Badge>
            <h1 className="text-4xl font-extrabold text-foreground mb-3">
              Frequently Asked Questions
            </h1>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Real answers for international students in Korea — written specifically for JBNU and Jeonju life.
            </p>
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search questions... e.g. visa extension, bank account, dormitory"
              icon={<Search size={15} />}
              className="max-w-lg mx-auto"
            />
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          {/* Category tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  category === cat
                    ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/25"
                    : "border border-white/8 text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                {cat}
                {cat !== "All" && (
                  <span className="ml-1.5 text-muted-foreground/50">
                    {FAQS.filter(f => f.category === cat).length}
                  </span>
                )}
              </button>
            ))}
            <button
              onClick={() => setOpenAll(!openAll)}
              className="ml-auto px-3.5 py-1.5 rounded-xl text-xs font-medium border border-white/8 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
            >
              {openAll ? "Collapse all" : "Expand all"}
            </button>
          </div>

          {/* Results count */}
          {search && (
            <p className="text-xs text-muted-foreground mb-4">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""} for &quot;{search}&quot;
            </p>
          )}

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <MessageSquare size={32} className="text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-medium">No questions match your search.</p>
              <p className="text-xs text-muted-foreground/60 mt-1 mb-4">Try different keywords or ask the AI assistant.</p>
              <Link
                href="/dashboard/ai"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500 text-white text-xs font-medium hover:bg-indigo-600 transition-colors"
              >
                <Sparkles size={13} /> Ask ICOM AI
              </Link>
            </div>
          )}

          {/* FAQ groups */}
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="mb-8">
              {category === "All" && (
                <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">{cat}</h2>
              )}
              <div className="space-y-2">
                {items.map((faq, i) => (
                  <OpenableFAQItem key={i} faq={faq} forceOpen={openAll} />
                ))}
              </div>
            </div>
          ))}

          {/* AI CTA */}
          <div className="mt-8 p-6 rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 to-violet-950/40 text-center">
            <Sparkles size={24} className="text-indigo-400 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-foreground mb-1">Still have a question?</h3>
            <p className="text-xs text-muted-foreground mb-4">
              ICOM AI knows everything about student life in Korea. Ask it anything.
            </p>
            <Link
              href="/dashboard/ai"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors"
            >
              <Sparkles size={14} /> Ask the AI Assistant
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function OpenableFAQItem({ faq, forceOpen }: { faq: FAQ; forceOpen: boolean }) {
  const [localOpen, setLocalOpen] = useState(false);
  const open = forceOpen || localOpen;

  return (
    <div className={`rounded-2xl border transition-all duration-200 ${open ? "border-indigo-500/30 bg-indigo-500/4" : "border-white/8 bg-white/3 hover:border-white/12"}`}>
      <button
        onClick={() => setLocalOpen(!localOpen)}
        className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-sm font-medium text-foreground leading-relaxed">{faq.q}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 mt-0.5 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180 text-indigo-400" : ""}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-5">
          <div className="h-px bg-white/6 mb-4" />
          <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
          {faq.tags && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {faq.tags.map(tag => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
