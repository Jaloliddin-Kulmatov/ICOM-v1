import React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import DashboardLayout from "@/components/layout/dashboard-layout";

/** Frame shared by the study tool pages: back link, icon, title and the on-device note. */
export default function ToolPage({ icon: Icon, tile, title, intro, children }: {
  icon: React.ElementType; tile: string; title: string; intro: string; children: React.ReactNode;
}) {
  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <Link href="/dashboard/tools" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground mb-4">
          <ChevronLeft size={14} /> Study tools
        </Link>
        <div className="flex items-center gap-3 mb-1">
          <span className={`h-11 w-11 rounded-2xl ${tile} text-white flex items-center justify-center shadow-sm`}><Icon size={20} /></span>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">{title}</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-2 mb-6">{intro}</p>
        {children}
        <p className="text-[11px] text-muted-foreground mt-8">Saved on this device only. Nothing is sent to ICOM.</p>
      </div>
    </DashboardLayout>
  );
}

export const field = "h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50";
export const card = "rounded-2xl border border-border bg-card p-5";
