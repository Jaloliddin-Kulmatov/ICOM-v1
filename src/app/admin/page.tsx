"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { useAuth } from "@/lib/auth";
import {
  ShieldCheck, Plus, Trash2, Briefcase, Users, Loader2,
  AlertCircle, Star, CheckCircle2, XCircle, GraduationCap,
  Globe, Calendar, Search, Pencil, X, MessageSquarePlus, Mail,
  Download, RefreshCw, CalendarOff, MapPin,
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
  description: string; contact: string; kakao_link: string;
  meeting_time: string; location: string; website: string;
  club_type: string; country: string; cover_image: string;
}

interface Job {
  id: number; title: string; company: string; location: string;
  type: string; salary: string; deadline: string;
  description: string; requirements: string[]; visa_compatible: string[];
  tags: string[]; apply_link: string;
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

interface FeedbackItem {
  id: number; user_id: number | null; name: string; email: string;
  rating: number | null; message: string; page_url: string; created_at: string;
}

const CLUB_CATEGORIES = ["academic", "sports", "culture", "social", "language", "tech", "arts", "volunteer"];
const JOB_TYPES = ["part-time", "internship", "research", "full-time", "volunteer"];

const AVATAR_COLORS = [
  ["bg-indigo-500", "text-white"], ["bg-violet-500", "text-white"],
  ["bg-emerald-500", "text-white"], ["bg-cyan-500", "text-white"],
  ["bg-rose-500", "text-white"], ["bg-amber-500", "text-white"],
  ["bg-sky-500", "text-white"], ["bg-fuchsia-500", "text-white"],
  ["bg-teal-500", "text-white"], ["bg-orange-500", "text-white"],
  ["bg-lime-500", "text-gray-900"], ["bg-pink-500", "text-white"],
];

function avatarColor(id: number) { return AVATAR_COLORS[id % AVATAR_COLORS.length]; }
function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"clubs" | "communities" | "jobs" | "ambassadors" | "users" | "feedback">("clubs");
  const [clubs, setClubs] = useState<Club[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [ambassadors, setAmbassadors] = useState<AmbassadorApp[]>([]);
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Persistent scrape status panel — sticks around until the next click, so
  // the admin doesn't miss a result that fades away in 3 seconds.
  type ScrapeStatus =
    | { kind: "idle" }
    | { kind: "running"; startedAt: number }
    | { kind: "done"; newCount: number; finishedAt: number }
    | { kind: "error"; message: string };
  const [scrapeStatus, setScrapeStatus] = useState<ScrapeStatus>({ kind: "idle" });

  // ── Add Job form ───────────────────────────────────────────────
  const [jobForm, setJobForm] = useState({
    title: "", company: "", location: "", type: "part-time",
    salary: "", description: "", requirements: "",
    visa_compatible: "D-2, D-4", deadline: "", tags: "",
  });

  // ── Edit states ────────────────────────────────────────────────
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [editClubForm, setEditClubForm] = useState({
    name: "", category: "", university: "", description: "",
    contact: "", kakao_link: "", meeting_time: "", location: "",
    website: "", club_type: "club", country: "", cover_image: "",
  });
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [editJobForm, setEditJobForm] = useState({
    title: "", company: "", location: "", type: "part-time",
    salary: "", description: "", requirements: "", visa_compatible: "",
    deadline: "", tags: "", apply_link: "",
  });
  const [editBusy, setEditBusy] = useState(false);

  const loadData = useCallback(async () => {
    const [cd, jd, ad, ud, fd] = await Promise.allSettled([
      apiCall("GET", "/admin/clubs"),
      apiCall("GET", "/admin/jobs"),
      apiCall("GET", "/ambassador/applications"),
      apiCall("GET", "/admin/users"),
      apiCall("GET", "/feedback"),
    ]);
    if (cd.status === "fulfilled") setClubs(cd.value.clubs || []);
    if (jd.status === "fulfilled") setJobs(jd.value.jobs || []);
    if (ad.status === "fulfilled") setAmbassadors(ad.value.applications || []);
    if (ud.status === "fulfilled") setAppUsers(ud.value.users || []);
    if (fd.status === "fulfilled") setFeedback(fd.value.feedback || []);

    // Surface the first error so we can see why data isn't loading
    const firstErr = [cd, jd, ad, ud, fd].find(r => r.status === "rejected") as PromiseRejectedResult | undefined;
    if (firstErr) flash(firstErr.reason?.message || "Some data failed to load", true);
  }, []);

  const deleteFeedback = async (id: number) => {
    if (!confirm("Delete this feedback?")) return;
    try {
      await apiCall("DELETE", `/feedback/${id}`);
      setFeedback(prev => prev.filter(f => f.id !== id));
      flash("Feedback deleted.");
    } catch (err: unknown) {
      flash(err instanceof Error ? err.message : "Failed to delete", true);
    }
  };

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

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      await apiCall("POST", "/admin/jobs", jobForm);
      flash("Job posted!");
      setJobForm({ title: "", company: "", location: "", type: "part-time", salary: "", description: "", requirements: "", visa_compatible: "D-2, D-4", deadline: "", tags: "" });
      loadData();
    } catch (err: unknown) { flash(err instanceof Error ? err.message : "Failed", true); }
    finally { setBusy(false); }
  };

  // Fires the Wanted scraper on the backend. The endpoint returns 202
  // immediately while the work happens in a background thread, so we:
  //   1. Snapshot the current job count
  //   2. Poll /admin/jobs every 3s for up to ~30s
  //   3. Stop when the count jumps (success) or timeout hits (no new postings)
  // The scrapeStatus panel stays visible the whole time so the admin sees
  // progress instead of a 3-second toast.
  const handleScrapeNow = async () => {
    if (scraping) return;
    setScraping(true);
    setScrapeStatus({ kind: "running", startedAt: Date.now() });

    try {
      await apiCall("POST", "/admin/jobs/scrape-now");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not start scraper";
      setScrapeStatus({ kind: "error", message: msg });
      setScraping(false);
      return;
    }

    // Default scrape pulls up to 40 listings with a 0.3s delay between detail
    // fetches → ~30-60s typical, longer on cold start. 30 polls * 3s = 90s.
    // We poll the server's own scrape-status board, which reports the exact
    // inserted + reactivated count — no guessing from job totals.
    const maxPolls = 30;
    let polls = 0;

    const poll = async () => {
      polls += 1;
      try {
        const st = await apiCall("GET", "/admin/jobs/scrape-status");
        if (st.state === "done") {
          const added = typeof st.added === "number" ? st.added : 0;
          setScrapeStatus({ kind: "done", newCount: added, finishedAt: Date.now() });
          setScraping(false);
          // Refresh the table so the new rows show.
          try { const f = await apiCall("GET", "/admin/jobs"); setJobs(f.jobs || []); } catch {}
          return;
        }
        if (st.state === "error") {
          setScrapeStatus({ kind: "error", message: st.error || "Scraper failed." });
          setScraping(false);
          return;
        }
      } catch { /* keep polling */ }

      if (polls >= maxPolls) {
        setScrapeStatus({ kind: "done", newCount: 0, finishedAt: Date.now() });
        setScraping(false);
        return;
      }
      setTimeout(poll, 3000);
    };

    setTimeout(poll, 3000);  // first poll after 3s — give the scraper a head start
  };

  // Reset & re-scrape: deactivate every current job, then kick off a fresh
  // scrape so any still-live Korean postings get reinserted with full English
  // translations and real deadlines. Same polling UX as scrape-now, but the
  // status panel reports the "deactivated" count too.
  const handleResetJobs = async () => {
    if (resetting || scraping) return;
    if (!confirm(
      "This will hide every current internship and re-pull them from Wanted.co.kr " +
      "with English translations. Continue?"
    )) return;
    setResetting(true);
    setScrapeStatus({ kind: "running", startedAt: Date.now() });

    try {
      await apiCall("POST", "/admin/jobs/reset");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not reset internships";
      setScrapeStatus({ kind: "error", message: msg });
      setResetting(false);
      return;
    }

    // Poll the server's scrape-status board for the exact count of postings
    // brought back (inserted + reactivated), or 90s elapses.
    const maxPolls = 30;
    let polls = 0;

    const poll = async () => {
      polls += 1;
      try {
        const st = await apiCall("GET", "/admin/jobs/scrape-status");
        if (st.state === "done") {
          const added = typeof st.added === "number" ? st.added : 0;
          setScrapeStatus({ kind: "done", newCount: added, finishedAt: Date.now() });
          setResetting(false);
          try { const f = await apiCall("GET", "/admin/jobs"); setJobs(f.jobs || []); } catch {}
          return;
        }
        if (st.state === "error") {
          setScrapeStatus({ kind: "error", message: st.error || "Re-scrape failed." });
          setResetting(false);
          return;
        }
      } catch { /* keep polling */ }

      if (polls >= maxPolls) {
        setScrapeStatus({ kind: "done", newCount: 0, finishedAt: Date.now() });
        setResetting(false);
        return;
      }
      setTimeout(poll, 3000);
    };

    setTimeout(poll, 3000);
  };

  // Strip the fake "today+60" deadlines that the older scraper set when
  // Wanted didn't return a real date. Affected rows become rolling so the
  // detail page reads "Apply anytime" instead of a misleading date.
  const [fixingDeadlines, setFixingDeadlines] = useState(false);
  const [seedingJeonju, setSeedingJeonju] = useState(false);
  const [seedingIcomClubs, setSeedingIcomClubs] = useState(false);
  const handleFixDeadlines = async () => {
    if (fixingDeadlines) return;
    setFixingDeadlines(true);
    try {
      const data = await apiCall("POST", "/admin/jobs/fix-deadlines");
      flash(data.message || `Cleared ${data.cleared || 0} fake deadlines.`);
      loadData();
    } catch (err: unknown) {
      flash(err instanceof Error ? err.message : "Could not fix deadlines.", true);
    } finally {
      setFixingDeadlines(false);
    }
  };

  const handleSeedIcomClubs = async () => {
    if (seedingIcomClubs) return;
    setSeedingIcomClubs(true);
    try {
      const data = await apiCall("POST", "/admin/seed-icom-clubs");
      flash(data.message || "Done.");
      loadData();
    } catch (err: unknown) {
      flash(err instanceof Error ? err.message : "Could not create clubs.", true);
    } finally {
      setSeedingIcomClubs(false);
    }
  };

  const handleSeedJeonju = async () => {
    if (seedingJeonju) return;
    setSeedingJeonju(true);
    try {
      const data = await apiCall("POST", "/admin/seed-jeonju-jobs");
      flash(data.message || `Inserted ${data.inserted || 0} Jeonju jobs.`);
      loadData();
    } catch (err: unknown) {
      flash(err instanceof Error ? err.message : "Could not seed Jeonju jobs.", true);
    } finally {
      setSeedingJeonju(false);
    }
  };

  const deleteClub = async (id: number) => {
    if (!confirm("Remove this entry?")) return;
    try { await apiCall("DELETE", `/admin/clubs/${id}`); loadData(); } catch { /**/ }
  };

  const deleteJob = async (id: number) => {
    if (!confirm("Remove this job?")) return;
    try { await apiCall("DELETE", `/admin/jobs/${id}`); loadData(); } catch { /**/ }
  };

  const openEditClub = (club: Club) => {
    setEditingClub(club);
    setEditClubForm({
      name: club.name, category: club.category, university: club.university,
      description: club.description || "", contact: club.contact || "",
      kakao_link: club.kakao_link || "", meeting_time: club.meeting_time || "",
      location: club.location || "", website: club.website || "",
      club_type: club.club_type || "club", country: club.country || "",
      cover_image: club.cover_image || "",
    });
  };

  const handleSaveClub = async () => {
    if (!editingClub) return;
    setEditBusy(true);
    try {
      await apiCall("PATCH", `/admin/clubs/${editingClub.id}`, editClubForm);
      flash("Saved!"); setEditingClub(null); loadData();
    } catch (err: unknown) { flash(err instanceof Error ? err.message : "Save failed", true); }
    finally { setEditBusy(false); }
  };

  const openEditJob = (job: Job) => {
    setEditingJob(job);
    setEditJobForm({
      title: job.title, company: job.company, location: job.location || "",
      type: job.type || "part-time", salary: job.salary || "",
      description: job.description || "",
      requirements: Array.isArray(job.requirements) ? job.requirements.join("\n") : (job.requirements || ""),
      visa_compatible: Array.isArray(job.visa_compatible) ? job.visa_compatible.join(", ") : (job.visa_compatible || ""),
      deadline: job.deadline || "",
      tags: Array.isArray(job.tags) ? job.tags.join(", ") : (job.tags || ""),
      apply_link: job.apply_link || "",
    });
  };

  const handleSaveJob = async () => {
    if (!editingJob) return;
    setEditBusy(true);
    try {
      await apiCall("PATCH", `/admin/jobs/${editingJob.id}`, editJobForm);
      flash("Saved!"); setEditingJob(null); loadData();
    } catch (err: unknown) { flash(err instanceof Error ? err.message : "Save failed", true); }
    finally { setEditBusy(false); }
  };

  const deleteAmbassador = async (id: number) => {
    if (!confirm("Permanently delete this ambassador application?")) return;
    try { await apiCall("DELETE", `/ambassador/applications/${id}`); flash("Application deleted."); loadData(); }
    catch (err: unknown) { flash(err instanceof Error ? err.message : "Delete failed", true); }
  };

  if (authLoading || !user) return null;

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/50 transition-colors";
  const labelCls = "text-xs font-medium text-muted-foreground mb-1.5 block";
  // Modal inputs need explicit white text since the modal has a forced dark background
  const mInputCls = "w-full bg-white/8 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white [color-scheme:dark] placeholder:text-white/30 focus:outline-none focus:border-indigo-500/60 transition-colors";

  const pendingAmbassadors = ambassadors.filter(a => a.status === "pending").length;
  const clubsOnly = clubs.filter(c => c.club_type === "club");
  const communitiesOnly = clubs.filter(c => c.club_type === "community");

  const tabs = [
    { id: "clubs"       as const, Icon: GraduationCap,   label: `Clubs (${clubsOnly.length})` },
    { id: "communities" as const, Icon: Globe,           label: `Communities (${communitiesOnly.length})` },
    { id: "jobs"        as const, Icon: Briefcase,       label: `Internships (${jobs.length})` },
    { id: "ambassadors" as const, Icon: Star,            label: pendingAmbassadors ? `Ambassadors (${pendingAmbassadors})` : "Ambassadors" },
    { id: "users"       as const, Icon: Users,           label: `Users (${appUsers.length})` },
    { id: "feedback"    as const, Icon: MessageSquarePlus, label: `Feedback (${feedback.length})` },
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
            <p className="text-xs text-muted-foreground">Manage clubs, communities, internships and users</p>
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

        {/* ── Tabs ── */}
        <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-white/5 border border-white/8 mb-6">
          {tabs.map(({ id, Icon, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                tab === id ? "bg-indigo-500/20 text-indigo-400" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {/* ══════════════════ CLUBS TAB ══════════════════ */}
        {tab === "clubs" && (
          <div className="space-y-4">
            {/* Seed ICOM Travel & Hiking */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-violet-500/20 bg-violet-500/5">
              <div>
                <p className="text-sm font-semibold text-foreground">ICOM Travel &amp; ICOM Hiking</p>
                <p className="text-xs text-muted-foreground">Create these two communities owned by you (safe to run once).</p>
              </div>
              <Button
                size="sm"
                onClick={handleSeedIcomClubs}
                disabled={seedingIcomClubs}
                className="gap-1.5 bg-violet-500 hover:bg-violet-600 text-white shrink-0"
              >
                {seedingIcomClubs ? <><Loader2 size={13} className="animate-spin" /> Creating…</> : <><Plus size={13} /> Create Clubs</>}
              </Button>
            </div>

          <div className="space-y-2">
            {clubsOnly.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <GraduationCap size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No university clubs yet.</p>
                <p className="text-xs mt-1 opacity-60">Clubs added from the Community page will appear here.</p>
              </div>
            ) : (
              <>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1 mb-3">
                  University Clubs ({clubsOnly.length})
                </p>
                {clubsOnly.map(club => (
                  <div key={club.id} className="flex items-center justify-between gap-3 p-4 rounded-xl border border-white/8 bg-white/3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">{club.name}</p>
                      <p className="text-xs text-muted-foreground">{club.category} · {club.university}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => openEditClub(club)} className="p-2 rounded-lg text-muted-foreground hover:text-indigo-400 hover:bg-indigo-500/10 transition-all" title="Edit">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => deleteClub(club.id)} className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/8 transition-all" title="Delete">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
          </div>
        )}

        {/* ══════════════════ COMMUNITIES TAB ══════════════════ */}
        {tab === "communities" && (
          <div className="space-y-2">
            {communitiesOnly.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Globe size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No communities yet.</p>
                <p className="text-xs mt-1 opacity-60">Communities added from the Community page will appear here.</p>
              </div>
            ) : (
              <>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1 mb-3">
                  International Communities ({communitiesOnly.length})
                </p>
                {communitiesOnly.map(club => (
                  <div key={club.id} className="flex items-center justify-between gap-3 p-4 rounded-xl border border-white/8 bg-white/3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">{club.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {club.country ? `${club.country} · ` : ""}{club.university}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => openEditClub(club)} className="p-2 rounded-lg text-muted-foreground hover:text-indigo-400 hover:bg-indigo-500/10 transition-all" title="Edit">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => deleteClub(club.id)} className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/8 transition-all" title="Delete">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ══════════════════ JOBS TAB ══════════════════ */}
        {tab === "jobs" && (
          <div className="space-y-6">
            {/* ── Auto-scrape internships from Wanted.co.kr ── */}
            <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 overflow-hidden">
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <Download size={18} className="text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Fetch from Wanted.co.kr</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Pulls the latest Korean internships and inserts up to 40 new postings.
                    Runs automatically twice a day; tap below to trigger it manually.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  <Button
                    type="button"
                    onClick={handleScrapeNow}
                    disabled={scraping || resetting}
                    className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    {scraping ? (
                      <><Loader2 size={14} className="animate-spin" /> Scraping…</>
                    ) : (
                      <><Download size={14} /> Scrape now</>
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleResetJobs}
                    disabled={scraping || resetting}
                    variant="outline"
                    className="gap-2 border-amber-500/40 text-amber-500 hover:bg-amber-500/10"
                    title="Hide all current internships, then re-scrape with English translations"
                  >
                    {resetting ? (
                      <><Loader2 size={14} className="animate-spin" /> Resetting…</>
                    ) : (
                      <><RefreshCw size={14} /> Reset & re-scrape</>
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleFixDeadlines}
                    disabled={scraping || resetting || fixingDeadlines}
                    variant="outline"
                    className="gap-2 border-sky-500/40 text-sky-500 hover:bg-sky-500/10"
                    title="Clear fake 'today + 60 days' deadlines so they show as Rolling instead"
                  >
                    {fixingDeadlines ? (
                      <><Loader2 size={14} className="animate-spin" /> Fixing…</>
                    ) : (
                      <><CalendarOff size={14} /> Fix deadlines</>
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSeedJeonju}
                    disabled={seedingJeonju}
                    variant="outline"
                    className="gap-2 border-violet-500/40 text-violet-500 hover:bg-violet-500/10"
                    title="Insert 15 real Jeonju/Jeonbuk internship listings (safe to run multiple times)"
                  >
                    {seedingJeonju ? (
                      <><Loader2 size={14} className="animate-spin" /> Seeding…</>
                    ) : (
                      <><MapPin size={14} /> Seed Jeonju Jobs</>
                    )}
                  </Button>
                </div>
              </div>

              {/* ── Live status panel ─────────────────────────────── */}
              {scrapeStatus.kind === "running" && (
                <div className="border-t border-emerald-500/20 bg-emerald-500/8 px-5 py-3 flex items-center gap-3">
                  <Loader2 size={15} className="text-emerald-500 animate-spin shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-emerald-500">
                      Scraping Wanted.co.kr…
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Fetching listings · checking each for duplicates · inserting new
                      postings. This usually takes 10-30 seconds.
                    </p>
                  </div>
                </div>
              )}

              {scrapeStatus.kind === "done" && (
                <div className={`border-t px-5 py-3 flex items-center gap-3 ${
                  scrapeStatus.newCount > 0
                    ? "border-emerald-500/20 bg-emerald-500/8"
                    : "border-amber-500/20 bg-amber-500/8"
                }`}>
                  {scrapeStatus.newCount > 0 ? (
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle size={15} className="text-amber-500 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${
                      scrapeStatus.newCount > 0 ? "text-emerald-500" : "text-amber-500"
                    }`}>
                      {scrapeStatus.newCount > 0
                        ? `Added ${scrapeStatus.newCount} new internship${scrapeStatus.newCount > 1 ? "s" : ""} 🎉`
                        : "Already up to date — no new internships found"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {scrapeStatus.newCount > 0
                        ? "Scroll down to see the new postings in the table below."
                        : "Wanted.co.kr didn't have any internships we hadn't already saved."}
                    </p>
                  </div>
                  <button
                    onClick={() => setScrapeStatus({ kind: "idle" })}
                    className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    aria-label="Dismiss"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}

              {scrapeStatus.kind === "error" && (
                <div className="border-t border-red-500/20 bg-red-500/8 px-5 py-3 flex items-center gap-3">
                  <AlertCircle size={15} className="text-red-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-red-500">Scrape failed</p>
                    <p className="text-[11px] text-muted-foreground break-words">
                      {scrapeStatus.message}
                    </p>
                  </div>
                  <button
                    onClick={() => setScrapeStatus({ kind: "idle" })}
                    className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    aria-label="Dismiss"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleAddJob} className="p-4 sm:p-6 rounded-2xl border border-white/8 bg-white/3 space-y-4">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Plus size={15} className="text-indigo-400" /> Post a Job / Internship
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Job Title *</label>
                  <input required value={jobForm.title} onChange={e => setJobForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. English Tutor" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Company / Organization *</label>
                  <input required value={jobForm.company} onChange={e => setJobForm(p => ({ ...p, company: e.target.value }))} placeholder="e.g. JBNU Language Center" className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Salary / Pay</label>
                  <input value={jobForm.salary} onChange={e => setJobForm(p => ({ ...p, salary: e.target.value }))} placeholder="e.g. 12,000₩/hr" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Application Deadline</label>
                  <input value={jobForm.deadline} onChange={e => setJobForm(p => ({ ...p, deadline: e.target.value }))} placeholder="e.g. Jun 30" className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Description</label>
                <textarea value={jobForm.description} onChange={e => setJobForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Describe the role..." className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Requirements (one per line)</label>
                <textarea value={jobForm.requirements} onChange={e => setJobForm(p => ({ ...p, requirements: e.target.value }))} rows={3} placeholder={"University enrollment\nBasic Korean"} className={inputCls} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                Post Internship
              </Button>
            </form>

            {jobs.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">
                  Active Internships ({jobs.length})
                </p>
                {jobs.map(job => (
                  <div key={job.id} className="flex items-center justify-between gap-3 p-4 rounded-xl border border-white/8 bg-white/3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">{job.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {job.company} · {job.type}{job.salary ? ` · ${job.salary}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => openEditJob(job)} className="p-2 rounded-lg text-muted-foreground hover:text-indigo-400 hover:bg-indigo-500/10 transition-all" title="Edit">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => deleteJob(job.id)} className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/8 transition-all" title="Delete">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════ USERS TAB ══════════════════ */}
        {tab === "users" && (
          <div className="space-y-4">
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
                  value={userSearch} onChange={e => setUserSearch(e.target.value)}
                  placeholder="Search by name or email…"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/50 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              {filteredUsers.map((u) => {
                const [bg, fg] = avatarColor(u.id);
                return (
                  <div key={u.id} className="flex items-start gap-3 p-4 rounded-xl border border-white/8 bg-white/3 hover:bg-white/5 transition-colors">
                    <div className={`w-9 h-9 rounded-full ${bg} ${fg} flex items-center justify-center text-sm font-bold shrink-0 mt-0.5 select-none`}>
                      {initials(u.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="text-sm font-semibold text-foreground">{u.name}</p>
                        {u.role === "admin" && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 font-bold">admin</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mb-1">{u.email}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground/70">
                        {u.university && <span className="flex items-center gap-1"><GraduationCap size={10} /> {u.university}</span>}
                        {u.country && <span className="flex items-center gap-1"><Globe size={10} /> {u.country}</span>}
                        <span className="flex items-center gap-1">
                          <Calendar size={10} />
                          {new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredUsers.length === 0 && userSearch && (
                <p className="text-sm text-muted-foreground text-center py-8">No users match &ldquo;{userSearch}&rdquo;.</p>
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
                  app.status === "approved" ? "border-emerald-500/20 bg-emerald-500/5"
                    : app.status === "rejected" ? "border-red-500/10 bg-red-500/3 opacity-60"
                    : "border-white/8 bg-white/3"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-bold text-foreground">{app.name}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                        app.status === "approved" ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                          : app.status === "rejected" ? "text-red-400 border-red-500/20"
                          : "text-amber-400 border-amber-500/20 bg-amber-500/10"
                      }`}>{app.status}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {app.email} · {app.university}
                      {app.department ? ` · ${app.department}` : ""}{app.year ? ` · ${app.year}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {app.country}{app.visa_type ? ` · ${app.visa_type}` : ""}{app.social ? ` · ${app.social}` : ""}
                    </p>
                    {app.motivation && (
                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-3 italic">&ldquo;{app.motivation}&rdquo;</p>
                    )}
                  </div>
                  <div className="flex gap-2 sm:flex-col sm:gap-1.5 shrink-0">
                    {app.status === "pending" && (
                      <>
                        <button
                          onClick={async () => { await apiCall("PATCH", `/ambassador/applications/${app.id}`, { status: "approved" }); loadData(); }}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-medium hover:bg-emerald-500/25 transition-colors"
                        >
                          <CheckCircle2 size={12} /> Accept
                        </button>
                        <button
                          onClick={async () => { await apiCall("PATCH", `/ambassador/applications/${app.id}`, { status: "rejected" }); loadData(); }}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors"
                        >
                          <XCircle size={12} /> Reject
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => deleteAmbassador(app.id)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors"
                      title="Delete application"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══════════════════ FEEDBACK TAB ══════════════════ */}
        {tab === "feedback" && (
          <div className="space-y-3">
            {feedback.length === 0 && (
              <div className="text-center py-12">
                <MessageSquarePlus size={32} className="text-muted-foreground/25 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No feedback yet. When users submit feedback it will appear here.</p>
              </div>
            )}
            {feedback.map(f => (
              <div
                key={f.id}
                className="p-4 sm:p-5 rounded-2xl border border-border bg-card hover:border-emerald-500/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {(f.name || "?")[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground truncate">{f.name}</p>
                        {f.user_id === null && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-amber-500/30 text-amber-400 bg-amber-500/10 uppercase font-bold">
                            Anonymous
                          </span>
                        )}
                        {f.rating && (
                          <span className="flex items-center gap-0.5">
                            {[1,2,3,4,5].map(n => (
                              <Star
                                key={n}
                                size={11}
                                className={n <= (f.rating || 0) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}
                              />
                            ))}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground flex-wrap">
                        {f.email && (
                          <a href={`mailto:${f.email}`} className="flex items-center gap-1 hover:text-emerald-400 transition-colors">
                            <Mail size={9} /> {f.email}
                          </a>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar size={9} />
                          {new Date(f.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteFeedback(f.id)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                    title="Delete feedback"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap pl-12">
                  {f.message}
                </p>
                {f.page_url && (
                  <p className="text-[10px] text-muted-foreground mt-2 pl-12 truncate">
                    From: <a href={f.page_url} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">{f.page_url}</a>
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ══════════ EDIT CLUB / COMMUNITY MODAL ══════════ */}
      {editingClub && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm" onClick={() => setEditingClub(null)}>
          <div className="w-full max-w-lg bg-[#0e0e1a] border border-white/12 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Pencil size={14} className="text-indigo-400" />
                Edit {editingClub.club_type === "community" ? "Community" : "Club"}
              </h2>
              <button onClick={() => setEditingClub(null)} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/8"><X size={15} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-white/50 mb-1 block">Name *</label>
                  <input value={editClubForm.name} onChange={e => setEditClubForm(p => ({ ...p, name: e.target.value }))} className={mInputCls} />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-white/50 mb-1 block">University</label>
                  <input value={editClubForm.university} onChange={e => setEditClubForm(p => ({ ...p, university: e.target.value }))} className={mInputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-white/50 mb-1 block">Category</label>
                  <select value={editClubForm.category} onChange={e => setEditClubForm(p => ({ ...p, category: e.target.value }))} className={mInputCls}>
                    {CLUB_CATEGORIES.map(c => <option key={c} value={c} className="bg-[#1a1a2e] text-white">{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-white/50 mb-1 block">Type</label>
                  <select value={editClubForm.club_type} onChange={e => setEditClubForm(p => ({ ...p, club_type: e.target.value }))} className={mInputCls}>
                    <option value="club" className="bg-[#1a1a2e] text-white">Club (university)</option>
                    <option value="community" className="bg-[#1a1a2e] text-white">Community (nationality)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium text-white/50 mb-1 block">Description</label>
                <textarea rows={4} value={editClubForm.description} onChange={e => setEditClubForm(p => ({ ...p, description: e.target.value }))} className={mInputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-white/50 mb-1 block">Meeting Time</label>
                  <input value={editClubForm.meeting_time} onChange={e => setEditClubForm(p => ({ ...p, meeting_time: e.target.value }))} className={mInputCls} />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-white/50 mb-1 block">Location</label>
                  <input value={editClubForm.location} onChange={e => setEditClubForm(p => ({ ...p, location: e.target.value }))} className={mInputCls} />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium text-white/50 mb-1 block">Official Website URL</label>
                <input value={editClubForm.website} onChange={e => setEditClubForm(p => ({ ...p, website: e.target.value }))} placeholder="https://..." className={mInputCls} />
              </div>
              <div>
                <label className="text-[11px] font-medium text-white/50 mb-1 block">KakaoTalk Link</label>
                <input value={editClubForm.kakao_link} onChange={e => setEditClubForm(p => ({ ...p, kakao_link: e.target.value }))} placeholder="https://open.kakao.com/o/..." className={mInputCls} />
              </div>
              <div>
                <label className="text-[11px] font-medium text-white/50 mb-1 block">Contact</label>
                <input value={editClubForm.contact} onChange={e => setEditClubForm(p => ({ ...p, contact: e.target.value }))} placeholder="email | phone" className={mInputCls} />
              </div>
              <div>
                <label className="text-[11px] font-medium text-white/50 mb-1 block">Country (for communities)</label>
                <input value={editClubForm.country} onChange={e => setEditClubForm(p => ({ ...p, country: e.target.value }))} placeholder="e.g. Uzbekistan" className={mInputCls} />
              </div>
              <div>
                <label className="text-[11px] font-medium text-white/50 mb-1 block">Cover Photo URL <span className="text-white/25 font-normal">(optional)</span></label>
                <input value={editClubForm.cover_image} onChange={e => setEditClubForm(p => ({ ...p, cover_image: e.target.value }))} placeholder="https://... (leave blank for auto-generated)" className={mInputCls} />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setEditingClub(null)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-white/60 hover:bg-white/5 transition-colors">Cancel</button>
                <button onClick={handleSaveClub} disabled={editBusy} className="flex-1 py-2.5 rounded-xl bg-indigo-500 text-white text-xs font-semibold hover:bg-indigo-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {editBusy ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />} Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ EDIT JOB MODAL ══════════ */}
      {editingJob && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm" onClick={() => setEditingJob(null)}>
          <div className="w-full max-w-lg bg-[#0e0e1a] border border-white/12 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
              <h2 className="text-sm font-bold text-white flex items-center gap-2"><Pencil size={14} className="text-indigo-400" /> Edit Internship / Job</h2>
              <button onClick={() => setEditingJob(null)} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/8"><X size={15} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-white/50 mb-1 block">Job Title *</label>
                  <input value={editJobForm.title} onChange={e => setEditJobForm(p => ({ ...p, title: e.target.value }))} className={mInputCls} />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-white/50 mb-1 block">Company *</label>
                  <input value={editJobForm.company} onChange={e => setEditJobForm(p => ({ ...p, company: e.target.value }))} className={mInputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-white/50 mb-1 block">Type</label>
                  <select value={editJobForm.type} onChange={e => setEditJobForm(p => ({ ...p, type: e.target.value }))} className={mInputCls}>
                    {JOB_TYPES.map(t => <option key={t} value={t} className="bg-[#1a1a2e] text-white">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-white/50 mb-1 block">Location</label>
                  <input value={editJobForm.location} onChange={e => setEditJobForm(p => ({ ...p, location: e.target.value }))} className={mInputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-white/50 mb-1 block">Salary / Pay</label>
                  <input value={editJobForm.salary} onChange={e => setEditJobForm(p => ({ ...p, salary: e.target.value }))} placeholder="e.g. 12,000₩/hr" className={mInputCls} />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-white/50 mb-1 block">Deadline</label>
                  <input value={editJobForm.deadline} onChange={e => setEditJobForm(p => ({ ...p, deadline: e.target.value }))} placeholder="e.g. Jun 30" className={mInputCls} />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium text-white/50 mb-1 block">Description</label>
                <textarea rows={3} value={editJobForm.description} onChange={e => setEditJobForm(p => ({ ...p, description: e.target.value }))} className={mInputCls} />
              </div>
              <div>
                <label className="text-[11px] font-medium text-white/50 mb-1 block">Requirements (one per line)</label>
                <textarea rows={3} value={editJobForm.requirements} onChange={e => setEditJobForm(p => ({ ...p, requirements: e.target.value }))} className={mInputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-white/50 mb-1 block">Visa Types (comma-sep)</label>
                  <input value={editJobForm.visa_compatible} onChange={e => setEditJobForm(p => ({ ...p, visa_compatible: e.target.value }))} placeholder="D-2, D-4" className={mInputCls} />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-white/50 mb-1 block">Tags (comma-sep)</label>
                  <input value={editJobForm.tags} onChange={e => setEditJobForm(p => ({ ...p, tags: e.target.value }))} placeholder="Teaching, JBNU" className={mInputCls} />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium text-white/50 mb-1 block">Apply Link (URL)</label>
                <input value={editJobForm.apply_link} onChange={e => setEditJobForm(p => ({ ...p, apply_link: e.target.value }))} placeholder="https://..." className={mInputCls} />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setEditingJob(null)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-white/60 hover:bg-white/5 transition-colors">Cancel</button>
                <button onClick={handleSaveJob} disabled={editBusy} className="flex-1 py-2.5 rounded-xl bg-indigo-500 text-white text-xs font-semibold hover:bg-indigo-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {editBusy ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />} Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
