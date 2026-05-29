"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/layout/navbar";
import Link from "next/link";
import {
  ArrowLeft, MapPin, Clock, DollarSign, CheckCircle2,
  Briefcase, Tag, Calendar, Loader2, AlertCircle, Building2, ExternalLink,
  Bookmark, BookmarkCheck, Globe, Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/utils";
import { Bookmarks } from "@/lib/bookmarks";
import type { Job as JobType } from "@/types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

const typeConfig: Record<string, { label: string; variant: "default" | "success" | "cyan" | "warning" | "violet" }> = {
  "part-time":  { label: "Part-time",  variant: "default" },
  internship:   { label: "Internship", variant: "cyan"    },
  research:     { label: "Research",   variant: "violet"  },
  "full-time":  { label: "Full-time",  variant: "success" },
  remote:       { label: "Remote",     variant: "warning" },
};

interface JobDetail {
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
  salary?: string;
  description: string;
  requirements: string[];
  visa_compatible: string[];
  deadline?: string;
  tags: string[];
  apply_link?: string;
  foreigner_friendly?: "yes" | "no" | "unclear" | "";
  foreigner_note?: string;
  apply_count?: number;
  isNew?: boolean;
  created_at: string;
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    fetch(`${API}/admin/jobs/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject("Not found"))
      .then(d => {
        setJob(d.job);
        if (d.job) setBookmarked(Bookmarks.jobs.has(String(d.job.id)));
      })
      .catch(() => setError("Job not found or no longer available."))
      .finally(() => setLoading(false));
  }, [id]);

  // Convert API shape (snake_case, numeric id) → bookmarks-store shape
  // (camelCase, string id) so the saved-jobs page can render them.
  const toBookmarkShape = (j: JobDetail): JobType => ({
    id: String(j.id),
    title: j.title,
    company: j.company,
    location: j.location,
    type: (j.type || "internship") as JobType["type"],
    salary: j.salary,
    description: j.description,
    requirements: j.requirements,
    visaCompatible: j.visa_compatible,
    postedAt: j.created_at,
    deadline: j.deadline,
    applications: 0,
    tags: j.tags,
    isNew: j.isNew,
    applyLink: j.apply_link,
    foreignerFriendly: j.foreigner_friendly,
    foreignerNote: j.foreigner_note,
  });

  const toggleBookmark = () => {
    if (!job) return;
    const nowSaved = Bookmarks.jobs.toggle(toBookmarkShape(job));
    setBookmarked(nowSaved);
  };

  const handleApply = () => {
    if (!job?.apply_link) return;
    // Fire-and-forget: bump the apply counter so cards/lists can show
    // "N applied" reflecting real click-through, not a placeholder zero.
    fetch(`${API}/admin/jobs/${job.id}/apply-click`, { method: "POST" })
      .catch(() => { /* counter failure shouldn't block the apply jump */ });
    setJob((prev) => prev ? { ...prev, apply_count: (prev.apply_count || 0) + 1 } : prev);
    window.open(job.apply_link, "_blank", "noopener,noreferrer");
  };

  if (loading) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center pt-40">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    </div>
  );

  if (error || !job) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 pt-24 text-center">
        <AlertCircle size={32} className="text-muted-foreground/40 mx-auto mb-3" />
        <h1 className="text-lg font-bold text-foreground mb-2">Job Not Found</h1>
        <p className="text-sm text-muted-foreground mb-8">This listing may have expired. Browse open positions on these platforms:</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left mb-8">
          {[
            { name: "WorkNet Korea", sub: "Official Korean government job board", url: "https://www.work.go.kr/foreign/index.do", flag: "🇰🇷" },
            { name: "Saramin (사람인)", sub: "Largest Korean job portal", url: "https://www.saramin.co.kr", flag: "💼" },
            { name: "JobKorea", sub: "Popular for part-time & internships", url: "https://www.jobkorea.co.kr", flag: "🏢" },
            { name: "Alba (알바몬)", sub: "Part-time jobs near campus", url: "https://www.albamon.com", flag: "⏰" },
            { name: "Seek & Hired", sub: "English-friendly international jobs", url: "https://www.linkedin.com/jobs", flag: "🌍" },
            { name: "EPIK / TaLK", sub: "Teaching English in Korean schools", url: "https://www.epik.go.kr", flag: "📚" },
          ].map(site => (
            <a key={site.name} href={site.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card hover:border-indigo-500/30 hover:bg-muted/50 transition-all group">
              <span className="text-2xl">{site.flag}</span>
              <div>
                <p className="text-sm font-semibold text-foreground group-hover:text-indigo-500 transition-colors">{site.name}</p>
                <p className="text-xs text-muted-foreground">{site.sub}</p>
              </div>
              <ExternalLink size={13} className="text-muted-foreground/40 group-hover:text-indigo-400 ml-auto shrink-0" />
            </a>
          ))}
        </div>

        <Link href="/jobs" className="text-sm px-4 py-2 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition-colors inline-block">
          ← Back to ICOM Jobs
        </Link>
      </div>
    </div>
  );

  const typeInfo = typeConfig[job.type] ?? { label: job.type, variant: "default" as const };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <div className="border-b border-border bg-gradient-to-b from-indigo-500/5 to-transparent">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
            <Link href="/jobs" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-5 transition-colors">
              <ArrowLeft size={13} /> Back to Jobs
            </Link>

            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-border flex items-center justify-center text-xl font-bold text-foreground shrink-0">
                {job.company[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h1 className="text-2xl font-bold text-foreground">{job.title}</h1>
                  {job.isNew && <Badge variant="new" className="text-[10px]">New</Badge>}
                </div>
                <p className="text-sm text-muted-foreground font-medium mb-3">{job.company}</p>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin size={11} />{job.location}</span>
                  {job.salary && <span className="flex items-center gap-1"><DollarSign size={11} />{job.salary}</span>}
                  <span className="flex items-center gap-1"><Clock size={11} />{formatRelativeTime(job.created_at)}</span>
                  <span className="flex items-center gap-1"><Users size={11} />{job.apply_count || 0} applied</span>
                  {job.deadline && (
                    <span className="flex items-center gap-1 text-amber-500">
                      <Calendar size={11} />
                      {(() => {
                        const m = job.deadline.match(/^(\d{4})-(\d{2})-(\d{2})/);
                        if (!m) return `Apply by ${job.deadline}`;
                        const d = new Date(`${m[0]}T00:00:00Z`);
                        if (isNaN(d.getTime())) return `Apply by ${job.deadline}`;
                        return `Expires ${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
                      })()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>
              {job.visa_compatible.map(v => (
                <Badge key={v} variant="success" className="gap-1 text-xs">
                  <CheckCircle2 size={10} /> {v}
                </Badge>
              ))}
              {job.tags.map(t => (
                <Badge key={t} variant="outline" className="text-xs border-border">
                  <Tag size={9} className="mr-1" />{t}
                </Badge>
              ))}
            </div>

            {/* Description */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Briefcase size={14} className="text-indigo-500" /> Job Description
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{job.description}</p>
            </div>

            {/* Requirements */}
            {job.requirements.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500" /> Requirements
                </h2>

                {/* AI-detected foreigner-friendly banner — sits above the
                    requirements list so applicants can see at a glance whether
                    they're a fit before reading the Korean-original criteria. */}
                {job.foreigner_friendly === "yes" && (
                  <div className="mb-3 flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                    <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <p className="font-semibold text-emerald-500">Foreign applicants welcome</p>
                      {job.foreigner_note && (
                        <p className="text-muted-foreground mt-0.5">{job.foreigner_note}</p>
                      )}
                    </div>
                  </div>
                )}
                {job.foreigner_friendly === "no" && (
                  <div className="mb-3 flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25">
                    <AlertCircle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <p className="font-semibold text-amber-500">Korean fluency or citizenship required</p>
                      {job.foreigner_note && (
                        <p className="text-muted-foreground mt-0.5">{job.foreigner_note}</p>
                      )}
                    </div>
                  </div>
                )}
                {job.foreigner_friendly === "unclear" && (
                  <div className="mb-3 flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-muted/50 border border-border">
                    <AlertCircle size={14} className="text-muted-foreground mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <p className="font-semibold text-foreground">Eligibility for foreigners not specified</p>
                      <p className="text-muted-foreground mt-0.5">
                        Contact the employer to confirm before applying.
                      </p>
                    </div>
                  </div>
                )}

                <ul className="space-y-2">
                  {job.requirements.map((req, i) => (
                    <li key={i} className="flex gap-2.5 text-sm text-muted-foreground">
                      <span className="text-emerald-500 mt-0.5 shrink-0">·</span>
                      <span className="leading-relaxed">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-b from-indigo-500/5 to-transparent p-5">
              {job.apply_link ? (
                <Button
                  onClick={handleApply}
                  className="w-full mb-2 gap-2"
                  size="lg"
                >
                  Apply Now <ExternalLink size={14} />
                </Button>
              ) : (
                <Button
                  className="w-full mb-2"
                  size="lg"
                  disabled
                  title="No application link provided — contact the employer directly"
                >
                  Apply Now
                </Button>
              )}

              <button
                onClick={toggleBookmark}
                className={`w-full h-10 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                  bookmarked
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-500 hover:bg-amber-500/15"
                    : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-indigo-500/30"
                }`}
                aria-pressed={bookmarked}
              >
                {bookmarked ? (
                  <><BookmarkCheck size={14} /> Saved</>
                ) : (
                  <><Bookmark size={14} /> Save for later</>
                )}
              </button>

              <p className="text-[11px] text-muted-foreground text-center mt-3">
                {job.apply_link
                  ? "Apply Now opens the employer's official page in a new tab."
                  : "Contact the employer directly or visit their website to apply."}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Building2 size={12} className="text-muted-foreground" /> Job Details
              </h3>
              {(() => {
                // Format an ISO date like "2026-08-15" into "Aug 15, 2026".
                const fmtDeadline = (raw?: string) => {
                  if (!raw) return "Rolling — apply anytime";
                  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
                  if (!m) return raw;
                  const d = new Date(`${m[0]}T00:00:00Z`);
                  if (isNaN(d.getTime())) return raw;
                  return d.toLocaleDateString("en-US", {
                    year: "numeric", month: "short", day: "numeric",
                  });
                };
                const rows = [
                  { label: "Type",      value: typeInfo.label },
                  { label: "Location",  value: job.location },
                  { label: "Salary",    value: job.salary || "Not specified" },
                  { label: "Deadline",  value: fmtDeadline(job.deadline) },
                ];
                return rows.map(row => (
                  <div key={row.label} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="text-foreground font-medium text-right max-w-[60%]">{row.value}</span>
                  </div>
                ));
              })()}
            </div>

            {/* Foreigner-friendly status — explicit when we know, "Not clear"
                when AI couldn't determine. "No" rows are filtered out by the
                scraper, so this card never shows "Not welcome". */}
            {(job.foreigner_friendly || "") && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                  <Globe size={12} className="text-indigo-400" /> Foreign Applicants
                </h3>
                <div className={`flex items-start gap-2 text-xs ${
                  job.foreigner_friendly === "yes" ? "text-emerald-500" :
                  job.foreigner_friendly === "no"  ? "text-red-500" :
                  "text-amber-500"
                }`}>
                  {job.foreigner_friendly === "yes" ? <CheckCircle2 size={12} className="shrink-0 mt-0.5" /> :
                   job.foreigner_friendly === "no"  ? <AlertCircle size={12} className="shrink-0 mt-0.5" /> :
                   <AlertCircle size={12} className="shrink-0 mt-0.5" />}
                  <div>
                    <p className="font-medium text-foreground">
                      {job.foreigner_friendly === "yes" ? "Foreigners welcome"
                       : job.foreigner_friendly === "no" ? "Korean-only role"
                       : "Not clear — contact employer"}
                    </p>
                    {job.foreigner_note && (
                      <p className="text-muted-foreground mt-1 leading-relaxed">{job.foreigner_note}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
              <h3 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-emerald-500" /> Visa Compatible
              </h3>
              {job.visa_compatible.length > 0 ? job.visa_compatible.map(v => (
                <div key={v} className="flex items-center gap-2 text-xs">
                  <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                  <span className="text-foreground">{v} visa holders can apply</span>
                </div>
              )) : (
                <p className="text-xs text-muted-foreground">Contact employer for visa info.</p>
              )}
            </div>

            <Link href="/jobs" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors justify-center">
              <ExternalLink size={11} /> Browse more jobs
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
