"use client";

import React, { useState } from "react";
import Navbar from "@/components/layout/navbar";
import Link from "next/link";
import {
  Train, ChevronDown, ExternalLink, AlertCircle,
  CheckCircle2, ArrowLeft, Clock, ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const sections = [
  {
    title: "T-money Card (버스 & 지하철)",
    color: "text-amber-500 dark:text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    items: [
      {
        q: "What is T-money and where do I get one?",
        a: "T-money is Korea's rechargeable transit card — it works on buses, subways, and some taxis across the entire country. Buy one at any convenience store (CU, GS25, 7-Eleven, Ministop) for ₩2,500–4,000. It's a physical card you tap on bus/subway readers. You can also load T-money onto compatible smartphones (Android NFC) using the T-money app."
      },
      {
        q: "How do I charge (top up) my T-money card?",
        a: "Charge at: (1) Convenience store cash registers — hand the card and cash to the clerk, say '충전해주세요 + amount' (e.g., '만원 충전해주세요' = charge ₩10,000). (2) Subway station kiosks (machines have English interface — select 'Charge', insert card, insert cash). (3) T-money app (Android only, requires NFC). Minimum charge: ₩1,000. Recommended top-up: ₩10,000–20,000 at a time."
      },
      {
        q: "How much do I save using T-money vs cash?",
        a: "Using T-money is always cheaper than paying cash on buses: Bus with T-money = ₩1,200–1,500 (adults). Cash on bus = ₩1,300–1,600. Metro fare with T-money starts at ₩1,250. T-money also gives free transfers between bus and metro within 30 minutes — huge savings if you transfer to reach your destination."
      },
      {
        q: "What is Kakao T and how is it different?",
        a: "Kakao T is a taxi-hailing app (like Uber). Download it from the App Store or Google Play. You can call 일반택시 (regular taxi) or 블랙 (premium black car). Payment via Kakao Pay or credit card — no need for cash. Taxis in Korea are very affordable: base fare ₩3,800, typical city ride ₩5,000–12,000."
      },
    ]
  },
  {
    title: "Jeonju City Buses (전주 시내버스)",
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    items: [
      {
        q: "How do I use buses in Jeonju?",
        a: "Step 1: Find your bus using Naver Maps (map.naver.com) or Kakao Maps (map.kakao.com) — both show real-time bus arrival times and routes. Step 2: Board the bus at the front door and tap your T-money card on the reader. Step 3: When your stop approaches, press the stop button (하차 button). Step 4: Exit from the rear door and tap your T-money card again (this enables the free transfer discount)."
      },
      {
        q: "What apps should I use for Jeonju buses?",
        a: "Best apps: (1) Naver Maps (네이버지도) — best real-time bus tracking, walking + transit directions. (2) Kakao Maps (카카오맵) — great for routes and live bus locations. (3) 전주 버스 (Jeonju Bus) — official city bus app showing arrival times. All are free. Set your language to English in Naver Maps for easier use."
      },
      {
        q: "What bus goes from JBNU to Jeonju Hanok Village?",
        a: "From JBNU main gate, take Bus 119 or 511 — journey is approximately 20–30 minutes to the Hanok Village (한옥마을) area. Buses run from early morning to midnight. Check the Naver Maps app for real-time schedules. Taxi from JBNU to Hanok Village is about ₩6,000–9,000 (10–15 min)."
      },
    ]
  },
  {
    title: "KTX High-Speed Train (기차)",
    color: "text-blue-500 dark:text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    items: [
      {
        q: "How do I take the KTX from Jeonju?",
        a: "Jeonju Station (전주역) has KTX-Eum service to Seoul (Yongsan/Suseo station) in approximately 1h 50min. Book tickets on the Korail app, Korail website (letskorail.com), or at the ticket machines at Jeonju Station (English interface available). Book in advance for weekends and holidays — trains fill up fast."
      },
      {
        q: "Do international students get a discount on KTX?",
        a: "Yes! Show your university enrollment certificate (재학증명서) and student ID (학생증) for a 30% discount on KTX off-peak services. The 'KTX 학생 할인' (student discount) must be applied when booking — select '할인' (discount) → '청소년/학생' on the Korail app. Note: not available on all trains or routes — check availability when booking."
      },
      {
        q: "What is the difference between KTX, ITX, and Mugunghwa?",
        a: "KTX = High-speed train (최고속도 300km/h) — fastest and most expensive. ITX-Saemaeul = Intercity express — medium speed, good value. Mugunghwa = Regular train — slowest, cheapest. For Seoul to Jeonju: KTX takes ~1h50m (₩30,000–40,000); Mugunghwa takes ~3h (₩17,000). Book on the same Korail platform."
      },
      {
        q: "Can I use T-money on the KTX?",
        a: "No. T-money is only for city buses and subways. KTX requires a separate ticket purchased via Korail app, website, or ticket machine. For subway systems in Seoul, Busan, etc., T-money works normally — just tap on the gates."
      },
    ]
  },
  {
    title: "Seoul Subway & Getting Around Seoul",
    color: "text-indigo-500 dark:text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    items: [
      {
        q: "How do I use the Seoul Metro?",
        a: "Seoul has 23 metro lines covering the entire city. Use Naver Maps or Kakao Maps for route planning — enter your start and end points and select 'transit' (대중교통). Tap T-money on entry and exit gates. Base fare: ₩1,250 for up to 10km. Free transfers between lines and to/from buses within 30 minutes."
      },
      {
        q: "What is the best navigation app for Seoul?",
        a: "Naver Maps is the best overall — real-time subway delay information, walking directions, bus times. Google Maps works for walking and some transit but lacks real-time Korean transit data. Kakao Maps is excellent for subway routes. Download Subway Korea (서울 지하철) app for offline metro maps."
      },
      {
        q: "How do I get from Seoul station to popular tourist spots?",
        a: "Gyeongbokgung Palace: Line 3 (Orange) to Gyeongbokgung Station. Hongdae (nightlife): Line 2 (Green) to Hongik University Station. Myeongdong (shopping): Line 4 (Blue) to Myeongdong Station. Dongdaemun (markets): Line 1, 2, or 4 to Dongdaemun History & Culture Park. All reachable with T-money."
      },
    ]
  },
  {
    title: "Intercity Buses & Getting Around Korea",
    color: "text-violet-500 dark:text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    items: [
      {
        q: "How do I travel by intercity bus (고속버스)?",
        a: "Korea has an extensive intercity bus network. From Jeonju Express Bus Terminal (전주고속버스터미널) near the city center. Book on the KOBUS website (kobus.co.kr) or at the terminal. Jeonju → Seoul: ~3h, ₩15,000–20,000. These buses are comfortable with assigned seats. For regional buses (시외버스), use the Bustago app."
      },
      {
        q: "What is the Korail Pass for foreign students?",
        a: "The Korea Rail Pass (KR Pass) gives unlimited travel on KTX and all Korail trains for a set number of days (2, 3, 5 days). Available only to foreign nationals — buy at major Korail stations or online. Price: ~USD 80–150 depending on duration. Great for multi-city trips during vacation."
      },
    ]
  },
];

const quickLinks = [
  { label: "Korail Train Booking", url: "https://www.letskorail.com/ebizbf/EbizBfKrail0030.do", note: "KTX, ITX, Mugunghwa tickets" },
  { label: "Korail App", url: "https://apps.apple.com/kr/app/korail-talk/id535210587", note: "Download KorailTalk for iOS" },
  { label: "KOBUS (Intercity Bus)", url: "https://www.kobus.co.kr/main.do", note: "Book intercity bus tickets" },
  { label: "T-money Official", url: "https://www.t-money.co.kr", note: "Card info, balance check" },
  { label: "Seoul Metro (English)", url: "https://www.seoulmetro.co.kr/en", note: "Seoul subway map & info" },
  { label: "Naver Maps", url: "https://map.naver.com", note: "Best real-time transit directions" },
  { label: "Kakao T (Taxi)", url: "https://www.kakaocorp.com/page/service/service/KakaoT", note: "Taxi booking app" },
];

const fares = [
  { label: "City bus (T-money)", cost: "₩1,200–1,500" },
  { label: "Seoul metro (basic)", cost: "₩1,250" },
  { label: "Jeonju → Seoul KTX", cost: "₩30,000–40,000" },
  { label: "Jeonju → Seoul Bus", cost: "₩15,000–20,000" },
  { label: "Taxi (city, 5km avg.)", cost: "₩6,000–10,000" },
  { label: "Kakao T (premium)", cost: "₩12,000–25,000" },
];

export default function TransportPage() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <div className="border-b border-border bg-gradient-to-b from-amber-500/5 to-transparent">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
            <Link href="/support" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors">
              <ArrowLeft size={13} /> Back to Support
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                <Train size={18} className="text-amber-500" />
              </div>
              <div>
                <Badge variant="warning" className="text-[10px] mb-1">5 guides</Badge>
                <h1 className="text-2xl font-bold text-foreground">Transportation</h1>
              </div>
            </div>
            <p className="text-muted-foreground text-sm mt-2">T-money card, Jeonju buses, KTX trains, Seoul subway, and intercity travel — getting around Korea made easy.</p>
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

            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex gap-3">
              <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-foreground/70 leading-relaxed">
                <strong className="text-foreground">Tip:</strong> Always tap out when exiting buses and subways with T-money. If you forget to tap out, you'll be charged the maximum fare and lose your transfer discount.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                <Clock size={12} className="text-muted-foreground" /> Typical Fares
              </h3>
              <div className="space-y-2 text-xs">
                {fares.map(r => (
                  <div key={r.label} className="flex justify-between text-muted-foreground">
                    <span>{r.label}</span>
                    <span className="text-foreground font-medium">{r.cost}</span>
                  </div>
                ))}
              </div>
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
              <h3 className="text-xs font-semibold text-foreground mb-1">Download Naver Maps first</h3>
              <p className="text-xs text-muted-foreground">It gives real-time bus arrivals, KTX schedules, walking routes, and works offline for maps — the single most useful app in Korea.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
