"use client";

import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("icom_splash")) return;
    sessionStorage.setItem("icom_splash", "1");
    setVisible(true);

    const t1 = setTimeout(() => setFading(true), 1300);
    const t2 = setTimeout(() => setVisible(false), 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#050508] pointer-events-none transition-opacity duration-500 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-5 animate-fade-in">
        <img src="/logo.svg" alt="ICOM" className="w-20 h-20 drop-shadow-2xl" />
        <div className="text-center space-y-1">
          <p className="text-3xl font-bold tracking-tight text-white">
            ICOM<span className="text-indigo-400">.</span>
          </p>
          <p className="text-sm text-white/35 tracking-wide">
            International Community in Korea
          </p>
        </div>
      </div>
    </div>
  );
}
