"use client";

import React, { useCallback, useEffect, useState } from "react";
import { CalendarDays, CalendarPlus, MapPin, Plus, Trash2, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type ClubEvent = {
  id: number; title: string; starts_at: string; ends_at: string | null;
  location: string; description: string;
};

// Event times are Korea time ("2026-10-25T14:00", no timezone).
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parts(local: string) {
  const [d, t = "00:00"] = local.split("T");
  const [y, m, day] = d.split("-").map(Number);
  const [h, min] = t.split(":").map(Number);
  return { y, m, day, h, min };
}

function formatKst(local: string) {
  const { y, m, day, h, min } = parts(local);
  const wd = WEEKDAYS[new Date(Date.UTC(y, m - 1, day)).getUTCDay()];
  return `${wd} ${day} ${MONTHS[m - 1]} · ${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

/** Korea time → UTC in calendar format (20261025T050000Z). */
function utcStamp(local: string) {
  const { y, m, day, h, min } = parts(local);
  return new Date(Date.UTC(y, m - 1, day, h - 9, min)).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function endOf(e: ClubEvent) {
  if (e.ends_at) return e.ends_at;
  const { y, m, day, h, min } = parts(e.starts_at);   // default: two hours
  const end = new Date(Date.UTC(y, m - 1, day, h + 2, min));
  return end.toISOString().slice(0, 16);
}

function googleLink(e: ClubEvent, clubName: string) {
  const q = new URLSearchParams({
    action: "TEMPLATE", text: e.title,
    dates: `${utcStamp(e.starts_at)}/${utcStamp(endOf(e))}`,
    details: `${clubName} on ICOM${e.description ? `\n\n${e.description}` : ""}`,
    location: e.location,
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}

function downloadIcs(e: ClubEvent, clubName: string) {
  const esc = (s: string) => s.replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//ICOM//Club events//EN", "BEGIN:VEVENT",
    `UID:icom-event-${e.id}@icom.ai.kr`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
    `DTSTART:${utcStamp(e.starts_at)}`, `DTEND:${utcStamp(endOf(e))}`,
    `SUMMARY:${esc(e.title)}`, `LOCATION:${esc(e.location)}`,
    `DESCRIPTION:${esc(`${clubName} on ICOM${e.description ? `\n\n${e.description}` : ""}`)}`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${e.title.replace(/[^\w\- ]+/g, "").trim() || "event"}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const inputCls =
  "w-full h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

export default function ClubEvents({ clubId, clubName }: { clubId: number; clubName: string }) {
  const { user } = useAuth();
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [canOrganise, setCanOrganise] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", starts_at: "", ends_at: "", location: "", description: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { data } = await api.get<{ events: ClubEvent[]; can_organise: boolean }>(`/clubs/${clubId}/events`);
    setEvents(data?.events || []);
    setCanOrganise(!!data?.can_organise);
    setLoaded(true);
  }, [clubId]);

  useEffect(() => { load(); }, [load, user]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    const { error: err } = await api.post(`/clubs/${clubId}/events`, form);
    setBusy(false);
    if (err) { setError(err); return; }
    setForm({ title: "", starts_at: "", ends_at: "", location: "", description: "" });
    setAdding(false);
    load();
  };

  const remove = async (id: number) => {
    const { error: err } = await api.delete(`/clubs/events/${id}`);
    if (err) setError(err); else setEvents((list) => list.filter((x) => x.id !== id));
  };

  if (!loaded || (!events.length && !canOrganise)) return null;
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <section className="mb-4 p-5 rounded-2xl border border-border bg-card" aria-labelledby="club-events-title">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 id="club-events-title" className="text-sm font-semibold text-foreground flex items-center gap-2">
          <CalendarDays size={15} className="text-indigo-500" /> Upcoming events
        </h3>
        {canOrganise && !adding && (
          <Button size="sm" variant="outline" className="gap-1 h-8" onClick={() => setAdding(true)}>
            <Plus size={13} /> Add event
          </Button>
        )}
      </div>

      {adding && (
        <form onSubmit={save} className="mb-4 space-y-2.5 rounded-xl border border-border p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-foreground">New event (Korea time)</p>
            <button type="button" onClick={() => setAdding(false)} aria-label="Close" className="p-1 rounded text-muted-foreground hover:text-foreground"><X size={14} /></button>
          </div>
          <input id="event-title" className={inputCls} placeholder="Title, e.g. Moaksan hike" value={form.title} onChange={set("title")} required maxLength={150} />
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block text-xs text-muted-foreground">Starts
              <input id="event-start" type="datetime-local" className={inputCls} value={form.starts_at} onChange={set("starts_at")} required />
            </label>
            <label className="block text-xs text-muted-foreground">Ends (optional)
              <input id="event-end" type="datetime-local" className={inputCls} value={form.ends_at} onChange={set("ends_at")} />
            </label>
          </div>
          <input id="event-location" className={inputCls} placeholder="Location" value={form.location} onChange={set("location")} maxLength={200} />
          <textarea id="event-description" className={`${inputCls} h-20 py-2`} placeholder="Details (optional)" value={form.description} onChange={set("description")} maxLength={2000} />
          {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
          <Button type="submit" size="sm" disabled={busy} className="gap-1.5">
            {busy && <Loader2 size={13} className="animate-spin" />} Save event
          </Button>
        </form>
      )}

      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">No upcoming events. Add one so members can put it in their calendar.</p>
      ) : (
        <ul className="space-y-2.5">
          {events.map((e) => (
            <li key={e.id} className="rounded-xl border border-border p-3">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{e.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatKst(e.starts_at)} (Korea time)</p>
                  {e.location && <p className="text-xs text-muted-foreground mt-0.5 inline-flex items-center gap-1"><MapPin size={11} /> {e.location}</p>}
                  {e.description && <p className="text-xs text-foreground/80 mt-1.5 whitespace-pre-wrap">{e.description}</p>}
                </div>
                {canOrganise && (
                  <button onClick={() => remove(e.id)} aria-label={`Delete ${e.title}`} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 shrink-0">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button onClick={() => downloadIcs(e, clubName)} className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:underline">
                  <CalendarPlus size={12} /> Add to calendar
                </button>
                <a href={googleLink(e, clubName)} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:underline">
                  Google Calendar
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
      {!adding && error && <p className="mt-2 text-xs text-red-600" role="alert">{error}</p>}
    </section>
  );
}
