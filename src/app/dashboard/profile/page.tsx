"use client";

import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import {
  GraduationCap, Globe, Loader2, LogOut, Settings,
  Bell, Trophy, Users, MessageSquare, Pencil, CheckCircle2,
  X, ChevronRight, Shield,
} from "lucide-react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("icon_token") : null;
}

interface Club {
  id: number;
  name: string;
  club_type: "club" | "community";
  category: string;
  university: string;
  member_count: number;
}

const VISA_OPTIONS = ["D-2", "D-4", "D-10", "F-2", "F-4", "F-6", "E-7", "Other"];
const COUNTRY_OPTIONS = [
  "Uzbekistan","Kazakhstan","Kyrgyzstan","Tajikistan","Turkmenistan",
  "Russia","Ukraine","China","Vietnam","Mongolia","Indonesia","Philippines",
  "India","Pakistan","Bangladesh","Nepal","Sri Lanka","Other",
];

const GRAD_MAP: Record<string, string> = {
  "0": "from-indigo-500 to-violet-600",
  "1": "from-emerald-500 to-cyan-600",
  "2": "from-rose-500 to-pink-600",
  "3": "from-amber-500 to-orange-500",
  "4": "from-sky-500 to-blue-600",
  "5": "from-violet-500 to-purple-600",
};

function getGradient(id: number) {
  return GRAD_MAP[String(id % 6)] ?? "from-indigo-500 to-violet-600";
}

function initials(name: string) {
  return name.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join("").toUpperCase();
}

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth();
  const router = useRouter();

  // Clubs
  const [joined, setJoined] = useState<Club[]>([]);
  const [created, setCreated] = useState<Club[]>([]);
  const [clubsLoading, setClubsLoading] = useState(true);

  // Stats
  const [questionCount, setQuestionCount] = useState(0);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", university: "", country: "", visa_type: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Load clubs
  const loadData = useCallback(async () => {
    const token = getToken();
    if (!token) { setClubsLoading(false); return; }
    try {
      const [clubRes, chatRes] = await Promise.all([
        fetch(`${API}/clubs/mine`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/chat/posts`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (clubRes.ok) {
        const d = await clubRes.json();
        setCreated(d.created || []);
        setJoined(d.joined || []);
      }
      if (chatRes.ok) {
        const d = await chatRes.json();
        const mine = (d.posts || []).filter((p: { user_id: number }) => p.user_id === user?.id);
        setQuestionCount(mine.length);
      }
    } catch { /* ignore */ }
    finally { setClubsLoading(false); }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        university: user.university || "",
        country: user.country || "",
        visa_type: user.visa_type || "",
      });
      loadData();
    }
  }, [user, loadData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setSaveError("");
    try {
      const res = await fetch(`${API}/auth/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      refreshUser();
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Failed");
    } finally { setSaving(false); }
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  const totalClubs = joined.length + created.length;
  const grad = getGradient(user.id);

  return (
    <DashboardLayout>
      <div className="max-w-xl space-y-4">

        {/* ── Avatar card ── */}
        <div className="p-5 rounded-2xl border border-border bg-card">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-white text-xl font-black shrink-0 shadow-lg`}>
              {initials(user.name)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-foreground leading-tight">{user.name}</h1>
                {user.is_verified && (
                  <span className="flex items-center gap-0.5 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full font-semibold">
                    <Shield size={9} /> Verified
                  </span>
                )}
                {user.role === "admin" && (
                  <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-semibold">
                    Admin
                  </span>
                )}
              </div>

              <p className="text-xs text-muted-foreground mt-0.5 truncate">{user.email}</p>

              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {user.university && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <GraduationCap size={11} /> {user.university}
                  </span>
                )}
                {user.country && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Globe size={11} /> {user.country}
                  </span>
                )}
                {user.visa_type && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-medium">
                    {user.visa_type}
                  </span>
                )}
              </div>
            </div>

            {/* Edit button */}
            <button
              onClick={() => setEditing(true)}
              className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
              title="Edit profile"
            >
              <Pencil size={14} />
            </button>
          </div>

          {/* Saved banner */}
          {saved && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl">
              <CheckCircle2 size={13} /> Profile updated!
            </div>
          )}
        </div>

        {/* ── Edit form (inline) ── */}
        {editing && (
          <form onSubmit={handleSave} className="p-5 rounded-2xl border border-indigo-500/30 bg-card space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-bold text-foreground">Edit Profile</h2>
              <button type="button" onClick={() => setEditing(false)} className="text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>

            {/* Name */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Full name</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/50 transition-colors"
                placeholder="Your name"
                required
              />
            </div>

            {/* University */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">University</label>
              <input
                value={form.university}
                onChange={e => setForm(f => ({ ...f, university: e.target.value }))}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/50 transition-colors"
                placeholder="e.g. JBNU"
              />
            </div>

            {/* Country */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Country</label>
              <select
                value={form.country}
                onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-indigo-500/50 transition-colors"
              >
                <option value="">— select —</option>
                {COUNTRY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Visa type */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Visa type</label>
              <select
                value={form.visa_type}
                onChange={e => setForm(f => ({ ...f, visa_type: e.target.value }))}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-indigo-500/50 transition-colors"
              >
                <option value="">— select —</option>
                {VISA_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            {saveError && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl">{saveError}</p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full h-10 rounded-xl bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><CheckCircle2 size={14} /> Save changes</>}
            </button>
          </form>
        )}

        {/* ── Stats row ── */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Clubs", value: totalClubs, icon: Users, color: "text-indigo-400" },
            { label: "Questions", value: questionCount, icon: MessageSquare, color: "text-violet-400" },
            { label: "Created", value: created.length, icon: Trophy, color: "text-amber-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="p-3 rounded-2xl border border-border bg-card text-center">
              <Icon size={16} className={`${color} mx-auto mb-1`} />
              <p className="text-lg font-bold text-foreground leading-none">{value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* ── My clubs ── */}
        {!clubsLoading && totalClubs > 0 && (
          <div className="p-4 rounded-2xl border border-border bg-card">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">My Clubs & Communities</h2>
            <div className="space-y-2">
              {[...created, ...joined].slice(0, 6).map(club => (
                <Link
                  key={club.id}
                  href={`/community/${club.id}`}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-accent transition-colors group"
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/15 flex items-center justify-center shrink-0">
                    <Users size={12} className="text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{club.name}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{club.club_type} · {club.member_count} members</p>
                  </div>
                  <ChevronRight size={13} className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
                </Link>
              ))}
              {totalClubs > 6 && (
                <Link href="/community" className="block text-center text-xs text-indigo-400 hover:text-indigo-300 py-1">
                  View all {totalClubs} clubs →
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ── Quick links ── */}
        <div className="p-4 rounded-2xl border border-border bg-card">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Account</h2>
          <div className="space-y-1">
            {[
              { href: "/dashboard/notifications", icon: Bell, label: "Notifications" },
              { href: "/dashboard/achievements", icon: Trophy, label: "Achievements" },
              { href: "/dashboard/settings", icon: Settings, label: "Settings & Privacy" },
            ].map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent transition-colors group"
              >
                <Icon size={15} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                <span className="flex-1 text-sm text-foreground">{label}</span>
                <ChevronRight size={13} className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
              </Link>
            ))}

            {/* Sign out */}
            <button
              onClick={() => { logout(); router.push("/"); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/8 transition-colors group text-left"
            >
              <LogOut size={15} className="text-red-400" />
              <span className="flex-1 text-sm text-red-400">Sign out</span>
            </button>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
