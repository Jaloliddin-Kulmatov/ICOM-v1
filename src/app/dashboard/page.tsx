"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Sparkles, ArrowRight, Users,
  GraduationCap, Globe, Pencil, X, Loader2, ExternalLink,
  Plus, LogOut, CheckCircle2, Calendar,
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

      {/* ── My Clubs & Communities + ICOM AI (side by side on desktop) ── */}
      <div className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Clubs/Communities — 2/3 width on desktop */}
        <div className="lg:col-span-2 space-y-4">
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
            <div className="p-6 rounded-2xl border border-dashed border-border text-center">
              <Users size={24} className="text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">You haven&apos;t joined any clubs or communities yet.</p>
              <Link href="/community" className="mt-2 inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                Explore communities <ArrowRight size={10} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

        {/* ── ICOM AI card (prominent, sticky next to clubs) ── */}
        <aside className="lg:sticky lg:top-20 self-start">
          <Link
            href="/dashboard/ai"
            className="block rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-purple-500/10 p-5 hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/10 transition-all group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Sparkles size={18} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground leading-tight">ICOM AI</p>
                <p className="text-[11px] text-emerald-500 leading-tight">Online · responds instantly</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              Ask anything about Korea — visa, banking, housing, jobs, transportation. Answers in your language, 24/7.
            </p>
            <div className="space-y-1.5">
              {[
                "How do I extend my D-2 visa?",
                "Open a Kakao Bank account",
                "Find part-time jobs near campus",
              ].map((q) => (
                <div key={q} className="flex items-center gap-2 text-[11px] text-foreground/80 bg-background/50 rounded-lg px-2.5 py-1.5 border border-border">
                  <Sparkles size={10} className="text-indigo-500 shrink-0" />
                  <span className="truncate">{q}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-xs font-semibold group-hover:opacity-90 transition-opacity">
              Start chatting <ArrowRight size={12} />
            </div>
          </Link>
        </aside>
      </div>

      {/* ── Quick actions ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {quickLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-1.5 p-4 rounded-2xl border border-border bg-card hover:border-indigo-500/30 hover:shadow-sm transition-all text-center"
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-[11px] font-medium text-foreground">{item.label}</span>
          </Link>
        ))}
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
