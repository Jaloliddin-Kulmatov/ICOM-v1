"use client";

import { useState } from "react";
import {
  MapPin, Navigation, Loader2, RefreshCw, ChevronRight,
  Utensils, Hospital, Landmark, Pill, Building2, ShoppingCart,
  Phone, Coffee, Stethoscope, Train,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import NearbyRestaurants from "./nearby-restaurants";

/**
 * NearbyPlaces — generalised "find important locations near you" widget.
 *
 * One-click access to the most useful places international students need
 * in Korea, opened in Naver Map (the de-facto map app here). Naver Map
 * deep-link search URLs work on web AND open the native app on mobile
 * when installed.
 */

type Category = {
  key: string;
  label: string;
  desc: string;
  query: string;       // Naver Map search query (Korean recommended)
  Icon: LucideIcon;
  color: string;       // tailwind text colour
  bg: string;          // tailwind bg colour
};

const CATEGORIES: Category[] = [
  {
    key: "hospital",
    label: "Hospital",
    desc: "Foreigner-friendly general hospitals",
    query: "외국인 병원",
    Icon: Hospital,
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  {
    key: "pharmacy",
    label: "Pharmacy",
    desc: "Pharmacies with 24-hour service",
    query: "약국",
    Icon: Pill,
    color: "text-pink-500",
    bg: "bg-pink-500/10",
  },
  {
    key: "bank",
    label: "Bank",
    desc: "KB, Woori, Shinhan — foreigner accounts",
    query: "은행 외국인",
    Icon: Landmark,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    key: "immigration",
    label: "Immigration",
    desc: "Visa extensions and ARC services",
    query: "출입국 외국인청",
    Icon: Building2,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
  },
  {
    key: "convenience",
    label: "Convenience store",
    desc: "GS25, CU, 7-Eleven — open 24/7",
    query: "편의점",
    Icon: ShoppingCart,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    key: "atm",
    label: "Foreign-card ATM",
    desc: "Citi and GS25 — Visa/Mastercard friendly",
    query: "외국인 ATM",
    Icon: Phone,
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
  {
    key: "halal",
    label: "Halal & foreign food",
    desc: "Halal market and international groceries",
    query: "할랄 식료품",
    Icon: Utensils,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    key: "cafe",
    label: "Study café",
    desc: "Wi-Fi, power outlets, quiet hours",
    query: "스터디카페",
    Icon: Coffee,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    key: "clinic",
    label: "English-speaking clinic",
    desc: "Walk-in clinics with English support",
    query: "영어 진료 가능 병원",
    Icon: Stethoscope,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
  },
  {
    key: "subway",
    label: "Subway station",
    desc: "Find the closest metro entrance",
    query: "지하철역",
    Icon: Train,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
];

const CITIES: { city: string; lat: number; lng: number }[] = [
  { city: "Jeonju",  lat: 35.8242, lng: 127.1480 },
  { city: "Seoul",   lat: 37.5665, lng: 126.9780 },
  { city: "Busan",   lat: 35.1796, lng: 129.0756 },
  { city: "Daejeon", lat: 36.3504, lng: 127.3845 },
  { city: "Daegu",   lat: 35.8714, lng: 128.6014 },
  { city: "Gwangju", lat: 35.1595, lng: 126.8526 },
  { city: "Incheon", lat: 37.4563, lng: 126.7052 },
  { city: "Suwon",   lat: 37.2636, lng: 127.0286 },
];

function nearestCity(lat: number, lng: number) {
  const R = 6371;
  const dist = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const x = Math.sin(dLat / 2) ** 2 +
      Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  };
  let best = CITIES[0];
  let bestD = dist({ lat, lng }, best);
  for (const c of CITIES.slice(1)) {
    const d = dist({ lat, lng }, c);
    if (d < bestD) { best = c; bestD = d; }
  }
  return best.city;
}

function naverMapSearchUrl(query: string, near?: string) {
  const q = near ? `${near} ${query}` : query;
  return `https://map.naver.com/p/search/${encodeURIComponent(q)}`;
}

export default function NearbyPlaces() {
  const { user } = useAuth();
  const [city, setCity] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");

  const detect = () => {
    if (!navigator.geolocation) {
      setError("Geolocation isn't supported on this device.");
      return;
    }
    setError("");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = nearestCity(pos.coords.latitude, pos.coords.longitude);
        setCity(c);
        setLocating(false);
      },
      () => {
        setError("Location access denied. You can still tap any category to search.");
        setLocating(false);
      },
      { timeout: 8000 }
    );
  };

  return (
    <section id="nearby" className="space-y-5">
      {/* ── Header card ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-indigo-500/5 to-violet-500/5 p-5 sm:p-6">
        <div className="flex items-start gap-4 flex-col sm:flex-row sm:items-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
            <MapPin size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-foreground mb-0.5">Find places near you</h2>
            <p className="text-xs text-muted-foreground">
              {city ? (
                <>
                  Showing places near <span className="text-indigo-500 font-semibold">{city}</span>.
                  Tap any category to open Naver Map.
                </>
              ) : (
                <>One-tap access to the locations you'll need most as an international student.</>
              )}
            </p>
          </div>
          {!city ? (
            <button
              onClick={detect}
              disabled={locating}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500 text-white text-xs font-semibold hover:bg-indigo-600 transition-colors shrink-0 disabled:opacity-60"
            >
              {locating ? <Loader2 size={13} className="animate-spin" /> : <Navigation size={13} />}
              {locating ? "Locating…" : "Use my location"}
            </button>
          ) : (
            <button
              onClick={() => { setCity(null); setError(""); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <RefreshCw size={12} /> Change
            </button>
          )}
        </div>
        {error && (
          <p className="mt-3 text-[11px] text-amber-500">{error}</p>
        )}
      </div>

      {/* ── Categories grid ─────────────────────────────────────── */}
      {/* 2 cols on phone, 3 on tablets, 5 on PC — same density as before
          but each card has a larger icon and a bit more breathing room so
          it reads at desktop sizes without looking sparse. */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {CATEGORIES.map((c) => {
          const href = naverMapSearchUrl(c.query, city ?? undefined);
          return (
            <a
              key={c.key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-3 p-4 lg:p-5 rounded-2xl border border-border bg-card hover:border-indigo-500/40 hover:shadow-md transition-all min-h-[152px]"
            >
              <div className={`w-11 h-11 rounded-2xl ${c.bg} ${c.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                <c.Icon size={20} strokeWidth={2.25} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground leading-tight">{c.label}</p>
                <p className="text-[11px] text-muted-foreground leading-snug mt-1 line-clamp-2">{c.desc}</p>
              </div>
              <div className="flex items-center text-[10px] text-indigo-500 font-semibold">
                Open in Naver Map <ChevronRight size={11} className="ml-0.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </a>
          );
        })}
      </div>

      {/* ── AI personalised restaurant picks (kept) ─────────────── */}
      <div className="pt-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
          ✨ AI picks for {user?.country || "you"}
        </p>
        <NearbyRestaurants />
      </div>
    </section>
  );
}
