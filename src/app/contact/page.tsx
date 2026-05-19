import React from "react";
import Link from "next/link";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Mail, MessageSquare, Globe, Phone } from "lucide-react";

const channels = [
  {
    icon: MessageSquare,
    title: "Community Forum",
    desc: "Ask questions and get answers from students who've been there.",
    action: "Go to Community",
    href: "/community",
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
  },
  {
    icon: Globe,
    title: "AI Assistant",
    desc: "Get instant answers about visa, housing, banking, and campus life.",
    action: "Ask AI",
    href: "/dashboard/ai",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    icon: Mail,
    title: "Email Support",
    desc: "For account issues, partnerships, or anything else.",
    action: "202522916@jbnu.ac.kr",
    href: "mailto:202522916@jbnu.ac.kr",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
  {
    icon: Phone,
    title: "Immigration Helpline",
    desc: "Korean government helpline for foreign residents — available in English.",
    action: "1345 (free)",
    href: "tel:1345",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-extrabold text-foreground mb-3">Contact & Support</h1>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              We&apos;re here to help. Choose the fastest way to get your answer.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-12">
            {channels.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.title} className="p-5 rounded-2xl border border-border bg-card">
                  <div className={`w-10 h-10 rounded-xl ${c.bg} ${c.color} flex items-center justify-center mb-3`}>
                    <Icon size={18} />
                  </div>
                  <h3 className="text-sm font-bold text-foreground mb-1">{c.title}</h3>
                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{c.desc}</p>
                  <Link href={c.href} className={`text-xs font-semibold ${c.color} hover:underline`}>
                    {c.action} →
                  </Link>
                </div>
              );
            })}
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card text-center">
            <p className="text-sm font-semibold text-foreground mb-1">ICOM Technologies</p>
            <p className="text-xs text-muted-foreground mb-2">
              Supporting international students across Korea since 2024.
            </p>
            <p className="text-xs text-muted-foreground">
              Business inquiries:{" "}
              <a href="mailto:partners@konect.kr" className="text-indigo-500 hover:underline">
                partners@konect.kr
              </a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
