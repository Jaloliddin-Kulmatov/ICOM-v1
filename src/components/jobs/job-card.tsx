"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MapPin, Bookmark, Globe, ShieldAlert, ArrowUpRight, CalendarClock, Users } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { Bookmarks } from "@/lib/bookmarks";
import { jobCategory, jobCity, daysLeft } from "@/lib/job-filters";
import type { Job } from "@/types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

const detailHref = (id: string) => `/internships/${id.replace(/^db-/, "")}`;
const dbId = (id: string) => id.replace(/^db-/, "");

function trackApplyClick(id: string) {
  const numeric = dbId(id);
  if (!/^\d+$/.test(numeric)) return;  // ignore non-DB demo cards
  fetch(`${API}/admin/jobs/${numeric}/apply-click`, { method: "POST" })
    .catch(() => { /* ignore */ });
}

// A stable, readable colour per company so the logo tiles are easy to scan
// (we don't have real logos for scraped postings).
const TILE_COLORS = [
  "bg-indigo-600", "bg-violet-700", "bg-cyan-600", "bg-coral-500",
  "bg-amber-600", "bg-sky-700", "bg-rose-600", "bg-emerald-700",
];
function tileColor(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TILE_COLORS[h % TILE_COLORS.length];
}

function DeadlineChip({ job }: { job: Job }) {
  const d = daysLeft(job);
  if (d === null) {
    return <span className="chip-muted"><CalendarClock size={11} /> Rolling</span>;
  }
  const urgent = d <= 7;
  const label = d <= 0 ? "Closes today" : d === 1 ? "Closes tomorrow" : `Closes in ${d} days`;
  return (
    <span className={urgent ? "chip-urgent" : "chip-muted"}>
      <CalendarClock size={11} /> {label}
    </span>
  );
}

interface JobCardProps {
  job: Job;
  featured?: boolean;
}

export default function JobCard({ job, featured = false }: JobCardProps) {
  const [bookmarked, setBookmarked] = useState(() => Bookmarks.jobs.has(job.id));
  const [applies, setApplies] = useState(job.applyCount ?? job.applications ?? 0);
  const city = jobCity(job);
  const field = jobCategory(job);

  return (
    <article
      className={`group relative rounded-2xl border bg-card p-4 sm:p-5 transition-colors hover:border-indigo-500/40 focus-within:border-indigo-500/60 ${
        featured ? "border-indigo-500/40" : "border-border"
      }`}
    >
      <div className="flex items-start gap-3.5">
        <div
          className={`h-11 w-11 shrink-0 rounded-xl ${tileColor(job.company)} text-white flex items-center justify-center text-base font-extrabold`}
          aria-hidden
        >
          {job.company.trim()[0]?.toUpperCase() || "?"}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] leading-snug font-bold text-foreground line-clamp-2">
            {/* Stretched link: the whole card opens the detail page, while the
                Apply and Save buttons below stay separately clickable. */}
            <Link
              href={detailHref(job.id)}
              className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none group-hover:text-indigo-700 dark:group-hover:text-indigo-300"
            >
              {job.title}
            </Link>
            {job.isNew && (
              <span className="ml-2 align-middle inline-flex h-5 items-center rounded-md bg-coral-500/[0.12] px-1.5 text-[10px] font-bold uppercase tracking-wide text-coral-600 dark:text-coral-400">
                New
              </span>
            )}
          </h3>
          <p className="mt-0.5 text-[13px] text-muted-foreground truncate">
            <span className="font-semibold text-foreground/80">{job.company}</span>
            {city !== "Other" && <> · {city}</>}
            <> · {formatRelativeTime(job.postedAt)}</>
          </p>
        </div>

        <button
          onClick={() => setBookmarked(Bookmarks.jobs.toggle(job))}
          className={`relative z-10 -mr-1 -mt-1 p-2 rounded-lg shrink-0 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            bookmarked ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground hover:text-foreground"
          }`}
          aria-label={bookmarked ? `Remove ${job.title} from saved` : `Save ${job.title}`}
          aria-pressed={bookmarked}
        >
          <Bookmark size={17} className={bookmarked ? "fill-current" : ""} />
        </button>
      </div>

      {/* Key facts, in the order students decide on them */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {job.foreignerFriendly === "yes" && (
          <span className="chip-good" title={job.foreignerNote || "Foreign applicants welcome"}>
            <Globe size={11} /> Foreigners welcome
          </span>
        )}
        {job.foreignerFriendly === "no" && (
          <span className="chip-urgent" title={job.foreignerNote || "Korean fluency or local citizenship required"}>
            <ShieldAlert size={11} /> Korean required
          </span>
        )}
        <DeadlineChip job={job} />
        {field !== "Other" && <span className="chip-muted">{field}</span>}
        {city === "Other" && job.location && (
          <span className="chip-muted"><MapPin size={11} /> {job.location}</span>
        )}
        {job.salary && <span className="chip-muted">{job.salary}</span>}
      </div>

      {job.description && (
        <p className="mt-3 text-[13px] text-muted-foreground line-clamp-2 leading-relaxed">
          {job.description}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
          <Users size={12} /> {applies > 0 ? `${applies} applied` : "Be the first to apply"}
        </span>
        {job.applyLink ? (
          <a
            href={job.applyLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              setApplies((n) => n + 1);
              trackApplyClick(job.id);
            }}
            className="relative z-10 inline-flex h-9 items-center gap-1 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            aria-label={`Apply to ${job.title} at ${job.company} (opens the company's page)`}
          >
            Apply <ArrowUpRight size={14} />
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">Apply link coming soon</span>
        )}
      </div>
    </article>
  );
}
