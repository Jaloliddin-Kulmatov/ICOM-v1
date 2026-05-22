"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Sparkles, ArrowRight, Calendar, CheckCircle2, Zap,
  AlertCircle, Bell, Users, Briefcase, BookOpen,
  GraduationCap, Globe, Pencil, X, Loader2, ExternalLink,
  Plus, LogOut,
} from "lucide-react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("icon_token") : null;
}
async function apiCall(method: string, path: string, body?: object) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

interface MyClub {
  id: number; name: string; description: string; category: string;
  university: string; club_type: string; country: string;
  meeting_time: string; location: string; contact: string;
  kakao_link: string; website: string; member_count: number;
}

const CLUB_CATEGORIES = ["academic", "sports", "culture", "social", "language", "tech", "arts", "volunteer"];

const typeColors = {
  urgent:     "text-red-400 bg-red-500/10 border-red-500/20",
  scholarship:"text-amber-400 bg-amber-500/10 border-amber-500/20",
  event:      "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  info:       "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
};
const typeIcons = {
  urgent: AlertCircle, scholarship: Zap, event: Calendar, info: Bell,
};

const announcements = [
  { id: "1", type: "urgent" as const, title: "Health Insurance Renewal (NHIS)", body: "NHIS enrollment renewal deadline for all D-2 visa holders. Visit nhis.or.kr or the JBNU International Office.", time: "Pinned", tag: "All Students" },
  { id: "2", type: "scholarship" as const, title: "Korean Government Scholarship (GKS)", body: "Applications for the Global Korea Scholarship are open. Visit the JBNU scholarship portal for details.", time: "Pinned", tag: "JBNU" },
  { id: "3", type: "event" as const, title: "Welcome to ICOM — JBNU Community", body: "This platform is built for JBNU international students. Browse clubs, find jobs, and connect with others.", time: "New", tag: "JBNU" },
];

const quickLinks = [
  { href: "/support",      icon: "🗺️", label: "Life Guide" },
  { href: "/support/visa", icon: "🛂", label: "Visa Info" },
  { href: "/community",    icon: "👥", label: "Community" },
  { href: "/jobs",         icon: "💼", label: "Jobs" },
  { href: "/universities", icon: "🎓", label: "University" },
  { href: "/dashboard/ai", icon: "✨", label: "AI Chat" },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // ── My clubs state ─────────────────────────────────────────
  const [createdClubs, setCreatedClubs] = useState<MyClub[]>([]);
  const [joinedClubs, setJoinedClubs] = useState<MyClub[]>([]);
  const [clubsLoading, setClubsLoading] = useState(true);
  const [editingClub, setEditingClub] = useState<MyClub | null>(null);
  const [editForm, setEditForm] = useState({
    name: "", description: "", category: "", meeting_time: "",
    location: "", contact: "", kakao_link: "", website: "", country: "",
  });
  const [editBusy, setEditBusy] = useState(false);
  const [editMsg, setEditMsg] = useState("");

  const loadMyClubs = useCallback(async () => {
    try {
      const data = await apiCall("GET", "/clubs/mine");
      setCreatedClubs(data.created || []);
      setJoinedClubs(data.joined || []);
    } catch { /* ignore */ }
    finally { setClubsLoading(false); }
  }, []);

  useEffect(() => { if (user) loadMyClubs(); }, [user, loadMyClubs]);

  const openEdit = (club: MyClub) => {
    setEditingClub(club);
    setEditForm({
      name: club.name, description: club.description || "",
      category: club.category || "social",
      meeting_time: club.meeting_time || "", location: club.location || "",
      contact: club.contact || "", kakao_link: club.kakao_link || "",
      website: club.website || "", country: club.country || "",
    });
    setEditMsg("");
  };

  const handleSave = async () => {
    if (!editingClub) return;
    setEditBusy(true);
    try {
      await apiCall("PATCH", `/clubs/${editingClub.id}`, editForm);
      setEditMsg("Saved!");
      loadMyClubs();
      setTimeout(() => { setEditingClub(null); setEditMsg(""); }, 800);
    } catch (err: unknown) {
      setEditMsg(err instanceof Error ? err.message : "Save failed");
    } finally { setEditBusy(false); }
  };

  const handleLeave = async (clubId: number) => {
    if (!confirm("Leave this club/community?")) return;
    try {
      await apiCall("POST", `/clubs/${clubId}/leave`);
      loadMyClubs();
    } catch { /* ignore */ }
  };

  // Split by type
  const myUniversityClubs  = createdClubs.filter(c => c.club_type === "club");
  const myCommunities      = [
    ...createdClubs.filter(c => c.club_type === "community"),
    ...joinedClubs.filter(c => c.club_type === "community"),
  ];
  const myJoinedClubs      = joinedClubs.filter(c => c.club_type === "club");

  const mInputCls = "w-full bg-white/8 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/60 transition-colors";

  return (
    <DashboardLayout>
      {/* Welcome header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">{greeting}, {firstName} 👋</h1>
          <p className="text-sm text-muted-foreground">Welcome to ICOM — your guide to life at JBNU and in Korea.</p>
        </div>
        <Button variant="glass" size="sm" asChild className="gap-1.5 hidden sm:flex">
          <Link href="/dashboard/ai"><Sparkles size={14} className="text-violet-400" /> Ask AI</Link>
        </Button>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { icon: Users,    label: "Community",    value: "Join",   href: "/community",    color: "text-indigo-400", bg: "bg-indigo-500/10" },
          { icon: Briefcase,label: "Jobs & Clubs", value: "Browse", href: "/jobs",         color: "text-violet-400", bg: "bg-violet-500/10" },
          { icon: Sparkles, label: "AI Assistant", value: "Chat",   href: "/dashboard/ai", color: "text-cyan-400",   bg: "bg-cyan-500/10" },
          { icon: BookOpen, label: "Visa Guides",  value: "Read",   href: "/support/visa", color: "text-emerald-400",bg: "bg-emerald-500/10" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.label} href={item.href}
              className="group p-5 rounded-2xl border border-white/8 bg-white/3 hover:border-white/15 hover:bg-white/5 transition-all duration-200 hover:-translate-y-0.5">
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${item.bg} mb-3`}>
                <Icon size={17} className={item.color} />
              </div>
              <div className="text-sm font-semibold text-foreground group-hover:text-indigo-300 transition-colors">{item.value} →</div>
              <div className="text-xs text-muted-foreground mt-0.5">{item.label}</div>
            </Link>
          );
        })}
      </div>

      {/* ── My Clubs & Communities ── */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">My Clubs &amp; Communities</h2>
          <Link href="/community" className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
            <Plus size={11} /> Browse more
          </Link>
        </div>

        {clubsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={18} className="animate-spin text-muted-foreground" />
          </div>
        ) : (createdClubs.length === 0 && joinedClubs.length === 0) ? (
          <div className="p-6 rounded-2xl border border-dashed border-white/10 text-center">
            <Users size={24} className="text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">You haven&apos;t joined any clubs or communities yet.</p>
            <Link href="/community" className="mt-2 inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
              Explore communities <ArrowRight size={10} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Created clubs */}
            {myUniversityClubs.map(club => (
              <ClubCard key={`c-${club.id}`} club={club} isOwner onEdit={() => openEdit(club)} />
            ))}
            {/* Joined clubs */}
            {myJoinedClubs.map(club => (
              <ClubCard key={`j-${club.id}`} club={club} isOwner={false} onLeave={() => handleLeave(club.id)} />
            ))}
            {/* Communities (created + joined) */}
            {myCommunities.map(club => {
              const isOwner = createdClubs.some(c => c.id === club.id);
              return (
                <ClubCard key={`cm-${club.id}`} club={club} isOwner={isOwner}
                  onEdit={isOwner ? () => openEdit(club) : undefined}
                  onLeave={!isOwner ? () => handleLeave(club.id) : undefined}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — announcements */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Announcements</h2>
          <div className="space-y-3">
            {announcements.map((a) => {
              const Icon = typeIcons[a.type];
              return (
                <div key={a.id} className={`flex gap-3 p-4 rounded-2xl border ${typeColors[a.type]} transition-all hover:opacity-90`}>
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-white/5"><Icon size={15} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-xs font-semibold text-foreground">{a.title}</h3>
                      <span className="text-[10px] text-muted-foreground shrink-0">{a.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{a.body}</p>
                    <span className="text-[10px] text-muted-foreground/60 mt-1 inline-block">{a.tag}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* AI banner */}
          <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/50 to-violet-950/50 p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shrink-0">
                <Sparkles size={18} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-foreground mb-0.5">Ask ICOM AI anything about Korea</p>
                <p className="text-xs text-muted-foreground">Visa questions, banking, housing, transportation — I know it all.</p>
              </div>
              <Button size="sm" asChild className="shrink-0">
                <Link href="/dashboard/ai">Chat Now</Link>
              </Button>
            </div>
          </div>

          {/* Profile info */}
          {user && (
            <div className="p-5 rounded-2xl border border-white/8 bg-white/3">
              <h2 className="text-sm font-semibold text-foreground mb-3">Your Profile</h2>
              <div className="grid grid-cols-2 gap-y-2 text-xs">
                <span className="text-muted-foreground">Name</span>
                <span className="text-foreground font-medium">{user.name}</span>
                <span className="text-muted-foreground">University</span>
                <span className="text-foreground font-medium">{user.university || "Not set"}</span>
                <span className="text-muted-foreground">Visa Type</span>
                <span className="text-foreground font-medium">{user.visa_type || "Not set"}</span>
                <span className="text-muted-foreground">Country</span>
                <span className="text-foreground font-medium">{user.country || "Not set"}</span>
              </div>
              <Link href="/dashboard/settings" className="mt-3 flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                Edit profile <ArrowRight size={10} />
              </Link>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl border border-white/8 bg-white/3">
            <h2 className="text-sm font-semibold text-foreground mb-3">Quick Access</h2>
            <div className="grid grid-cols-2 gap-2">
              {quickLinks.map((item) => (
                <Link key={item.href} href={item.href}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/3 border border-white/8 hover:border-white/15 hover:bg-white/6 transition-all text-center">
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-[10px] font-medium text-muted-foreground">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-indigo-500/20 bg-indigo-500/5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 size={14} className="text-indigo-400" />
              <h2 className="text-sm font-semibold text-foreground">JBNU Resources</h2>
            </div>
            <div className="space-y-2 text-xs">
              {[
                { label: "International Office", href: "https://international.jbnu.ac.kr" },
                { label: "Student Portal",       href: "https://portal.jbnu.ac.kr" },
                { label: "Library",              href: "https://library.jbnu.ac.kr" },
              ].map((r) => (
                <a key={r.label} href={r.href} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between text-muted-foreground hover:text-indigo-400 transition-colors">
                  <span>{r.label}</span><ArrowRight size={10} />
                </a>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={14} className="text-emerald-400" />
              <h2 className="text-sm font-semibold text-foreground">Visa &amp; Insurance</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Keep your visa and NHIS insurance up to date to avoid enrollment issues.</p>
            <Link href="/support/visa" className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
              View visa guide <ArrowRight size={10} />
            </Link>
          </div>
        </div>
      </div>

      {/* ══════════ EDIT CLUB MODAL ══════════ */}
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
              <div>
                <label className="text-[11px] font-medium text-white/50 mb-1 block">Name *</label>
                <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} className={mInputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-white/50 mb-1 block">Category</label>
                  <select value={editForm.category} onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))} className={mInputCls}>
                    {CLUB_CATEGORIES.map(c => <option key={c} value={c} className="bg-[#1a1a2e] text-white">{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                {editingClub.club_type === "community" && (
                  <div>
                    <label className="text-[11px] font-medium text-white/50 mb-1 block">Country</label>
                    <input value={editForm.country} onChange={e => setEditForm(p => ({ ...p, country: e.target.value }))} placeholder="e.g. Uzbekistan" className={mInputCls} />
                  </div>
                )}
              </div>
              <div>
                <label className="text-[11px] font-medium text-white/50 mb-1 block">Description</label>
                <textarea rows={3} value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} className={mInputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-white/50 mb-1 block">Meeting Time</label>
                  <input value={editForm.meeting_time} onChange={e => setEditForm(p => ({ ...p, meeting_time: e.target.value }))} placeholder="e.g. Every Wed 6pm" className={mInputCls} />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-white/50 mb-1 block">Location</label>
                  <input value={editForm.location} onChange={e => setEditForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Room 304" className={mInputCls} />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium text-white/50 mb-1 block">Official Website</label>
                <input value={editForm.website} onChange={e => setEditForm(p => ({ ...p, website: e.target.value }))} placeholder="https://..." className={mInputCls} />
              </div>
              <div>
                <label className="text-[11px] font-medium text-white/50 mb-1 block">KakaoTalk Link</label>
                <input value={editForm.kakao_link} onChange={e => setEditForm(p => ({ ...p, kakao_link: e.target.value }))} placeholder="https://open.kakao.com/o/..." className={mInputCls} />
              </div>
              <div>
                <label className="text-[11px] font-medium text-white/50 mb-1 block">Contact</label>
                <input value={editForm.contact} onChange={e => setEditForm(p => ({ ...p, contact: e.target.value }))} placeholder="email | phone" className={mInputCls} />
              </div>

              {editMsg && (
                <p className={`text-xs text-center ${editMsg === "Saved!" ? "text-emerald-400" : "text-red-400"}`}>{editMsg}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button onClick={() => setEditingClub(null)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-white/60 hover:bg-white/5 transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={editBusy} className="flex-1 py-2.5 rounded-xl bg-indigo-500 text-white text-xs font-semibold hover:bg-indigo-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
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

// ── Club card component ────────────────────────────────────────
function ClubCard({ club, isOwner, onEdit, onLeave }: {
  club: MyClub;
  isOwner: boolean;
  onEdit?: () => void;
  onLeave?: () => void;
}) {
  const isCommunity = club.club_type === "community";
  const accentColor = isCommunity ? "text-violet-400" : "text-indigo-400";
  const borderColor = isCommunity ? "border-violet-500/20" : "border-indigo-500/20";
  const bgColor     = isCommunity ? "bg-violet-500/5"     : "bg-indigo-500/5";

  return (
    <div className={`group p-4 rounded-2xl border ${borderColor} ${bgColor} flex flex-col gap-2.5`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${isCommunity ? "bg-violet-500/15 text-violet-400" : "bg-indigo-500/15 text-indigo-400"}`}>
              {isCommunity ? "Community" : "Club"}
            </span>
            {isOwner && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400">Owner</span>
            )}
          </div>
          <h3 className="text-sm font-bold text-foreground leading-tight truncate">{club.name}</h3>
          <p className="text-[11px] text-muted-foreground">{isCommunity && club.country ? club.country : club.university}</p>
        </div>
        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {isOwner && onEdit && (
            <button onClick={onEdit} className={`p-1.5 rounded-lg ${accentColor} hover:bg-white/8 transition-all`} title="Edit">
              <Pencil size={12} />
            </button>
          )}
          {!isOwner && onLeave && (
            <button onClick={onLeave} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/8 transition-all" title="Leave">
              <LogOut size={12} />
            </button>
          )}
          {club.website && (
            <a href={club.website} target="_blank" rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-indigo-400 hover:bg-white/8 transition-all" title="Website">
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>

      {/* Description */}
      {club.description && (
        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{club.description}</p>
      )}

      {/* Meta */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground/70 mt-auto">
        {club.meeting_time && <span className="flex items-center gap-1"><Calendar size={9} />{club.meeting_time}</span>}
        {club.member_count > 0 && <span className="flex items-center gap-1"><Users size={9} />{club.member_count} members</span>}
        {club.location && <span className="flex items-center gap-1"><Globe size={9} />{club.location}</span>}
      </div>
    </div>
  );
}
