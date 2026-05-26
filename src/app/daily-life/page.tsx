import React from "react";
import Link from "next/link";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import NearbyPlaces from "@/components/daily-life/nearby-places";
import {
  Train, ShoppingBag, Wifi,
  Smartphone, DollarSign, Heart,
  Sparkles, Users, ArrowRight, ExternalLink, Sun,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

/* ── Data ───────────────────────────────────────────────────── */

const transport = [
  { emoji: "💳", title: "T-money card",     body: "Buy at any CU/GS25 for ₩2,500. Works on all subways, buses, and taxis.",          link: "https://www.t-money.co.kr/ncs/pct/tmnyIntd/ReadTmnyIntd.nt" },
  { emoji: "🗺️", title: "Naver Maps",       body: "Better than Google in Korea. Real-time arrivals, bus stops, walking routes.",      link: "https://map.naver.com" },
  { emoji: "🎓", title: "Student discount", body: "Show your 재학증명서 for 30–50% off monthly transit passes.",                       link: "https://www.seoulmetro.co.kr/en/page.do?menuIdx=354" },
  { emoji: "🚄", title: "KTX / SRT",        body: "Bullet train for city trips. Book 2+ weeks ahead on busy weekends.",               link: "https://www.letskorail.com" },
];

const essentials = [
  { emoji: "🏪", name: "Daiso",        note: "₩1,000–5,000 store. Dorm setup essentials.",                link: "https://www.daiso-industries.com/en/" },
  { emoji: "📦", name: "Coupang",      note: "Order at night, arrives next morning.",                     link: "https://www.coupang.com" },
  { emoji: "🛒", name: "Emart",        note: "Full supermarket — groceries & bulk supplies.",             link: "https://emart.ssg.com" },
  { emoji: "🥕", name: "Daangn",       note: "Used items. Great for furniture when moving.",              link: "https://www.daangn.com" },
  { emoji: "📶", name: "Airport SIM",  note: "KT/SKT in arrivals. ~₩30–50K for 30 days unlimited.",       link: "https://www.kt.com/eng/personal/mobile/roaming/roaming_usim_00.jsp" },
  { emoji: "💬", name: "MVNO plans",   note: "After your ARC: from ₩10,000/mo. Same speed as majors.",    link: "https://www.ktmmobile.com" },
];

const apps = [
  { icon: "🗺️", name: "Naver Map",  note: "Navigation — far better than Google in Korea.",     link: "https://map.naver.com" },
  { icon: "🚕", name: "Kakao T",    note: "Taxis, bikes, scooters — all in one app.",          link: "https://www.kakaomobility.com" },
  { icon: "🍜", name: "Baemin",     note: "Food delivery. English interface available.",       link: "https://www.baemin.com" },
  { icon: "📦", name: "Coupang",    note: "Shopping. Next-day delivery on almost everything.", link: "https://www.coupang.com" },
  { icon: "💳", name: "Kakao Bank", note: "Open a bank account 100% from your phone.",         link: "https://www.kakaobank.com" },
  { icon: "🈳", name: "Papago",     note: "Translation — often better than Google for Korean.",link: "https://papago.naver.com" },
];

const seasons = [
  { emoji: "🌸", s: "Spring", m: "Mar–May", t: "10–22°C", tip: "Cherry blossoms. Light jacket for cold mornings." },
  { emoji: "☀️", s: "Summer", m: "Jun–Aug", t: "25–38°C", tip: "Very humid. Carry an umbrella daily." },
  { emoji: "🍂", s: "Autumn", m: "Sep–Nov", t: "12–25°C", tip: "Best season. Clear skies, fall foliage." },
  { emoji: "❄️", s: "Winter", m: "Dec–Feb", t: "-10–5°C", tip: "Very cold and dry. Layer up." },
];

const budget = [
  { item: "Dorm (shared)",           range: "200,000–300,000 ₩" },
  { item: "School cafeteria",        range: "80,000–130,000 ₩" },
  { item: "Groceries",               range: "60,000–150,000 ₩" },
  { item: "Transport",               range: "30,000–55,000 ₩" },
  { item: "Mobile (MVNO)",           range: "10,000–20,000 ₩" },
  { item: "Social / fun",            range: "20,000–80,000 ₩" },
];

const tips = [
  { emoji: "🥢", tip: "Don't stick chopsticks upright in rice — funeral symbolism." },
  { emoji: "🙏", tip: "Use two hands when receiving from elders." },
  { emoji: "👞", tip: "Remove shoes when entering Korean homes." },
  { emoji: "🍺", tip: "Pour drinks for others before yourself." },
];

/* ── Page ───────────────────────────────────────────────────── */

export default function DailyLifePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16 pb-24 md:pb-0">

        {/* Hero — compact */}
        <div className="border-b border-border bg-gradient-to-b from-indigo-950/15 to-transparent">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-12 text-center">
            <Badge variant="default" className="mb-3 text-xs px-3 py-1 gap-1.5">
              <Heart size={11} className="text-rose-400" /> Life in Korea
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-2">
              Living in Korea, <span className="gradient-text">simplified</span>
            </h1>
            <p className="text-muted-foreground text-sm max-w-lg mx-auto">
              The essentials only — places, transport, apps and budget.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-10">

          {/* ── 1. Find nearby (NEW — was just restaurants) ─────── */}
          <NearbyPlaces />

          {/* ── 2. Transport ──────────────────────────────────── */}
          <Section icon={Train} color="text-blue-500" bg="bg-blue-500/10" title="Getting around">
            <div className="grid sm:grid-cols-2 gap-2.5">
              {transport.map((t) => (
                <SimpleCard key={t.title} emoji={t.emoji} title={t.title} body={t.body} link={t.link} />
              ))}
            </div>
          </Section>

          {/* ── 3. Essentials (Shopping + SIM merged) ─────────── */}
          <Section icon={ShoppingBag} color="text-pink-500" bg="bg-pink-500/10" title="Essentials & shopping">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {essentials.map((s) => (
                <SimpleCard key={s.name} emoji={s.emoji} title={s.name} body={s.note} link={s.link} />
              ))}
            </div>
          </Section>

          {/* ── 4. Essential apps ─────────────────────────────── */}
          <Section icon={Smartphone} color="text-emerald-500" bg="bg-emerald-500/10" title="Must-have apps">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {apps.map((a) => (
                <a
                  key={a.name}
                  href={a.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col gap-1.5 p-3.5 rounded-2xl border border-border bg-card hover:border-emerald-500/30 transition-colors"
                >
                  <span className="text-2xl">{a.icon}</span>
                  <p className="text-sm font-semibold text-foreground leading-tight">{a.name}</p>
                  <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">{a.note}</p>
                </a>
              ))}
            </div>
          </Section>

          {/* ── 5. Budget ─────────────────────────────────────── */}
          <Section icon={DollarSign} color="text-amber-500" bg="bg-amber-500/10" title="Monthly budget">
            <div className="rounded-2xl border border-emerald-500/20 bg-card overflow-hidden">
              <div className="divide-y divide-border">
                {budget.map((b) => (
                  <div key={b.item} className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-xs text-foreground">{b.item}</span>
                    <span className="text-xs font-semibold text-emerald-500">{b.range}</span>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 bg-emerald-500/5 border-t border-emerald-500/15 flex justify-between items-center">
                <span className="text-xs font-bold text-foreground">Monthly total</span>
                <span className="text-sm font-extrabold text-emerald-500">400,000 – 735,000 ₩</span>
              </div>
            </div>
          </Section>

          {/* ── 6. Quick tips (Seasons + Cultural collapsed) ─── */}
          <Section icon={Sun} color="text-indigo-500" bg="bg-indigo-500/10" title="Quick tips">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
              {seasons.map((s) => (
                <div key={s.s} className="p-3 rounded-2xl border border-border bg-card text-center">
                  <div className="text-2xl mb-1">{s.emoji}</div>
                  <p className="text-sm font-bold text-foreground">{s.s}</p>
                  <p className="text-[10px] text-muted-foreground mb-1">{s.m} · {s.t}</p>
                  <p className="text-[10px] text-muted-foreground leading-snug">{s.tip}</p>
                </div>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {tips.map((c) => (
                <div key={c.tip} className="flex items-start gap-2 p-2.5 rounded-xl border border-border bg-card">
                  <span className="text-base shrink-0">{c.emoji}</span>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{c.tip}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* ── CTA ───────────────────────────────────────────── */}
          <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/8 to-violet-500/5 p-7 text-center">
            <p className="text-base font-bold text-foreground mb-1">Have a specific question?</p>
            <p className="text-muted-foreground text-xs mb-5">Our AI and student community are here 24/7.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <Link href="/dashboard/ai" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity">
                <Sparkles size={14} /> Ask AI <ArrowRight size={13} />
              </Link>
              <Link href="/community" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-accent transition-colors">
                <Users size={14} /> Ask the community
              </Link>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}

/* ── Small building blocks ─────────────────────────────────── */

function Section({
  icon: Icon, color, bg, title, children,
}: {
  icon: React.ElementType; color: string; bg: string; title: string; children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-9 h-9 rounded-xl ${bg} ${color} flex items-center justify-center shrink-0`}>
          <Icon size={16} />
        </div>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function SimpleCard({ emoji, title, body, link }: { emoji: string; title: string; body: string; link?: string }) {
  const content = (
    <>
      <span className="text-xl shrink-0">{emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {link && <ExternalLink size={10} className="text-muted-foreground/50" />}
        </div>
        <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{body}</p>
      </div>
    </>
  );
  return link ? (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 p-3.5 rounded-2xl border border-border bg-card hover:border-indigo-500/30 transition-colors"
    >
      {content}
    </a>
  ) : (
    <div className="flex gap-3 p-3.5 rounded-2xl border border-border bg-card">{content}</div>
  );
}
