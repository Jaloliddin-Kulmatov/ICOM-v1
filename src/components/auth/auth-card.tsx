import React from "react";
import Link from "next/link";
import LogoMark from "@/components/ui/logo-mark";

/** Same frame as the sign-in page: logo, heading, card. */
export default function AuthCard({ title, subtitle, children, footer }: {
  title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 mesh-gradient dot-grid">
      <div className="fixed top-1/3 left-1/4 w-72 h-72 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
      <div className="w-full max-w-sm animate-slide-up">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <LogoMark className="w-9 h-9" />
            <span className="text-xl font-bold text-foreground">ICOM</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground mt-6 mb-1">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="glass-card p-7">{children}</div>
        {footer && <p className="text-center text-sm text-muted-foreground mt-5">{footer}</p>}
      </div>
    </div>
  );
}

export function FormMessage({ tone, children }: { tone: "error" | "ok"; children: React.ReactNode }) {
  const cls = tone === "error"
    ? "bg-red-500/10 border-red-500/20 text-red-400"
    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600";
  return <div role={tone === "error" ? "alert" : "status"} className={`px-3 py-2.5 rounded-lg border text-xs leading-relaxed animate-fade-in ${cls}`}>{children}</div>;
}
