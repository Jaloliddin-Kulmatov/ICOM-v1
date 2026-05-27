"use client";

import React, { useState } from "react";
import Navbar from "@/components/layout/navbar";
import JobCard from "@/components/jobs/job-card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, Sparkles, TrendingUp, CheckCircle2 } from "lucide-react";
import { JOB_CATEGORIES } from "@/lib/constants";
import type { Job } from "@/types";


const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

export default function JobsPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [visaFilter, setVisaFilter] = useState<string[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetch(`${API}/admin/jobs`)
      .then(r => r.json())
      .then(d => {
        if (d.jobs?.length) {
          const mapped: Job[] = d.jobs.map((j: { id: string; title: string; company: string; location: string; type: string; salary: string; description: string; requirements: string[]; visa_compatible: string[]; deadline: string; tags: string[]; isNew: boolean; apply_link: string }) => ({
            id: `db-${j.id}`, title: j.title, company: j.company, location: j.location || "",
            type: "internship" as Job["type"], salary: j.salary || "", description: j.description || "",
            requirements: j.requirements, visaCompatible: j.visa_compatible,
            postedAt: new Date().toISOString(), deadline: j.deadline, applications: 0,
            tags: j.tags, isNew: j.isNew, isHot: false, isBookmarked: false,
            applyLink: j.apply_link || "",
          }));
          setAllJobs(mapped);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggleVisa = (v: string) =>
    setVisaFilter((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);

  const filteredJobs = allJobs.filter((job) => {
    const matchSearch = !search || job.title.toLowerCase().includes(search.toLowerCase()) || job.company.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === "All" || job.type.toLowerCase().replace("-", " ") === activeCategory.toLowerCase() || (activeCategory === "Remote" && job.location.includes("Remote"));
    const matchVisa = visaFilter.length === 0 || visaFilter.some((v) => job.visaCompatible.includes(v));
    return matchSearch && matchCategory && matchVisa;
  });

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
                <Button variant="glass" className="gap-2 h-11 px-4 shrink-0">
                  <SlidersHorizontal size={15} />
                  <span className="hidden sm:inline">Filters</span>
                </Button>
              </div>

              {/* Category tabs */}
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                {JOB_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                      activeCategory === cat
                        ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/40"
                        : "text-muted-foreground hover:text-foreground bg-white/5 border border-white/8 hover:border-white/15"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Visa filter pills */}
              <div className="flex items-center gap-2">
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
                  Showing <span className="text-foreground font-medium">{filteredJobs.length}</span> results
                </p>
                <select className="text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-muted-foreground focus:outline-none focus:border-indigo-500/50">
                  <option>Most Recent</option>
                  <option>Salary: High to Low</option>
                  <option>Most Applied</option>
                  <option>Deadline Soon</option>
                </select>
              </div>

              <div className="space-y-4">
                {loading ? (
                  <div className="py-16 text-center text-muted-foreground text-sm">Loading internships…</div>
                ) : filteredJobs.length === 0 ? (
                  <div className="py-16 text-center text-muted-foreground text-sm">No internships match your filters.</div>
                ) : (
                  filteredJobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))
                )}
              </div>
            </div>

            {/* Sidebar — desktop only */}
            <div className="space-y-4 hidden lg:block">
              {/* Job alerts */}
              <div className="p-5 rounded-2xl border border-indigo-500/20 bg-indigo-500/5">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={14} className="text-indigo-400" />
                  <h3 className="text-sm font-semibold text-foreground">Job Alerts</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-3">Get notified of new listings matching your profile</p>
                <Button size="sm" className="w-full text-xs">
                  Enable Alerts
                </Button>
              </div>

              {/* Top companies */}
              <div className="p-5 rounded-2xl border border-white/8 bg-white/3">
                <h3 className="text-sm font-semibold text-foreground mb-3">Top Hiring Companies</h3>
                <div className="space-y-2.5">
                  {[
                    { name: "Kakao", jobs: 24, logo: "K" },
                    { name: "Samsung", jobs: 18, logo: "S" },
                    { name: "Naver", jobs: 15, logo: "N" },
                    { name: "LG", jobs: 12, logo: "L" },
                    { name: "Coupang", jobs: 9, logo: "C" },
                  ].map(({ name, jobs, logo }) => (
                    <div key={name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center text-xs font-bold text-foreground/60">
                          {logo}
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">{name}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] border-white/10">{jobs} jobs</Badge>
                    </div>
                  ))}
                </div>
              </div>

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
    </div>
  );
}
