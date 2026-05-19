"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles, LayoutDashboard, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

const ctaPoints = [
  "Free for all international students",
  "University email verification",
  "No credit card required",
  "AI assistant included",
];

export default function CtaSection() {
  const { user } = useAuth();
  if (user) return null;

  return (
    <section className="py-24 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/50 to-violet-950/50 p-10 sm:p-16 text-center">
          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl" />
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-violet-500/10 blur-3xl" />
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-xs font-medium text-indigo-300 mb-6">
              <Sparkles size={11} />
              Join 28,000+ students
            </div>

            <h2 className="text-4xl sm:text-5xl font-extrabold text-foreground mb-4 tracking-tight">
              Your Korea journey
              <br />
              <span className="gradient-text">starts here</span>
            </h2>

            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Create your free account today. Connect with your university community,
              find jobs, and get AI-powered support for life in Korea.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
              <Button size="xl" asChild className="w-full sm:w-auto shadow-glow-lg animate-pulse-glow">
                <Link href="/register">
                  Create Free Account
                  <ArrowRight size={18} className="ml-2" />
                </Link>
              </Button>
              <Button variant="glass" size="xl" asChild className="w-full sm:w-auto">
                <Link href="/community">
                  Browse Community
                </Link>
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {ctaPoints.map((point) => (
                <div key={point} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  {point}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
