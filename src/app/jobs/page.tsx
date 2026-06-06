"use client";

import React, { useState, useMemo } from "react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import JobCard from "@/components/jobs/job-card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, Sparkles, TrendingUp, CheckCircle2, MapPin, BellRing, BellOff, Loader2, X } from "lucide-react";
import { UNIVERSITIES } from "@/lib/constants";
import { useAuth } from "@/lib/auth";
import type { Job } from "@/types";


const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

// Korean translations of cities/provinces so we can match against location
// strings like "서울" or "전주" that come straight from Wanted.co.kr.
const CITY_KO: Record<string, string> = {
  Jeonju:  "전주",  Iksan:  "익산",  Gunsan:  "군산",
  Seoul:   "서울",  Incheon: "인천",  Suwon:   "수원",
  Daejeon: "대전",  Daegu:  "대구",   Gwangju: "광주",
  Busan:   "부산",  Ulsan:  "울산",   Sejong:  "세종",
  Pohang:  "포항",  Changwon: "창원",  Yongin: "용인",
};
const PROVINCE_KO: Record<string, string> = {
  "Jeollabuk-do": "전라북도",
  "Jeollanam-do": "전라남도",
  "Gyeonggi-do":  "경기도",
  "Gangwon-do":   "강원도",
  "Chungbuk":     "충청북도",
  "Chungnam":     "충청남도",
  "Gyeongbuk":    "경상북도",
  "Gyeongnam":    "경상남도",
};

// ── Field grouping ───────────────────────────────────────────────────────────
// Internships come from a scraper with no structured "field", so we infer one
// from the title / tags / requirements / description. First matching rule wins,
// so rules are ordered most-specific → most-general. This is what powers the
// "browse by interested field" tabs.
const FIELD_RULES: { field: string; kw: string[] }[] = [
  { field: "Data & AI", kw: ["machine learning", "deep learning", " ai ", "a.i.", "artificial intelligence", "data scien", "data analy", "data engineer", " ml ", "nlp", "computer vision", "vision", "llm", "analytics", "big data"] },
  { field: "Engineering", kw: ["developer", "engineer", "software", "backend", "back-end", "frontend", "front-end", "full stack", "full-stack", "programmer", "devops", " qa ", " sw ", "ios", "android", "web dev", "mobile", "cloud", "infra", "security", "blockchain", "robot", "embedded", "firmware", "coding"] },
  { field: "Design", kw: ["design", " ux", "ux ", " ui", "ui/", "graphic", "illustrat", "figma", "motion", "animation", "3d"] },
  { field: "Marketing", kw: ["marketing", "growth", "sns", "social media", "advertis", "branding", " pr ", "public relations", "seo", "campaign", "influencer", "community manager"] },
  { field: "Education", kw: ["teach", "tutor", "instructor", "lecturer", "education", " edu ", "esl", "language ", "academy", "mentor"] },
  { field: "Research", kw: ["research", "r&d", "laborator", " lab ", "scientist", "ph.d", "phd", "academic"] },
  { field: "Finance", kw: ["finance", "financial", "account", "investment", "fintech", " bank", "trading", "audit", " tax", "venture"] },
  { field: "Content & Media", kw: ["content", "video", "editor", "writer", "copywrit", "translat", "interpret", " media", "journalis", "photograph", "editorial", "subtitle"] },
  { field: "Business & Ops", kw: ["business", "operation", "strategy", "planning", "product manager", "project manager", " pm ", "sales", "business development", " bd ", "consult", "management", "human resources", " hr ", "recruit", "logistics", "administ", "sourcing", "merchandis"] },
];

function deriveField(job: Job): string {
  const hay = ` ${[job.title, (job.tags || []).join(" "), (job.requirements || []).join(" "), job.description].join(" ")} `.toLowerCase();
  for (const rule of FIELD_RULES) {
    if (rule.kw.some((k) => hay.includes(k))) return rule.field;
  }
  return "Other";
}

const KNOWN_TYPES = ["part-time", "internship", "research", "full-time", "remote"];
function normType(t?: string): Job["type"] {
  const v = (t || "").toLowerCase().trim().replace(/\s+/g, "-");
  return (KNOWN_TYPES.includes(v) ? v : "internship") as Job["type"];
}

// Rough numeric value of a salary string for "Salary: High to Low" sorting.
// Handles "2.5M", "15K", Korean 만/천, and plain numbers; unknown → -1 (sinks).
function salaryNum(s?: string): number {
  if (!s) return -1;
  const m = s.replace(/,/g, "").match(/(\d+(?:\.\d+)?)\s*(m|만|k|천)?/i);
  if (!m) return -1;
  let n = parseFloat(m[1]);
  const unit = (m[2] || "").toLowerCase();
  if (unit === "m") n *= 1_000_000;
  else if (unit === "만") n *= 10_000;
  else if (unit === "k" || unit === "천") n *= 1_000;
  return n;
}

// Timestamp of an ISO deadline for "Deadline Soon" sorting. Rolling / undated
// listings return Infinity so they sort to the bottom.
function deadlineTs(d?: string): number {
  const m = (d || "").trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return Infinity;
  const t = new Date(`${m[0]}T00:00:00Z`).getTime();
  return isNaN(t) ? Infinity : t;
}

type SortKey = "recent" | "salary" | "applied" | "deadline";

export default function JobsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [activeField, setActiveField] = useState("All");
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>("recent");
  const [showFilters, setShowFilters] = useState(false);
  const [visaFilter, setVisaFilter] = useState<string[]>([]);
  const [regionFilter, setRegionFilter] = useState(false);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [alertField, setAlertField] = useState("");
  const [alertRegion, setAlertRegion] = useState(false);
  const [alertsBusy, setAlertsBusy] = useState(false);

  // Resolve the user's university to a region (city + province + Korean
  // translations). Match by id, short name, or full name so any of the
  // values we save in user.university work.
  const myRegion = useMemo(() => {
    const uniId = (user?.university || "").trim();
    if (!uniId) return null;
    const lc = uniId.toLowerCase();
    const uni = UNIVERSITIES.find(
      (u) =>
        u.id.toLowerCase() === lc ||
        u.shortName.toLowerCase() === lc ||
        u.name.toLowerCase() === lc
    );
    if (!uni) return null;
    const keywords = [
      uni.city,
      uni.province,
      CITY_KO[uni.city] ?? "",
      PROVINCE_KO[uni.province] ?? "",
    ]
      .filter(Boolean)
      .map((k) => k.toLowerCase());
    return { city: uni.city, province: uni.province, keywords };
  }, [user?.university]);

  React.useEffect(() => {
    fetch(`${API}/admin/jobs`)
      .then(r => r.json())
      .then(d => {
        if (d.jobs?.length) {
          const mapped: Job[] = d.jobs.map((j: {
            id: string; title: string; company: string; location: string; type: string;
            salary: string; description: string; requirements: string[]; visa_compatible: string[];
            deadline: string; tags: string[]; isNew: boolean; apply_link: string;
            created_at?: string;
            foreigner_friendly?: string; foreigner_note?: string;
            apply_count?: number;
          }) => ({
            id: `db-${j.id}`, title: j.title, company: j.company, location: j.location || "",
            type: normType(j.type), salary: j.salary || "", description: j.description || "",
            requirements: j.requirements, visaCompatible: j.visa_compatible,
            // Use the real creation timestamp from the DB so "Posted X ago"
            // shows the actual age instead of "just now" every render.
            postedAt: j.created_at || new Date().toISOString(),
            deadline: j.deadline,
            // applications = real click count from the backend, so cards
            // show "12 applied" instead of always "0 applied".
            applications: j.apply_count || 0,
            applyCount: j.apply_count || 0,
            tags: j.tags, isNew: j.isNew, isHot: false, isBookmarked: false,
            applyLink: j.apply_link || "",
            foreignerFriendly: (j.foreigner_friendly || "") as Job["foreignerFriendly"],
            foreignerNote: j.foreigner_note || "",
          }));
          setAllJobs(mapped);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Load the current user's alerts subscription state so the button can
  // render "Alerts on" vs "Enable Alerts" correctly on refresh.
  React.useEffect(() => {
    if (!user) { setAlertsEnabled(false); return; }
    const token = typeof window !== "undefined" ? localStorage.getItem("icon_token") : null;
    if (!token) return;
    fetch(`${API}/admin/jobs/alerts`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          setAlertsEnabled(!!d.enabled);
          setAlertField(d.field || "");
          setAlertRegion(!!d.region);
        }
      })
      .catch(() => { /* harmless */ });
  }, [user]);

  // Top hiring companies — counted from currently-active jobs. Falls back
  // to nothing when the DB is empty (the sidebar block hides itself).
  const topCompanies = useMemo(() => {
    const tallies = new Map<string, number>();
    for (const j of allJobs) {
      const name = (j.company || "").trim();
      if (!name) continue;
      tallies.set(name, (tallies.get(name) || 0) + 1);
    }
    return Array.from(tallies.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, jobs]) => ({ name, jobs }));
  }, [allJobs]);

  const toggleAlerts = async () => {
    if (alertsBusy) return;
    if (!user) {
      // Send unauthenticated users to the login page so they can sign in
      // before subscribing. The button is also the only visible CTA on this
      // sidebar block.
      window.location.href = "/login?force=1";
      return;
    }
    setAlertsBusy(true);
    try {
      const enabling = !alertsEnabled;
      // When turning alerts ON, capture what the user is currently browsing —
      // the selected field and the "My Region" toggle — so the subscription
      // matches their interest instead of being a blanket on/off.
      const body = enabling
        ? { enabled: true, field: activeField === "All" ? "" : activeField, region: regionFilter }
        : { enabled: false };
      const token = typeof window !== "undefined" ? localStorage.getItem("icon_token") : null;
      const res = await fetch(`${API}/admin/jobs/alerts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setAlertsEnabled(!!data.enabled);
        setAlertField(data.field || "");
        setAlertRegion(!!data.region);
      }
    } catch { /* keep last known state */ }
    finally { setAlertsBusy(false); }
  };

  const toggleVisa = (v: string) =>
    setVisaFilter((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);

  const toggleType = (t: string) =>
    setTypeFilter((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

  // Field label for each job, memoized so tab-grouping and counts stay cheap.
  const jobField = useMemo(() => {
    const m = new Map<string, string>();
    for (const j of allJobs) m.set(j.id, deriveField(j));
    return m;
  }, [allJobs]);

  // Everything EXCEPT the field tab, so field counts reflect the other active
  // filters (search / visa / type / region).
  const baseJobs = useMemo(() => {
    const q = search.toLowerCase();
    return allJobs.filter((job) => {
      const matchSearch = !q
        || job.title.toLowerCase().includes(q)
        || job.company.toLowerCase().includes(q)
        || (job.tags || []).some((t) => t.toLowerCase().includes(q));
      const matchVisa = visaFilter.length === 0 || visaFilter.some((v) => job.visaCompatible.includes(v));
      const matchType = typeFilter.length === 0 || typeFilter.includes(job.type);
      let matchRegion = true;
      if (regionFilter && myRegion) {
        const loc = (job.location || "").toLowerCase();
        matchRegion = myRegion.keywords.some((k) => loc.includes(k));
      }
      return matchSearch && matchVisa && matchType && matchRegion;
    });
  }, [allJobs, search, visaFilter, typeFilter, regionFilter, myRegion]);

  // Field tabs present in the current base list, ordered by frequency (with
  // "Other" pinned last and an "All" tab first).
  const fieldTabs = useMemo(() => {
    const counts = new Map<string, number>();
    for (const job of baseJobs) {
      const f = jobField.get(job.id) || "Other";
      counts.set(f, (counts.get(f) || 0) + 1);
    }
    const ordered = Array.from(counts.entries()).sort((a, b) =>
      a[0] === "Other" ? 1 : b[0] === "Other" ? -1 : b[1] - a[1]
    );
    return [{ field: "All", count: baseJobs.length },
            ...ordered.map(([field, count]) => ({ field, count }))];
  }, [baseJobs, jobField]);

  // Job types actually present in the data — drives the Filters panel chips.
  const availableTypes = useMemo(() => {
    const s = new Set<string>();
    for (const j of allJobs) s.add(j.type);
    return Array.from(s);
  }, [allJobs]);

  // Apply the field tab + the chosen sort order.
  const visibleJobs = useMemo(() => {
    const list = baseJobs.filter((job) =>
      activeField === "All" || (jobField.get(job.id) || "Other") === activeField
    );
    const sorted = [...list];
    if (sortBy === "recent") {
      sorted.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
    } else if (sortBy === "salary") {
      sorted.sort((a, b) => salaryNum(b.salary) - salaryNum(a.salary));
    } else if (sortBy === "applied") {
      sorted.sort((a, b) => (b.applyCount ?? b.applications ?? 0) - (a.applyCount ?? a.applications ?? 0));
    } else if (sortBy === "deadline") {
      sorted.sort((a, b) => deadlineTs(a.deadline) - deadlineTs(b.deadline));
    }
    return sorted;
  }, [baseJobs, activeField, sortBy, jobField]);

  const activeFilterCount =
    visaFilter.length + typeFilter.length + (regionFilter ? 1 : 0) + (activeField !== "All" ? 1 : 0);

  const clearFilters = () => {
    setActiveField("All");
    setTypeFilter([]);
    setVisaFilter([]);
    setRegionFilter(false);
    setSearch("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16 pb-20 md:pb-0">
        {/* Page header */}
        <div className="border-b border-white/8 bg-gradient-to-b from-white/2 to-transparent">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="new" className="gap-1 text-xs">
                    <Sparkles size={10} />
                    AI-Powered Matching
                  </Badge>
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Internships</h1>
                <p className="text-muted-foreground text-sm">
                  Real internship opportunities at top companies — curated for international students
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-3">
                <div className="text-center">
                  <div className="text-xl font-bold gradient-text-primary">{allJobs.length || "—"}</div>
                  <div className="text-xs text-muted-foreground">Internships</div>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div className="text-center">
                  <div className="text-xl font-bold text-emerald-400">Real</div>
                  <div className="text-xs text-muted-foreground">Apply links</div>
                </div>
              </div>
            </div>

            {/* Search + filters */}
            <div className="mt-6 space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by role, company, or keyword..."
                    icon={<Search size={15} />}
                    className="h-11"
                  />
                </div>
                <Button
                  variant="glass"
                  className="gap-2 h-11 px-4 shrink-0"
                  onClick={() => setShowFilters((s) => !s)}
                >
                  <SlidersHorizontal size={15} />
                  <span className="hidden sm:inline">Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="text-[10px] font-bold bg-indigo-500/30 text-indigo-300 rounded-full px-1.5 py-0.5">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </div>

              {/* Advanced filters panel (toggled by the Filters button) */}
              {showFilters && (
                <div className="rounded-2xl border border-white/10 bg-white/3 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">Filter by job type</span>
                    {activeFilterCount > 0 && (
                      <button
                        onClick={clearFilters}
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                      >
                        <X size={11} /> Clear all
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableTypes.length === 0 ? (
                      <span className="text-xs text-muted-foreground">No job types available yet.</span>
                    ) : availableTypes.map((t) => (
                      <button
                        key={t}
                        onClick={() => toggleType(t)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all border ${
                          typeFilter.includes(t)
                            ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/40"
                            : "text-muted-foreground border-white/10 hover:border-white/20 hover:text-foreground"
                        }`}
                      >
                        {t.replace("-", " ")}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Field tabs — browse internships by interested field. Counts
                  reflect the current search / visa / type / region filters. */}
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                {fieldTabs.map(({ field, count }) => (
                  <button
                    key={field}
                    onClick={() => setActiveField(field)}
                    className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                      activeField === field
                        ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/40"
                        : "text-muted-foreground hover:text-foreground bg-white/5 border border-white/8 hover:border-white/15"
                    }`}
                  >
                    {field}
                    <span className={`text-[10px] px-1.5 rounded-full ${
                      activeField === field ? "bg-indigo-500/30" : "bg-white/10"
                    }`}>
                      {count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Visa + region filter pills */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                  <CheckCircle2 size={11} />
                  Visa compatible:
                </span>
                {["D-2", "D-4", "F-2", "E-7"].map((v) => (
                  <button
                    key={v}
                    onClick={() => toggleVisa(v)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                      visaFilter.includes(v)
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        : "text-muted-foreground border-white/10 hover:border-white/20 hover:text-foreground"
                    }`}
                  >
                    {v}
                  </button>
                ))}

                {/* My Region — only shown for signed-in users with a
                    recognised university. Keywords include English +
                    Korean city/province so it matches Wanted.co.kr's
                    Korean location strings ("서울", "전주") too. */}
                {myRegion && (
                  <>
                    <span className="text-xs text-muted-foreground/40 px-1">·</span>
                    <button
                      onClick={() => setRegionFilter((p) => !p)}
                      title={`Show internships near ${myRegion.city} (${myRegion.province})`}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border flex items-center gap-1.5 ${
                        regionFilter
                          ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/40"
                          : "text-muted-foreground border-white/10 hover:border-white/20 hover:text-foreground"
                      }`}
                    >
                      <MapPin size={11} />
                      My Region · {myRegion.city}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main listings */}
            <div className="lg:col-span-3">
              {/* Info banner */}
              <div className="flex items-center gap-3 p-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 mb-5">
                <Sparkles size={18} className="text-violet-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    All listings include <span className="text-indigo-400 font-bold">real apply links</span>
                  </p>
                  <p className="text-xs text-muted-foreground">Click Apply ↗ to go directly to the company's official careers page</p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  Showing <span className="text-foreground font-medium">{visibleJobs.length}</span> results
                  {activeField !== "All" && <span className="text-indigo-400"> · {activeField}</span>}
                </p>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortKey)}
                  className="text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-muted-foreground focus:outline-none focus:border-indigo-500/50"
                >
                  <option value="recent">Most Recent</option>
                  <option value="salary">Salary: High to Low</option>
                  <option value="applied">Most Applied</option>
                  <option value="deadline">Deadline Soon</option>
                </select>
              </div>

              <div className="space-y-4">
                {loading ? (
                  <div className="py-16 text-center text-muted-foreground text-sm">Loading internships…</div>
                ) : visibleJobs.length === 0 ? (
                  <div className="py-16 text-center text-muted-foreground text-sm">No internships match your filters.</div>
                ) : (
                  visibleJobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))
                )}
              </div>
            </div>

            {/* Sidebar — desktop only */}
            <div className="space-y-4 hidden lg:block">
              {/* Job alerts */}
              <div className={`p-5 rounded-2xl border ${alertsEnabled ? "border-emerald-500/30 bg-emerald-500/5" : "border-indigo-500/20 bg-indigo-500/5"}`}>
                <div className="flex items-center gap-2 mb-2">
                  {alertsEnabled
                    ? <BellRing size={14} className="text-emerald-400" />
                    : <TrendingUp size={14} className="text-indigo-400" />}
                  <h3 className="text-sm font-semibold text-foreground">
                    {alertsEnabled ? "Alerts active" : "Job Alerts"}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  {alertsEnabled ? (
                    <>
                      We&apos;ll email you about new{" "}
                      <span className="text-emerald-400 font-medium">{alertField || "internship"}</span>{" "}
                      listings{alertRegion && myRegion ? <> near <span className="text-emerald-400 font-medium">{myRegion.city}</span></> : ""}.
                    </>
                  ) : (
                    <>
                      Get notified about new{" "}
                      <span className="text-indigo-400 font-medium">{activeField !== "All" ? activeField : "internship"}</span>{" "}
                      listings{regionFilter && myRegion ? <> near <span className="text-indigo-400 font-medium">{myRegion.city}</span></> : ""}.
                    </>
                  )}
                </p>
                <Button
                  size="sm"
                  variant={alertsEnabled ? "outline" : "default"}
                  className="w-full text-xs gap-1.5"
                  onClick={toggleAlerts}
                  disabled={alertsBusy}
                >
                  {alertsBusy ? (
                    <><Loader2 size={12} className="animate-spin" /> Saving…</>
                  ) : alertsEnabled ? (
                    <><BellOff size={12} /> Turn off alerts</>
                  ) : (
                    <><BellRing size={12} /> Enable Alerts</>
                  )}
                </Button>
              </div>

              {/* Top companies — computed from the live job list, so it
                  reflects what's actually scraped (e.g. "Ssuksuk Company")
                  instead of a stale Kakao/Samsung/Naver placeholder. */}
              {topCompanies.length > 0 && (
                <div className="p-5 rounded-2xl border border-white/8 bg-white/3">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Top Hiring Companies</h3>
                  <div className="space-y-2.5">
                    {topCompanies.map(({ name, jobs }) => (
                      <div key={name} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-7 w-7 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center text-xs font-bold text-foreground/60 shrink-0">
                            {name[0]?.toUpperCase() || "?"}
                          </div>
                          <span className="text-xs font-medium text-muted-foreground truncate">{name}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px] border-white/10 shrink-0">
                          {jobs} {jobs === 1 ? "job" : "jobs"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Salary guide */}
              <div className="p-5 rounded-2xl border border-white/8 bg-white/3">
                <h3 className="text-sm font-semibold text-foreground mb-3">Avg. Salary Guide</h3>
                <div className="space-y-2">
                  {[
                    { type: "Part-time", range: "9K–15K₩/hr", color: "bg-blue-400" },
                    { type: "Internship", range: "2M–3.5M₩/mo", color: "bg-indigo-400" },
                    { type: "Research", range: "1.2M–2M₩/mo", color: "bg-violet-400" },
                    { type: "Full-time", range: "2.5M–5M₩/mo", color: "bg-emerald-400" },
                  ].map(({ type, range, color }) => (
                    <div key={type} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className={`h-1.5 w-1.5 rounded-full ${color}`} />
                        <span className="text-muted-foreground">{type}</span>
                      </div>
                      <span className="font-medium text-foreground">{range}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
