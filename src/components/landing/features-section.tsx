import React from "react";
import Link from "next/link";
import {
  Users,
  Briefcase,
  GraduationCap,
  Globe,
  Sparkles,
  Shield,
  MessageSquare,
  Bell,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: Users,
    color: "from-indigo-500 to-violet-500",
    badge: "Community",
    title: "Student Community Platform",
    description:
      "Connect with fellow international students across 47 Korean universities. Share experiences, ask questions, and build your network.",
    highlights: ["University-based channels", "Real-time group chats", "Student networking events", "Discussion feeds"],
    href: "/community",
  },
  {
    icon: GraduationCap,
    color: "from-violet-500 to-purple-500",
    badge: "Ambassadors",
    title: "University Ambassador System",
    description:
      "Verified ambassadors from every campus deliver critical announcements, events, scholarship alerts, and emergency notifications.",
    highlights: ["Verified campus reps", "Emergency alerts", "Scholarship notifications", "Official event listings"],
    href: "/universities",
  },
  {
    icon: Briefcase,
    color: "from-blue-500 to-cyan-500",
    badge: "Careers",
    title: "Jobs & Internship Platform",
    description:
      "AI-powered job matching for international students. Filter by visa compatibility, salary, location, and student hours.",
    highlights: ["D-2/D-4 visa filtering", "AI job matching", "1,200+ active listings", "Research opportunities"],
    href: "/jobs",
  },
  {
    icon: Globe,
    color: "from-emerald-500 to-teal-500",
    badge: "Support",
    title: "International Student Support",
    description:
      "Step-by-step guides for every challenge — visa extensions, bank accounts, hospital visits, housing, and more.",
    highlights: ["Visa extension guides", "Bank account setup", "Housing directory", "Health insurance help"],
    href: "/support",
  },
  {
    icon: Sparkles,
    color: "from-amber-500 to-orange-500",
    badge: "AI",
    title: "AI-Powered Assistant",
    description:
      "Your personal AI guide for life in Korea. Instant answers, Korean-English translation, smart recommendations, and onboarding.",
    highlights: ["24/7 AI chatbot", "Korean ↔ English translation", "Personalized recommendations", "Smart onboarding"],
    href: "/dashboard/ai",
  },
  {
    icon: Shield,
    color: "from-pink-500 to-rose-500",
    badge: "Security",
    title: "Secure University Auth",
    description:
      "University email verification, OAuth login, and future SSO-ready architecture. Your identity is verified and protected.",
    highlights: ["Uni email verification", "Google/Apple OAuth", "Two-factor auth", "GDPR compliant"],
    href: "/register",
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-24 px-4 sm:px-6 relative overflow-hidden" id="features">
      {/* Background accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="default" className="mb-4 text-xs px-4 py-1">
            Everything You Need
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-4">
            Built for the full
            <span className="gradient-text"> student journey</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From landing at Incheon Airport to launching your career in Korea — ICOM covers every step.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.title}
                href={feature.href}
                className="group relative p-6 rounded-2xl bg-white/3 border border-white/8 hover:border-white/15 hover:bg-white/5 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              >
                {/* Hover glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-gradient-to-r ${feature.color} opacity-10 blur-2xl`} />
                </div>

                {/* Icon */}
                <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} mb-4 shadow-lg`}>
                  <Icon size={20} className="text-white" />
                </div>

                <Badge variant="outline" className="text-[10px] mb-3 border-white/15">
                  {feature.badge}
                </Badge>

                <h3 className="text-base font-semibold text-foreground mb-2 group-hover:text-indigo-300 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  {feature.description}
                </p>

                <ul className="space-y-1.5">
                  {feature.highlights.map((h) => (
                    <li key={h} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="h-1 w-1 rounded-full bg-indigo-400 shrink-0" />
                      {h}
                    </li>
                  ))}
                </ul>

                <div className="flex items-center gap-1 mt-5 text-xs font-medium text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn more
                  <ArrowRight size={12} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
