"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/layout/navbar";
import Link from "next/link";
import {
  ArrowLeft, Users, MessageSquare, Info, Globe, MapPin, Clock,
  Phone, Link as LinkIcon, Send, Loader2, CornerUpLeft, X, Lock,
  ExternalLink, CheckCircle2, Crown, Settings,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { formatRelativeTime } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("icon_token") : null;
}

function getClubCoverUrl(club: { id: number; name: string; category: string; club_type?: string; country?: string | null }): string {
  const name = club.name.toLowerCase();
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
    if (regex.test(name)) return `https://loremflickr.com/600/200/${kw}?lock=${club.id}`;
  }
  const catKw: Record<string, string> = {
    sports: "sports,stadium", academic: "university,studying",
    culture: "culture,art", social: "people,friends",
    language: "language,study", tech: "technology,computer",
    arts: "art,creative", volunteer: "volunteer,community",
    "national community": club.country ? `${club.country.toLowerCase().split(" ")[0]},culture` : "international,flag",
    "religion & culture": "culture,tradition", "support & community": "community,people",
  };
  const kw = catKw[club.category?.toLowerCase()] || "students,university,korea";
  return `https://loremflickr.com/600/200/${kw}?lock=${club.id}`;
}

async function apiFetch(method: string, path: string, body?: object) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

interface Club {
  id: number;
  name: string;
  description: string;
  category: string;
  university: string;
  meeting_time: string;
  location: string;
  member_count: number;
  pending_count: number;
  my_status: "pending" | "approved" | null;
  is_creator: boolean;
  creator_name: string | null;
  club_type: "club" | "community";
  country: string | null;
  website: string;
  cover_image: string;
  kakao_link: string | null;
  contact: string | null;
  created_at: string;
}

interface ChatMessage {
  id: number;
  club_id: number;
  user_id: number;
  author_name: string;
  content: string;
  reply_to_id: number | null;
  reply_to_name: string | null;
  reply_to_content: string | null;
  created_at: string;
}

interface Member {
  membership_id: number | null;
  user_id: number;
  name: string;
  university: string;
  country: string;
  visa_type: string;
  joined_at: string;
}

const AVATAR_GRADIENTS = [
  "from-indigo-500 to-violet-600",
  "from-emerald-500 to-cyan-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-500",
  "from-sky-500 to-blue-600",
  "from-violet-500 to-purple-600",
  "from-teal-500 to-emerald-600",
  "from-fuchsia-500 to-pink-600",
];

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const CATEGORY_COLORS: Record<string, string> = {
  academic:            "text-indigo-500 bg-indigo-500/10 border-indigo-500/25",
  sports:              "text-emerald-500 bg-emerald-500/10 border-emerald-500/25",
  culture:             "text-violet-500 bg-violet-500/10 border-violet-500/25",
  social:              "text-cyan-500 bg-cyan-500/10 border-cyan-500/25",
  language:            "text-amber-500 bg-amber-500/10 border-amber-500/25",
  tech:                "text-blue-500 bg-blue-500/10 border-blue-500/25",
  arts:                "text-pink-500 bg-pink-500/10 border-pink-500/25",
  volunteer:           "text-orange-500 bg-orange-500/10 border-orange-500/25",
  "national community":"text-violet-500 bg-violet-500/10 border-violet-500/25",
  "religion & culture":"text-amber-500 bg-amber-500/10 border-amber-500/25",
  "support & community":"text-emerald-500 bg-emerald-500/10 border-emerald-500/25",
};

// ── Manage Requests Modal ─────────────────────────────────────
function ManageModal({
  club,
  onClose,
  onUpdate,
}: {
  club: Club;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [requests, setRequests] = useState<
    { membership_id: number; user_id: number; name: string; university: string; country: string; visa_type: string }[]
  >([]);
  const [busy, setBusy] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("GET", `/clubs/${club.id}/requests`).then((d) => {
      setRequests(d.requests || []);
      setLoading(false);
    });
  }, [club.id]);

  const handle = async (userId: number, action: "approve" | "reject") => {
    setBusy(userId);
    await apiFetch("POST", `/clubs/${club.id}/${action}/${userId}`);
    setRequests((prev) => prev.filter((r) => r.user_id !== userId));
    setBusy(null);
    onUpdate();
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#0e0e1a] border border-white/12 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <h2 className="text-sm font-bold text-white">
            Manage — {club.name}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/8"
          >
            <X size={15} />
          </button>
        </div>
        <div className="p-5">
          <p className="text-xs font-semibold text-white/45 uppercase tracking-widest mb-3">
            Join Requests ({requests.length})
          </p>
          {loading && (
            <div className="flex justify-center py-6">
              <Loader2 size={18} className="animate-spin text-white/40" />
            </div>
          )}
          {!loading && requests.length === 0 && (
            <p className="text-sm text-white/50 text-center py-6">
              No pending requests.
            </p>
          )}
          <div className="space-y-3">
            {requests.map((r) => (
              <div
                key={r.user_id}
                className="p-3.5 rounded-xl border border-white/8 bg-white/3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {r.name}
                    </p>
                    <p className="text-xs text-white/50 mt-0.5">
                      {r.university}
                      {r.country ? ` · ${r.country}` : ""}
                      {r.visa_type ? ` · ${r.visa_type}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => handle(r.user_id, "approve")}
                      disabled={busy === r.user_id}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-medium hover:bg-emerald-500/25 transition-colors disabled:opacity-50"
                    >
                      {busy === r.user_id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        "Accept"
                      )}
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

// ── Main Page ─────────────────────────────────────────────────
export default function CommunityDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const clubId = parseInt(params.id as string);

  const [club, setClub] = useState<Club | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [tab, setTab] = useState<"chat" | "members" | "about">("chat");
  const [joining, setJoining] = useState(false);
  const [showManage, setShowManage] = useState(false);

  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const lastIdRef = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Members
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // ── Fetch club ──
  const fetchClub = useCallback(async () => {
    try {
      const d = await apiFetch("GET", `/clubs/${clubId}`);
      if (d.error) {
        setPageError(d.error);
        setPageLoading(false);
        return;
      }
      setClub(d.club);
    } catch {
      setPageError("Failed to load.");
    } finally {
      setPageLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    fetchClub();
  }, [fetchClub]);

  // ── Chat: fetch messages ──
  const fetchMessages = useCallback(
    async (after = 0) => {
      if (!club) return;
      const ok = club.my_status === "approved" || club.is_creator;
      if (!ok) return;
      const res = await fetch(`${API}/clubs/${clubId}/chat?after=${after}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) return;
      const d = await res.json();
      const msgs: ChatMessage[] = d.messages || [];
      if (msgs.length > 0) {
        setMessages((prev) => {
          const ids = new Set(prev.map((m) => m.id));
          return [...prev, ...msgs.filter((m) => !ids.has(m.id))];
        });
        lastIdRef.current = msgs[msgs.length - 1].id;
      }
      setChatLoading(false);
    },
    [club, clubId]
  );

  useEffect(() => {
    if (!club) return;
    const ok = club.my_status === "approved" || club.is_creator;
    if (ok && tab === "chat") {
      setChatLoading(messages.length === 0);
      fetchMessages(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [club?.id, club?.my_status, club?.is_creator, tab]);

  // Poll every 4s
  useEffect(() => {
    if (!club) return;
    const ok = club.my_status === "approved" || club.is_creator;
    if (!ok) return;
    const id = setInterval(() => fetchMessages(lastIdRef.current), 4000);
    return () => clearInterval(id);
  }, [club, fetchMessages]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Members ──
  const fetchMembers = useCallback(async () => {
    if (!club) return;
    const ok = club.my_status === "approved" || club.is_creator;
    if (!ok) return;
    setMembersLoading(true);
    const d = await apiFetch("GET", `/clubs/${clubId}/members`);
    setMembers(d.members || []);
    setMembersLoading(false);
  }, [club, clubId]);

  useEffect(() => {
    if (tab === "members") fetchMembers();
  }, [tab, fetchMembers]);

  // ── Join / Leave ──
  const handleJoin = async () => {
    if (!club) return;
    setJoining(true);
    const ok = club.my_status === "approved" || club.is_creator;
    const path = ok ? `/clubs/${club.id}/leave` : `/clubs/${club.id}/request`;
    const d = await apiFetch("POST", path);
    if (d.club) setClub(d.club);
    setJoining(false);
  };

  // ── Send message ──
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending || !club) return;
    setSending(true);
    const body: { content: string; reply_to_id?: number } = { content: text };
    if (replyTo) body.reply_to_id = replyTo.id;
    const d = await apiFetch("POST", `/clubs/${club.id}/chat`, body);
    if (d.message) {
      setMessages((prev) => [...prev, d.message]);
      lastIdRef.current = d.message.id;
      setInput("");
      setReplyTo(null);
    }
    setSending(false);
  };

  // Focus input when replying
  useEffect(() => {
    if (replyTo) inputRef.current?.focus();
  }, [replyTo]);

  // ── Loading / Error states ──
  if (pageLoading)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );

  if (pageError || !club)
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <p className="text-muted-foreground">{pageError || "Club not found."}</p>
        <Link
          href="/community"
          className="text-sm text-indigo-500 hover:text-indigo-400 transition-colors"
        >
          ← Back to Community
        </Link>
      </div>
    );

  const isApproved = club.my_status === "approved" || club.is_creator;
  const isPending = club.my_status === "pending";
  const isCC = club.club_type === "community";
  const colorCls = CATEGORY_COLORS[club.category] || CATEGORY_COLORS.social;
  const locationDisplay = isCC
    ? club.country || club.location || "South Korea"
    : club.university;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {showManage && club.is_creator && (
        <ManageModal
          club={club}
          onClose={() => setShowManage(false)}
          onUpdate={fetchClub}
        />
      )}

      <main className="pt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          {/* Back */}
          <Link
            href="/community"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5 group"
          >
            <ArrowLeft
              size={14}
              className="group-hover:-translate-x-0.5 transition-transform"
            />
            Back to Community
          </Link>

          {/* ── Hero header ── */}
          <div className="rounded-2xl border border-border overflow-hidden mb-6">
            {/* Cover image */}
            {(() => {
              const coverUrl = club.cover_image || getClubCoverUrl(club);
              return (
                <div className="relative h-36 sm:h-44 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverUrl}
                    alt={club.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/icom-${club.id}/800/250`; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/70" />
                </div>
              );
            })()}
            <div className={`p-6 sm:p-8 -mt-0 ${isCC ? "bg-gradient-to-br from-violet-950/40 to-indigo-950/30" : "bg-gradient-to-br from-indigo-950/40 to-cyan-950/30"}`}>
              <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                {/* Avatar */}
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black shrink-0 shadow-lg ${
                    isCC
                      ? "bg-gradient-to-br from-violet-500 to-indigo-600"
                      : "bg-gradient-to-br from-indigo-500 to-cyan-600"
                  }`}
                >
                  {club.name[0]?.toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span
                      className={`text-[11px] px-2.5 py-1 rounded-full border font-semibold capitalize ${colorCls}`}
                    >
                      {club.category}
                    </span>
                    <span
                      className={`text-[11px] px-2.5 py-1 rounded-full border font-semibold ${
                        isCC
                          ? "text-violet-400 bg-violet-500/10 border-violet-500/20"
                          : "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
                      }`}
                    >
                      {isCC ? "🌍 Community" : "🎓 Club"}
                    </span>
                    {isApproved && (
                      <span className="text-[11px] px-2.5 py-1 rounded-full border text-emerald-400 bg-emerald-500/10 border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle2 size={10} /> Joined
                      </span>
                    )}
                    {isPending && (
                      <span className="text-[11px] px-2.5 py-1 rounded-full border text-amber-400 bg-amber-500/10 border-amber-500/20">
                        Pending approval
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                    {club.name}
                  </h1>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <Users size={12} />
                      {club.member_count} member
                      {club.member_count !== 1 ? "s" : ""}
                    </span>
                    {locationDisplay && (
                      <span className="flex items-center gap-1.5">
                        <MapPin size={12} />
                        {locationDisplay}
                      </span>
                    )}
                    {club.creator_name && (
                      <span>by {club.creator_name}</span>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {club.is_creator && (
                    <button
                      onClick={() => setShowManage(true)}
                      className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-amber-400 hover:border-amber-500/30 transition-all"
                    >
                      <Settings size={14} />
                      Manage
                      {club.pending_count > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
                          {club.pending_count}
                        </span>
                      )}
                    </button>
                  )}
                  {user && !club.is_creator && (
                    <button
                      onClick={handleJoin}
                      disabled={joining || isPending}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-60 ${
                        isApproved
                          ? "border border-border text-muted-foreground hover:text-red-400 hover:border-red-500/30"
                          : isPending
                          ? "border border-amber-500/20 text-amber-400 cursor-default"
                          : "bg-indigo-500 text-white hover:bg-indigo-600 shadow-sm"
                      }`}
                    >
                      {joining && (
                        <Loader2 size={14} className="animate-spin" />
                      )}
                      {isApproved
                        ? "Leave"
                        : isPending
                        ? "Pending…"
                        : "Request to Join"}
                    </button>
                  )}
                  {!user && (
                    <Link
                      href="/login"
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors"
                    >
                      Sign in to Join
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Tabs ── */}
          <div className="flex gap-1 p-1 rounded-xl bg-muted/50 border border-border mb-6 w-fit">
            {(
              [
                { key: "chat", icon: MessageSquare, label: "Chat" },
                {
                  key: "members",
                  icon: Users,
                  label: `Members (${club.member_count})`,
                },
                { key: "about", icon: Info, label: "About" },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === t.key
                    ? "bg-background shadow-sm text-foreground border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <t.icon size={14} />
                {t.label}
              </button>
            ))}
          </div>

          {/* ══════════════════════════════
               CHAT TAB
          ══════════════════════════════ */}
          {tab === "chat" && (
            <div
              className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col"
              style={{
                height: "calc(100vh - 360px)",
                minHeight: "480px",
              }}
            >
              {!isApproved ? (
                /* Locked */
                <div className="flex flex-col items-center justify-center flex-1 gap-5 p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                    <Lock size={24} className="text-muted-foreground/50" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-foreground mb-1">
                      Members only
                    </p>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      {isPending
                        ? "Your request is pending. The creator will approve you soon!"
                        : "Join this community to chat with other members."}
                    </p>
                  </div>
                  {!isPending && user && (
                    <button
                      onClick={handleJoin}
                      disabled={joining}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors"
                    >
                      {joining && (
                        <Loader2 size={14} className="animate-spin" />
                      )}
                      Request to Join
                    </button>
                  )}
                  {!user && (
                    <Link
                      href="/login"
                      className="px-5 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors"
                    >
                      Sign in to Join
                    </Link>
                  )}
                </div>
              ) : (
                /* Chat UI */
                <>
                  {/* Messages area */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                    {chatLoading && (
                      <div className="flex justify-center pt-10">
                        <Loader2
                          size={20}
                          className="animate-spin text-muted-foreground"
                        />
                      </div>
                    )}
                    {!chatLoading && messages.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-16">
                        <MessageSquare
                          size={32}
                          className="text-muted-foreground/25"
                        />
                        <p className="text-sm text-muted-foreground">
                          No messages yet.{" "}
                          <span className="font-medium text-foreground">
                            Say hello!
                          </span>{" "}
                          👋
                        </p>
                      </div>
                    )}

                    {messages.map((m) => {
                      const isMe = m.user_id === user?.id;
                      const grad =
                        AVATAR_GRADIENTS[m.user_id % AVATAR_GRADIENTS.length];
                      return (
                        <div
                          key={m.id}
                          className={`group flex gap-3 ${
                            isMe ? "flex-row-reverse" : ""
                          }`}
                        >
                          {/* Avatar */}
                          <div
                            className={`w-9 h-9 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-white text-[11px] font-bold shrink-0 mt-0.5 shadow-sm`}
                          >
                            {initials(m.author_name)}
                          </div>

                          {/* Bubble column */}
                          <div
                            className={`max-w-[68%] sm:max-w-[60%] flex flex-col gap-1 ${
                              isMe ? "items-end" : "items-start"
                            }`}
                          >
                            {/* Name + time */}
                            <div className="flex items-center gap-2">
                              {!isMe && (
                                <span className="text-xs font-semibold text-foreground">
                                  {m.author_name}
                                </span>
                              )}
                              <span className="text-[10px] text-muted-foreground">
                                {formatRelativeTime(m.created_at)}
                              </span>
                            </div>

                            {/* Reply preview */}
                            {m.reply_to_name && (
                              <div
                                className={`text-[11px] px-3 py-1.5 rounded-xl border w-full ${
                                  isMe
                                    ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                                    : "bg-muted border-border text-muted-foreground"
                                }`}
                              >
                                <span className="font-semibold">
                                  ↩ {m.reply_to_name}:{" "}
                                </span>
                                <span className="opacity-70 line-clamp-1">
                                  {m.reply_to_content}
                                </span>
                              </div>
                            )}

                            {/* Message bubble */}
                            <div
                              className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                                isMe
                                  ? "bg-indigo-500 text-white rounded-tr-sm"
                                  : "bg-muted text-foreground rounded-tl-sm"
                              }`}
                            >
                              {m.content}
                            </div>

                            {/* Reply button */}
                            <button
                              onClick={() => setReplyTo(m)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-muted-foreground hover:text-indigo-400 px-1 mt-0.5"
                            >
                              <CornerUpLeft size={11} /> Reply
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>

                  {/* Reply preview bar */}
                  {replyTo && (
                    <div className="flex items-center gap-3 px-4 py-2.5 border-t border-border bg-muted/40">
                      <CornerUpLeft
                        size={13}
                        className="text-indigo-400 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold text-indigo-400">
                          {replyTo.author_name}{" "}
                        </span>
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {replyTo.content}
                        </span>
                      </div>
                      <button
                        onClick={() => setReplyTo(null)}
                        className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors shrink-0"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  )}

                  {/* Input row */}
                  <div className="px-4 py-3 border-t border-border shrink-0">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl bg-gradient-to-br ${
                          AVATAR_GRADIENTS[
                            (user?.id || 0) % AVATAR_GRADIENTS.length
                          ]
                        } flex items-center justify-center text-white text-[11px] font-bold shrink-0`}
                      >
                        {user ? initials(user.name) : "?"}
                      </div>
                      <input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && !e.shiftKey && sendMessage()
                        }
                        placeholder={
                          replyTo
                            ? `Reply to ${replyTo.author_name}…`
                            : "Write a message…"
                        }
                        className="flex-1 bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
                      />
                      <button
                        onClick={sendMessage}
                        disabled={sending || !input.trim()}
                        className="p-2.5 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition-colors disabled:opacity-40"
                      >
                        {sending ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <Send size={15} />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ══════════════════════════════
               MEMBERS TAB
          ══════════════════════════════ */}
          {tab === "members" && (
            <div>
              {!isApproved ? (
                <div className="rounded-2xl border border-border bg-card p-14 text-center">
                  <Lock
                    size={28}
                    className="text-muted-foreground/30 mx-auto mb-3"
                  />
                  <p className="text-sm text-muted-foreground">
                    Join this community to see who else is a member.
                  </p>
                </div>
              ) : membersLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2
                    size={20}
                    className="animate-spin text-muted-foreground"
                  />
                </div>
              ) : members.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-14 text-center">
                  <Users
                    size={28}
                    className="text-muted-foreground/30 mx-auto mb-3"
                  />
                  <p className="text-sm text-muted-foreground">
                    No approved members yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {members.map((m) => {
                    const grad =
                      AVATAR_GRADIENTS[m.user_id % AVATAR_GRADIENTS.length];
                    const isCreator = m.name.includes("(Creator)");
                    const displayName = m.name.replace(" (Creator)", "");
                    return (
                      <div
                        key={m.user_id}
                        className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card hover:border-indigo-500/20 hover:shadow-sm transition-all"
                      >
                        <div
                          className={`w-11 h-11 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm`}
                        >
                          {initials(displayName)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {displayName}
                            </p>
                            {isCreator && (
                              <Crown
                                size={11}
                                className="text-amber-400 shrink-0"
                              />
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {[m.country, m.university, m.visa_type]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════
               ABOUT TAB
          ══════════════════════════════ */}
          {tab === "about" && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Description — wider */}
              <div className="md:col-span-3 p-5 rounded-2xl border border-border bg-card">
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  About this {isCC ? "community" : "club"}
                </h3>
                {club.description ? (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {club.description}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No description yet.
                  </p>
                )}
              </div>

              {/* Details sidebar */}
              <div className="md:col-span-2 space-y-3">
                <div className="p-5 rounded-2xl border border-border bg-card space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">
                    Details
                  </h3>
                  {club.meeting_time && (
                    <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <Clock
                        size={14}
                        className="text-indigo-400 shrink-0 mt-0.5"
                      />
                      <span>{club.meeting_time}</span>
                    </div>
                  )}
                  {club.location && (
                    <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <MapPin
                        size={14}
                        className="text-violet-400 shrink-0 mt-0.5"
                      />
                      <span>{club.location}</span>
                    </div>
                  )}
                  {locationDisplay && (
                    <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <Globe
                        size={14}
                        className="text-cyan-400 shrink-0 mt-0.5"
                      />
                      <span>{locationDisplay}</span>
                    </div>
                  )}
                  {club.website && (
                    <a
                      href={club.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      <ExternalLink size={14} />
                      Official Website →
                    </a>
                  )}
                </div>

                {/* Members-only info */}
                {isApproved && (club.kakao_link || club.contact) && (
                  <div className="p-5 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 space-y-3">
                    <h3 className="text-sm font-semibold text-indigo-400 flex items-center gap-1.5">
                      <Lock size={12} /> Members-only
                    </h3>
                    {club.kakao_link && (
                      <div className="flex items-center gap-2.5 text-sm">
                        <LinkIcon
                          size={13}
                          className="text-indigo-400 shrink-0"
                        />
                        <a
                          href={
                            club.kakao_link.startsWith("http")
                              ? club.kakao_link
                              : `https://${club.kakao_link}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          KakaoTalk Group →
                        </a>
                      </div>
                    )}
                    {club.contact && (
                      <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                        <Phone size={13} className="shrink-0" />
                        <span>{club.contact}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
