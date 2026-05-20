"use client";

import React, { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/layout/navbar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search, Users, Globe, MapPin, Clock, Phone, CheckCircle2,
  LogIn, Loader2, Plus, X, Lock, ChevronDown, ChevronUp,
  UserCheck, Link as LinkIcon, Settings, MessageSquare,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import PostFeed from "@/components/community/post-feed";
import ClubChat from "@/components/community/club-chat";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

interface Club {
  id: number; name: string; category: string; university: string;
  description: string; contact: string | null; kakao_link: string | null;
  meeting_time: string; location: string; member_count: number;
  pending_count: number; my_status: "pending" | "approved" | null;
  is_creator: boolean; creator_name: string | null; club_type: "club" | "community";
  country?: string;
}

interface JoinRequest {
  membership_id: number; user_id: number; name: string;
  university: string; country: string; visa_type: string; requested_at: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  academic: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  sports:   "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  culture:  "text-violet-400 bg-violet-500/10 border-violet-500/20",
  social:   "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  language: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  tech:     "text-blue-400 bg-blue-500/10 border-blue-500/20",
  arts:     "text-pink-400 bg-pink-500/10 border-pink-500/20",
  volunteer:"text-orange-400 bg-orange-500/10 border-orange-500/20",
};
const CATEGORIES = ["academic","sports","culture","social","language","tech","arts","volunteer"];

function getToken() { return typeof window !== "undefined" ? localStorage.getItem("icon_token") : null; }

async function apiFetch(method: string, path: string, body?: object) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

// ── Create Club Modal ────────────────────────────────────────

function CreateClubModal({ onClose, onCreate }: { onClose: () => void; onCreate: (club: Club) => void }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: "", category: "social", university: user?.university || "JBNU",
    description: "", kakao_link: "", contact: "", meeting_time: "", location: "",
    club_type: "club" as "club" | "community", country: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const inputCls = "w-full bg-[#1a1a2e] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-indigo-500/50 transition-colors [color-scheme:dark]";
  const labelCls = "text-xs font-medium text-white/55 mb-1 block";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const data = await apiFetch("POST", "/clubs", form);
      if (data.error) throw new Error(data.error);
      onCreate(data.club);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-[#0e0e1a] border border-white/12 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <h2 className="text-base font-bold text-white">Create a Club or Community</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-colors"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-xs text-red-400 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">{error}</p>}

          {/* Type selector */}
          <div className="grid grid-cols-2 gap-2">
            {(["club", "community"] as const).map(t => (
              <button key={t} type="button"
                onClick={() => setForm(p => ({...p, club_type: t}))}
                className={`py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  form.club_type === t
                    ? t === "club" ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300" : "bg-violet-500/20 border-violet-500/40 text-violet-300"
                    : "border-white/10 text-white/40 hover:text-white/70"
                }`}>
                {t === "club" ? "🎓 Club" : "🌍 Community"}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-white/35 -mt-2">
            {form.club_type === "club" ? "For university-specific groups (sports, academic, arts...)" : "For country or nationality-based communities (Uzbeks at JBNU, Vietnamese Students...)"}
          </p>

          <div>
            <label className={labelCls}>{form.club_type === "club" ? "Club" : "Community"} Name *</label>
            <input required value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder="e.g. JBNU Hiking Club" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Category</label>
              <select value={form.category} onChange={e => setForm(p => ({...p, category: e.target.value}))} className={inputCls + " [color-scheme:dark]"}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
              </select>
            </div>
            {form.club_type === "community" ? (
              <div>
                <label className={labelCls}>Country / Nationality</label>
                <input value={form.country} onChange={e => setForm(p => ({...p, country: e.target.value}))} placeholder="e.g. Uzbekistan" className={inputCls} />
              </div>
            ) : (
              <div>
                <label className={labelCls}>University</label>
                <input value={form.university} onChange={e => setForm(p => ({...p, university: e.target.value}))} className={inputCls} />
              </div>
            )}
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} rows={3} placeholder="What does your club do?" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Meeting Time</label>
              <input value={form.meeting_time} onChange={e => setForm(p => ({...p, meeting_time: e.target.value}))} placeholder="e.g. Every Sat 2pm" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Location</label>
              <input value={form.location} onChange={e => setForm(p => ({...p, location: e.target.value}))} placeholder="e.g. Student Union B203" className={inputCls} />
            </div>
          </div>
          <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/15 space-y-3">
            <p className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5"><Lock size={12} /> Private info — only shown to accepted members</p>
            <div>
              <label className={labelCls}>KakaoTalk Group Link / ID</label>
              <input value={form.kakao_link} onChange={e => setForm(p => ({...p, kakao_link: e.target.value}))} placeholder="e.g. open.kakao.com/o/gXXXXXXXX" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Contact (email / KakaoTalk ID / phone)</label>
              <input value={form.contact} onChange={e => setForm(p => ({...p, contact: e.target.value}))} placeholder="e.g. kakao: jbnu_hiking" className={inputCls} />
            </div>
          </div>
          <button type="submit" disabled={busy} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Create Club
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Manage Requests Modal ─────────────────────────────────────

function ManageModal({ club, onClose, onUpdate }: { club: Club; onClose: () => void; onUpdate: () => void }) {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => {
    apiFetch("GET", `/clubs/${club.id}/requests`).then(d => {
      setRequests(d.requests || []);
      setLoading(false);
    });
  }, [club.id]);

  const handle = async (userId: number, action: "approve" | "reject") => {
    setBusy(userId);
    await apiFetch("POST", `/clubs/${club.id}/${action}/${userId}`);
    setRequests(prev => prev.filter(r => r.user_id !== userId));
    setBusy(null);
    onUpdate();
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-[#0e0e1a] border border-white/12 rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <h2 className="text-sm font-bold text-white">Manage — {club.name}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/8"><X size={15} /></button>
        </div>
        <div className="p-5">
          <p className="text-xs font-semibold text-white/45 uppercase tracking-widest mb-3">
            Join Requests ({requests.length})
          </p>
          {loading && <div className="flex justify-center py-6"><Loader2 size={18} className="animate-spin text-white/40" /></div>}
          {!loading && requests.length === 0 && (
            <p className="text-sm text-white/50 text-center py-6">No pending requests.</p>
          )}
          <div className="space-y-3">
            {requests.map(r => (
              <div key={r.user_id} className="p-3.5 rounded-xl border border-white/8 bg-white/3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{r.name}</p>
                    <p className="text-xs text-white/50 mt-0.5">
                      {r.university}{r.country ? ` · ${r.country}` : ""}{r.visa_type ? ` · ${r.visa_type}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => handle(r.user_id, "approve")}
                      disabled={busy === r.user_id}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-medium hover:bg-emerald-500/25 transition-colors disabled:opacity-50"
                    >
                      {busy === r.user_id ? <Loader2 size={12} className="animate-spin" /> : "Accept"}
                    </button>
                    <button
                      onClick={() => handle(r.user_id, "reject")}
                      disabled={busy === r.user_id}
                      className="px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Club Card ─────────────────────────────────────────────────

function ClubCard({ club, onAction, onManage, onChat, unreadCount = 0 }: {
  club: Club;
  onAction: (club: Club, action: "request" | "leave") => Promise<void>;
  onManage: (club: Club) => void;
  onChat: (club: Club) => void;
  unreadCount?: number;
}) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [showPrivate, setShowPrivate] = useState(false);
  const colorCls = CATEGORY_COLORS[club.category] || CATEGORY_COLORS.social;
  const isApproved = club.my_status === "approved" || club.is_creator;
  const isPending = club.my_status === "pending";

  const handleClick = async () => {
    setBusy(true);
    await onAction(club, isApproved ? "leave" : "request");
    setBusy(false);
  };

  return (
    <div className={`p-5 rounded-2xl border transition-all ${
      isApproved ? "border-indigo-500/25 bg-indigo-500/5" :
      isPending  ? "border-amber-500/20 bg-amber-500/5" :
      "border-white/8 bg-white/3 hover:border-white/15 hover:bg-white/5"
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${colorCls} capitalize`}>{club.category}</div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground">{club.university}</span>
          {club.is_creator && (
            <button onClick={() => onManage(club)} title="Manage members" className="p-1 rounded-lg text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10 transition-colors relative">
              <Settings size={13} />
              {club.pending_count > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center font-bold">{club.pending_count}</span>
              )}
            </button>
          )}
        </div>
      </div>

      <h3 className="text-sm font-bold text-foreground mb-1">{club.name}</h3>
      {club.creator_name && !club.is_creator && (
        <p className="text-[11px] text-muted-foreground mb-2">by {club.creator_name}</p>
      )}
      {club.description && (
        <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">{club.description}</p>
      )}

      <div className="space-y-1.5 text-[11px] text-muted-foreground mb-3">
        {club.meeting_time && <div className="flex items-center gap-1.5"><Clock size={11} />{club.meeting_time}</div>}
        {club.location     && <div className="flex items-center gap-1.5"><MapPin size={11} />{club.location}</div>}
      </div>

      {/* Private info — only approved members */}
      {isApproved && (club.kakao_link || club.contact) && (
        <div className="mb-3">
          <button onClick={() => setShowPrivate(v => !v)} className="flex items-center gap-1.5 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors">
            <Lock size={10} /> Members-only info {showPrivate ? <ChevronUp size={10}/> : <ChevronDown size={10}/>}
          </button>
          {showPrivate && (
            <div className="mt-2 p-3 rounded-xl bg-indigo-500/8 border border-indigo-500/15 space-y-1.5 text-[11px]">
              {club.kakao_link && (
                <div className="flex items-center gap-1.5 text-indigo-300">
                  <LinkIcon size={11} />
                  <a href={club.kakao_link.startsWith("http") ? club.kakao_link : `https://${club.kakao_link}`}
                     target="_blank" rel="noopener noreferrer"
                     className="truncate hover:underline">
                    KakaoTalk Group →
                  </a>
                </div>
              )}
              {club.contact && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Phone size={11} />{club.contact}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/6">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users size={12} />
          <span>{club.member_count} member{club.member_count !== 1 ? "s" : ""}</span>
          {isApproved && <span className="flex items-center gap-1 text-indigo-400 ml-1"><CheckCircle2 size={11}/> Joined</span>}
          {isPending  && <span className="text-amber-400 ml-1">Pending…</span>}
          {club.is_creator && <span className="text-amber-400 ml-1">Your club</span>}
        </div>

        <div className="flex items-center gap-2">
          {isApproved && (
            <button
              onClick={() => onChat(club)}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 transition-all"
            >
              <MessageSquare size={12} /> Chat
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-0.5">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          )}
          {!club.is_creator && user && (
            <button
              onClick={handleClick}
              disabled={busy || isPending}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all disabled:opacity-60 ${
                isApproved ? "border border-white/10 text-muted-foreground hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/5" :
                isPending  ? "border border-amber-500/20 text-amber-400 cursor-default" :
                "bg-indigo-500 text-white hover:bg-indigo-600"
              }`}
            >
              {busy ? <Loader2 size={12} className="animate-spin" /> :
               isApproved ? "Leave" : isPending ? "Pending" : "Request to Join"}
            </button>
          )}
        </div>
        {!user && (
          <Link href="/login" className="px-3 py-1.5 rounded-xl text-xs font-medium border border-white/10 text-muted-foreground hover:text-indigo-400 hover:border-indigo-500/30 transition-all">
            Sign in to join
          </Link>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────

export default function CommunityPage() {
  const { user } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeTab, setActiveTab] = useState<"club" | "community">("club");
  const [showCreate, setShowCreate] = useState(false);
  const [manageClub, setManageClub] = useState<Club | null>(null);
  const [chatClub, setChatClub] = useState<Club | null>(null);
  const [activeTabMain, setActiveTabMain] = useState<"club" | "community" | "news">("club");
  const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({});
  const [newsUnread, setNewsUnread] = useState(0);

  const checkUnread = useCallback(async (approvedClubs: Club[]) => {
    if (!approvedClubs.length) return;
    const counts: Record<number, number> = {};
    await Promise.all(approvedClubs.map(async (c) => {
      const lastId = parseInt(localStorage.getItem(`chat_lid_${c.id}`) || "0", 10);
      try {
        const res = await fetch(`${API}/clubs/${c.id}/chat?after=${lastId}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (!res.ok) return;
        const d = await res.json();
        // Only count messages from OTHER people (not your own)
        const msgs = (d.messages || []).filter(
          (m: { user_id: number }) => m.user_id !== user?.id
        );
        if (msgs.length > 0) counts[c.id] = msgs.length;
      } catch { /* ignore */ }
    }));
    setUnreadCounts(counts);
  }, [user]);

  const fetchClubs = useCallback(async () => {
    const token = getToken();
    const res = await fetch(`${API}/clubs`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const d = await res.json();
    const loadedClubs: Club[] = d.clubs || [];
    setClubs(loadedClubs);
    setLoading(false);
    // Check unread counts for approved clubs
    if (token) {
      const approved = loadedClubs.filter(c => c.my_status === "approved" || c.is_creator);
      checkUnread(approved);
    }
  }, [checkUnread]);

  useEffect(() => { fetchClubs(); }, [fetchClubs]);

  // Poll chat unread every 8 seconds
  useEffect(() => {
    if (!user) return;
    const approved = clubs.filter(c => c.my_status === "approved" || c.is_creator);
    const interval = setInterval(() => {
      if (approved.length > 0) checkUnread(approved);
    }, 8000);
    // Also re-check when the tab becomes visible again
    const onVisible = () => {
      if (document.visibilityState === "visible" && approved.length > 0) checkUnread(approved);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [clubs, user, checkUnread]);

  // Check news unread on mount and every 30s
  const checkNewsUnread = useCallback(async () => {
    if (!user) return;
    const lastSeenId = parseInt(localStorage.getItem("news_last_post_id") || "0", 10);
    try {
      const res = await fetch(`${API}/posts`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) return;
      const d = await res.json();
      const posts: { id: number; user_id: number }[] = d.posts || [];
      // Don't notify for posts you wrote yourself
      const count = posts.filter(p => p.id > lastSeenId && p.user_id !== user.id).length;
      setNewsUnread(count);
    } catch { /* ignore */ }
  }, [user]);

  useEffect(() => {
    checkNewsUnread();
    const interval = setInterval(checkNewsUnread, 30000);
    return () => clearInterval(interval);
  }, [checkNewsUnread]);

  const handleAction = async (club: Club, action: "request" | "leave") => {
    const path = action === "request" ? `/clubs/${club.id}/request` : `/clubs/${club.id}/leave`;
    const data = await apiFetch("POST", path);
    if (data.club) setClubs(prev => prev.map(c => c.id === club.id ? { ...c, ...data.club } : c));
  };

  const handleCreate = (newClub: Club) => setClubs(prev => [newClub, ...prev]);

  const tabClubs = clubs.filter(c => (c.club_type || "club") === activeTab);
  const categories = ["all", ...Array.from(new Set(tabClubs.map(c => c.category)))];
  const myClubs = clubs.filter(c => c.my_status === "approved" || c.is_creator);

  const filtered = tabClubs.filter(c => {
    const matchCat = activeCategory === "all" || c.category === activeCategory;
    const matchSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.description || "").toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {showCreate && <CreateClubModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
      {manageClub && <ManageModal club={manageClub} onClose={() => setManageClub(null)} onUpdate={fetchClubs} />}
      {chatClub && <ClubChat club={chatClub} onClose={() => {
        setChatClub(null);
        // After closing chat, re-check unread (slight delay for localStorage to update)
        setTimeout(() => {
          const approved = clubs.filter(c => c.my_status === "approved" || c.is_creator);
          checkUnread(approved);
          // Clear the unread count for the club we just viewed
          setUnreadCounts(prev => { const n = {...prev}; delete n[chatClub.id]; return n; });
        }, 200);
      }} />}

      <main className="pt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-start justify-between mb-6 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="violet" className="text-xs">JBNU</Badge>
                <Badge variant="default" className="text-xs">International Students</Badge>
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-1">Community & Clubs</h1>
              <p className="text-sm text-muted-foreground">Join clubs, connect with students, and build your network.</p>
            </div>
            {user ? (
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors shrink-0 shadow-sm"
              >
                <Plus size={15} /> Create
              </button>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors shrink-0 shadow-sm"
              >
                <Plus size={15} /> Create
              </Link>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-2xl bg-muted/50 border border-border mb-6 w-fit">
            {([
              { key: "club",      label: "Clubs" },
              { key: "community", label: "Community" },
              { key: "news",      label: "News" },
            ] as const).map(tab => {
              // Count total unread chat messages across all clubs for the chat tabs
              const totalChatUnread = tab.key !== "news"
                ? clubs.filter(c => (c.club_type || "club") === tab.key).reduce((sum, c) => sum + (unreadCounts[c.id] || 0), 0)
                : 0;
              return (
                <button key={tab.key}
                  onClick={() => {
                    if (tab.key !== "news") setActiveTab(tab.key as "club" | "community");
                    setActiveCategory("all");
                    setActiveTabMain(tab.key);
                    if (tab.key === "news") {
                      // Mark news as read — save latest seen ID
                      fetch(`${API}/posts`, { headers: { Authorization: `Bearer ${getToken()}` } })
                        .then(r => r.json())
                        .then(d => {
                          const posts: { id: number }[] = d.posts || [];
                          if (posts.length > 0) localStorage.setItem("news_last_post_id", String(Math.max(...posts.map(p => p.id))));
                        }).catch(() => {});
                      setNewsUnread(0);
                    }
                  }}
                  className={`relative px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                    activeTabMain === tab.key
                      ? "bg-background shadow-sm text-foreground border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}>
                  {tab.label}
                  {tab.key !== "news" && (
                    <span className="ml-1.5 text-[10px] text-muted-foreground">
                      ({clubs.filter(c => (c.club_type || "club") === tab.key).length})
                    </span>
                  )}
                  {/* Unread badge */}
                  {tab.key === "news" && newsUnread > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-0.5">
                      {newsUnread > 9 ? "9+" : newsUnread}
                    </span>
                  )}
                  {tab.key !== "news" && totalChatUnread > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-0.5">
                      {totalChatUnread > 9 ? "9+" : totalChatUnread}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* News tab */}
          {activeTabMain === "news" && (
            <div className="max-w-2xl">
              <PostFeed />
            </div>
          )}

          {/* Clubs / Community tab */}
          {activeTabMain !== "news" && <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                {/* My clubs */}
                {user && myClubs.length > 0 && (
                  <div className="p-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5">
                    <h2 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                      <UserCheck size={13} className="text-indigo-400" /> My Clubs ({myClubs.length})
                    </h2>
                    <div className="space-y-1.5">
                      {myClubs.map(c => (
                        <div key={c.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                          <span className="truncate">{c.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Categories */}
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 px-1">Category</h2>
                  <div className="space-y-0.5">
                    {categories.map(cat => (
                      <button key={cat} onClick={() => setActiveCategory(cat)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
                          activeCategory === cat ? "bg-indigo-500/10 text-indigo-400" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                        }`}>
                        <Globe size={13} />
                        <span className="font-medium capitalize">{cat === "all" ? "All Clubs" : cat}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 rounded-2xl border border-white/8 bg-white/3 text-xs text-muted-foreground space-y-2">
                  <p className="font-semibold text-foreground">How it works</p>
                  <p>Click <strong>Request to Join</strong> on a club. The creator reviews your request and accepts or rejects it.</p>
                  <p>Once accepted, you can see the KakaoTalk group link and private contact details.</p>
                </div>
              </div>
            </div>

            {/* Main */}
            <div className="lg:col-span-3 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${activeTab === "club" ? "clubs" : "communities"}...`} icon={<Search size={15} />} />
                </div>
              </div>

              {!user && (
                <div className="flex items-center gap-3 p-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5">
                  <LogIn size={16} className="text-indigo-400 shrink-0" />
                  <p className="text-sm text-muted-foreground flex-1">
                    <Link href="/login" className="text-indigo-400 font-medium hover:text-indigo-300">Sign in</Link>{" "}
                    to join clubs, create your own, or see KakaoTalk group links.
                  </p>
                </div>
              )}

              {loading && (
                <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground text-sm">
                  <Loader2 size={16} className="animate-spin" /> Loading clubs...
                </div>
              )}

              {!loading && filtered.length === 0 && (
                <div className="text-center py-16 rounded-2xl border border-white/8 bg-white/3">
                  <Users size={32} className="text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground font-medium">
                    {tabClubs.length === 0 ? `No ${activeTab === "club" ? "clubs" : "communities"} yet. Be the first to create one!` : "No results match your search."}
                  </p>
                  {user && tabClubs.length === 0 && (
                    <button onClick={() => setShowCreate(true)} className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors mx-auto">
                      <Plus size={14} /> Create the first {activeTab === "club" ? "club" : "community"}
                    </button>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filtered.map(club => (
                  <ClubCard
                    key={club.id}
                    club={club}
                    onAction={handleAction}
                    onManage={setManageClub}
                    onChat={setChatClub}
                    unreadCount={unreadCounts[club.id] || 0}
                  />
                ))}
              </div>
            </div>
          </div>}

        </div>
      </main>
    </div>
  );
}
