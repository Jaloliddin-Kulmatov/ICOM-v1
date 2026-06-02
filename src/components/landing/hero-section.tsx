"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Users, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import MemberCount from "@/components/landing/member-count";

export default function HeroSection() {
  const { user } = useAuth();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden mesh-gradient">
      <div className="absolute inset-0 dot-grid opacity-60 pointer-events-none" />
      <div className="absolute top-1/4 left-1/3 w-[480px] h-[480px] rounded-full bg-indigo-600/8 dark:bg-indigo-600/12 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[360px] h-[360px] rounded-full bg-violet-600/6 dark:bg-violet-600/10 blur-[80px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 text-center py-24">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/25 bg-indigo-500/8 text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-8 animate-fade-in">
          <Sparkles size={12} />
          Now serving international students at JBNU and across Korea
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-[72px] font-extrabold tracking-tight leading-[1.06] mb-6 animate-slide-up">
          <span className="text-foreground">The home for</span>
          <br />
          <span className="gradient-text">international</span>
          <br />
          <span className="text-foreground">students in Korea</span>
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: "0.1s" }}>
          Community, jobs, visa guidance, housing, banking, and an AI assistant —
          everything you need, in one place.
        </p>

        {/* CTAs — change based on auth state */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14 animate-slide-up" style={{ animationDelay: "0.15s" }}>
          {user ? (
            <>
              <Button size="xl" asChild className="w-full sm:w-auto shadow-[0_4px_24px_rgba(99,102,241,0.4)] hover:shadow-[0_4px_32px_rgba(99,102,241,0.6)]">
                <Link href="/dashboard">
                  <LayoutDashboard size={17} className="mr-2" />
                  Go to Dashboard
                  <ArrowRight size={17} className="ml-2" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild className="w-full sm:w-auto">
                <Link href="/community">
                  <Users size={16} className="mr-2 text-indigo-500" />
                  Explore community
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button size="xl" asChild className="w-full sm:w-auto shadow-[0_4px_24px_rgba(99,102,241,0.4)] hover:shadow-[0_4px_32px_rgba(99,102,241,0.6)]">
                <Link href="/register">
                  Get started free
                  <ArrowRight size={17} className="ml-2" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild className="w-full sm:w-auto">
                <Link href="/community">
                  <Users size={16} className="mr-2 text-indigo-500" />
                  Explore community
                </Link>
              </Button>
            </>
          )}
        </div>

        {/* Sign-in nudge for logged-out users */}
        {!user && (
          <p className="text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Already have an account?{" "}
            <Link href="/login?force=1" className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-2 transition-colors">
              Sign in
            </Link>
          </p>
        )}

        {/* Live JBNU member count */}
        <MemberCount />

        {/* JBNU badge */}
        <div className="mt-8 animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <Badge variant="violet" className="text-xs px-3 py-1 gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            Starting at Jeonbuk National University (JBNU) · Jeonju, Korea
          </Badge>
        </div>
      </div>

      <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  );
}
