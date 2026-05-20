"use client";

import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("icon_token") : null;
}

/**
 * Returns the total number of unread notification groups (chat clubs + news)
 * for the given user, excluding their own activity.
 * Polls every 60 seconds and re-checks on tab visibility change.
 */
export function useNotifCount(userId: number | undefined): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) { setCount(0); return; }

    let cancelled = false;

    const check = async () => {
      const token = getToken();
      if (!token) return;
      try {
        const clubsRes = await fetch(`${API}/clubs`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!clubsRes.ok) return;
        const clubsData = await clubsRes.json();
        const myClubs = (clubsData.clubs || []).filter(
          (c: { my_status: string; is_creator: boolean }) =>
            c.my_status === "approved" || c.is_creator
        );

        let total = 0;

        // Chat unreads — only messages from other people
        await Promise.all(
          myClubs.map(async (club: { id: number }) => {
            const lastId = parseInt(
              localStorage.getItem(`chat_lid_${club.id}`) || "0",
              10
            );
            try {
              const r = await fetch(
                `${API}/clubs/${club.id}/chat?after=${lastId}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              if (!r.ok) return;
              const d = await r.json();
              const others = (d.messages || []).filter(
                (m: { user_id: number }) => m.user_id !== userId
              );
              if (others.length > 0) total += 1;
            } catch { /* ignore */ }
          })
        );

        // News unreads — only posts from other people
        const lastSeenId = parseInt(
          localStorage.getItem("news_last_post_id") || "0",
          10
        );
        try {
          const r = await fetch(`${API}/posts`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (r.ok) {
            const d = await r.json();
            const newPosts = (d.posts || []).filter(
              (p: { id: number; user_id: number }) =>
                p.id > lastSeenId && p.user_id !== userId
            );
            if (newPosts.length > 0) total += 1;
          }
        } catch { /* ignore */ }

        if (!cancelled) setCount(total);
      } catch { /* ignore */ }
    };

    check();
    const interval = setInterval(check, 60000);

    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [userId]);

  return count;
}
