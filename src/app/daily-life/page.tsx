import React from "react";
import Link from "next/link";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import NearbyRestaurants from "@/components/daily-life/nearby-restaurants";
import {
  Train, ShoppingBag, Utensils, Wifi,
  Moon, Sun, Smartphone, DollarSign, Heart,
  Sparkles, Users, ArrowRight, AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

/* ── Data ───────────────────────────────────────────────────── */

const transport = [
  { emoji: "💳", title: "T-money card", body: "Buy at any CU/GS25 for ₩2,500. Works on all subways, buses, and taxis." },
  { emoji: "🗺️", title: "Naver Maps", body: "Better than Google in Korea. Real-time arrivals, bus stops, walking routes." },
  { emoji: "🎓", title: "Student discount", body: "Show your enrollment certificate (재학증명서) for 30–50% off monthly passes." },
  { emoji: "🚄", title: "KTX / SRT", body: "Bullet train for city trips. Book 2+ weeks ahead on busy weekends." },
];

// International restaurants & foods available in Korea — grouped by cuisine
const foreignFoodCategories = [
  {
    region: "🌍 Central Asian & Uzbek",
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    items: [
      { name: "Plov (Osh)",          price: "10,000–15,000 ₩",  where: "Uzbek restaurants in Itaewon / university districts", emoji: "🍚" },
      { name: "Samsa & Manti",       price: "5,000–9,000 ₩",    where: "Central Asian eateries near JBNU, Sinchon",           emoji: "🥟" },
      { name: "Shashlik (BBQ)",      price: "12,000–18,000 ₩",  where: "Uzbek / Halal BBQ spots in major cities",             emoji: "🍢" },
      { name: "Lagman noodles",      price: "8,000–12,000 ₩",   where: "Central Asian restaurants, Dongdaemun area",          emoji: "🍜" },
    ],
  },
  {
    region: "🕌 Halal / Middle Eastern",
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    items: [
      { name: "Shawarma",            price: "6,000–10,000 ₩",   where: "Itaewon Halal Street, Mosque area Seoul",            emoji: "🌯" },
      { name: "Kebab & hummus",      price: "8,000–14,000 ₩",   where: "Halal restaurants near Dongdaemun, Itaewon",         emoji: "🥙" },
      { name: "Halal fried chicken", price: "8,000–13,000 ₩",   where: "BBQ Olive, Halal Guys (Seoul)",                      emoji: "🍗" },
      { name: "Falafel wrap",        price: "7,000–11,000 ₩",   where: "Middle Eastern cafés, Hongdae, Itaewon",             emoji: "🧆" },
    ],
  },
  {
    region: "🍜 Chinese & Southeast Asian",
    color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    items: [
      { name: "Chinese jjajangmyeon", price: "7,000–12,000 ₩",  where: "China Town (Incheon), any Chinese restaurant",        emoji: "🍝" },
      { name: "Vietnamese pho & bánh mì", price: "8,000–13,000 ₩", where: "Pho Bac, Viet chain restaurants, delivery apps",  emoji: "🍲" },
      { name: "Thai green curry",    price: "10,000–15,000 ₩",  where: "Thai restaurants in Hongdae, Sinchon, Itaewon",       emoji: "🍛" },
      { name: "Indonesian / Malay rice", price: "9,000–14,000 ₩", where: "Southeast Asian spots near university areas",       emoji: "🌾" },
    ],
  },
  {
    region: "🍕 Western & Indian",
    color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
    items: [
      { name: "Indian curry & naan", price: "10,000–18,000 ₩",  where: "Everest, Indian Kitchen, Zomato listings in Seoul",   emoji: "🍛" },
      { name: "Pizza (chain)",       price: "8,000–20,000 ₩",   where: "Domino's, Pizza Alvolo (Korean-style), Mr. Pizza",    emoji: "🍕" },
      { name: "Burger & fries",      price: "5,000–12,000 ₩",   where: "McDonald's, Lotteria, Five Guys (major cities)",      emoji: "🍔" },
      { name: "Subway sandwich",     price: "5,500–9,500 ₩",    where: "Subway (most campuses and city centres)",              emoji: "🥖" },
    ],
  },
];

const shopping = [
  { emoji: "🏪", name: "Daiso",           note: "₩1,000–5,000 store. Everything you need to set up a dorm room." },
  { emoji: "📦", name: "Coupang",         note: "Order at night, arrives next morning. Korea's Amazon." },
  { emoji: "🛒", name: "Emart / Homeplus", note: "Full supermarket for groceries, snacks, and bulk supplies." },
  { emoji: "🥕", name: "Daangn (당근마켓)", note: "Second-hand app. Great for furniture when moving in or out." },
];

const simSteps = [
  { step: "1", title: "Airport SIM", body: "KT/SKT booths in Incheon arrivals. ~₩30–50K for 30-day unlimited data. Passport only." },
  { step: "2", title: "Switch to MVNO", body: "After your ARC card: KT M-mobile or LG Hello Mobile from ₩10,000/mo. Same tower speed." },
  { step: "3", title: "Campus & café Wi-Fi", body: "Nearly every café and all campuses have free fast Wi-Fi. eduroam works at most Korean universities." },
];

const nightlife = [
  { emoji: "🎤", name: "Norebang (노래방)", note: "Private karaoke rooms. ₩10–20K/hr. Most essential Korea experience." },
  { emoji: "🍗", name: "Chimaek (치맥)",    note: "Fried chicken + beer. BHC, BBQ, Kyochon. Delivery via Baemin." },
  { emoji: "🏮", name: "Pojangmacha",       note: "Street tent bars. Tteokbokki + makgeolli from ₩3,000. Open late." },
  { emoji: "🏪", name: "Convenience store", note: "CU/GS25 outdoor tables. Beer ₩1,800. '4캔 만원' (4 cans ₩10K) deal." },
];

const seasons = [
  { emoji: "🌸", s: "Spring", m: "Mar–May",  t: "10–22°C", tip: "Cherry blossoms. Light jacket for cold mornings." },
  { emoji: "☀️", s: "Summer", m: "Jun–Aug",  t: "25–38°C", tip: "Very humid. Carry an umbrella daily." },
  { emoji: "🍂", s: "Autumn", m: "Sep–Nov",  t: "12–25°C", tip: "Best season. Clear skies, fall foliage." },
  { emoji: "❄️", s: "Winter", m: "Dec–Feb",  t: "-10–5°C", tip: "Very cold and dry. Layer up." },
];

const budget = [
  { item: "Dorm (shared)",         range: "200,000–300,000 ₩" },
  { item: "School cafeteria (학식)", range: "80,000–130,000 ₩" },
  { item: "Groceries / conv. store",range: "60,000–150,000 ₩" },
  { item: "Transport",             range: "30,000–55,000 ₩" },
  { item: "Mobile (budget MVNO)",  range: "10,000–20,000 ₩" },
  { item: "Social / fun",          range: "20,000–80,000 ₩" },
];

const culturalTips = [
  { emoji: "🥢", tip: "Don't stick chopsticks upright in rice — associated with funerals." },
  { emoji: "🙏", tip: "Use two hands when receiving things from elders." },
  { emoji: "👞", tip: "Remove shoes when entering Korean homes." },
  { emoji: "🍺", tip: "Pour drinks for others before pouring for yourself." },
  { emoji: "💸", tip: "Carry cash — ATMs at GS25/CU work with foreign cards." },
];

const apps = [
  { icon: "🗺️", name: "Naver Map",   note: "Navigation. Far better than Google Maps in Korea." },
  { icon: "🚕", name: "Kakao T",     note: "Taxis, bikes, and scooters in one app." },
  { icon: "🍜", name: "Baemin",      note: "Food delivery. English interface available." },
  { icon: "📦", name: "Coupang",     note: "Shopping. Next-day delivery on almost everything." },
  { icon: "💳", name: "Kakao Bank",  note: "Open a bank account 100% from your phone." },
  { icon: "🈳", name: "Papago",      note: "Translation. Often better than Google for Korean." },
];

/* ── Page ───────────────────────────────────────────────────── */

export default function DailyLifePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">

        {/* Hero */}
        <div className="border-b border-border bg-gradient-to-b from-indigo-950/20 to-transparent">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 text-center">
            <Badge variant="default" className="mb-3 text-xs px-3 py-1 gap-1.5">
              <Heart size={11} className="text-rose-400" /> Life in Korea Guide
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-3">
              Living in Korea, <span className="gradient-text">simplified</span>
            </h1>
            <p className="text-muted-foreground text-sm max-w-xl mx-auto">
              Transport, food, shopping, SIM, apps, budget — the essentials for international students.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-14">

          {/* ── Transport ──────────────────────────────────────── */}
          <section id="transport">
            <SectionHeader icon={Train} color="text-blue-500" bg="bg-blue-500/10" title="Getting Around" />
            <div className="grid sm:grid-cols-2 gap-3">
              {transport.map((t) => (
                <div key={t.title} className="flex gap-3 p-4 rounded-2xl border border-border bg-card">
                  <span className="text-xl shrink-0">{t.emoji}</span>
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-0.5">{t.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{t.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Food ───────────────────────────────────────────── */}
          <section id="food">
            <SectionHeader icon={Utensils} color="text-orange-500" bg="bg-orange-500/10" title="International Food in Korea" />
            <div className="space-y-4">
              {foreignFoodCategories.map((cat) => (
                <div key={cat.region} className="rounded-2xl border border-border bg-card overflow-hidden">
                  <div className={`px-4 py-2.5 border-b border-border flex items-center gap-2 ${cat.color} bg-opacity-10`}>
                    <span className="text-sm font-bold text-foreground">{cat.region}</span>
                  </div>
                  <div className="divide-y divide-border">
                    {cat.items.map((f) => (
                      <div key={f.name} className="flex items-start gap-3 px-4 py-3">
                        <span className="text-lg shrink-0 w-6 text-center mt-0.5">{f.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground font-medium">{f.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{f.where}</p>
                        </div>
                        <span className="text-xs font-semibold text-emerald-500 shrink-0 mt-0.5">{f.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Halal tip */}
            <div className="mt-3 px-4 py-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-start gap-2">
              <AlertCircle size={13} className="text-emerald-400 mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Halal tip:</span>{" "}
                Search <span className="font-medium">"할랄 음식"</span> on Naver Map or use the{" "}
                <span className="font-medium">HalalTrip</span> app to find certified halal restaurants near you.
              </p>
            </div>
            <NearbyRestaurants />
          </section>

          {/* ── Shopping ───────────────────────────────────────── */}
          <section id="shopping">
            <SectionHeader icon={ShoppingBag} color="text-pink-500" bg="bg-pink-500/10" title="Shopping" />
            <div className="grid sm:grid-cols-2 gap-3">
              {shopping.map((s) => (
                <div key={s.name} className="flex gap-3 p-4 rounded-2xl border border-border bg-card">
                  <span className="text-xl shrink-0">{s.emoji}</span>
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-0.5">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── SIM & Wi-Fi ─────────────────────────────────────── */}
          <section id="wifi">
            <SectionHeader icon={Wifi} color="text-cyan-500" bg="bg-cyan-500/10" title="SIM & Wi-Fi" />
            <div className="space-y-3">
              {simSteps.map((s) => (
                <div key={s.step} className="flex gap-3 p-4 rounded-2xl border border-border bg-card">
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/10 text-cyan-500 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{s.step}</div>
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-0.5">{s.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Nightlife ───────────────────────────────────────── */}
          <section id="nightlife">
            <SectionHeader icon={Moon} color="text-violet-500" bg="bg-violet-500/10" title="Evenings & Nightlife" />
            <div className="grid sm:grid-cols-2 gap-3">
              {nightlife.map((n) => (
                <div key={n.name} className="flex gap-3 p-4 rounded-2xl border border-border bg-card">
                  <span className="text-xl shrink-0">{n.emoji}</span>
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-0.5">{n.name}</p>
                    <p className="text-xs text-muted-foreground">{n.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Essential Apps ─────────────────────────────────── */}
          <section id="apps">
            <SectionHeader icon={Smartphone} color="text-emerald-500" bg="bg-emerald-500/10" title="Essential Apps" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {apps.map((a) => (
                <div key={a.name} className="flex gap-3 p-4 rounded-2xl border border-border bg-card">
                  <span className="text-xl shrink-0">{a.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-0.5">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{a.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Seasons ────────────────────────────────────────── */}
          <section id="weather">
            <SectionHeader icon={Sun} color="text-indigo-500" bg="bg-indigo-500/10" title="Four Seasons" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {seasons.map((s) => (
                <div key={s.s} className="p-4 rounded-2xl border border-border bg-card text-center">
                  <div className="text-2xl mb-1">{s.emoji}</div>
                  <p className="text-sm font-bold text-foreground">{s.s}</p>
                  <p className="text-[11px] text-muted-foreground mb-1">{s.m} · {s.t}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{s.tip}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Budget ─────────────────────────────────────────── */}
          <section id="budget">
            <SectionHeader icon={DollarSign} color="text-amber-500" bg="bg-amber-500/10" title="Monthly Budget" />
            <div className="rounded-2xl border border-emerald-500/20 bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-emerald-500/15 bg-emerald-500/5 flex items-center gap-2">
                <span className="text-base">🎓</span>
                <p className="text-sm font-bold text-foreground">Tight student budget estimate</p>
              </div>
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
          </section>

          {/* ── Cultural Tips ──────────────────────────────────── */}
          <section>
            <SectionHeader icon={Heart} color="text-rose-500" bg="bg-rose-500/10" title="Cultural Tips" />
            <div className="grid sm:grid-cols-2 gap-2">
              {culturalTips.map((c) => (
                <div key={c.tip} className="flex items-start gap-2.5 p-3 rounded-xl border border-border bg-card">
                  <span className="text-lg shrink-0">{c.emoji}</span>
                  <p className="text-xs text-muted-foreground leading-relaxed">{c.tip}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── CTA ────────────────────────────────────────────── */}
          <section>
            <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/8 to-violet-500/5 p-8 text-center">
              <p className="text-lg font-bold text-foreground mb-1">Have a question?</p>
              <p className="text-muted-foreground text-xs mb-5">Our AI and student community are here 24/7.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/dashboard/ai" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity">
                  <Sparkles size={14} /> Ask AI <ArrowRight size={13} />
                </Link>
                <Link href="/community" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-accent transition-colors">
                  <Users size={14} /> Ask the community
                </Link>
              </div>
            </div>
          </section>

        </div>
      </main>
      <Footer />
    </div>
  );
}

function SectionHeader({ icon: Icon, color, bg, title }: {
  icon: React.ElementType; color: string; bg: string; title: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-9 h-9 rounded-xl ${bg} ${color} flex items-center justify-center shrink-0`}>
        <Icon size={16} />
      </div>
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
    </div>
  );
}
