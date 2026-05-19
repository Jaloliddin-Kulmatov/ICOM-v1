"use client";

import { useState } from "react";
import { MapPin, Star, Loader2, Navigation, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth";

type Restaurant = {
  name: string;
  korean: string;
  type: string;
  price: string;
  rating: number;
  note: string;
  emoji: string;
};

type Results = {
  korean: Restaurant[];
  foreign: Restaurant[];
};

const CITIES: { city: string; lat: number; lng: number }[] = [
  { city: "Jeonju",   lat: 35.8242, lng: 127.1480 },
  { city: "Seoul",    lat: 37.5665, lng: 126.9780 },
  { city: "Busan",    lat: 35.1796, lng: 129.0756 },
  { city: "Daejeon",  lat: 36.3504, lng: 127.3845 },
  { city: "Daegu",    lat: 35.8714, lng: 128.6014 },
  { city: "Gwangju",  lat: 35.1595, lng: 126.8526 },
  { city: "Incheon",  lat: 37.4563, lng: 126.7052 },
  { city: "Suwon",    lat: 37.2636, lng: 127.0286 },
  { city: "Jeonju",   lat: 35.8242, lng: 127.1480 },
];

function nearestCity(lat: number, lng: number) {
  const R = 6371;
  return CITIES.reduce((best, c) => {
    const dLat = ((c.lat - lat) * Math.PI) / 180;
    const dLng = ((c.lng - lng) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat * Math.PI) / 180) * Math.cos((c.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const bd = (() => {
      const dLat2 = ((best.lat - lat) * Math.PI) / 180;
      const dLng2 = ((best.lng - lng) * Math.PI) / 180;
      const a2 = Math.sin(dLat2 / 2) ** 2 + Math.cos((lat * Math.PI) / 180) * Math.cos((best.lat * Math.PI) / 180) * Math.sin(dLng2 / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a2), Math.sqrt(1 - a2));
    })();
    return d < bd ? c : best;
  }).city;
}

function RestaurantCard({ r, accent }: { r: Restaurant; accent: string }) {
  return (
    <div className={`p-4 rounded-2xl border bg-card transition-colors group hover:${accent}`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl">{r.emoji}</span>
        <div className="flex items-center gap-1 text-xs text-amber-500 font-semibold">
          <Star size={11} className="fill-amber-500" />
          {r.rating}
        </div>
      </div>
      <h4 className="text-sm font-bold text-foreground leading-tight mb-0.5">{r.name}</h4>
      <p className="text-[11px] text-muted-foreground mb-1">{r.korean} · {r.type}</p>
      <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">{r.note}</p>
      <span className="text-xs font-semibold text-emerald-500">{r.price}</span>
    </div>
  );
}

export default function NearbyRestaurants() {
  const { user } = useAuth();
  const [state, setState] = useState<"idle" | "locating" | "loading" | "done" | "error">("idle");
  const [results, setResults] = useState<Results | null>(null);
  const [city, setCity] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function fetchRecommendations(cityName: string, nationality: string) {
    setState("loading");
    const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
    const token = typeof window !== "undefined" ? localStorage.getItem("icon_token") : null;
    const res = await fetch(`${BASE}/ai/restaurants`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ city: cityName, nationality }),
    });
    if (!res.ok) { setErrorMsg("Could not load recommendations."); setState("error"); return; }
    const json = await res.json();
    if (json.error) { setErrorMsg(json.error); setState("error"); return; }
    setResults(json);
    setState("done");
  }

  function detect() {
    if (!navigator.geolocation) { setErrorMsg("Geolocation not supported."); setState("error"); return; }
    setState("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = nearestCity(pos.coords.latitude, pos.coords.longitude);
        setCity(c);
        fetchRecommendations(c, user?.country || "");
      },
      () => { setErrorMsg("Location access denied. Enable it in browser settings."); setState("error"); },
      { timeout: 8000 }
    );
  }

  function reset() { setState("idle"); setResults(null); setCity(""); setErrorMsg(""); }

  if (state === "idle") {
    return (
      <div className="mt-6 p-5 rounded-2xl border border-orange-500/20 bg-orange-500/5 flex flex-col sm:flex-row items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center shrink-0">
            <MapPin size={18} className="text-orange-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Restaurants near you</p>
            <p className="text-xs text-muted-foreground">
              {user?.country
                ? `International & ${user.country} food near you`
                : "International & foreign food near you"}
            </p>
          </div>
        </div>
        <button
          onClick={detect}
          className="sm:ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 transition-colors shrink-0"
        >
          <Navigation size={13} />
          Find restaurants
        </button>
      </div>
    );
  }

  if (state === "locating" || state === "loading") {
    return (
      <div className="mt-6 p-5 rounded-2xl border border-border bg-card flex items-center gap-3">
        <Loader2 size={18} className="text-orange-500 animate-spin" />
        <p className="text-sm text-muted-foreground">
          {state === "locating" ? "Detecting your location…" : `Finding restaurants in ${city}…`}
        </p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="mt-6 p-4 rounded-xl border border-red-500/20 bg-red-500/5 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">{errorMsg}</p>
        <button onClick={reset} className="text-xs text-orange-500 hover:underline shrink-0">Try again</button>
      </div>
    );
  }

  if (!results) return null;

  const nationalityLabel = user?.country || "International";

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-5">
        <MapPin size={14} className="text-orange-500" />
        <p className="text-sm font-semibold text-foreground">
          Near <span className="text-orange-500">{city}</span>
          {user?.country && <span className="text-muted-foreground font-normal"> · personalised for {user.country}</span>}
        </p>
        <button onClick={reset} className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
          <RefreshCw size={11} /> refresh
        </button>
      </div>

      {/* Korean picks */}
      {results.korean?.length > 0 && (
        <>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">🇰🇷 Korean picks</p>
          <div className="grid sm:grid-cols-2 gap-3 mb-6">
            {results.korean.map((r) => (
              <RestaurantCard key={r.name} r={r} accent="border-orange-500/30" />
            ))}
          </div>
        </>
      )}

      {/* Home country picks */}
      {results.foreign?.length > 0 && (
        <>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
            🌍 {nationalityLabel} & international food
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {results.foreign.map((r) => (
              <RestaurantCard key={r.name} r={r} accent="border-indigo-500/30" />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
