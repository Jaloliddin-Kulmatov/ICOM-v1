"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Zap,
  AlertCircle,
  Bell,
  Users,
  Briefcase,
  BookOpen,
} from "lucide-react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

const typeColors = {
  urgent: "text-red-400 bg-red-500/10 border-red-500/20",
  scholarship: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  event: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  info: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
};

const typeIcons = {
  urgent: AlertCircle,
  scholarship: Zap,
  event: Calendar,
  info: Bell,
};

const announcements = [
  {
    id: "1",
    type: "urgent" as const,
    title: "Health Insurance Renewal (NHIS)",
    body: "NHIS enrollment renewal deadline for all D-2 visa holders. Visit nhis.or.kr or the JBNU International Office.",
    time: "Pinned",
    tag: "All Students",
  },
  {
    id: "2",
    type: "scholarship" as const,
    title: "Korean Government Scholarship (GKS)",
    body: "Applications for the Global Korea Scholarship are open. Visit the JBNU scholarship portal for details.",
    time: "Pinned",
    tag: "JBNU",
  },
  {
    id: "3",
    type: "event" as const,
    title: "Welcome to ICOM — JBNU Community",
    body: "This platform is built for JBNU international students. Browse clubs, find jobs, and connect with others.",
    time: "New",
    tag: "JBNU",
  },
];

const quickLinks = [
  { href: "/support", icon: "🗺️", label: "Life Guide" },
  { href: "/support/visa", icon: "🛂", label: "Visa Info" },
  { href: "/community", icon: "👥", label: "Community" },
  { href: "/jobs", icon: "💼", label: "Jobs" },
  { href: "/universities", icon: "🎓", label: "University" },
  { href: "/dashboard/ai", icon: "✨", label: "AI Chat" },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] || "there";

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <DashboardLayout>
      {/* Welcome header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">
            {greeting}, {firstName} 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Welcome to ICOM — your guide to life at JBNU and in Korea.
          </p>
        </div>
        <Button variant="glass" size="sm" asChild className="gap-1.5 hidden sm:flex">
          <Link href="/dashboard/ai">
            <Sparkles size={14} className="text-violet-400" />
            Ask AI
          </Link>
        </Button>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { icon: Users, label: "Community", value: "Join", href: "/community", color: "text-indigo-400", bg: "bg-indigo-500/10" },
          { icon: Briefcase, label: "Jobs & Clubs", value: "Browse", href: "/jobs", color: "text-violet-400", bg: "bg-violet-500/10" },
          { icon: Sparkles, label: "AI Assistant", value: "Chat", href: "/dashboard/ai", color: "text-cyan-400", bg: "bg-cyan-500/10" },
          { icon: BookOpen, label: "Visa Guides", value: "Read", href: "/support/visa", color: "text-emerald-400", bg: "bg-emerald-500/10" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="group p-5 rounded-2xl border border-white/8 bg-white/3 hover:border-white/15 hover:bg-white/5 transition-all duration-200 hover:-translate-y-0.5"
            >
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${item.bg} mb-3`}>
                <Icon size={17} className={item.color} />
              </div>
              <div className="text-sm font-semibold text-foreground group-hover:text-indigo-300 transition-colors">{item.value} →</div>
              <div className="text-xs text-muted-foreground mt-0.5">{item.label}</div>
            </Link>
          );
        })}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Announcements — 2 cols */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Announcements</h2>

          <div className="space-y-3">
            {announcements.map((a) => {
              const Icon = typeIcons[a.type];
              return (
                <div
                  key={a.id}
                  className={`flex gap-3 p-4 rounded-2xl border ${typeColors[a.type]} transition-all hover:opacity-90`}
                >
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-white/5">
                    <Icon size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-xs font-semibold text-foreground">{a.title}</h3>
                      <span className="text-[10px] text-muted-foreground shrink-0">{a.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{a.body}</p>
                    <span className="text-[10px] text-muted-foreground/60 mt-1 inline-block">{a.tag}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* AI banner */}
          <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/50 to-violet-950/50 p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shrink-0">
                <Sparkles size={18} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-foreground mb-0.5">Ask ICOM AI anything about Korea</p>
                <p className="text-xs text-muted-foreground">Visa questions, banking, housing, transportation — I know it all.</p>
              </div>
              <Button size="sm" asChild className="shrink-0">
                <Link href="/dashboard/ai">Chat Now</Link>
              </Button>
            </div>
          </div>

          {/* Profile info card */}
          {user && (
            <div className="p-5 rounded-2xl border border-white/8 bg-white/3">
              <h2 className="text-sm font-semibold text-foreground mb-3">Your Profile</h2>
              <div className="grid grid-cols-2 gap-y-2 text-xs">
                <span className="text-muted-foreground">Name</span>
                <span className="text-foreground font-medium">{user.name}</span>
                <span className="text-muted-foreground">University</span>
                <span className="text-foreground font-medium">{user.university || "Not set"}</span>
                <span className="text-muted-foreground">Visa Type</span>
                <span className="text-foreground font-medium">{user.visa_type || "Not set"}</span>
                <span className="text-muted-foreground">Country</span>
                <span className="text-foreground font-medium">{user.country || "Not set"}</span>
              </div>
              <Link
                href="/dashboard/settings"
                className="mt-3 flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Edit profile <ArrowRight size={10} />
              </Link>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Quick access */}
          <div className="p-5 rounded-2xl border border-white/8 bg-white/3">
            <h2 className="text-sm font-semibold text-foreground mb-3">Quick Access</h2>
            <div className="grid grid-cols-2 gap-2">
              {quickLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/3 border border-white/8 hover:border-white/15 hover:bg-white/6 transition-all text-center"
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-[10px] font-medium text-muted-foreground">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* JBNU info */}
          <div className="p-5 rounded-2xl border border-indigo-500/20 bg-indigo-500/5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 size={14} className="text-indigo-400" />
              <h2 className="text-sm font-semibold text-foreground">JBNU Resources</h2>
            </div>
            <div className="space-y-2 text-xs">
              {[
                { label: "International Office", href: "https://international.jbnu.ac.kr" },
                { label: "Student Portal", href: "https://portal.jbnu.ac.kr" },
                { label: "Library", href: "https://library.jbnu.ac.kr" },
              ].map((r) => (
                <a
                  key={r.label}
                  href={r.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between text-muted-foreground hover:text-indigo-400 transition-colors"
                >
                  <span>{r.label}</span>
                  <ArrowRight size={10} />
                </a>
              ))}
            </div>
          </div>

          {/* Visa guide link */}
          <div className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={14} className="text-emerald-400" />
              <h2 className="text-sm font-semibold text-foreground">Visa & Insurance</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Keep your visa and NHIS insurance up to date to avoid enrollment issues.</p>
            <Link
              href="/support/visa"
              className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              View visa guide <ArrowRight size={10} />
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
