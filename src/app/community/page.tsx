"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search, Users, Globe, MapPin, Clock, CheckCircle2,
  LogIn, Loader2, Plus, X, Lock, Settings, MessageSquare,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import PostFeed from "@/components/community/post-feed";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

interface Club {
  id: number; name: string; category: string; university: string;
  description: string; contact: string | null; kakao_link: string | null;
  meeting_time: string; location: string; member_count: number;
  pending_count: number; my_status: "pending" | "approved" | null;
  is_creator: boolean; creator_name: string | null; club_type: "club" | "community";
  country?: string; website?: string; cover_image?: string;
}

interface JoinRequest {
  membership_id: number; user_id: number; name: string;
  university: string; country: string; visa_type: string; requested_at: string;
}

// Map university short-name → city (used on community cards instead of uni name)
const UNI_CITY: Record<string, string> = {
  "JBNU": "Jeonju",
  "SNU": "Seoul",
  "Yonsei": "Seoul",
  "Korea": "Seoul",
  "Hanyang": "Seoul",
  "SKKU": "Seoul/Suwon",
  "EWHA": "Seoul",
  "Kyung Hee": "Seoul",
  "Sogang": "Seoul",
  "Chung-Ang": "Seoul",
  "Inha": "Incheon",
  "PNU": "Busan",
  "Konkuk": "Seoul",
  "Hongik": "Seoul",
  "Sejong": "Seoul",
  "Dongguk": "Seoul",
  "CNU": "Daejeon",
  "Ajou": "Suwon",
};

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
// Category filters — clubs and communities use different sets
const CLUB_CATEGORIES      = ["academic", "sports", "culture", "social", "language", "tech", "arts", "volunteer"];
const COMMUNITY_CATEGORIES = ["national community", "religion & culture", "support & community"];

function getToken() { return typeof window !== "undefined" ? localStorage.getItem("icon_token") : null; }

// ── Keyword-based cover image ─────────────────────────────────────────────────
function getClubCoverUrl(club: { id: number; name: string; category: string; club_type?: string; country?: string }): string {
  const name = club.name.toLowerCase();

  // Name-specific patterns → relevant loremflickr keywords
  const matchers: [RegExp, string][] = [
    [/guitar|music|band|choir|piano|drum|jazz|rock|kpop|k-pop|orchestra|instrument/i, "music,concert"],
    [/badminton/i, "badminton,sport"],
    [/basketball/i, "basketball"],
    [/soccer|football|futsal/i, "soccer,football"],
    [/volleyball/i, "volleyball,sport"],
    [/swimming|aqua/i, "swimming,pool"],
    [/cycling|bicycle|bike/i, "cycling,bicycle"],
    [/tennis|table.tennis|ping.pong/i, "tennis,sport"],
    [/hiking|mountain|outdoor|trekking|climbing/i, "hiking,mountain"],
    [/running|marathon|jogging|track/i, "running,marathon"],
    [/yoga|wellness|meditation|mindful|pilates/i, "yoga,wellness"],
    [/dance|dancing|ballet|choreograph/i, "dance,performance"],
    [/cooking|culinary|food|baking|chef|gastro/i, "cooking,food"],
    [/photo|photography|camera|film|cinema|video/i, "photography,camera"],
    [/art|painting|drawing|sketch|craft|ceramic|sculpt/i, "art,painting"],
    [/design|graphic|ui|ux|visual|illustration/i, "design,creative"],
    [/tech|coding|programming|developer|software|ai|robot|computer|hack/i, "technology,coding"],
    [/environment|eco|green|sustainability|nature|forest|recycle/i, "nature,environment"],
    [/volunteer|service|charity|community.service|welfare/i, "volunteer,community"],
    [/language|english|korean|chinese|japanese|arabic|french|spanish|learn/i, "language,study"],
    [/book|reading|literature|writing|poetry|story|library/i, "books,reading"],
    [/business|entrepreneur|startup|finance|invest|market/i, "business,office"],
    [/journalism|media|news|broadcast|radio|press/i, "journalism,media"],
    [/debate|public.speak|model.un|diplomacy|speech/i, "debate,speech"],
    [/chess|board.game|gaming|esport|game.club/i, "chess,strategy"],
    [/science|research|lab|engineering|math|physics|chemistry|biology/i, "science,laboratory"],
    [/culture|cultural|tradition|heritage|festival/i, "culture,tradition"],
    [/prayer|faith|religion|church|mosque|temple/i, "faith,community"],
  ];

  for (const [regex, kw] of matchers) {
    if (regex.test(name)) {
      return `https://loremflickr.com/600/200/${kw}?lock=${club.id}`;
    }
  }

  // Category fallback
  const catKw: Record<string, string> = {
    sports:               "sports,stadium",
    academic:             "university,studying",
    culture:              "culture,art",
    social:               "people,friends",
    language:             "language,study",
    tech:                 "technology,computer",
    arts:                 "art,creative",
    volunteer:            "volunteer,community",
    "national community": club.country ? `${club.country.toLowerCase().split(" ")[0]},culture` : "international,flag",
    "religion & culture": "culture,tradition",
    "support & community":"community,people",
  };

  const kw = catKw[club.category?.toLowerCase()] || "students,university,korea";
  return `https://loremflickr.com/600/200/${kw}?lock=${club.id}`;
}

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
    club_type: "club" as "club" | "community", country: "", cover_image: "",
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
                onClick={() => setForm(p => ({
                  ...p,
                  club_type: t,
                  // Clear university for communities (nationwide); restore for clubs
                  university: t === "community" ? "" : (user?.university || "JBNU"),
                  // Switch to sensible default category for each type
                  category: t === "community" ? "national community" : "social",
                }))}
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
            {form.club_type === "club" ? "For university-specific groups (sports, academic, arts...)" : "For country or nationality-based communities across South Korea (Uzbek students, Vietnamese Students...)"}
          </p>

          <div>
            <label className={labelCls}>{form.club_type === "club" ? "Club" : "Community"} Name *</label>
            <input required value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder="e.g. JBNU Hiking Club" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Category</label>
              <select value={form.category} onChange={e => setForm(p => ({...p, category: e.target.value}))} className={inputCls + " [color-scheme:dark]"}>
                {(form.club_type === "community" ? COMMUNITY_CATEGORIES : CLUB_CATEGORIES).map((c: string) => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
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
          <div>
            <label className={labelCls}>Cover Photo URL <span className="text-white/25 font-normal">(optional)</span></label>
            <input value={form.cover_image} onChange={e => setForm(p => ({...p, cover_image: e.target.value}))} placeholder="https://... (leave blank for auto-generated)" className={inputCls} />
            <p className="text-[10px] text-white/30 mt-1">Paste any image URL. Leave blank for a beautiful auto-generated cover.</p>
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

function ClubCard({ club, onAction, onManage }: {
  club: Club;
  onAction: (club: Club, action: "request" | "leave") => Promise<void>;
  onManage: (club: Club) => void;
}) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const colorCls = CATEGORY_COLORS[club.category] || CATEGORY_COLORS.social;
  const isApproved = club.my_status === "approved" || club.is_creator;
  const isPending = club.my_status === "pending";
  const isCC = club.club_type === "community";

  const handleAction = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setBusy(true);
    await onAction(club, isApproved ? "leave" : "request");
    setBusy(false);
  };

  const handleManage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onManage(club);
  };

  const coverUrl = club.cover_image || getClubCoverUrl(club);

  return (
    <Link
      href={`/community/${club.id}`}
      className={`group block rounded-2xl border overflow-hidden transition-all duration-200 hover:-translate-y-0.5 ${
        isApproved
          ? "border-indigo-500/30 bg-indigo-500/5 hover:border-indigo-500/50 hover:shadow-[0_4px_20px_rgba(99,102,241,0.12)]"
          : isPending
          ? "border-amber-500/20 bg-amber-500/5 hover:border-amber-500/35"
          : "border-border bg-card hover:border-indigo-500/25 hover:shadow-sm"
      }`}
    >
      {/* Cover image banner */}
      <div className="relative h-28 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverUrl}
          alt={club.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/icom-${club.id}/600/200`; }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60" />
        {/* Category badge overlaid */}
        <div className="absolute bottom-2 left-3 flex items-center gap-1.5">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border backdrop-blur-sm ${colorCls} capitalize`}>
            {club.category}
          </span>
          {club.is_creator && (
            <button
              onClick={handleManage}
              title="Manage members"
              className="relative p-1 rounded-lg bg-black/40 text-white/80 hover:text-amber-400 hover:bg-black/60 transition-colors backdrop-blur-sm"
            >
              <Settings size={11} />
              {club.pending_count > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 text-white text-[7px] flex items-center justify-center font-bold">
                  {club.pending_count}
                </span>
              )}
            </button>
          )}
        </div>
        {/* Location overlay top-right */}
        <div className="absolute top-2 right-3">
          <span className="text-[10px] text-white/80 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
            {isCC ? (club.country || "South Korea") : club.university}
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        {/* Name */}
        <h3 className="text-sm font-bold text-foreground mb-1 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
          {club.name}
        </h3>
        {club.creator_name && !club.is_creator && (
          <p className="text-[11px] text-muted-foreground mb-2">by {club.creator_name}</p>
        )}
        {club.description && (
          <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">
            {club.description}
          </p>
        )}

        {/* Meta */}
        <div className="space-y-1 text-[11px] text-muted-foreground">
          {club.meeting_time && (
            <div className="flex items-center gap-1.5"><Clock size={11} />{club.meeting_time}</div>
          )}
          {club.location && (
            <div className="flex items-center gap-1.5"><MapPin size={11} />{club.location}</div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className={`flex items-center justify-between px-5 py-3 border-t ${
        isApproved ? "border-indigo-500/15" : isPending ? "border-amber-500/10" : "border-border"
      }`}>
        {/* Left: member count + status */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Users size={12} />
          <span>{club.member_count} member{club.member_count !== 1 ? "s" : ""}</span>
          {isApproved && (
            <span className="flex items-center gap-1 text-indigo-400">
              <CheckCircle2 size={11} /> Joined
            </span>
          )}
          {isPending && <span className="text-amber-400">Pending…</span>}
          {club.is_creator && <span className="text-amber-400">Owner</span>}
        </div>

        {/* Right: CTA */}
        <div className="flex items-center gap-2">
          {/* Open button — always visible */}
          <span className="flex items-center gap-1 text-xs text-indigo-500 dark:text-indigo-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Open →
          </span>

          {/* Join / Leave / Request */}
          {!club.is_creator && user && (
            <button
              onClick={handleAction}
              disabled={busy || isPending}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all disabled:opacity-60 ${
                isApproved
                  ? "border border-border text-muted-foreground hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/5"
                  : isPending
                  ? "border border-amber-500/20 text-amber-400 cursor-default"
                  : "bg-indigo-500 text-white hover:bg-indigo-600 shadow-sm"
              }`}
            >
              {busy ? (
                <Loader2 size={12} className="animate-spin" />
              ) : isApproved ? (
                "Leave"
              ) : isPending ? (
                "Pending"
              ) : (
                "Join"
              )}
            </button>
          )}
          {!user && (
            <Link
              href="/login"
              onClick={e => e.stopPropagation()}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Main Page ─────────────────────────────────────────────────

function ClubSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse">
      <div className="h-28 bg-muted/50" />
      <div className="p-4 space-y-2">
        <div className="h-4 w-2/3 rounded bg-muted/60" />
        <div className="h-3 w-full rounded bg-muted/40" />
        <div className="h-3 w-4/5 rounded bg-muted/40" />
      </div>
      <div className="px-4 py-3 border-t border-border flex justify-between">
        <div className="h-3 w-20 rounded bg-muted/40" />
        <div className="h-6 w-14 rounded-xl bg-muted/40" />
      </div>
    </div>
  );
}

export default function CommunityPage() {
  const { user } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<{ clubs: number; communities: number } | null>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeTab, setActiveTab] = useState<"club" | "community">("club");
  const [showCreate, setShowCreate] = useState(false);
  const [manageClub, setManageClub] = useState<Club | null>(null);
  const [activeTabMain, setActiveTabMain] = useState<"club" | "community" | "news">("club");
  const [newsUnread, setNewsUnread] = useState(0);
  const [toast, setToast] = useState<{ msg: string; clubId?: number } | null>(null);
  const prevNewsRef = useRef(0);

  // Fetch lightweight counts immediately so tab labels show before full list arrives
  useEffect(() => {
    fetch(`${API}/clubs/counts`)
      .then(r => r.json())
      .then(d => setCounts({ clubs: d.clubs ?? 0, communities: d.communities ?? 0 }))
      .catch(() => {});
  }, []);

  const fetchClubs = useCallback(async () => {
    const token = getToken();
    const res = await fetch(`${API}/clubs`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const d = await res.json();
    const loadedClubs: Club[] = d.clubs || [];
    setClubs(loadedClubs);
    setLoading(false);
  }, []);

  useEffect(() => { fetchClubs(); }, [fetchClubs]);

  // Re-fetch clubs every 30s so newly-approved memberships are picked up
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(fetchClubs, 30000);
    return () => clearInterval(interval);
  }, [user, fetchClubs]);

  // Detect newly-approved join requests and show toast
  useEffect(() => {
    if (!user || clubs.length === 0) return;
    const seenStr = localStorage.getItem("seen_approved_clubs") || "[]";
    let seen: number[] = [];
    try { seen = JSON.parse(seenStr); } catch { seen = []; }
    const newlyApproved = clubs.filter(
      c => c.my_status === "approved" && !c.is_creator && !seen.includes(c.id)
    );
    if (newlyApproved.length > 0) {
      const first = newlyApproved[0];
      setToast({
        msg: `🎉 You're now a member of ${first.name}!`,
        clubId: first.id,
      });
      // Mark all as seen so the toast doesn't keep firing
      const updated = [...seen, ...newlyApproved.map(c => c.id)];
      localStorage.setItem("seen_approved_clubs", JSON.stringify(updated));
    }
  }, [clubs, user]);

  // Show toast when news unread increases
  useEffect(() => {
    if (newsUnread > prevNewsRef.current && prevNewsRef.current >= 0) {
      setToast({ msg: `${newsUnread} new post${newsUnread !== 1 ? "s" : ""} in News` });
    }
    prevNewsRef.current = newsUnread;
  }, [newsUnread]);

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

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

  // Fixed category lists per tab — clubs use subject categories, communities use group types
  const categoryList = activeTab === "club" ? CLUB_CATEGORIES : COMMUNITY_CATEGORIES;
  const categories = ["all", ...categoryList];

  const filtered = tabClubs
    .filter(c => {
      const matchCat = activeCategory === "all" || c.category.toLowerCase() === activeCategory.toLowerCase();
      const matchSearch = !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.description || "").toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    })
    .sort((a, b) => {
      // Priority: creator (2) > joined (1) > pending (0.5) > none (0)
      const rank = (c: Club) => c.is_creator ? 3 : c.my_status === "approved" ? 2 : c.my_status === "pending" ? 1 : 0;
      const diff = rank(b) - rank(a);
      if (diff !== 0) return diff;
      // Within same rank: most members first
      return b.member_count - a.member_count;
    });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Toast notification */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-5 py-3 rounded-2xl bg-indigo-600 text-white shadow-2xl shadow-indigo-500/30 animate-fade-in cursor-pointer select-none"
          onClick={() => {
            setToast(null);
            if (toast.clubId) {
              // Navigate to the club's detail page chat tab
              window.location.href = `/community/${toast.clubId}`;
            } else {
              setActiveTabMain("news");
            }
          }}
        >
          <span className="w-2 h-2 rounded-full bg-white animate-pulse shrink-0" />
          <span className="text-sm font-medium">{toast.msg}</span>
          <button
            onClick={e => { e.stopPropagation(); setToast(null); }}
            className="ml-1 text-white/60 hover:text-white text-xs"
          >✕</button>
        </div>
      )}
      {showCreate && <CreateClubModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
      {manageClub && <ManageModal club={manageClub} onClose={() => setManageClub(null)} onUpdate={fetchClubs} />}

      <main className="pt-16 pb-20 md:pb-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-start justify-between mb-5 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Badge variant="violet" className="text-xs">JBNU</Badge>
                <Badge variant="default" className="text-xs">International Students</Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">Community & Clubs</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Join clubs, connect with students, and build your network.</p>
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
            ] as const).map(tab => (
              <button key={tab.key}
                onClick={() => {
                  if (tab.key !== "news") setActiveTab(tab.key as "club" | "community");
                  setActiveCategory("all");  // always reset filter on tab switch
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
                    ({loading && counts
                      ? tab.key === "club" ? counts.clubs : counts.communities
                      : clubs.filter(c => (c.club_type || "club") === tab.key).length})
                  </span>
                )}
                {/* News unread badge only */}
                {tab.key === "news" && newsUnread > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-0.5">
                    {newsUnread > 9 ? "9+" : newsUnread}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* News tab */}
          {activeTabMain === "news" && (
            <div className="max-w-2xl">
              <PostFeed />
            </div>
          )}

          {/* Clubs / Community tab */}
          {activeTabMain !== "news" && <>
            {/* Mobile: horizontal category scroll */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 mb-4 lg:hidden">
              {categories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className={`shrink-0 px-3.5 py-2 rounded-full text-sm font-medium transition-all border ${
                    activeCategory === cat
                      ? "bg-indigo-500/15 text-indigo-400 border-indigo-500/30"
                      : "text-muted-foreground bg-white/5 border-white/10 hover:border-white/20"
                  }`}>
                  {cat === "all" ? "All" : cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar — desktop only */}
            <div className="lg:col-span-1 hidden lg:block">
              <div className="sticky top-24 space-y-4">
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 px-1">Category</h2>
                  <div className="space-y-0.5">
                    {categories.map(cat => (
                      <button key={cat} onClick={() => setActiveCategory(cat)}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all ${
                          activeCategory === cat ? "bg-indigo-500/10 text-indigo-400" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                        }`}>
                        <Globe size={13} />
                        <span className="font-medium capitalize">{cat === "all" ? "All Clubs" : cat}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-4 rounded-2xl border border-white/8 bg-white/3 text-xs text-muted-foreground space-y-2">
                  <p className="font-semibold text-foreground">How it works</p>
                  <p>Click <strong>Join</strong> on any club or community — you&apos;re in instantly.</p>
                  <p>Once you join, you can chat with members and see the KakaoTalk group link and contact details.</p>
                </div>
              </div>
            </div>

            {/* Main */}
            <div className="lg:col-span-3 space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={`Search ${activeTab === "club" ? "clubs" : "communities"}...`}
                    className="w-full pl-9 h-10 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all"
                  />
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => <ClubSkeleton key={i} />)}
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
                  />
                ))}
              </div>
            </div>
          </div>
          </>}

        </div>
      </main>
      <Footer />
    </div>
  );
}
