"use client";

import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Start fade at 1500ms, remove from DOM at 1900ms (400ms fade)
    const t1 = setTimeout(() => setFading(true), 1500);
    const t2 = setTimeout(() => setVisible(false), 1900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#050508] transition-opacity duration-400 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />

      <div className="flex flex-col items-center gap-6 animate-fade-in relative">
        {/* Pulsing ring behind logo */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-28 h-28 rounded-full bg-indigo-500/10 animate-ping" style={{ animationDuration: "1.5s" }} />
          <img src="/logo.svg" alt="ICOM" className="w-20 h-20 drop-shadow-2xl relative z-10" />
        </div>

        <div className="text-center space-y-1.5">
          <p className="text-3xl font-bold tracking-tight text-white">
            ICOM<span className="text-indigo-400">.</span>
          </p>
          <p className="text-sm text-white/40 tracking-widest uppercase">
            International Community in Korea
          </p>
        </div>

        {/* Loading dots */}
        <div className="flex items-center gap-1.5 mt-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-indigo-400/60 animate-bounce"
              style={{ animationDelay: `${i * 150}ms`, animationDuration: "0.8s" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
