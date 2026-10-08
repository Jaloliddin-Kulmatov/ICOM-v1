"use client";

import React, { useState, useMemo } from "react";
import { useQueryState, useQueryListState } from "@/hooks/use-query-state";
import { jobCategory, jobCity, daysLeft, matchesSearch, sortJobs, SORTS, type SortKey } from "@/lib/job-filters";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import JobCard from "@/components/jobs/job-card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, Sparkles, TrendingUp, CheckCircle2, MapPin, BellRing, BellOff, Loader2, X, CalendarClock, Globe2, ArrowUpDown } from "lucide-react";
import { JOB_CATEGORIES, UNIVERSITIES } from "@/lib/constants";
import { useAuth } from "@/lib/auth";
import type { Job } from "@/types";

const ALERT_FIELDS = ["IT / Tech", "Marketing", "Engineering", "Business / Admin", "Design", "Finance", "Research / R&D", "Media / Content", "Sales", "All Fields"];
const ALERT_LOCATIONS = ["Jeonju / Jeonbuk", "Seoul", "Busan", "Daejeon", "Gwangju", "All Korea"];


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

const PAGE_SIZE = 20;
const DEADLINES: Record<string, string> = {
  any: "Any deadline",
  week: "Closing within 7 days",
  month: "Closing within 30 days",
  rolling: "Rolling (no deadline)",
};

type Filters = {
  search: string; category: string; city: string; deadline: string;
  friendly: boolean; visas: string[]; region: string[] | null;
};

/** Apply every filter except the ones named in `skip` (used for facet counts). */
function applyFilters(jobs: Job[], f: Filters, skip: (keyof Filters)[] = []): Job[] {
  return jobs.filter((job) => {
    if (!skip.includes("search") && !matchesSearch(job, f.search)) return false;
    if (!skip.includes("category") && f.category !== "All" && jobCategory(job) !== f.category) return false;
    if (!skip.includes("city") && f.city !== "All Locations" && jobCity(job) !== f.city) return false;
    if (!skip.includes("friendly") && f.friendly && job.foreignerFriendly !== "yes") return false;
    if (!skip.includes("visas") && f.visas.length && !f.visas.some((v) => job.visaCompatible.includes(v))) return false;
    if (!skip.includes("deadline") && f.deadline !== "any") {
      const d = daysLeft(job);
      if (f.deadline === "rolling" && d !== null) return false;
      if (f.deadline === "week" && (d === null || d > 7)) return false;
      if (f.deadline === "month" && (d === null || d > 30)) return false;
    }
    if (!skip.includes("region") && f.region) {
      const loc = (job.location || "").toLowerCase();
      if (!f.region.some((k) => loc.includes(k))) return false;
    }
    return true;
  });
}

export default function JobsPage() {
  const { user } = useAuth();
  // Every filter lives in the URL (?q=&field=&city=…) so back/refresh/share keep it.
  const [search, setSearch] = useQueryState("q", "");
  const [activeCategory, setActiveCategory] = useQueryState("field", "All");
  const [locationFilter, setLocationFilter] = useQueryState("city", "All Locations");
  const [deadlineFilter, setDeadlineFilter] = useQueryState("deadline", "any");
  const [friendlyOnly, setFriendlyOnly] = useQueryState("welcome", "");
  const [sort, setSort] = useQueryState("sort", "newest");
  const [visaFilter, setVisaFilter, toggleVisa] = useQueryListState("visa");
  const [regionParam, setRegionParam] = useQueryState("near", "");
  const regionFilter = regionParam === "1";
  const [showFilters, setShowFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [alertsBusy, setAlertsBusy] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertField, setAlertField] = useState("All Fields");
  const [alertLocation, setAlertLocation] = useState("All Korea");

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
            type: "internship" as Job["type"], salary: j.salary || "", description: j.description || "",
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
      .then(d => { if (d) setAlertsEnabled(!!d.enabled); })
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
      window.location.href = "/login?force=1";
      return;
    }
    // If turning OFF — disable immediately, no modal needed
    if (alertsEnabled) {
      setAlertsBusy(true);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("icon_token") : null;
        const res = await fetch(`${API}/admin/jobs/alerts`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" },
          body: JSON.stringify({ enabled: false }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) setAlertsEnabled(!!data.enabled);
      } catch { /* keep last known state */ }
      finally { setAlertsBusy(false); }
      return;
    }
    // If turning ON — show preferences modal first
    setShowAlertModal(true);
  };

  const confirmAlerts = async () => {
    setShowAlertModal(false);
    setAlertsBusy(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("icon_token") : null;
      const res = await fetch(`${API}/admin/jobs/alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" },
        // Send field + location so the backend can send a confirmation email
        // with the user's chosen preferences.
        body: JSON.stringify({ enabled: true, field: alertField, location: alertLocation }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setAlertsEnabled(!!data.enabled);
        // Save preferences to localStorage so we can display them
        localStorage.setItem("job_alert_field", alertField);
        localStorage.setItem("job_alert_location", alertLocation);
      }
    } catch { /* keep last known state */ }
    finally { setAlertsBusy(false); }
  };

  const filters: Filters = {
    search, category: activeCategory, city: locationFilter, deadline: deadlineFilter,
    friendly: friendlyOnly === "1", visas: visaFilter,
    region: regionFilter && myRegion ? myRegion.keywords : null,
  };

  // Faceted counts: each option shows how many results it would give with
  // the other filters applied, so users never pick a dead end.
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    const base = applyFilters(allJobs, filters, ["category"]);
    base.forEach((j) => counts.set(jobCategory(j), (counts.get(jobCategory(j)) || 0) + 1));
    return { counts, total: base.length };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allJobs, search, locationFilter, deadlineFilter, friendlyOnly, visaFilter.join(), regionFilter, myRegion]);

  const locations = useMemo(() => {
    const counts = new Map<string, number>();
    applyFilters(allJobs, filters, ["city"]).forEach((j) => counts.set(jobCity(j), (counts.get(jobCity(j)) || 0) + 1));
    const other = counts.get("Other") || 0;
    counts.delete("Other");
    const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    return [...sorted, ...(other ? [["Other", other] as [string, number]] : [])];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allJobs, search, activeCategory, deadlineFilter, friendlyOnly, visaFilter.join(), regionFilter, myRegion]);

  // Only offer visa chips that some listing actually mentions.
  const visaOptions = useMemo(() => {
    const set = new Set<string>();
    allJobs.forEach((j) => j.visaCompatible.forEach((v) => set.add(v)));
    return ["D-2", "D-4", "D-10", "F-2", "E-7"].filter((v) => set.has(v));
  }, [allJobs]);

  const friendlyCount = useMemo(
    () => applyFilters(allJobs, filters, ["friendly"]).filter((j) => j.foreignerFriendly === "yes").length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allJobs, search, activeCategory, locationFilter, deadlineFilter, visaFilter.join(), regionFilter, myRegion]
  );

  const filteredJobs = useMemo(
    () => sortJobs(applyFilters(allJobs, filters), (sort in SORTS ? sort : "newest") as SortKey),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allJobs, search, activeCategory, locationFilter, deadlineFilter, friendlyOnly, visaFilter.join(), regionFilter, myRegion, sort]
  );

  // Start from the top of the list whenever the filters change.
  React.useEffect(() => { setVisibleCount(PAGE_SIZE); },
    [search, activeCategory, locationFilter, deadlineFilter, friendlyOnly, visaFilter.join(), regionFilter, sort]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeCount =
    (activeCategory !== "All" ? 1 : 0) + (locationFilter !== "All Locations" ? 1 : 0) +
    (deadlineFilter !== "any" ? 1 : 0) + (friendlyOnly === "1" ? 1 : 0) +
    visaFilter.length + (regionFilter ? 1 : 0) + (search ? 1 : 0);

  const clearAll = () => {
    setSearch(""); setActiveCategory("All"); setLocationFilter("All Locations");
    setDeadlineFilter("any"); setFriendlyOnly(""); setVisaFilter([]); setRegionParam("");
  };

  // Load saved alert preferences from localStorage on mount
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const f = localStorage.getItem("job_alert_field");
    const l = localStorage.getItem("job_alert_location");
    if (f) setAlertField(f);
    if (l) setAlertLocation(l);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16 pb-20 md:pb-0">
        {/* Page header */}
        <div className="border-b border-border bg-gradient-to-b from-indigo-500/[0.05] to-transparent">
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
                <div className="h-8 w-px bg-border" />
                <div className="text-center">
                  <div className="text-xl font-bold text-emerald-400">Real</div>
                  <div className="text-xs text-muted-foreground">Apply links</div>
                </div>
              </div>
            </div>

            {/* Search + filters */}
            <div className="mt-6 space-y-3">
              <div className="flex gap-2">
                <div className="flex-1 min-w-0">
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search role, company, skill or city"
                    icon={<Search size={15} />}
                    className="h-11"
                    aria-label="Search internships"
                  />
                </div>
                <Button
                  variant="outline"
                  className="md:hidden gap-2 h-11 px-4 shrink-0"
                  onClick={() => setShowFilters((v) => !v)}
                  aria-expanded={showFilters}
                  aria-controls="internship-filters"
                >
                  <SlidersHorizontal size={15} />
                  Filters
                  {activeCount > 0 && (
                    <span className="ml-0.5 h-5 min-w-5 px-1.5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">
                      {activeCount}
                    </span>
                  )}
                </Button>
              </div>

              {/* Field — the main way students browse */}
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1" role="group" aria-label="Field">
                {JOB_CATEGORIES.map((cat) => {
                  const n = cat === "All" ? categoryCounts.total : categoryCounts.counts.get(cat) || 0;
                  const on = activeCategory === cat;
                  if (!on && cat !== "All" && n === 0) return null;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      aria-pressed={on}
                      className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        on
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-card text-foreground/80 border-border hover:border-indigo-500/40"
                      }`}
                    >
                      {cat}
                      <span className={`tabular-nums ${on ? "text-white/80" : "text-muted-foreground"}`}>{n}</span>
                    </button>
                  );
                })}
              </div>

              {/* Secondary filters — collapsible on phones, always visible on desktop */}
              <div id="internship-filters" className={`${showFilters ? "flex" : "hidden"} md:flex flex-wrap items-center gap-2`}>
                <label className="relative">
                  <span className="sr-only">Location</span>
                  <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className={`appearance-none h-9 pl-8 pr-8 rounded-full text-xs font-semibold border bg-card cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      locationFilter !== "All Locations" ? "border-indigo-500 text-indigo-700 dark:text-indigo-300" : "border-border text-foreground"
                    }`}
                  >
                    <option value="All Locations">All locations</option>
                    {locations.map(([loc, n]) => (
                      <option key={loc} value={loc}>{loc} ({n})</option>
                    ))}
                  </select>
                </label>

                <label className="relative">
                  <span className="sr-only">Deadline</span>
                  <CalendarClock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <select
                    value={deadlineFilter}
                    onChange={(e) => setDeadlineFilter(e.target.value)}
                    className={`appearance-none h-9 pl-8 pr-8 rounded-full text-xs font-semibold border bg-card cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      deadlineFilter !== "any" ? "border-indigo-500 text-indigo-700 dark:text-indigo-300" : "border-border text-foreground"
                    }`}
                  >
                    {Object.entries(DEADLINES).map(([k, label]) => (
                      <option key={k} value={k}>{label}</option>
                    ))}
                  </select>
                </label>

                <button
                  onClick={() => setFriendlyOnly(friendlyOnly === "1" ? "" : "1")}
                  aria-pressed={friendlyOnly === "1"}
                  className={`h-9 inline-flex items-center gap-1.5 px-3.5 rounded-full text-xs font-semibold border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    friendlyOnly === "1"
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-card text-foreground border-border hover:border-emerald-500/50"
                  }`}
                >
                  <Globe2 size={13} />
                  Foreigners welcome
                  <span className={`tabular-nums ${friendlyOnly === "1" ? "text-white/80" : "text-muted-foreground"}`}>{friendlyCount}</span>
                </button>

                {visaOptions.length > 1 && visaOptions.map((v) => (
                  <button
                    key={v}
                    onClick={() => toggleVisa(v)}
                    aria-pressed={visaFilter.includes(v)}
                    className={`h-9 inline-flex items-center gap-1 px-3 rounded-full text-xs font-semibold border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      visaFilter.includes(v)
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-card text-foreground border-border hover:border-indigo-500/40"
                    }`}
                  >
                    <CheckCircle2 size={12} /> {v}
                  </button>
                ))}

                {myRegion && (
                  <button
                    onClick={() => setRegionParam(regionFilter ? "" : "1")}
                    aria-pressed={regionFilter}
                    title={`Show internships near ${myRegion.city} (${myRegion.province})`}
                    className={`h-9 inline-flex items-center gap-1.5 px-3.5 rounded-full text-xs font-semibold border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      regionFilter
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-card text-foreground border-border hover:border-indigo-500/40"
                    }`}
                  >
                    <MapPin size={12} />
                    Near {myRegion.city}
                  </button>
                )}

                {activeCount > 0 && (
                  <button
                    onClick={clearAll}
                    className="h-9 inline-flex items-center gap-1 px-3 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X size={13} /> Clear all
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main listings */}
            <div className="lg:col-span-3">
              {/* Job alerts — mobile only (desktop shows this in the sidebar) */}
              {user && (
                <div className={`lg:hidden p-4 rounded-2xl border mb-4 flex items-center justify-between gap-3 ${alertsEnabled ? "border-emerald-500/30 bg-emerald-500/5" : "border-indigo-500/20 bg-indigo-500/5"}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    {alertsEnabled
                      ? <BellRing size={15} className="text-emerald-400 shrink-0" />
                      : <BellRing size={15} className="text-indigo-400 shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground">
                        {alertsEnabled ? "Job alerts active" : "Job Alerts"}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {alertsEnabled ? `${alertField} · ${alertLocation}` : "Get emailed when new internships match your profile"}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={alertsEnabled ? "outline" : "default"}
                    className="shrink-0 text-xs gap-1.5"
                    onClick={toggleAlerts}
                    disabled={alertsBusy}
                  >
                    {alertsBusy ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : alertsEnabled ? (
                      <><BellOff size={12} /> Off</>
                    ) : (
                      <><BellRing size={12} /> Enable</>
                    )}
                  </Button>
                </div>
              )}

              {/* Info banner */}
              <div className="hidden md:flex items-center gap-3 p-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 mb-5">
                <Sparkles size={18} className="text-violet-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    All listings include <span className="text-indigo-400 font-bold">real apply links</span>
                  </p>
                  <p className="text-xs text-muted-foreground">Click Apply ↗ to go directly to the company's official careers page</p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 mb-4">
                <p className="text-sm text-muted-foreground" aria-live="polite">
                  {loading ? "Loading…" : (
                    <>
                      <span className="text-foreground font-semibold tabular-nums">{filteredJobs.length}</span>
                      {filteredJobs.length === allJobs.length ? " internships" : ` of ${allJobs.length} internships`}
                    </>
                  )}
                </p>
                <label className="relative">
                  <span className="sr-only">Sort</span>
                  <ArrowUpDown size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="appearance-none text-xs font-semibold bg-card border border-border rounded-lg h-8 pl-7 pr-7 text-foreground cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {Object.entries(SORTS).map(([k, label]) => (
                      <option key={k} value={k}>{label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="space-y-3">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-40 rounded-2xl border border-border bg-card animate-pulse" />
                  ))
                ) : filteredJobs.length === 0 ? (
                  <div className="py-16 px-6 text-center rounded-2xl border border-dashed border-border">
                    <p className="text-sm font-semibold text-foreground">No internships match these filters</p>
                    <p className="text-xs text-muted-foreground mt-1 mb-4">Try a different field or city, or remove a filter.</p>
                    <Button size="sm" variant="outline" onClick={clearAll}>Clear all filters</Button>
                  </div>
                ) : (
                  <>
                    {filteredJobs.slice(0, visibleCount).map((job) => (
                      <JobCard key={job.id} job={job} />
                    ))}
                    {visibleCount < filteredJobs.length && (
                      <Button
                        variant="outline"
                        className="w-full h-11"
                        onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                      >
                        Show more · {filteredJobs.length - visibleCount} left
                      </Button>
                    )}
                  </>
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
                  {alertsEnabled
                    ? `${alertField} · ${alertLocation}`
                    : "Get notified of new listings matching your field and location."}
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

      {/* Job Alerts Preferences Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowAlertModal(false)}>
          <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gradient-to-r from-indigo-500/10 to-indigo-600/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center">
                  <BellRing size={15} className="text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground">Set Alert Preferences</h2>
                  <p className="text-[11px] text-muted-foreground">We&apos;ll email you matching new internships</p>
                </div>
              </div>
              <button onClick={() => setShowAlertModal(false)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <X size={15} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Field of interest */}
              <div>
                <label className="text-xs font-semibold text-foreground mb-2 block">Interested Field</label>
                <div className="grid grid-cols-2 gap-2">
                  {ALERT_FIELDS.map(f => (
                    <button
                      key={f}
                      onClick={() => setAlertField(f)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all text-left ${
                        alertField === f
                          ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-500"
                          : "bg-muted/50 border-border text-muted-foreground hover:border-indigo-500/30 hover:text-foreground"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="text-xs font-semibold text-foreground mb-2 block">Preferred Location</label>
                <div className="grid grid-cols-2 gap-2">
                  {ALERT_LOCATIONS.map(l => (
                    <button
                      key={l}
                      onClick={() => setAlertLocation(l)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all text-left ${
                        alertLocation === l
                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                          : "bg-muted/50 border-border text-muted-foreground hover:border-emerald-500/30 hover:text-foreground"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={confirmAlerts}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-700 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <BellRing size={14} /> Enable Alerts
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
