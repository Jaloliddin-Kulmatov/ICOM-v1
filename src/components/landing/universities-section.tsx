import React from "react";
import Link from "next/link";
import { Users, ArrowRight, CheckCircle2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UNIVERSITIES } from "@/lib/constants";

export default function UniversitiesSection() {
  return (
    <section className="py-24 px-4 sm:px-6" id="universities">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-start gap-16">
          {/* Left content */}
          <div className="lg:w-2/5 lg:sticky lg:top-24">
            <Badge variant="violet" className="mb-4 text-xs px-3 py-1">
              University Network
            </Badge>
            <h2 className="text-4xl font-bold text-foreground mb-4 leading-tight">
              47 universities,
              <br />
              <span className="gradient-text">one platform</span>
            </h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Every major Korean university has an ICOM community hub with verified ambassadors,
              official announcements, and dedicated student channels.
            </p>
            <div className="space-y-3 mb-8">
              {[
                "Verified university ambassadors",
                "Official scholarship alerts",
                "Emergency notification system",
                "Campus-specific events and guides",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
            <Link
              href="/universities"
              className="inline-flex items-center gap-2 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors group"
            >
              View all universities
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Right: University grid */}
          <div className="lg:w-3/5 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {UNIVERSITIES.filter(u => u.featured).map((uni) => (
              <a
                key={uni.id}
                href={uni.website}
                target="_blank"
                rel="noopener noreferrer"
                className="group p-4 rounded-2xl border border-white/8 bg-white/3 hover:border-indigo-500/30 hover:bg-white/6 transition-all duration-300 hover:-translate-y-0.5"
              >
                {/* Color stripe */}
                <div
                  className="h-1 w-8 rounded-full mb-3 opacity-80"
                  style={{ backgroundColor: uni.color }}
                />
                <h3 className="text-sm font-semibold text-foreground mb-0.5 group-hover:text-indigo-300 transition-colors">
                  {uni.shortName}
                </h3>
                <p className="text-xs text-muted-foreground mb-2 leading-tight line-clamp-2">
                  {uni.name}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground/70">
                    <Users size={10} />
                    <span>{uni.students.toLocaleString()} students</span>
                  </div>
                  <ExternalLink size={10} className="text-muted-foreground/40 group-hover:text-indigo-400 transition-colors" />
                </div>
              </a>
            ))}

            {/* More universities teaser */}
            <div className="p-4 rounded-2xl border border-dashed border-white/10 bg-white/2 flex flex-col items-center justify-center text-center gap-2">
              <div className="h-8 w-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-sm">
                +39
              </div>
              <p className="text-xs text-muted-foreground">More universities coming</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
