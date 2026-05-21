"use client";

import React, { useState } from "react";
import Navbar from "@/components/layout/navbar";
import JobCard from "@/components/jobs/job-card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search, SlidersHorizontal, Sparkles, TrendingUp, CheckCircle2,
  Pencil, Trash2, X, Loader2, Plus,
} from "lucide-react";
import { JOB_CATEGORIES } from "@/lib/constants";
import { useAuth } from "@/lib/auth";
import type { Job } from "@/types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

function getToken() { return typeof window !== "undefined" ? localStorage.getItem("icon_token") : null; }

async function apiFetch(method: string, path: string, body?: object) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

// ── Raw job shape returned by the API ──────────────────────────────────
interface RawJob {
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  description: string;
  requirements: string[];
  visa_compatible: string[];
  deadline: string;
  tags: string[];
  isNew: boolean;
  apply_link: string;
}

function rawToJob(j: RawJob): Job {
  return {
    id: `db-${j.id}`,
    title: j.title,
    company: j.company,
    location: j.location || "",
    type: "internship" as Job["type"],
    salary: j.salary || "",
    description: j.description || "",
    requirements: j.requirements,
    visaCompatible: j.visa_compatible,
    postedAt: new Date().toISOString(),
    deadline: j.deadline,
    applications: 0,
    tags: j.tags,
    isNew: j.isNew,
    isHot: false,
    isBookmarked: false,
    applyLink: j.apply_link || "",
  };
}

// ── Edit Job Modal ──────────────────────────────────────────────────────────

interface EditJobForm {
  title: string; company: string; location: string; type: string;
  salary: string; description: string; requirements: string;
  visa_compatible: string; deadline: string; tags: string; apply_link: string;
}

function EditJobModal({ job, rawId, onClose, onSave }: {
  job: Job; rawId: number; onClose: () => void; onSave: (updated: Job) => void;
}) {
  const [form, setForm] = useState<EditJobForm>({
    title: job.title,
    company: job.company,
    location: job.location,
    type: job.type,
    salary: job.salary,
    description: job.description,
    requirements: job.requirements.join("\n"),
    visa_compatible: job.visaCompatible.join(", "),
    deadline: job.deadline || "",
    tags: job.tags.join(", "),
    apply_link: job.applyLink || "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const inputCls = "w-full bg-[#1a1a2e] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-indigo-500/50 transition-colors";
  const labelCls = "text-xs font-medium text-white/55 mb-1 block";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const data = await apiFetch("PATCH", `/admin/jobs/${rawId}`, form);
      if (data.error) throw new Error(data.error);
      onSave(rawToJob(data.job));
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-[#0e0e1a] border border-white/12 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <h2 className="text-base font-bold text-white flex items-center gap-2"><Pencil size={14} /> Edit Internship</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-colors"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-xs text-red-400 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Title *</label>
              <input required value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Company *</label>
              <input required value={form.company} onChange={e => setForm(p => ({...p, company: e.target.value}))} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Location</label>
              <input value={form.location} onChange={e => setForm(p => ({...p, location: e.target.value}))} placeholder="e.g. Seoul / Remote" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Salary</label>
              <input value={form.salary} onChange={e => setForm(p => ({...p, salary: e.target.value}))} placeholder="e.g. 2.5M₩/mo" className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea rows={4} value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Requirements (one per line)</label>
            <textarea rows={3} value={form.requirements} onChange={e => setForm(p => ({...p, requirements: e.target.value}))} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Visa Compatible (comma-separated)</label>
              <input value={form.visa_compatible} onChange={e => setForm(p => ({...p, visa_compatible: e.target.value}))} placeholder="D-2, D-4, F-2" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Deadline</label>
              <input value={form.deadline} onChange={e => setForm(p => ({...p, deadline: e.target.value}))} placeholder="e.g. 2025-06-30" className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Tags (comma-separated)</label>
            <input value={form.tags} onChange={e => setForm(p => ({...p, tags: e.target.value}))} placeholder="e.g. tech, remote, python" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Apply Link</label>
            <input value={form.apply_link} onChange={e => setForm(p => ({...p, apply_link: e.target.value}))} placeholder="https://careers.company.com/..." className={inputCls} />
          </div>
          <button type="submit" disabled={busy} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Pencil size={14} />}
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Create Job Modal ──────────────────────────────────────────────────────────

function CreateJobModal({ onClose, onCreate }: { onClose: () => void; onCreate: (job: Job) => void }) {
  const [form, setForm] = useState<EditJobForm>({
    title: "", company: "", location: "", type: "internship",
    salary: "", description: "", requirements: "",
    visa_compatible: "D-2, D-4", deadline: "", tags: "", apply_link: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const inputCls = "w-full bg-[#1a1a2e] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-indigo-500/50 transition-colors";
  const labelCls = "text-xs font-medium text-white/55 mb-1 block";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const data = await apiFetch("POST", "/admin/jobs", form);
      if (data.error) throw new Error(data.error);
      onCreate(rawToJob(data.job));
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-[#0e0e1a] border border-white/12 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <h2 className="text-base font-bold text-white flex items-center gap-2"><Plus size={14} /> Add Internship</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-colors"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-xs text-red-400 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Title *</label>
              <input required value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} placeholder="e.g. Software Intern" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Company *</label>
              <input required value={form.company} onChange={e => setForm(p => ({...p, company: e.target.value}))} placeholder="e.g. Kakao" className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Location</label>
              <input value={form.location} onChange={e => setForm(p => ({...p, location: e.target.value}))} placeholder="e.g. Seoul / Remote" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Salary</label>
              <input value={form.salary} onChange={e => setForm(p => ({...p, salary: e.target.value}))} placeholder="e.g. 2.5M₩/mo" className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea rows={3} value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} placeholder="Role overview..." className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Requirements (one per line)</label>
            <textarea rows={3} value={form.requirements} onChange={e => setForm(p => ({...p, requirements: e.target.value}))} placeholder="Bachelor's in CS&#10;React experience" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Visa Compatible</label>
              <input value={form.visa_compatible} onChange={e => setForm(p => ({...p, visa_compatible: e.target.value}))} placeholder="D-2, D-4, F-2" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Deadline</label>
              <input value={form.deadline} onChange={e => setForm(p => ({...p, deadline: e.target.value}))} placeholder="e.g. 2025-06-30" className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Tags (comma-separated)</label>
            <input value={form.tags} onChange={e => setForm(p => ({...p, tags: e.target.value}))} placeholder="e.g. tech, remote, python" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Apply Link</label>
            <input value={form.apply_link} onChange={e => setForm(p => ({...p, apply_link: e.target.value}))} placeholder="https://careers.company.com/..." className={inputCls} />
          </div>
          <button type="submit" disabled={busy} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Add Internship
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────

export default function JobsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [visaFilter, setVisaFilter] = useState<string[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [rawIds, setRawIds] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [editJob, setEditJob] = useState<Job | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  React.useEffect(() => {
    fetch(`${API}/admin/jobs`)
      .then(r => r.json())
      .then(d => {
        if (d.jobs?.length) {
          const mapped: Job[] = d.jobs.map((j: RawJob) => rawToJob(j));
          const ids: Record<string, number> = {};
          d.jobs.forEach((j: RawJob) => { ids[`db-${j.id}`] = j.id; });
          setAllJobs(mapped);
          setRawIds(ids);
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

  const handleDelete = async (job: Job) => {
    if (!confirm(`Delete "${job.title}"?`)) return;
    const rawId = rawIds[job.id];
    if (!rawId) return;
    await apiFetch("DELETE", `/admin/jobs/${rawId}`);
    setAllJobs(prev => prev.filter(j => j.id !== job.id));
  };

  const handleSave = (updated: Job) => {
    setAllJobs(prev => prev.map(j => j.id === updated.id ? updated : j));
    setEditJob(null);
  };

  const handleCreate = (created: Job) => {
    setAllJobs(prev => [created, ...prev]);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {editJob && rawIds[editJob.id] && (
        <EditJobModal
          job={editJob}
          rawId={rawIds[editJob.id]}
          onClose={() => setEditJob(null)}
          onSave={handleSave}
        />
      )}
      {showCreate && <CreateJobModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}

      <main className="pt-16">
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
              <div className="flex items-center gap-3">
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
                {isAdmin && (
                  <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors"
                  >
                    <Plus size={14} /> Add
                  </button>
                )}
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
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
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
                  <p className="text-xs text-muted-foreground">Click Apply ↗ to go directly to the company&apos;s official careers page</p>
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
                    <div key={job.id} className="relative group">
                      <JobCard job={job} />
                      {isAdmin && (
                        <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditJob(job)}
                            className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-colors"
                            title="Edit"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(job)}
                            className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
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
