"use client";

import React, { useState } from "react";
import Navbar from "@/components/layout/navbar";
import { UNIVERSITIES } from "@/lib/constants";
import { Users, MapPin, ExternalLink, Search, Star, CheckCircle2, GraduationCap, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import AmbassadorModal from "@/components/ui/ambassador-modal";

const PROVINCES = [
  "All",
  "Seoul",
  "Gyeonggi-do",
  "Incheon",
  "Daejeon",
  "Busan",
  "Daegu",
  "Gwangju",
  "Ulsan",
  "Gangwon-do",
  "Chungcheong",
  "Jeollabuk-do",
  "Jeollanam-do",
  "Gyeongsang",
  "Jeju-do",
];

const JBNU_INFO = {
  address: "567 Baekje-daero, Deokjin-gu, Jeonju, Jeollabuk-do 54896",
  intlOffice: "+82-63-270-2023",
  website: "https://international.jbnu.ac.kr",
  programs: ["Exchange", "Degree-seeking", "Korean Language", "Summer School"],
  tips: [
    "The International Office (국제교류처) is in the Main Administration Building, Room 104.",
    "JBNU has direct shuttle buses connecting the main campus and the medical school campus.",
    "Free Korean tutoring is available through the Language Education Center.",
    "Student dormitories (기숙사) — international students get priority in the first-year application.",
  ],
};

export default function UniversitiesPage() {
  const [search, setSearch] = useState("");
  const [province, setProvince] = useState("All");
  const [showAmbassador, setShowAmbassador] = useState(false);

  const filtered = UNIVERSITIES.filter(u => {
    const matchSearch = !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.shortName.toLowerCase().includes(search.toLowerCase()) ||
      u.city.toLowerCase().includes(search.toLowerCase()) ||
      u.province.toLowerCase().includes(search.toLowerCase());
    const matchProvince = province === "All" || u.province === province;
    return matchSearch && matchProvince;
  });

  const jbnu = UNIVERSITIES.find(u => u.id === "jbnu")!;
  const jbnuInFilter = filtered.some(u => u.id === "jbnu");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {showAmbassador && <AmbassadorModal onClose={() => setShowAmbassador(false)} />}
      <main className="pt-16">

        {/* Hero */}
        <div className="border-b border-border bg-gradient-to-b from-indigo-950/30 via-violet-950/10 to-transparent dark:from-indigo-950/30 dark:via-violet-950/10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 text-center">
            <Badge variant="violet" className="mb-4 text-xs px-3 py-1">University Network</Badge>
            <h1 className="text-4xl font-extrabold text-foreground mb-3">Korean Universities Guide</h1>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8 text-sm leading-relaxed">
              Find the right university, connect with students, and navigate Korean campus life.
              Starting with JBNU — growing to every university in Korea.
            </p>
            <div className="flex items-center justify-center gap-8 text-sm">
              {[
                { value: `${UNIVERSITIES.length}+`, label: "Universities", color: "text-violet-500 dark:text-violet-400" },
                { value: "47K+", label: "Int'l Students", color: "text-indigo-500 dark:text-indigo-400" },
                { value: "89", label: "Countries", color: "text-cyan-600 dark:text-cyan-400" },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

          {/* JBNU spotlight */}
          {jbnuInFilter && <div className="mb-12 rounded-3xl border border-indigo-500/30 bg-card overflow-hidden shadow-sm">
            <div className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-lg shrink-0 shadow-[0_4px_20px_rgba(99,102,241,0.4)]">
                  JB
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-bold text-foreground">Jeonbuk National University</h2>
                    <Badge variant="new" className="text-[10px] gap-1"><Star size={8} className="fill-current" /> ICOM Home</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">전북대학교 · Jeonju, Jeollabuk-do</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="md:col-span-2 space-y-4">
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    JBNU is one of Korea&apos;s largest national universities, with strong programs in engineering, agriculture, medicine, and the arts. Located in Jeonju — famous for bibimbap and traditional culture — it&apos;s a welcoming city for international students.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: Users, label: `${jbnu.students.toLocaleString()}+ Int'l Students`, color: "text-indigo-500 dark:text-indigo-400" },
                      { icon: MapPin, label: "Jeonju, Jeollabuk-do", color: "text-violet-500 dark:text-violet-400" },
                      { icon: GraduationCap, label: "10 Colleges, 80+ Departments", color: "text-cyan-600 dark:text-cyan-400" },
                      { icon: Globe, label: "Exchange & Degree Programs", color: "text-emerald-600 dark:text-emerald-400" },
                    ].map(({ icon: Icon, label, color }) => (
                      <div key={label} className="flex items-center gap-2 text-xs text-foreground/70">
                        <Icon size={13} className={color} />
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5 text-xs">
                  <h3 className="text-xs font-semibold text-foreground mb-2">Quick Info</h3>
                  <div className="flex items-start gap-2 text-foreground/70">
                    <MapPin size={12} className="text-muted-foreground mt-0.5 shrink-0" />
                    <span className="leading-relaxed">{JBNU_INFO.address}</span>
                  </div>
                  <div className="text-foreground/70">📞 {JBNU_INFO.intlOffice}</div>
                  <a href={JBNU_INFO.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
                    <ExternalLink size={11} /> International Office →
                  </a>
                </div>
              </div>

              {/* Programs */}
              <div className="mb-6">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Available Programs</p>
                <div className="flex flex-wrap gap-2">
                  {JBNU_INFO.programs.map(p => (
                    <span key={p} className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400">{p}</span>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div className="p-4 rounded-2xl bg-muted/50 border border-border">
                <p className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-emerald-500 dark:text-emerald-400" /> Student Tips
                </p>
                <ul className="space-y-2">
                  {JBNU_INFO.tips.map((tip, i) => (
                    <li key={i} className="text-xs text-foreground/70 flex gap-2">
                      <span className="text-muted-foreground shrink-0">·</span>
                      <span className="leading-relaxed">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 flex gap-3">
                <Link href="/community" className="text-xs px-4 py-2 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition-colors font-medium">
                  View JBNU Community
                </Link>
                <Link href="/jobs" className="text-xs px-4 py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  Find Jobs Near JBNU
                </Link>
              </div>
            </div>
          </div>}

          {/* Search + province filter */}
          <div className="flex flex-col gap-3 mb-6">
            <div className="max-w-sm">
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search universities..."
                icon={<Search size={15} />}
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {PROVINCES.map(p => (
                <button
                  key={p}
                  onClick={() => setProvince(p)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    province === p
                      ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/40"
                      : "border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            {province === "All" ? "All Universities" : province} ({filtered.length})
          </h2>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(uni => (
              <div
                key={uni.id}
                className="group p-5 rounded-2xl border border-border bg-card hover:border-indigo-500/30 hover:shadow-sm transition-all duration-200 hover:-translate-y-0.5"
              >
                <div className="h-0.5 w-10 rounded-full mb-4" style={{ backgroundColor: uni.color }} />

                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h3 className="text-sm font-bold text-foreground group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                        {uni.shortName}
                      </h3>
                      {uni.intl && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">Int&apos;l</span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-tight">{uni.name}</p>
                  </div>
                  <ExternalLink size={12} className="text-muted-foreground/40 group-hover:text-indigo-400 transition-colors mt-0.5 shrink-0" />
                </div>

                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin size={10} />
                    <span>{uni.city}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={10} />
                    <span>{uni.students.toLocaleString()} int&apos;l</span>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground/60 mt-1.5">{uni.province}</p>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <GraduationCap size={32} className="text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No universities match your search.</p>
            </div>
          )}

          {/* Ambassador CTA */}
          <div className="mt-12 relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-950/30 to-indigo-950/30 dark:from-violet-950/40 dark:to-indigo-950/40 p-8 text-center">
            <Star size={28} className="text-violet-400/50 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-foreground mb-2">Become an Ambassador</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-5">
              Represent your university on ICOM. Help international students, build your network, and earn recognition.
            </p>
            <button onClick={() => setShowAmbassador(true)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors">
              Apply as Ambassador <Star size={13} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
