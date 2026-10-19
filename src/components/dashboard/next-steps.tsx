"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronRight, ShieldCheck, Briefcase } from "lucide-react";
import ArrivalChecklist from "@/components/guide/arrival-checklist";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ARRIVAL_STEPS, daysUntil } from "@/lib/profile-options";

type UpcomingEvent = { id: number; club_id: number; club_name: string; title: string; starts_at: string; location: string };

const cardCls = "rounded-2xl border border-border bg-card p-5";

/** Dashboard row: visa countdown, matched internships, arrival checklist, club events. */
export default function NextSteps() {
  const { user } = useAuth();
  const [events, setEvents] = useState<UpcomingEvent[]>([]);

  useEffect(() => {
    if (!user) return;
    api.get<{ events: UpcomingEvent[] }>("/clubs/events/upcoming").then(({ data }) => setEvents(data?.events || []));
  }, [user]);

  if (!user) return null;
  const days = daysUntil(user.visa_expiry);
  const checklistDone = ARRIVAL_STEPS.every((s) => (user.checklist || []).includes(s.id));
  const profileSet = Boolean(user.job_field || user.city || user.topik_level != null);

  return (
    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Visa */}
      <section className={cardCls} aria-labelledby="visa-card-title">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck size={16} className="text-indigo-600 dark:text-indigo-400" />
          <h2 id="visa-card-title" className="text-sm font-bold text-foreground">Visa</h2>
        </div>
        {days == null ? (
          <>
            <p className="text-sm text-muted-foreground">Add your visa expiry date and we&apos;ll email you 90, 60, 30 and 7 days before it ends.</p>
            <Link href="/dashboard/profile" className="mt-3 inline-flex items-center text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:underline">
              Add expiry date <ChevronRight size={13} />
            </Link>
          </>
        ) : (
          <>
            <p className={`text-3xl font-extrabold tabular-nums ${days < 0 ? "text-red-600" : days <= 60 ? "text-coral-600" : "text-foreground"}`}>
              {days < 0 ? "Expired" : `${days} days`}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {user.visa_type || "Visa"} {days < 0 ? "expired on" : "expires on"} {user.visa_expiry}
            </p>
            {days >= 0 && days <= 120 && (
              <p className="text-xs text-foreground/80 mt-2">Apply to extend it at least 4 weeks before it expires.</p>
            )}
            <Link href="/guide/visa" className="mt-3 inline-flex items-center text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:underline">
              How to extend <ChevronRight size={13} />
            </Link>
          </>
        )}
      </section>

      {/* Jobs for you, or upcoming events once the profile is set */}
      {events.length > 0 ? (
        <section className={cardCls} aria-labelledby="events-card-title">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays size={16} className="text-indigo-600 dark:text-indigo-400" />
            <h2 id="events-card-title" className="text-sm font-bold text-foreground">Coming up in your clubs</h2>
          </div>
          <ul className="space-y-2">
            {events.slice(0, 3).map((e) => (
              <li key={e.id}>
                <Link href={`/community/${e.club_id}`} className="block rounded-xl border border-border px-3 py-2 hover:bg-accent/60">
                  <span className="block text-sm font-semibold text-foreground truncate">{e.title}</span>
                  <span className="block text-xs text-muted-foreground truncate">
                    {new Date(e.starts_at).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    {" · "}{e.club_name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className={cardCls} aria-labelledby="jobs-card-title">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase size={16} className="text-indigo-600 dark:text-indigo-400" />
            <h2 id="jobs-card-title" className="text-sm font-bold text-foreground">Internships for you</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {profileSet
              ? `Sorted for ${[user.job_field, user.city].filter(Boolean).join(" in ") || "your Korean level"}.`
              : "Tell us your field, city and Korean level to see the best matches first."}
          </p>
          <Link href={profileSet ? "/internships?sort=for-you" : "/dashboard/profile"}
            className="mt-3 inline-flex items-center text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:underline">
            {profileSet ? "See matches" : "Set up matching"} <ChevronRight size={13} />
          </Link>
        </section>
      )}

      {/* Arrival checklist until it's finished */}
      {!checklistDone && <div className="md:col-span-2 lg:col-span-1"><ArrivalChecklist compact /></div>}
    </div>
  );
}
