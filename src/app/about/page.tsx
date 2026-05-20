import React from "react";
import Navbar from "@/components/layout/navbar";
import Link from "next/link";
import { Heart, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const team = [
  { name: "Kulmatov Jaloliddin", role: "Founder & CEO", country: "🇺🇿 Uzbekistan", bio: "International student at JBNU. Built ICOM because navigating life in Korea was harder than it needed to be." },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <div className="border-b border-border bg-gradient-to-b from-indigo-500/5 to-transparent">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
            <Badge variant="violet" className="mb-4 text-xs">Our Mission</Badge>
            <h1 className="text-4xl font-extrabold text-foreground mb-4">Built by students,<br />for students</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              ICOM started as one international student's frustration with how hard it was to find jobs, understand visas, and connect with other internationals in Korea. We're building the platform we wished existed.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 space-y-16">

          {/* Story */}
          <div className="rounded-2xl border border-border bg-card p-8">
            <h2 className="text-xl font-bold text-foreground mb-4">The Story</h2>
            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>When you arrive in Korea as an international student, nobody gives you a manual. You spend your first weeks figuring out how to open a bank account, which apps to download, how to get a T-money card, where to find part-time work that's compatible with your visa, and how to meet other people in the same situation.</p>
              <p>ICOM was built to fix that. Starting at Jeonbuk National University (JBNU) in Jeonju, we're creating the definitive platform for international students in Korea — community, jobs, visa guidance, AI support, and everything in between.</p>
              <p>Our goal is simple: make the first year in Korea feel like arriving somewhere you already know how things work.</p>
            </div>
          </div>

          {/* Team */}
          <div>
            <h2 className="text-xl font-bold text-foreground mb-6">The Team</h2>
            <div className="grid gap-4">
              {team.map(member => (
                <div key={member.name} className="p-6 rounded-2xl border border-border bg-card flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {member.name[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-foreground">{member.name}</h3>
                      <span className="text-xs text-muted-foreground">{member.country}</span>
                    </div>
                    <p className="text-xs text-indigo-500 font-medium mb-2">{member.role}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{member.bio}</p>
                  </div>
                </div>
              ))}
              <div className="p-6 rounded-2xl border border-dashed border-border text-center">
                <p className="text-sm text-muted-foreground mb-3">We&apos;re growing. Want to help build ICOM?</p>
                <Link href="/careers" className="inline-flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-600 font-medium">
                  View open roles <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>

          {/* Values */}
          <div>
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2"><Heart size={18} className="text-rose-500" /> Our Values</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { title: "Students First", desc: "Every feature we build starts with a real student problem. We don't add complexity for its own sake." },
                { title: "Radically Honest", desc: "We give real information, not marketing fluff. If something is hard, we say it's hard." },
                { title: "Community-Driven", desc: "The best answers come from students who've been through it. We amplify their knowledge." },
                { title: "Open & Inclusive", desc: "ICOM is for every international student, from every country, at every Korean university." },
              ].map(v => (
                <div key={v.title} className="p-5 rounded-2xl border border-border bg-card">
                  <h3 className="text-sm font-bold text-foreground mb-2">{v.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
