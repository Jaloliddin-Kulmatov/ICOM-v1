"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { formatRelativeTime } from "@/lib/utils";
import { UNIVERSITIES } from "@/lib/constants";
import {
  MessageSquare, Plus, ImageIcon, X, Loader2, Sparkles,
  AlertCircle, ShieldCheck, ArrowRight, Search, MapPin,
  Globe2, GraduationCap,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

// Korean translations of cities/provinces — same map as the jobs page so we
// can match posts that mention "전주" or "전라북도" instead of the English name.
const CITY_KO: Record<string, string> = {
  Jeonju: "전주", Iksan: "익산", Gunsan: "군산",
  Seoul: "서울", Incheon: "인천", Suwon: "수원",
  Daejeon: "대전", Daegu: "대구", Gwangju: "광주",
  Busan: "부산", Ulsan: "울산", Sejong: "세종",
  Pohang: "포항", Changwon: "창원", Yongin: "용인",
  Chuncheon: "춘천", Cheongju: "청주", Cheonan: "천안",
  Gongju: "공주", Jinju: "진주", Gimhae: "김해",
  Mokpo: "목포", Suncheon: "순천", Jeju: "제주",
  Ansan: "안산", Seongnam: "성남", Gyeongsan: "경산",
  Wonju: "원주",
};
const PROVINCE_KO: Record<string, string> = {
  "Jeollabuk-do": "전라북도",
  "Jeollanam-do": "전라남도",
  "Gyeonggi-do":  "경기도",
  "Gangwon-do":   "강원도",
  "Chungcheong":  "충청도",
  "Gyeongsang":   "경상도",
  "Jeju-do":      "제주도",
};

interface ChatPost {
  id: number;
  user_id: number;
  author_name: string;
  author_university: string;
  author_country: string;
  title: string;
  content: string;
  image_url: string;
  // "" = global (All Korea). A university token (e.g. "jbnu") = visible only
  // inside that university's chat, never in the global feed.
  scope: string;
  answer_count: number;
  created_at: string;
}

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("icon_token") : null;
}

// Resize a File to a max width of 1024px and return a base64 data URL
// (under ~450KB so it fits inside our backend's 600KB limit).
async function fileToCompressedDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Not a valid image"));
      img.onload = () => {
        const maxW = 1024;
        const scale = img.width > maxW ? maxW / img.width : 1;
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas unavailable"));
        ctx.drawImage(img, 0, 0, w, h);
        // Try 0.8 quality; bump down if too big
        let q = 0.8;
        let out = canvas.toDataURL("image/jpeg", q);
        while (out.length > 450_000 && q > 0.3) {
          q -= 0.1;
          out = canvas.toDataURL("image/jpeg", q);
        }
        resolve(out);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function ChatPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<ChatPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  // Two-tab view: "all" shows every question, "uni" filters to questions
  // from students at the user's university (e.g. JBNU Chat). Defaults to
  // "all" when the user has no university or isn't signed in.
  const [tab, setTab] = useState<"all" | "uni">("all");

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/chat/posts`);
      const data = await res.json();
      setPosts(data.posts || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  // Resolve the signed-in user's university to a region (city + province +
  // Korean translations + university name variants). Used to surface posts
  // from your area first — JBNU students see Jeonju / Jeollabuk-do questions
  // before random Seoul ones.
  const myRegion = useMemo(() => {
    const raw = (user?.university || "").trim();
    if (!raw) return null;
    const lc = raw.toLowerCase();
    const uni = UNIVERSITIES.find(
      (u) =>
        u.id.toLowerCase() === lc ||
        u.shortName.toLowerCase() === lc ||
        u.name.toLowerCase() === lc
    );
    if (!uni) return null;
    return {
      uniLabel: uni.shortName,
      uniTokens: [uni.id, uni.shortName, uni.name]
        .filter(Boolean).map((s) => s.toLowerCase()),
      cityTokens: [uni.city, CITY_KO[uni.city] ?? ""]
        .filter(Boolean).map((s) => s.toLowerCase()),
      provinceTokens: [uni.province, PROVINCE_KO[uni.province] ?? ""]
        .filter(Boolean).map((s) => s.toLowerCase()),
    };
  }, [user?.university]);

  // Posts that mention your university/city/province bubble to the top.
  //   +3 university (incl. shortName + Korean name)
  //   +2 city  (e.g. "Jeonju" / "전주")
  //   +1 province (e.g. "Jeollabuk-do" / "전라북도")
  // Ties break on created_at (newest first), which is what the backend
  // already returns — so when myRegion is null the order is unchanged.
  const rankPost = useCallback((p: ChatPost): number => {
    if (!myRegion) return 0;
    const hay = `${p.title} ${p.content} ${p.author_university} ${p.author_country}`.toLowerCase();
    let score = 0;
    if (myRegion.uniTokens.some((t) => hay.includes(t))) score += 3;
    if (myRegion.cityTokens.some((t) => hay.includes(t))) score += 2;
    if (myRegion.provinceTokens.some((t) => hay.includes(t))) score += 1;
    return score;
  }, [myRegion]);

  const sortedPosts = useMemo(() => {
    if (!myRegion) return posts;
    // Stable sort by score desc, falling back to original (newest-first) order
    return [...posts]
      .map((p, idx) => ({ p, idx, score: rankPost(p) }))
      .sort((a, b) => (b.score - a.score) || (a.idx - b.idx))
      .map((x) => x.p);
  }, [posts, myRegion, rankPost]);

  // True when a post's scope targets *my* university (so it belongs in my
  // "{UNI} Chat" tab). Tolerant match against id / shortName / full name.
  const scopeMatchesMyUni = useCallback((scope: string): boolean => {
    if (!myRegion) return false;
    const s = (scope || "").toLowerCase().trim();
    if (!s) return false;
    return myRegion.uniTokens.some((t) => s === t || s.includes(t) || t.includes(s));
  }, [myRegion]);

  // The global feed ("All Korea") shows ONLY posts with no scope. Posts written
  // inside a university chat (non-empty scope) are deliberately excluded here —
  // they're private to that university and never leak into the global feed,
  // even for students of other universities or signed-out visitors.
  const allKoreaPosts = useMemo(
    () => sortedPosts.filter((p) => !(p.scope || "").trim()),
    [sortedPosts]
  );

  // My university chat: posts scoped to my university.
  const uniPosts = useMemo(
    () => (myRegion ? sortedPosts.filter((p) => scopeMatchesMyUni(p.scope)) : []),
    [sortedPosts, myRegion, scopeMatchesMyUni]
  );

  const localPostCount = useMemo(
    () => (myRegion ? allKoreaPosts.filter((p) => rankPost(p) > 0).length : 0),
    [allKoreaPosts, myRegion, rankPost]
  );

  // Pick the feed for the active tab, then apply the search filter.
  const tabFilteredPosts = tab === "uni" && myRegion ? uniPosts : allKoreaPosts;

  const visiblePosts = !search
    ? tabFilteredPosts
    : tabFilteredPosts.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.content.toLowerCase().includes(search.toLowerCase())
      );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16 pb-20 md:pb-10">
        {/* Header */}
        <div className="border-b border-border bg-gradient-to-b from-indigo-500/5 to-transparent">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
            <Badge variant="default" className="mb-3 text-xs px-3 py-1 gap-1.5">
              <Sparkles size={11} className="text-violet-400" /> Community Q&A
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-2">
              Ask the community
            </h1>
            <p className="text-muted-foreground text-sm max-w-xl">
              Stuck on something? Ask a question — international students who&apos;ve
              been there will share their experience.
            </p>

            {myRegion && localPostCount > 0 && tab === "all" && (
              <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-indigo-500 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full">
                <MapPin size={11} />
                Showing {localPostCount} question{localPostCount === 1 ? "" : "s"} from your area first ({myRegion.uniLabel})
              </div>
            )}

            {myRegion && tab === "uni" && (
              <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-indigo-500 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full">
                <GraduationCap size={11} />
                Private to {myRegion.uniLabel} students — these questions aren&apos;t shown in All Korea
              </div>
            )}

            {/* Tabs — only render when the user belongs to a recognised
                university. Tabs let you switch between the global feed and
                a uni-only feed (e.g. "JBNU Chat"). */}
            {myRegion && (
              <div className="mt-5 inline-flex items-center gap-1 p-1 rounded-xl border border-border bg-card">
                <button
                  onClick={() => setTab("all")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    tab === "all"
                      ? "bg-indigo-500/15 text-indigo-500"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Globe2 size={12} />
                  All Korea
                  <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${
                    tab === "all" ? "bg-indigo-500/20" : "bg-muted"
                  }`}>{allKoreaPosts.length}</span>
                </button>
                <button
                  onClick={() => setTab("uni")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    tab === "uni"
                      ? "bg-indigo-500/15 text-indigo-500"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <GraduationCap size={12} />
                  {myRegion.uniLabel} Chat
                  <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${
                    tab === "uni" ? "bg-indigo-500/20" : "bg-muted"
                  }`}>{uniPosts.length}</span>
                </button>
              </div>
            )}

            <div className="mt-6 flex gap-3 flex-col sm:flex-row">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search questions…"
                  className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all"
                />
              </div>
              {user ? (
                <button
                  onClick={() => setShowComposer(true)}
                  className="h-10 px-4 rounded-xl bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 transition-colors flex items-center gap-2 justify-center shrink-0"
                >
                  <Plus size={14} /> Ask a question
                </button>
              ) : (
                <Link
                  href="/login?force=1"
                  className="h-10 px-4 rounded-xl bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 transition-colors flex items-center gap-2 justify-center shrink-0"
                >
                  Sign in to ask
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-3">
          {loading ? (
            <div className="text-center py-16">
              <Loader2 size={24} className="animate-spin text-muted-foreground mx-auto" />
            </div>
          ) : visiblePosts.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              {search
                ? `No questions matching "${search}".`
                : tab === "uni" && myRegion
                  ? `No questions yet from ${myRegion.uniLabel} students. Be the first to ask!`
                  : "No questions yet. Be the first to ask!"}
            </div>
          ) : (
            visiblePosts.map((p) => {
              const isLocal = rankPost(p) > 0;
              return (
              <Link
                key={p.id}
                href={`/chat/${p.id}`}
                className={`block p-4 sm:p-5 rounded-2xl border bg-card hover:shadow-sm transition-all ${
                  isLocal
                    ? "border-indigo-500/30 ring-1 ring-indigo-500/10"
                    : "border-border hover:border-indigo-500/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {p.author_name[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1 flex-wrap">
                      <span className="font-medium text-foreground">{p.author_name}</span>
                      {p.author_university && <span>· {p.author_university}</span>}
                      {p.author_country && <span>· {p.author_country}</span>}
                      <span>· {formatRelativeTime(p.created_at)}</span>
                      {p.scope && scopeMatchesMyUni(p.scope) ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-violet-500 bg-violet-500/10 px-1.5 py-0.5 rounded-full font-semibold">
                          <GraduationCap size={9} /> {myRegion?.uniLabel} only
                        </span>
                      ) : isLocal && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-indigo-500 bg-indigo-500/10 px-1.5 py-0.5 rounded-full font-semibold">
                          <MapPin size={9} /> Near you
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-foreground leading-snug mb-1">
                      {p.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-2">
                      {p.content}
                    </p>
                    {p.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.image_url}
                        alt=""
                        className="max-h-32 rounded-lg border border-border object-cover mb-2"
                      />
                    )}
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MessageSquare size={11} />
                        {p.answer_count} {p.answer_count === 1 ? "answer" : "answers"}
                      </span>
                      <span className="flex items-center gap-1 text-indigo-500">
                        Read & answer <ArrowRight size={11} />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
              );
            })
          )}
        </div>
      </main>

      <Footer />

      {showComposer && (
        <ComposerModal
          uniLabel={myRegion?.uniLabel ?? null}
          defaultScope={tab === "uni" && myRegion ? "uni" : "all"}
          onClose={() => setShowComposer(false)}
          onCreated={(p) => {
            setPosts((prev) => [p, ...prev]);
            setShowComposer(false);
          }}
        />
      )}
    </div>
  );
}

function ComposerModal({
  uniLabel, defaultScope, onClose, onCreated,
}: {
  uniLabel: string | null;
  defaultScope: "all" | "uni";
  onClose: () => void;
  onCreated: (post: ChatPost) => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  // Audience: "all" (global) or "uni" (only my university's chat). The uni
  // option is only offered when the user belongs to a recognised university.
  const [scope, setScope] = useState<"all" | "uni">(uniLabel ? defaultScope : "all");

  const handleImage = async (file?: File | null) => {
    if (!file) return;
    setError("");
    try {
      const dataUrl = await fileToCompressedDataURL(file);
      setImageUrl(dataUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read image");
    }
  };

  const submit = async () => {
    setError("");
    if (!title.trim() || !content.trim()) {
      setError("Please give your question a title and some context.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/chat/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          image_url: imageUrl,
          scope: scope === "uni" ? "university" : "all",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not post your question.");
        return;
      }
      onCreated(data.post);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center px-0 sm:px-4 bg-black/60 backdrop-blur-sm"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="w-full max-w-xl bg-card border border-border sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gradient-to-r from-indigo-500/10 to-violet-500/10">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Plus size={15} className="text-indigo-500" /> Ask a question
          </h2>
          <button
            onClick={() => !submitting && onClose()}
            disabled={submitting}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X size={15} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. How do I pay tuition with a foreign credit card?"
              maxLength={200}
              className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all"
            />
            <p className="text-[10px] text-muted-foreground mt-1 text-right">{title.length}/200</p>
          </div>

          {/* Audience — only shown to students with a recognised university. */}
          {uniLabel && (
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Post to</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setScope("all")}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    scope === "all"
                      ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-500"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-indigo-500/30"
                  }`}
                >
                  <Globe2 size={14} />
                  <span className="text-left leading-tight">All Korea<br /><span className="text-[10px] font-normal opacity-70">Everyone sees it</span></span>
                </button>
                <button
                  type="button"
                  onClick={() => setScope("uni")}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    scope === "uni"
                      ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-500"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-indigo-500/30"
                  }`}
                >
                  <GraduationCap size={14} />
                  <span className="text-left leading-tight">{uniLabel} Chat<br /><span className="text-[10px] font-normal opacity-70">Only {uniLabel} students</span></span>
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">Your question *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share the details — what you've tried, what you're stuck on, where you are in Korea. The more context, the better the answers."
              rows={6}
              maxLength={5000}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all resize-none"
            />
            <p className="text-[10px] text-muted-foreground mt-1 text-right">{content.length}/5000</p>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">Add a picture (optional)</label>
            {imageUrl ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="" className="w-full max-h-48 object-cover rounded-xl border border-border" />
                <button
                  onClick={() => setImageUrl("")}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors"
                  type="button"
                  aria-label="Remove image"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-border text-xs text-muted-foreground cursor-pointer hover:border-indigo-500/30 hover:text-foreground transition-all">
                <ImageIcon size={14} className="text-indigo-500" />
                Choose an image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImage(e.target.files?.[0])}
                />
              </label>
            )}
          </div>

          <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/40 border border-border text-[11px] text-muted-foreground">
            <ShieldCheck size={13} className="text-emerald-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              ICOM Chat is a safe space. Posts containing terror, violence, sexual,
              or hate content are automatically blocked and never reach the feed.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-400">
              <AlertCircle size={13} className="shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={submitting}
              className="flex-1 h-10 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={submitting || !title.trim() || !content.trim()}
              className="flex-1 h-10 rounded-xl bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <><Loader2 size={14} className="animate-spin" /> Posting…</>
              ) : (
                <><Plus size={14} /> Post question</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
