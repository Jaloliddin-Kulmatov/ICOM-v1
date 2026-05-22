"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { useAuth } from "@/lib/auth";
import {
  ShieldCheck, Plus, Trash2, Briefcase, Users, Loader2,
  AlertCircle, Star, CheckCircle2, XCircle, GraduationCap,
  Globe, Calendar, Search,
} from "lucide-react";
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

interface AppUser {
  id: number; name: string; email: string; university: string;
  country: string; visa_type: string; role: string; created_at: string;
}

interface AmbassadorApp {
  id: number; name: string; email: string; university: string;
  department: string; year: string; country: string; visa_type: string;
  motivation: string; social: string; status: string; created_at: string;
}

const CLUB_CATEGORIES = ["academic", "sports", "culture", "social", "language", "tech", "arts", "volunteer"];
const JOB_TYPES = ["part-time", "internship", "research", "full-time", "volunteer"];

// Avatar palette — 12 distinct colour pairs [bg, text]
const AVATAR_COLORS = [
  ["bg-indigo-500",  "text-white"],
  ["bg-violet-500",  "text-white"],
  ["bg-emerald-500", "text-white"],
  ["bg-cyan-500",    "text-white"],
  ["bg-rose-500",    "text-white"],
  ["bg-amber-500",   "text-white"],
  ["bg-sky-500",     "text-white"],
  ["bg-fuchsia-500", "text-white"],
  ["bg-teal-500",    "text-white"],
  ["bg-orange-500",  "text-white"],
  ["bg-lime-500",    "text-gray-900"],
  ["bg-pink-500",    "text-white"],
];

function avatarColor(id: number) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"clubs" | "jobs" | "ambassadors" | "users">("clubs");
  const [clubs, setClubs] = useState<Club[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [ambassadors, setAmbassadors] = useState<AmbassadorApp[]>([]);
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  const [userSearch, setUserSearch] = useState("");
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
      const [cd, jd, ad, ud] = await Promise.all([
        apiCall("GET", "/admin/clubs"),
        apiCall("GET", "/admin/jobs"),
        apiCall("GET", "/ambassador/applications"),
        apiCall("GET", "/admin/users"),
      ]);
      setClubs(cd.clubs || []);
      setJobs(jd.jobs || []);
      setAmbassadors(ad.applications || []);
      setAppUsers(ud.users || []);
    } catch { /* ignore on load */ }
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

  const handleSeedUniversityClubs = async () => {
    if (!confirm("This will seed all university-specific clubs into the database (safe to run multiple times). Continue?")) return;
    setBusy(true);
    try {
      const data = await apiCall("POST", "/admin/seed-university-clubs");
      flash(data.message || "Seeded!");
      loadData();
    } catch (err: unknown) {
      flash(err instanceof Error ? err.message : "Seed failed", true);
    } finally { setBusy(false); }
  };

  const handleTransferClubs = async () => {
    if (!confirm("Transfer ownership of ALL clubs & communities from the ICOM system account to YOUR account? This makes you the creator who can manage join requests. Continue?")) return;
    setBusy(true);
    try {
      const data = await apiCall("POST", "/admin/transfer-clubs-to-me");
      flash(data.message || "Ownership transferred!");
      loadData();
    } catch (err: unknown) {
      flash(err instanceof Error ? err.message : "Transfer failed", true);
    } finally { setBusy(false); }
  };

  const handleSeedCommunities = async () => {
    if (!confirm("This will seed all international communities (Uzbek, Chinese, Vietnamese, etc.) into the database (safe to run multiple times). Continue?")) return;
    setBusy(true);
    try {
      const data = await apiCall("POST", "/admin/seed-communities");
      flash(data.message || "Communities seeded!");
      loadData();
    } catch (err: unknown) {
      flash(err instanceof Error ? err.message : "Seed failed", true);
    } finally { setBusy(false); }
  };

  if (authLoading || !user) return null;

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/50 transition-colors";
  const labelCls = "text-xs font-medium text-muted-foreground mb-1.5 block";

  const pendingAmbassadors = ambassadors.filter(a => a.status === "pending").length;

  const tabs = [
    { id: "clubs" as const,       Icon: Users,     label: "Clubs" },
    { id: "jobs"  as const,       Icon: Briefcase, label: "Jobs" },
    { id: "ambassadors" as const, Icon: Star,      label: pendingAmbassadors ? `Ambassadors (${pendingAmbassadors})` : "Ambassadors" },
    { id: "users" as const,       Icon: Users,     label: `Users (${appUsers.length})` },
  ];

  const filteredUsers = appUsers.filter(u =>
    !userSearch ||
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="w-full max-w-3xl">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <div className="h-10 w-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
            <ShieldCheck size={20} className="text-amber-400" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-xs text-muted-foreground">Manage clubs, jobs and users for JBNU</p>
          </div>
        </div>

        {/* ── Alerts ── */}
        {error && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            <AlertCircle size={14} className="shrink-0" /> {error}
          </div>
        )}
        {success && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400">
            {success}
          </div>
        )}

        {/* ── Tabs — scrollable on mobile ── */}
        <div className="flex overflow-x-auto gap-1 p-1 rounded-xl bg-white/5 border border-white/8 mb-6 scrollbar-hide">
          {tabs.map(({ id, Icon, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
                tab === id ? "bg-indigo-500/20 text-indigo-400" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {/* ══════════════════ CLUBS TAB ══════════════════ */}
        {tab === "clubs" && (
          <div className="space-y-6">
            <form onSubmit={handleAddClub} className="p-4 sm:p-6 rounded-2xl border border-white/8 bg-white/3 space-y-4">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Plus size={15} className="text-indigo-400" /> Add Club / Community
              </h2>

              {/* Club Name — full width */}
              <div>
                <label className={labelCls}>Club Name *</label>
                <input
                  required
                  value={clubForm.name}
                  onChange={e => setClubForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. JBNU Badminton Club"
                  className={inputCls}
                />
              </div>

              {/* Category + University */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Category</label>
                  <select
                    value={clubForm.category}
                    onChange={e => setClubForm(p => ({ ...p, category: e.target.value }))}
                    className={inputCls}
                  >
                    {CLUB_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>University</label>
                  <input
                    value={clubForm.university}
                    onChange={e => setClubForm(p => ({ ...p, university: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className={labelCls}>Description</label>
                <textarea
                  value={clubForm.description}
                  onChange={e => setClubForm(p => ({ ...p, description: e.target.value }))}
                  rows={3}
                  placeholder="What does this club do?"
                  className={inputCls}
                />
              </div>

              {/* Meeting Time + Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Meeting Time</label>
                  <input
                    value={clubForm.meeting_time}
                    onChange={e => setClubForm(p => ({ ...p, meeting_time: e.target.value }))}
                    placeholder="e.g. Every Wed 6pm"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Location</label>
                  <input
                    value={clubForm.location}
                    onChange={e => setClubForm(p => ({ ...p, location: e.target.value }))}
                    placeholder="e.g. Student Union B203"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Contact */}
              <div>
                <label className={labelCls}>Contact (KakaoTalk ID / Email)</label>
                <input
                  value={clubForm.contact}
                  onChange={e => setClubForm(p => ({ ...p, contact: e.target.value }))}
                  placeholder="e.g. kakao: jbnu_badminton"
                  className={inputCls}
                />
              </div>

              <Button type="submit" disabled={busy} className="w-full gap-2">
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Add Club
              </Button>
            </form>

            {/* Seed international communities */}
            <div className="p-4 rounded-2xl border border-violet-500/15 bg-violet-500/5 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Globe size={15} className="text-violet-400" /> Seed International Communities
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Add all nationality communities (Uzbek, Chinese, Vietnamese, Arab, Russian, etc.) to the database. Safe to run multiple times.
                </p>
              </div>
              <button
                onClick={handleSeedCommunities}
                disabled={busy}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500 text-white text-xs font-semibold hover:bg-violet-600 transition-colors disabled:opacity-50 shrink-0"
              >
                {busy ? <Loader2 size={13} className="animate-spin" /> : <Globe size={13} />}
                Run Seed
              </button>
            </div>

            {/* Seed university clubs */}
            <div className="p-4 rounded-2xl border border-indigo-500/15 bg-indigo-500/5 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <GraduationCap size={15} className="text-indigo-400" /> Seed University Clubs
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Add all real university-specific clubs (JBNU, SNU, Yonsei, etc.) to the database. Safe to run multiple times.
                </p>
              </div>
              <button
                onClick={handleSeedUniversityClubs}
                disabled={busy}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500 text-white text-xs font-semibold hover:bg-indigo-600 transition-colors disabled:opacity-50 shrink-0"
              >
                {busy ? <Loader2 size={13} className="animate-spin" /> : <GraduationCap size={13} />}
                Run Seed
              </button>
            </div>

            {/* Transfer club ownership */}
            <div className="p-4 rounded-2xl border border-amber-500/15 bg-amber-500/5 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <ShieldCheck size={15} className="text-amber-400" /> Take Ownership of All Clubs
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Transfer all clubs &amp; communities from the ICOM system account to your account. You&apos;ll become the creator and can manage join requests.
                </p>
              </div>
              <button
                onClick={handleTransferClubs}
                disabled={busy}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50 shrink-0"
              >
                {busy ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
                Transfer
              </button>
            </div>

            {/* Existing clubs list */}
            {clubs.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">
                  Active Clubs ({clubs.length})
                </h2>
                {clubs.map(club => (
                  <div key={club.id} className="flex items-center justify-between gap-3 p-4 rounded-xl border border-white/8 bg-white/3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{club.name}</p>
                      <p className="text-xs text-muted-foreground">{club.category} · {club.university}</p>
                    </div>
                    <button
                      onClick={() => deleteClub(club.id)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/8 transition-all shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════ JOBS TAB ══════════════════ */}
        {tab === "jobs" && (
          <div className="space-y-6">
            <form onSubmit={handleAddJob} className="p-4 sm:p-6 rounded-2xl border border-white/8 bg-white/3 space-y-4">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Plus size={15} className="text-indigo-400" /> Post a Job / Opportunity
              </h2>

              {/* Title + Company */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Job Title *</label>
                  <input
                    required
                    value={jobForm.title}
                    onChange={e => setJobForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. English Tutor"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Company / Organization *</label>
                  <input
                    required
                    value={jobForm.company}
                    onChange={e => setJobForm(p => ({ ...p, company: e.target.value }))}
                    placeholder="e.g. JBNU Language Center"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Type + Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Type</label>
                  <select
                    value={jobForm.type}
                    onChange={e => setJobForm(p => ({ ...p, type: e.target.value }))}
                    className={inputCls}
                  >
                    {JOB_TYPES.map(t => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Location</label>
                  <input
                    value={jobForm.location}
                    onChange={e => setJobForm(p => ({ ...p, location: e.target.value }))}
                    placeholder="e.g. Jeonju / Online"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Salary + Deadline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Salary / Pay</label>
                  <input
                    value={jobForm.salary}
                    onChange={e => setJobForm(p => ({ ...p, salary: e.target.value }))}
                    placeholder="e.g. 12,000₩/hr"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Application Deadline</label>
                  <input
                    value={jobForm.deadline}
                    onChange={e => setJobForm(p => ({ ...p, deadline: e.target.value }))}
                    placeholder="e.g. Jun 30"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className={labelCls}>Description</label>
                <textarea
                  value={jobForm.description}
                  onChange={e => setJobForm(p => ({ ...p, description: e.target.value }))}
                  rows={3}
                  placeholder="Describe the role..."
                  className={inputCls}
                />
              </div>

              {/* Requirements */}
              <div>
                <label className={labelCls}>Requirements (one per line)</label>
                <textarea
                  value={jobForm.requirements}
                  onChange={e => setJobForm(p => ({ ...p, requirements: e.target.value }))}
                  rows={3}
                  placeholder={"University enrollment\nBasic Korean"}
                  className={inputCls}
                />
              </div>

              {/* Visa + Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Visa Types (comma separated)</label>
                  <input
                    value={jobForm.visa_compatible}
                    onChange={e => setJobForm(p => ({ ...p, visa_compatible: e.target.value }))}
                    placeholder="D-2, D-4"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Tags (comma separated)</label>
                  <input
                    value={jobForm.tags}
                    onChange={e => setJobForm(p => ({ ...p, tags: e.target.value }))}
                    placeholder="Teaching, Flexible, JBNU"
                    className={inputCls}
                  />
                </div>
              </div>

              <Button type="submit" disabled={busy} className="w-full gap-2">
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Post Job
              </Button>
            </form>

            {/* Existing jobs list */}
            {jobs.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">
                  Active Jobs ({jobs.length})
                </h2>
                {jobs.map(job => (
                  <div key={job.id} className="flex items-center justify-between gap-3 p-4 rounded-xl border border-white/8 bg-white/3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{job.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {job.company} · {job.type}{job.salary ? ` · ${job.salary}` : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteJob(job.id)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/8 transition-all shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════ USERS TAB ══════════════════ */}
        {tab === "users" && (
          <div className="space-y-4">
            {/* Summary + Search — stacks on mobile */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-indigo-400 shrink-0" />
                <span className="text-sm font-semibold text-foreground">
                  {appUsers.length} registered user{appUsers.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="relative w-full sm:w-64">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  placeholder="Search by name or email…"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/50 transition-colors"
                />
              </div>
            </div>

            {/* User list */}
            <div className="space-y-2">
              {filteredUsers.map((u, i) => {
                const [bg, fg] = avatarColor(u.id);
                return (
                <div
                  key={u.id}
                  className="flex items-start gap-3 p-4 rounded-xl border border-white/8 bg-white/3 hover:bg-white/5 transition-colors"
                >
                  {/* Coloured initial avatar */}
                  <div className={`w-9 h-9 rounded-full ${bg} ${fg} flex items-center justify-center text-sm font-bold shrink-0 mt-0.5 select-none`}>
                    {initials(u.name)}
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="text-sm font-semibold text-foreground">{u.name}</p>
                      {u.role === "admin" && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 font-bold">
                          admin
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mb-1">{u.email}</p>

                    {/* Meta — visible on all sizes, wraps naturally */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground/70">
                      {u.university && (
                        <span className="flex items-center gap-1">
                          <GraduationCap size={10} /> {u.university}
                        </span>
                      )}
                      {u.country && (
                        <span className="flex items-center gap-1">
                          <Globe size={10} /> {u.country}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar size={10} />
                        {new Date(u.created_at).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                );
              })}

              {filteredUsers.length === 0 && userSearch && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No users match &ldquo;{userSearch}&rdquo;.
                </p>
              )}
              {appUsers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No users registered yet.</p>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════ AMBASSADORS TAB ══════════════════ */}
        {tab === "ambassadors" && (
          <div className="space-y-3">
            {ambassadors.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No applications yet.</p>
            )}
            {ambassadors.map(app => (
              <div
                key={app.id}
                className={`p-4 sm:p-5 rounded-2xl border ${
                  app.status === "approved"
                    ? "border-emerald-500/20 bg-emerald-500/5"
                    : app.status === "rejected"
                    ? "border-red-500/10 bg-red-500/3 opacity-60"
                    : "border-white/8 bg-white/3"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-bold text-foreground">{app.name}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                        app.status === "approved"
                          ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                          : app.status === "rejected"
                          ? "text-red-400 border-red-500/20"
                          : "text-amber-400 border-amber-500/20 bg-amber-500/10"
                      }`}>
                        {app.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {app.email} · {app.university}
                      {app.department ? ` · ${app.department}` : ""}
                      {app.year ? ` · ${app.year}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {app.country}
                      {app.visa_type ? ` · ${app.visa_type}` : ""}
                      {app.social ? ` · ${app.social}` : ""}
                    </p>
                    {app.motivation && (
                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-3 italic">
                        &ldquo;{app.motivation}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Accept / Reject — full width on mobile */}
                  {app.status === "pending" && (
                    <div className="flex gap-2 sm:flex-col sm:gap-1.5 shrink-0">
                      <button
                        onClick={async () => {
                          await apiCall("PATCH", `/ambassador/applications/${app.id}`, { status: "approved" });
                          loadData();
                        }}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-medium hover:bg-emerald-500/25 transition-colors"
                      >
                        <CheckCircle2 size={12} /> Accept
                      </button>
                      <button
                        onClick={async () => {
                          await apiCall("PATCH", `/ambassador/applications/${app.id}`, { status: "rejected" });
                          loadData();
                        }}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors"
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
