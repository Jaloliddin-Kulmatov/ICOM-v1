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
        const allMyClubs = (clubsData.clubs || []).filter(
          (c: { my_status: string; is_creator: boolean }) =>
            c.my_status === "approved" || c.is_creator
        );

        let total = 0;

        // Newly-approved join requests — count once per club until acknowledged
        const seenStr = localStorage.getItem("seen_approved_clubs") || "[]";
        let seen: number[] = [];
        try { seen = JSON.parse(seenStr); } catch { seen = []; }
        const newlyApproved = allMyClubs.filter(
          (c: { id: number; my_status: string; is_creator: boolean }) =>
            c.my_status === "approved" && !c.is_creator && !seen.includes(c.id)
        );
        total += newlyApproved.length;

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

        // Unseen "club created" celebrations
        try {
          const raw = JSON.parse(localStorage.getItem("created_clubs") || "[]") as Array<{ id: number }>;
          const seenCreatedStr = localStorage.getItem("seen_created_clubs") || "[]";
          let seenCreated: number[] = [];
          try { seenCreated = JSON.parse(seenCreatedStr); } catch { seenCreated = []; }
          total += raw.filter(e => !seenCreated.includes(e.id)).length;
        } catch { /**/ }

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
