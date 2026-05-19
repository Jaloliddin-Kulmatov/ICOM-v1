"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Send, Trash2, Globe, Building2, Users, ChevronDown,
  Loader2, MessageSquare, Lock, LogIn,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

function token() {
  return typeof window !== "undefined" ? localStorage.getItem("icon_token") : null;
}

type PostAsOption = { type: "user" | "university" | "club"; label: string; club_id: number | null };

type Comment = {
  id: number; post_id: number; user_id: number;
  author_name: string; content: string; created_at: string;
};

type Post = {
  id: number; user_id: number; author_name: string;
  content: string; posted_as_type: "user" | "university" | "club";
  posted_as_label: string | null; club_id: number | null;
  created_at: string; comment_count: number;
};

function PostAsIcon({ type }: { type: string }) {
  if (type === "university") return <Building2 size={11} />;
  if (type === "club") return <Users size={11} />;
  return <Globe size={11} />;
}

// ── Inline Comments ───────────────────────────────────────────────

function PostComments({ postId, initialCount }: { postId: number; initialCount: number }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetch(`${API}/posts/${postId}/comments`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then(r => r.json())
      .then(d => { setComments(d.comments || []); setLoading(false); });
  }, [postId]);

  const addComment = async () => {
    const text = input.trim();
    if (!text || posting) return;
    setPosting(true);
    const res = await fetch(`${API}/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ content: text }),
    });
    const d = await res.json();
    if (d.comment) { setComments(prev => [...prev, d.comment]); setInput(""); }
    setPosting(false);
  };

  if (loading) {
    return (
      <div className="mt-3 pt-3 border-t border-border flex justify-center py-3">
        <Loader2 size={14} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-border space-y-2">
      {comments.length === 0 && (
        <p className="text-xs text-center text-muted-foreground py-1">No comments yet. Be the first!</p>
      )}
      {comments.map(c => (
        <div key={c.id} className="flex gap-2 items-start">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5">
            {c.author_name[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="bg-muted rounded-xl px-3 py-2 inline-block max-w-full">
              <span className="text-[10px] font-semibold text-foreground">{c.author_name} </span>
              <span className="text-xs text-foreground/80 break-words">{c.content}</span>
            </div>
            <p className="text-[9px] text-muted-foreground px-1 mt-0.5">{formatRelativeTime(c.created_at)}</p>
          </div>
        </div>
      ))}

      {user && (
        <div className="flex items-center gap-2 pt-1">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
            {user.name?.[0]?.toUpperCase() || "?"}
          </div>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && addComment()}
            placeholder="Write a comment..."
            className="flex-1 bg-muted rounded-xl px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
          />
          <button
            onClick={addComment}
            disabled={posting || !input.trim()}
            className="p-1.5 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition-colors disabled:opacity-40 shrink-0"
          >
            {posting ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Post Card ─────────────────────────────────────────────────────

function PostCard({ post, currentUserId, onDelete }: {
  post: Post; currentUserId?: number; onDelete: (id: number) => void;
}) {
  const label = post.posted_as_label || post.author_name;
  const isOwn = post.user_id === currentUserId;
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comment_count);

  const avatarLetter = label[0]?.toUpperCase() ?? "?";
  const gradients: Record<string, string> = {
    university: "from-indigo-500 to-violet-600",
    club: "from-emerald-500 to-cyan-600",
    user: "from-slate-500 to-slate-700",
  };

  return (
    <div className="p-4 rounded-2xl border border-border bg-card group">
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradients[post.posted_as_type]} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
          {avatarLetter}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-semibold text-foreground">{label}</span>
            <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium border ${
              post.posted_as_type === "university" ? "text-indigo-500 bg-indigo-500/10 border-indigo-500/20" :
              post.posted_as_type === "club"       ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" :
                                                    "text-muted-foreground bg-muted border-border"
            }`}>
              <PostAsIcon type={post.posted_as_type} />
              {post.posted_as_type}
            </span>
            {post.posted_as_type !== "user" && (
              <span className="text-[10px] text-muted-foreground">by {post.author_name}</span>
            )}
            <span className="text-[10px] text-muted-foreground ml-auto">{formatRelativeTime(post.created_at)}</span>
          </div>
          <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{post.content}</p>
        </div>
        {isOwn && (
          <button onClick={() => onDelete(post.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0">
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* Comment toggle */}
      <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center">
        <button
          onClick={() => setShowComments(v => !v)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-indigo-500 transition-colors"
        >
          <MessageSquare size={13} />
          <span>{commentCount > 0 ? `${commentCount} comment${commentCount !== 1 ? "s" : ""}` : "Comment"}</span>
          <ChevronDown size={12} className={`transition-transform ${showComments ? "rotate-180" : ""}`} />
        </button>
      </div>

      {showComments && (
        <PostComments
          postId={post.id}
          initialCount={commentCount}
        />
      )}
    </div>
  );
}

// ── Main PostFeed ─────────────────────────────────────────────────

export default function PostFeed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [locked, setLocked] = useState(false);
  const [options, setOptions] = useState<PostAsOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<PostAsOption | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const fetchPosts = useCallback(async () => {
    const t = token();
    const res = await fetch(`${API}/posts`, {
      headers: t ? { Authorization: `Bearer ${t}` } : {},
    });
    const d = await res.json();
    if (d.locked) { setLocked(true); setLoadingPosts(false); return; }
    setPosts(d.posts || []);
    setLocked(false);
    setLoadingPosts(false);
  }, []);

  const fetchOptions = useCallback(async () => {
    const t = token();
    if (!t) return;
    const res = await fetch(`${API}/posts/options`, { headers: { Authorization: `Bearer ${t}` } });
    const d = await res.json();
    const opts: PostAsOption[] = d.options || [];
    setOptions(opts);
    if (opts.length > 0 && !selectedOption) setSelectedOption(opts[0]);
  }, [selectedOption]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);
  useEffect(() => { if (user) fetchOptions(); }, [user, fetchOptions]);

  const handlePost = async () => {
    if (!content.trim() || !selectedOption) return;
    setPosting(true);
    const res = await fetch(`${API}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({
        content: content.trim(),
        posted_as_type: selectedOption.type,
        posted_as_label: selectedOption.label,
        club_id: selectedOption.club_id,
      }),
    });
    const d = await res.json();
    if (d.post) { setPosts(p => [d.post, ...p]); setContent(""); }
    setPosting(false);
  };

  const handleDelete = async (id: number) => {
    await fetch(`${API}/posts/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token()}` } });
    setPosts(p => p.filter(x => x.id !== id));
  };

  // ── Not logged in ──
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 rounded-2xl border border-border bg-card text-center px-6">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
          <LogIn size={22} className="text-indigo-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground mb-1">Sign in to view posts</p>
          <p className="text-xs text-muted-foreground">Join the ICOM community to see what&apos;s happening</p>
        </div>
        <Link href="/login" className="px-5 py-2 rounded-xl bg-indigo-500 text-white text-xs font-semibold hover:bg-indigo-600 transition-colors">
          Sign in
        </Link>
      </div>
    );
  }

  // ── Locked (no club membership yet) ──
  if (locked) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-center px-6">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
          <Lock size={22} className="text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground mb-1">Join a club to read News</p>
          <p className="text-xs text-muted-foreground">You must be a member of at least one club or community to view the News feed</p>
        </div>
        <p className="text-[11px] text-muted-foreground">← Browse clubs and hit &quot;Request to Join&quot;</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Composer — only for ambassadors and club/community owners */}
      {user && options.length === 0 && (
        <div className="p-4 rounded-2xl border border-border bg-card text-center">
          <p className="text-xs text-muted-foreground">
            Only ambassadors and club/community owners can post News.{" "}
            <Link href="/ambassador" className="text-indigo-400 hover:underline">Apply to become an ambassador →</Link>
          </p>
        </div>
      )}
      {user && selectedOption && options.length > 0 && (
        <div className="p-4 rounded-2xl border border-border bg-card space-y-3">
          {/* Post-as picker */}
          <div className="relative">
            <button
              onClick={() => setShowPicker(v => !v)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-muted/50 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              <PostAsIcon type={selectedOption.type} />
              Posting as <span className="font-bold">{selectedOption.label}</span>
              <ChevronDown size={11} className={`transition-transform ${showPicker ? "rotate-180" : ""}`} />
            </button>
            {showPicker && options.length > 1 && (
              <div className="absolute top-9 left-0 z-20 w-56 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
                {options.map((o, i) => (
                  <button
                    key={i}
                    onClick={() => { setSelectedOption(o); setShowPicker(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs text-left hover:bg-muted transition-colors ${selectedOption.label === o.label ? "text-indigo-500 bg-indigo-500/5" : "text-foreground"}`}
                  >
                    <PostAsIcon type={o.type} />
                    <span className="font-medium">{o.label}</span>
                    <span className="text-muted-foreground ml-auto capitalize">{o.type}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Share news, updates, or events with the community..."
            rows={3}
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none leading-relaxed"
          />
          <div className="flex items-center justify-between">
            <span className={`text-[11px] ${content.length > 1800 ? "text-red-400" : "text-muted-foreground"}`}>{content.length}/2000</span>
            <button
              onClick={handlePost}
              disabled={posting || !content.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-500 text-white text-xs font-semibold hover:bg-indigo-600 transition-colors disabled:opacity-40"
            >
              {posting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              Post
            </button>
          </div>
        </div>
      )}

      {/* Feed */}
      {loadingPosts ? (
        <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm rounded-2xl border border-border bg-card">
          No posts yet. Be the first to share something!
        </div>
      ) : (
        posts.map(p => (
          <PostCard key={p.id} post={p} currentUserId={user?.id} onDelete={handleDelete} />
        ))
      )}
    </div>
  );
}
