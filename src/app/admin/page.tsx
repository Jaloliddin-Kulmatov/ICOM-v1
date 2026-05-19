"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { useAuth } from "@/lib/auth";
import { ShieldCheck, Plus, Trash2, Briefcase, Users, Loader2, AlertCircle, Star, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("icon_token") : null;
}

async function apiCall(method: string, path: string, body?: object) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

interface Club {
  id: number; name: string; category: string; university: string;
  description: string; contact: string; meeting_time: string; location: string;
}

interface Job {
  id: number; title: string; company: string; location: string;
  type: string; salary: string; deadline: string;
}

interface AmbassadorApp {
  id: number; name: string; email: string; university: string;
  department: string; year: string; country: string; visa_type: string;
  motivation: string; social: string; status: string; created_at: string;
}

const CLUB_CATEGORIES = ["academic", "sports", "culture", "social", "language", "tech", "arts", "volunteer"];
const JOB_TYPES = ["part-time", "internship", "research", "full-time", "volunteer"];

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"clubs" | "jobs" | "ambassadors">("clubs");
  const [clubs, setClubs] = useState<Club[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [ambassadors, setAmbassadors] = useState<AmbassadorApp[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [clubForm, setClubForm] = useState({
    name: "", category: "social", university: "JBNU",
    description: "", contact: "", meeting_time: "", location: "",
  });

  const [jobForm, setJobForm] = useState({
    title: "", company: "", location: "", type: "part-time",
    salary: "", description: "", requirements: "", visa_compatible: "D-2, D-4", deadline: "", tags: "",
  });

  const loadData = useCallback(async () => {
    try {
      const [cd, jd, ad] = await Promise.all([
        apiCall("GET", "/admin/clubs"),
        apiCall("GET", "/admin/jobs"),
        apiCall("GET", "/ambassador/applications"),
      ]);
      setClubs(cd.clubs || []);
      setJobs(jd.jobs || []);
      setAmbassadors(ad.applications || []);
    } catch {
      // ignore on load
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!user) router.push("/login");
      else if (user.role !== "admin") router.push("/dashboard");
      else loadData();
    }
  }, [user, authLoading, router, loadData]);

  const flash = (msg: string, isError = false) => {
    if (isError) setError(msg); else setSuccess(msg);
    setTimeout(() => { setError(""); setSuccess(""); }, 3000);
  };

  const handleAddClub = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await apiCall("POST", "/admin/clubs", clubForm);
      flash("Club added!");
      setClubForm({ name: "", category: "social", university: "JBNU", description: "", contact: "", meeting_time: "", location: "" });
      loadData();
    } catch (err: unknown) {
      flash(err instanceof Error ? err.message : "Failed", true);
    } finally { setBusy(false); }
  };

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await apiCall("POST", "/admin/jobs", jobForm);
      flash("Job posted!");
      setJobForm({ title: "", company: "", location: "", type: "part-time", salary: "", description: "", requirements: "", visa_compatible: "D-2, D-4", deadline: "", tags: "" });
      loadData();
    } catch (err: unknown) {
      flash(err instanceof Error ? err.message : "Failed", true);
    } finally { setBusy(false); }
  };

  const deleteClub = async (id: number) => {
    if (!confirm("Remove this club?")) return;
    try { await apiCall("DELETE", `/admin/clubs/${id}`); loadData(); } catch { /**/ }
  };

  const deleteJob = async (id: number) => {
    if (!confirm("Remove this job?")) return;
    try { await apiCall("DELETE", `/admin/jobs/${id}`); loadData(); } catch { /**/ }
  };

  if (authLoading || !user) return null;

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/50 transition-colors";
  const labelCls = "text-xs font-medium text-muted-foreground mb-1 block";

  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
            <ShieldCheck size={20} className="text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-xs text-muted-foreground">Manage clubs and job listings for JBNU</p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            <AlertCircle size={14} /> {error}
          </div>
        )}
        {success && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400">
            {success}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/8 mb-6 w-fit">
          {([["clubs", Users, "Clubs"], ["jobs", Briefcase, "Jobs"], ["ambassadors", Star, `Ambassadors${ambassadors.filter(a=>a.status==="pending").length ? ` (${ambassadors.filter(a=>a.status==="pending").length})` : ""}`]] as const).map(([id, Icon, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === id ? "bg-indigo-500/20 text-indigo-400" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {/* CLUBS TAB */}
        {tab === "clubs" && (
          <div className="space-y-6">
            <form onSubmit={handleAddClub} className="p-6 rounded-2xl border border-white/8 bg-white/3 space-y-4">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Plus size={15} className="text-indigo-400" /> Add Club / Community
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={labelCls}>Club Name *</label>
                  <input required value={clubForm.name} onChange={e => setClubForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. JBNU Badminton Club" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Category</label>
                  <select value={clubForm.category} onChange={e => setClubForm(p => ({ ...p, category: e.target.value }))} className={inputCls}>
                    {CLUB_CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>University</label>
                  <input value={clubForm.university} onChange={e => setClubForm(p => ({ ...p, university: e.target.value }))} className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Description</label>
                  <textarea value={clubForm.description} onChange={e => setClubForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="What does this club do?" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Meeting Time</label>
                  <input value={clubForm.meeting_time} onChange={e => setClubForm(p => ({ ...p, meeting_time: e.target.value }))} placeholder="e.g. Every Wed 6pm" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Location</label>
                  <input value={clubForm.location} onChange={e => setClubForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Student Union B203" className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Contact (KakaoTalk ID / Email)</label>
                  <input value={clubForm.contact} onChange={e => setClubForm(p => ({ ...p, contact: e.target.value }))} placeholder="e.g. kakao: jbnu_badminton" className={inputCls} />
                </div>
              </div>
              <Button type="submit" disabled={busy} className="w-full gap-2">
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Add Club
              </Button>
            </form>

            {/* Existing clubs */}
            {clubs.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Active Clubs ({clubs.length})</h2>
                {clubs.map(club => (
                  <div key={club.id} className="flex items-center justify-between p-4 rounded-xl border border-white/8 bg-white/3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{club.name}</p>
                      <p className="text-xs text-muted-foreground">{club.category} · {club.university}</p>
                    </div>
                    <button onClick={() => deleteClub(club.id)} className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/8 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* JOBS TAB */}
        {tab === "jobs" && (
          <div className="space-y-6">
            <form onSubmit={handleAddJob} className="p-6 rounded-2xl border border-white/8 bg-white/3 space-y-4">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Plus size={15} className="text-indigo-400" /> Post a Job / Opportunity
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Job Title *</label>
                  <input required value={jobForm.title} onChange={e => setJobForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. English Tutor" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Company / Organization *</label>
                  <input required value={jobForm.company} onChange={e => setJobForm(p => ({ ...p, company: e.target.value }))} placeholder="e.g. JBNU Language Center" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Type</label>
                  <select value={jobForm.type} onChange={e => setJobForm(p => ({ ...p, type: e.target.value }))} className={inputCls}>
                    {JOB_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Location</label>
                  <input value={jobForm.location} onChange={e => setJobForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Jeonju / Online" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Salary / Pay</label>
                  <input value={jobForm.salary} onChange={e => setJobForm(p => ({ ...p, salary: e.target.value }))} placeholder="e.g. 12,000₩/hr" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Application Deadline</label>
                  <input value={jobForm.deadline} onChange={e => setJobForm(p => ({ ...p, deadline: e.target.value }))} placeholder="e.g. Jun 30" className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Description</label>
                  <textarea value={jobForm.description} onChange={e => setJobForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Describe the role..." className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Requirements (one per line)</label>
                  <textarea value={jobForm.requirements} onChange={e => setJobForm(p => ({ ...p, requirements: e.target.value }))} rows={3} placeholder={"University enrollment\nBasic Korean"} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Visa Types (comma separated)</label>
                  <input value={jobForm.visa_compatible} onChange={e => setJobForm(p => ({ ...p, visa_compatible: e.target.value }))} placeholder="D-2, D-4" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Tags (comma separated)</label>
                  <input value={jobForm.tags} onChange={e => setJobForm(p => ({ ...p, tags: e.target.value }))} placeholder="Teaching, Flexible, JBNU" className={inputCls} />
                </div>
              </div>
              <Button type="submit" disabled={busy} className="w-full gap-2">
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Post Job
              </Button>
            </form>

            {/* Existing jobs */}
            {jobs.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Active Jobs ({jobs.length})</h2>
                {jobs.map(job => (
                  <div key={job.id} className="flex items-center justify-between p-4 rounded-xl border border-white/8 bg-white/3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{job.title}</p>
                      <p className="text-xs text-muted-foreground">{job.company} · {job.type} {job.salary ? `· ${job.salary}` : ""}</p>
                    </div>
                    <button onClick={() => deleteJob(job.id)} className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/8 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AMBASSADORS TAB */}
        {tab === "ambassadors" && (
          <div className="space-y-3">
            {ambassadors.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No applications yet.</p>
            )}
            {ambassadors.map(app => (
              <div key={app.id} className={`p-5 rounded-2xl border ${app.status === "approved" ? "border-emerald-500/20 bg-emerald-500/5" : app.status === "rejected" ? "border-red-500/10 bg-red-500/3 opacity-60" : "border-white/8 bg-white/3"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-bold text-foreground">{app.name}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${app.status === "approved" ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" : app.status === "rejected" ? "text-red-400 border-red-500/20" : "text-amber-400 border-amber-500/20 bg-amber-500/10"}`}>{app.status}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{app.email} · {app.university} · {app.department} · {app.year}</p>
                    <p className="text-xs text-muted-foreground">{app.country}{app.visa_type ? ` · ${app.visa_type}` : ""}{app.social ? ` · ${app.social}` : ""}</p>
                    {app.motivation && (
                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-3 italic">&ldquo;{app.motivation}&rdquo;</p>
                    )}
                  </div>
                  {app.status === "pending" && (
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={async () => { await apiCall("PATCH", `/ambassador/applications/${app.id}`, { status: "approved" }); loadData(); }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs hover:bg-emerald-500/25 transition-colors"
                      >
                        <CheckCircle2 size={12} /> Accept
                      </button>
                      <button
                        onClick={async () => { await apiCall("PATCH", `/ambassador/applications/${app.id}`, { status: "rejected" }); loadData(); }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20 transition-colors"
                      >
                        <XCircle size={12} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
