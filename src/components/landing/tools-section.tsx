import React from "react";
import Link from "next/link";
import {
  ArrowRight, Bell, Briefcase, Check, Compass, FileText, ListChecks, MessageSquare, Sparkles, Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Each tool shows a small drawing of what it does, so visitors see the tool
// instead of reading about it. The numbers in the drawings are examples.

type Tool = {
  title: string; href: string; icon: React.ElementType; tile: string; text: string;
  preview: React.ReactNode; wide?: boolean;
};

const Box = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-xl border border-border bg-background/60 p-4 ${className}`}>{children}</div>
);

const Line = ({ w, className = "bg-muted-foreground/20" }: { w: string; className?: string }) => (
  <div className={`h-1.5 rounded-full ${className}`} style={{ width: w }} />
);

function CvPreview() {
  const doc = (title: string, rows: [string, string][], ko?: boolean) => (
    <div className={`w-full sm:flex-1 rounded-lg border bg-card p-3 shadow-sm ${ko ? "border-blue-500/40" : "border-border"}`}>
      <p className={`text-[11px] font-bold text-center mb-2 ${ko ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`}>{title}</p>
      <div className="space-y-1.5">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[2.6rem_1fr] gap-1.5 items-center">
            <span className={`text-[9px] rounded px-1 py-0.5 text-center ${ko ? "bg-blue-500/10 text-blue-700 dark:text-blue-300" : "bg-muted text-muted-foreground"}`}>{k}</span>
            <span className="text-[10px] text-foreground truncate">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <Box className="flex flex-col sm:flex-row items-center gap-3">
      {doc("CV", [["Edu", "JBNU, Business"], ["Work", "Marketing intern"], ["Lang", "TOPIK 4"]])}
      <div className="h-8 w-8 shrink-0 rounded-full bg-blue-500 text-white flex items-center justify-center shadow rotate-90 sm:rotate-0">
        <ArrowRight size={14} />
      </div>
      {doc("이력서", [["학력", "전북대학교 경영학"], ["경력", "마케팅 인턴"], ["어학", "TOPIK 4급"]], true)}
    </Box>
  );
}

function VisaPreview() {
  const left = 62, total = 90;
  const r = 30, c = 2 * Math.PI * r;
  return (
    <Box className="flex items-center gap-4">
      <svg viewBox="0 0 72 72" className="h-[72px] w-[72px] shrink-0 -rotate-90" aria-hidden>
        <circle cx="36" cy="36" r={r} fill="none" strokeWidth="7" className="stroke-muted" />
        <circle cx="36" cy="36" r={r} fill="none" strokeWidth="7" strokeLinecap="round" className="stroke-amber-500"
          strokeDasharray={`${(left / total) * c} ${c}`} />
      </svg>
      <div>
        <p className="text-2xl font-extrabold text-foreground leading-none">62 days</p>
        <p className="text-xs text-muted-foreground mt-1">until your D-2 visa ends</p>
        <div className="flex gap-1 mt-2">
          {[90, 60, 30, 7].map((d) => (
            <span key={d} className={`text-[10px] font-semibold rounded-full px-1.5 py-0.5 ${d === 60 ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground"}`}>{d}d</span>
          ))}
        </div>
      </div>
    </Box>
  );
}

function JobsPreview() {
  const jobs = [
    { t: "Marketing intern", m: "Seoul · Internship", c: "bg-blue-500" },
    { t: "Café staff (weekends)", m: "Jeonju · ₩10,500/h", c: "bg-emerald-500" },
    { t: "Research assistant", m: "JBNU · D-2 OK", c: "bg-violet-500" },
  ];
  return (
    <Box className="space-y-2.5">
      {jobs.map((j) => (
        <div key={j.t} className="flex items-center gap-2.5">
          <span className={`h-7 w-7 rounded-lg ${j.c} shrink-0`} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground truncate">{j.t}</p>
            <p className="text-[10px] text-muted-foreground">{j.m}</p>
          </div>
        </div>
      ))}
    </Box>
  );
}

function AiPreview() {
  return (
    <Box className="space-y-2">
      <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-orange-500 px-3 py-1.5 text-[11px] text-white">
        How do I extend my D-2 visa?
      </div>
      <div className="w-[85%] rounded-2xl rounded-bl-sm bg-muted px-3 py-2 space-y-1.5">
        <Line w="90%" /><Line w="75%" /><Line w="55%" />
      </div>
    </Box>
  );
}

function AskPreview() {
  return (
    <Box className="space-y-2.5">
      <div className="inline-flex rounded-lg border border-border p-0.5 text-[10px] font-semibold">
        <span className="rounded-md bg-pink-500 text-white px-2 py-0.5">All students</span>
        <span className="px-2 py-0.5 text-muted-foreground">My university</span>
      </div>
      <p className="text-xs font-semibold text-foreground">Which bank is easiest for foreigners?</p>
      <div className="flex items-center gap-2">
        <div className="flex -space-x-1.5">
          {["bg-pink-400", "bg-blue-400", "bg-emerald-400"].map((c) => <span key={c} className={`h-5 w-5 rounded-full border-2 border-card ${c}`} />)}
        </div>
        <span className="text-[10px] text-muted-foreground">4 answers · 1 accepted</span>
      </div>
    </Box>
  );
}

function ChecklistPreview() {
  const items: [string, boolean][] = [["Get your ARC", true], ["Open a bank account", true], ["Phone plan", false], ["Health insurance", false]];
  return (
    <Box className="space-y-2">
      {items.map(([t, done]) => (
        <div key={t} className="flex items-center gap-2.5">
          <span className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${done ? "bg-teal-500 text-white" : "border-2 border-muted-foreground/30"}`}>
            {done && <Check size={10} strokeWidth={3} />}
          </span>
          <span className={`text-xs ${done ? "text-muted-foreground line-through" : "text-foreground"}`}>{t}</span>
        </div>
      ))}
    </Box>
  );
}

function ClubsPreview() {
  return (
    <Box className="space-y-2.5">
      {[["Language exchange", "Fri 19:00", "bg-sky-500"], ["Football club", "Sat 10:00", "bg-emerald-500"]].map(([n, d, c]) => (
        <div key={n} className="flex items-center gap-2.5">
          <span className={`h-8 w-8 rounded-full ${c} shrink-0 flex items-center justify-center text-white text-[11px] font-bold`}>{n[0]}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{n}</p>
            <p className="text-[10px] text-muted-foreground">Next event · {d}</p>
          </div>
        </div>
      ))}
    </Box>
  );
}

function GuidesPreview() {
  const topics = ["Visa", "Banking", "Housing", "Insurance", "Transport", "Korean"];
  return (
    <Box className="flex flex-wrap gap-1.5">
      {topics.map((t) => (
        <span key={t} className="text-[11px] font-medium rounded-full border border-border bg-card px-2.5 py-1 text-foreground">{t}</span>
      ))}
    </Box>
  );
}

const TOOLS: Tool[] = [
  { title: "Korean CV maker", href: "/dashboard/cv", icon: FileText, tile: "bg-blue-500", wide: true, preview: <CvPreview />,
    text: "Turn your CV into a Korean 이력서 in the format companies expect, then download it as Word." },
  { title: "Visa reminders", href: "/dashboard/profile", icon: Bell, tile: "bg-amber-500", preview: <VisaPreview />,
    text: "Add your visa end date. We remind you 90, 60, 30 and 7 days before." },
  { title: "Internships & part-time", href: "/internships", icon: Briefcase, tile: "bg-emerald-500", preview: <JobsPreview />,
    text: "Jobs open to international students, checked every day." },
  { title: "AI assistant", href: "/dashboard/ai", icon: Sparkles, tile: "bg-orange-500", preview: <AiPreview />,
    text: "Ask about visas, banks or hospitals and get an answer in seconds." },
  { title: "Ask students", href: "/chat", icon: MessageSquare, tile: "bg-pink-500", preview: <AskPreview />,
    text: "Ask everyone, or only students at your university." },
  { title: "Arrival checklist", href: "/guide", icon: ListChecks, tile: "bg-teal-500", preview: <ChecklistPreview />,
    text: "Everything to do in your first weeks, in order." },
  { title: "Clubs", href: "/community", icon: Users, tile: "bg-sky-500", preview: <ClubsPreview />,
    text: "Join university clubs and see their next events." },
  { title: "Life in Korea guides", href: "/guide", icon: Compass, tile: "bg-violet-500", preview: <GuidesPreview />,
    text: "Simple step-by-step guides for daily life." },
];

export default function ToolsSection() {
  return (
    <section className="py-24 px-4 sm:px-6" id="tools">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Badge variant="default" className="mb-4 text-xs px-4 py-1">Free tools</Badge>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-4">
            Tools for <span className="gradient-text">life in Korea</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need as an international student, in one place. Free for every student.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link key={tool.title} href={tool.href}
                className={`group flex flex-col gap-5 rounded-3xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-foreground/15 ${tool.wide ? "md:col-span-2" : ""}`}>
                <div className="flex items-center gap-3">
                  <span className={`h-11 w-11 rounded-2xl ${tool.tile} text-white flex items-center justify-center shadow-sm shrink-0`}>
                    <Icon size={20} />
                  </span>
                  <h3 className="flex-1 text-lg font-bold text-foreground">{tool.title}</h3>
                  <ArrowRight size={18} className="text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
                </div>
                <div aria-hidden className="flex-1">{tool.preview}</div>
                <p className="text-sm text-muted-foreground leading-relaxed">{tool.text}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
