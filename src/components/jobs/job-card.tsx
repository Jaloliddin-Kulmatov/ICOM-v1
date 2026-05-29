"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Clock,
  DollarSign,
  Bookmark,
  ArrowRight,
  Zap,
  CheckCircle2,
  Users,
  Globe,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/utils";
import { Bookmarks } from "@/lib/bookmarks";
import type { Job } from "@/types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

// Strip the "db-" prefix from the list page so we can route to /jobs/<numeric id>
const detailHref = (id: string) => `/jobs/${id.replace(/^db-/, "")}`;
const dbId = (id: string) => id.replace(/^db-/, "");

// Fire-and-forget hit to the apply-counter endpoint. We don't await it —
// it shouldn't slow the click → external-window jump. Failures are silent.
function trackApplyClick(id: string) {
  const numeric = dbId(id);
  if (!/^\d+$/.test(numeric)) return;  // ignore non-DB demo cards
  fetch(`${API}/admin/jobs/${numeric}/apply-click`, { method: "POST" })
    .catch(() => { /* ignore */ });
}

const typeConfig: Record<Job["type"], { label: string; variant: "default" | "success" | "cyan" | "warning" | "violet" }> = {
  "part-time": { label: "Part-time", variant: "default" },
  internship: { label: "Internship", variant: "cyan" },
  research: { label: "Research", variant: "violet" },
  "full-time": { label: "Full-time", variant: "success" },
  remote: { label: "Remote", variant: "warning" },
};

interface JobCardProps {
  job: Job;
  featured?: boolean;
}

// Format an ISO deadline ("2026-08-15") into "Aug 15, 2026". Non-ISO free
// text (e.g. "Open until filled") is shown as-is. Empty/missing → null so the
// caller can fall back to the rolling label.
function formatDeadline(raw?: string): string | null {
  const s = (raw || "").trim();
  if (!s) return null;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return s;
  const d = new Date(`${m[0]}T00:00:00Z`);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function JobCard({ job, featured = false }: JobCardProps) {
  const [bookmarked, setBookmarked] = useState(() => Bookmarks.jobs.has(job.id));
  // Optimistic apply count — bumps immediately on click so the UI feels
  // responsive even before the network call returns.
  const [applies, setApplies] = useState(job.applyCount ?? job.applications ?? 0);
  const typeInfo = typeConfig[job.type];

  return (
    <Link
      href={detailHref(job.id)}
      className={`group relative rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card block cursor-pointer ${
        featured
          ? "border-indigo-500/30 bg-gradient-to-br from-indigo-950/30 to-violet-950/20"
          : "border-white/8 bg-white/3 hover:border-white/15 hover:bg-white/5"
      }`}
    >
      {/* Featured glow */}
      {featured && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/5 to-violet-500/5 pointer-events-none" />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Company logo placeholder */}
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center text-sm font-bold text-foreground/70">
            {job.company[0]}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold text-foreground group-hover:text-indigo-300 transition-colors">
                {job.title}
              </h3>
              {job.isNew && (
                <Badge variant="new" className="text-[10px] px-1.5 py-0 h-4">New</Badge>
              )}
              {job.isHot && (
                <span className="text-xs">🔥</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{job.company}</p>
          </div>
        </div>

        <button
          onClick={(e) => {
            // Don't navigate to the detail page when the user just wants to bookmark.
            e.preventDefault();
            e.stopPropagation();
            setBookmarked(Bookmarks.jobs.toggle(job));
          }}
          className={`p-1.5 rounded-lg transition-all hover:bg-white/5 shrink-0 ${
            bookmarked ? "text-indigo-400" : "text-muted-foreground hover:text-foreground"
          }`}
          aria-label={bookmarked ? "Remove bookmark" : "Save for later"}
        >
          <Bookmark size={15} className={bookmarked ? "fill-indigo-400" : ""} />
        </button>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-3 mb-3">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin size={11} />
          <span>{job.location}</span>
        </div>
        {job.salary && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <DollarSign size={11} />
            <span>{job.salary}</span>
          </div>
        )}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock size={11} />
          <span>{formatRelativeTime(job.postedAt)}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Users size={11} />
          <span>{applies} applied</span>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <Badge variant={typeInfo.variant} className="text-[11px]">
          {typeInfo.label}
        </Badge>

        {/* AI-detected foreigner-friendly indicator (only shown when the
            scraper actually classified the posting). Skipped on admin-entered
            jobs whose foreignerFriendly stays empty. */}
        {job.foreignerFriendly === "yes" && (
          <Badge variant="success" className="gap-1 text-[11px]" title={job.foreignerNote || "Foreign applicants welcome"}>
            <Globe size={9} /> Foreigners welcome
          </Badge>
        )}
        {job.foreignerFriendly === "no" && (
          <Badge variant="warning" className="gap-1 text-[11px]" title={job.foreignerNote || "Korean fluency or local citizenship required"}>
            <ShieldAlert size={9} /> Korean-only
          </Badge>
        )}

        {job.visaCompatible.map((visa) => (
          <Badge key={visa} variant="success" className="gap-1 text-[11px]">
            <CheckCircle2 size={9} />
            {visa}
          </Badge>
        ))}
        {job.tags.slice(0, 2).map((tag) => (
          <Badge key={tag} variant="outline" className="text-[11px] border-white/10">
            {tag}
          </Badge>
        ))}
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
        {job.description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {(() => {
          const dl = formatDeadline(job.deadline);
          // A real date is urgency-worthy (amber); a rolling listing is calmer
          // (muted) but we still show *something* so every card has a clear
          // deadline status instead of a blank space.
          return dl ? (
            <div className="flex items-center gap-1 text-xs text-amber-400">
              <Zap size={11} />
              <span>Apply by {dl}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock size={11} />
              <span>Rolling — apply anytime</span>
            </div>
          );
        })()}
        {job.applyLink ? (
          <a
            href={job.applyLink}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto"
            // Don't bubble into the wrapping <Link> — Apply should go to the
            // employer site in a new tab, not to our detail page. Also bump
            // the apply counter so cards rank by real interest.
            onClick={(e) => {
              e.stopPropagation();
              setApplies((n) => n + 1);
              trackApplyClick(job.id);
            }}
          >
            <Button size="sm" variant={featured ? "default" : "outline"} className="gap-1">
              Apply ↗
              <ArrowRight size={12} />
            </Button>
          </a>
        ) : (
          <Button size="sm" variant="outline" disabled className="ml-auto gap-1 opacity-40">
            Apply
          </Button>
        )}
      </div>
    </Link>
  );
}
