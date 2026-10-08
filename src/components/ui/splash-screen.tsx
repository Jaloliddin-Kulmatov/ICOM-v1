"use client";

import { useEffect, useState } from "react";
import LogoMark from "@/components/ui/logo-mark";

const SEEN_KEY = "icom_splash_seen";

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Show the splash once per browser session, not on every full page load.
    let seen = false;
    try { seen = sessionStorage.getItem(SEEN_KEY) === "1"; sessionStorage.setItem(SEEN_KEY, "1"); } catch { /* storage unavailable */ }
    if (seen) { setVisible(false); return; }
    // Start fade at 1100ms, remove from DOM at 1500ms (400ms fade)
    const t1 = setTimeout(() => setFading(true), 1100);
    const t2 = setTimeout(() => setVisible(false), 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0b1220] transition-opacity duration-400 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-6 animate-fade-in relative">
        <LogoMark className="w-20 h-20 drop-shadow-2xl" />

        <div className="text-center space-y-1.5">
          <p className="text-3xl font-extrabold tracking-tight text-white">ICOM</p>
          <p className="text-sm text-white/50 tracking-widest uppercase">
            International Community in Korea
          </p>
        </div>

        {/* Metro-line loader: three stations lighting up in turn */}
        <div className="flex items-center mt-2" aria-hidden>
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center">
              {i > 0 && <div className="w-6 h-[3px] bg-white/20" />}
              <div
                className="w-2.5 h-2.5 rounded-full border-2 border-indigo-400 animate-pulse"
                style={{ animationDelay: `${i * 200}ms`, animationDuration: "0.9s" }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
