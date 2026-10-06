import React from "react";
import { cn } from "@/lib/utils";

// ICOM "Metro Stop" mark: the i is a subway line, the o is a station ring,
// and the coral dot is you arriving. Same artwork as /public/logo.svg.
export default function LogoMark({ className, title = "ICOM" }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" role="img" aria-label={title} className={cn("w-8 h-8 shrink-0", className)}>
      <rect width="64" height="64" rx="15" fill="#00994a" />
      <rect x="18" y="12" width="7" height="40" rx="3.5" fill="#fff" fillOpacity=".35" />
      <circle cx="21.5" cy="17" r="5" fill="#fff" />
      <path d="M21.5 32H32" stroke="#fff" strokeWidth="7" strokeLinecap="round" />
      <circle cx="41" cy="32" r="11" stroke="#fff" strokeWidth="7" />
      <circle cx="41" cy="32" r="3.2" fill="#ff6b5a" />
    </svg>
  );
}
