"use client";

import React, { useEffect, useRef, useState } from "react";
import { TrendingUp, Globe2, Building2, Users } from "lucide-react";

const stats = [
  {
    icon: Users,
    value: 28000,
    suffix: "+",
    label: "International Students",
    sublabel: "Across all partner universities",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
  },
  {
    icon: Building2,
    value: 47,
    suffix: "",
    label: "Partner Universities",
    sublabel: "Including SKY, KAIST, POSTECH",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
  {
    icon: TrendingUp,
    value: 1200,
    suffix: "+",
    label: "Active Job Listings",
    sublabel: "Updated daily",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    icon: Globe2,
    value: 89,
    suffix: "",
    label: "Countries Represented",
    sublabel: "A truly global community",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
];

function useCountUp(end: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end, duration, start]);

  return count;
}

function StatCard({ stat, animate }: { stat: typeof stats[0]; animate: boolean }) {
  const count = useCountUp(stat.value, 2000, animate);
  const Icon = stat.icon;

  return (
    <div className="relative p-8 rounded-2xl border border-white/8 bg-white/3 text-center group hover:border-white/15 hover:bg-white/5 transition-all duration-300">
      <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg} mb-4`}>
        <Icon size={22} className={stat.color} />
      </div>
      <div className={`text-5xl font-extrabold mb-1 ${stat.color}`}>
        {animate ? count.toLocaleString() : "0"}{stat.suffix}
      </div>
      <div className="text-base font-semibold text-foreground mb-1">{stat.label}</div>
      <div className="text-xs text-muted-foreground">{stat.sublabel}</div>
    </div>
  );
}

export default function StatsSection() {
  const [animate, setAnimate] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setAnimate(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-24 px-4 sm:px-6 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-950/20 to-transparent pointer-events-none" />

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            The numbers don&apos;t lie
          </h2>
          <p className="text-muted-foreground">
            Korea&apos;s fastest-growing platform for international students
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <StatCard key={stat.label} stat={stat} animate={animate} />
          ))}
        </div>
      </div>
    </section>
  );
}
