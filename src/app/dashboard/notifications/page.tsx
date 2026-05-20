"use client";

import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import {
  Bell, MessageSquare, Newspaper, CheckCheck,
  Loader2, ExternalLink, RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("icon_token") : null;
}

interface Club {
  id: number;
  name: string;
  club_type: "club" | "community";
  my_status: "pending" | "approved" | null;
  is_creator: boolean;
}

interface Post {
  id: number;
  user_id: number;
  posted_as_label: string;
  content: string;
  created_at: string;
}

interface ChatMessage {
  id: number;
  user_id: number;
  author_name: string;
  content: string;
  created_at: string;
}

interface Notif {
  id: string;
  type: "chat" | "news";
  clubId?: number;
  clubName?: string;
  clubType?: "club" | "community";
  count: number;
  previewText: string;
  timestamp: string;
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifs = useCallback(async (silent = false) => {
    if (!user) { setLoading(false); return; }
    const token = getToken();
    if (!token) { setLoading(false); return; }

    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      // 1. Load clubs the user belongs to
      const clubsRes = await fetch(`${API}/clubs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const clubsData = await clubsRes.json();
      const myClubs: Club[] = (clubsData.clubs || []).filter(
        (c: Club) => c.my_status === "approved" || c.is_creator
      );

      // 2. Check chat unread per club
      const chatNotifs: Notif[] = [];
      await Promise.all(
        myClubs.map(async (club) => {
          const lastId = parseInt(
            localStorage.getItem(`chat_lid_${club.id}`) || "0",
            10
          );
          try {
            const res = await fetch(`${API}/clubs/${club.id}/chat?after=${lastId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) return;
            const d = await res.json();
            const msgs: ChatMessage[] = (d.messages || []).filter(
              (m: ChatMessage) => m.user_id !== user.id   // ignore own messages
            );
            if (msgs.length > 0) {
              const latest = msgs[msgs.length - 1];
              chatNotifs.push({
                id: `chat_${club.id}`,
                type: "chat",
                clubId: club.id,
                clubName: club.name,
                clubType: club.club_type,
                count: msgs.length,
                previewText: `${latest.author_name}: ${latest.content}`,
                timestamp: latest.created_at,
              });
            }
          } catch { /* ignore */ }
        })
      );

      // 3. Check news unread
      const newsNotifs: Notif[] = [];
      const lastSeenId = parseInt(
        localStorage.getItem("news_last_post_id") || "0",
        10
      );
      try {
        const res = await fetch(`${API}/posts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const d = await res.json();
          const newPosts: Post[] = (d.posts || []).filter(
            (p: Post) => p.id > lastSeenId && p.user_id !== user.id  // ignore own posts
          );
          if (newPosts.length > 0) {
            const latest = newPosts[0];
            newsNotifs.push({
              id: "news",
              type: "news",
              count: newPosts.length,
              previewText: `${latest.posted_as_label}: ${latest.content.slice(0, 90)}${latest.content.length > 90 ? "…" : ""}`,
              timestamp: latest.created_at,
            });
          }
        }
      } catch { /* ignore */ }

      // Sort newest first
      const all = [...chatNotifs, ...newsNotifs].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setNotifs(all);
    } catch { /* ignore */ }
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  // Mark a single notification as read
  const dismiss = async (notif: Notif) => {
    if (notif.type === "news") {
      // Fetch latest post IDs and save to localStorage
      try {
        const res = await fetch(`${API}/posts`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const d = await res.json();
        const posts: Post[] = d.posts || [];
        if (posts.length > 0) {
          localStorage.setItem(
            "news_last_post_id",
            String(Math.max(...posts.map((p) => p.id)))
          );
        }
      } catch { /* ignore */ }
    }
    // For chat: we let the user click "View" to open the chat — actual read marking
    // happens in ClubChat when they open it. Just remove from this list.
    setNotifs((prev) => prev.filter((n) => n.id !== notif.id));
  };

  // Mark all as read
  const dismissAll = async () => {
    // Mark news read
    try {
      const res = await fetch(`${API}/posts`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const d = await res.json();
      const posts: Post[] = d.posts || [];
      if (posts.length > 0) {
        localStorage.setItem(
          "news_last_post_id",
          String(Math.max(...posts.map((p) => p.id)))
        );
      }
    } catch { /* ignore */ }
    setNotifs([]);
  };

  const total = notifs.length;

  return (
    <DashboardLayout>
      <div className="max-w-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center">
              <Bell size={20} className="text-muted-foreground" />
              {total > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-0.5">
                  {total > 9 ? "9+" : total}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Notifications</h1>
              <p className="text-xs text-muted-foreground">
                {total > 0
                  ? `${total} unread notification${total !== 1 ? "s" : ""}`
                  : "You're all caught up"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchNotifs(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-xl border border-border hover:bg-accent disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
            </button>
            {total > 0 && (
              <button
                onClick={dismissAll}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-xl border border-border hover:bg-accent"
              >
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground text-sm">
            <Loader2 size={16} className="animate-spin" /> Checking for notifications…
          </div>
        )}

        {/* Not logged in */}
        {!loading && !user && (
          <div className="p-12 rounded-2xl border border-white/8 bg-white/3 text-center">
            <Bell size={32} className="text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Sign in to see your notifications.</p>
          </div>
        )}

        {/* Empty */}
        {!loading && user && notifs.length === 0 && (
          <div className="p-12 rounded-2xl border border-white/8 bg-white/3 text-center">
            <Bell size={32} className="text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground font-medium">No new notifications.</p>
            <p className="text-xs text-muted-foreground/60 mt-1 leading-relaxed">
              New club chat messages and news posts will appear here.
            </p>
          </div>
        )}

        {/* Notification list */}
        {!loading && notifs.length > 0 && (
          <div className="space-y-2">
            {notifs.map((notif) => (
              <div
                key={notif.id}
                className="flex items-start gap-3 p-4 rounded-2xl border border-border bg-card hover:bg-accent/30 transition-colors"
              >
                {/* Type icon */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    notif.type === "chat"
                      ? "bg-indigo-500/15"
                      : "bg-violet-500/15"
                  }`}
                >
                  {notif.type === "chat" ? (
                    <MessageSquare size={16} className="text-indigo-400" />
                  ) : (
                    <Newspaper size={16} className="text-violet-400" />
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="text-sm font-semibold text-foreground">
                      {notif.type === "chat" ? notif.clubName : "News Feed"}
                    </p>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-tight ${
                        notif.type === "chat"
                          ? "bg-indigo-500/15 text-indigo-400"
                          : "bg-violet-500/15 text-violet-400"
                      }`}
                    >
                      {notif.count} new
                    </span>
                    {notif.type === "chat" && notif.clubType && (
                      <span className="text-[10px] text-muted-foreground/50 capitalize">
                        {notif.clubType}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {notif.previewText}
                  </p>
                  <p className="text-[10px] text-muted-foreground/40 mt-1.5">
                    {timeAgo(notif.timestamp)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <Link
                    href={notif.type === "news" ? "/community?tab=news" : "/community"}
                    onClick={() => dismiss(notif)}
                    className="flex items-center gap-1 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors px-2.5 py-1.5 rounded-xl hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/20"
                  >
                    View <ExternalLink size={10} />
                  </Link>
                  <button
                    onClick={() => dismiss(notif)}
                    className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors px-2.5 py-1"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
