"use client";

import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import {
  Settings, Loader2, CheckCircle2, Users, Pencil, Trash2,
  LogOut, UserX, Globe, GraduationCap,
  ExternalLink, Plus, Crown,
} from "lucide-react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("icon_token") : null;
}
async function api(method: string, path: string, body?: object) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

interface Club {
  id: number; name: string; description: string; category: string;
  university: string; club_type: "club" | "community"; country: string;
  meeting_time: string; location: string; contact: string;
  kakao_link: string; website: string; member_count: number;
}
interface Member {
  membership_id: number | null; user_id: number; name: string;
  university: string; country: string; visa_type: string; joined_at: string;
}

const CLUB_CATS = ["academic","sports","culture","social","language","tech","arts","volunteer"];
const COMM_CATS = ["national community","religion & culture","support & community"];

const AVATAR_GRADIENTS = [
  "from-indigo-500 to-violet-600","from-emerald-500 to-cyan-600",
  "from-rose-500 to-pink-600","from-amber-500 to-orange-500",
  "from-sky-500 to-blue-600","from-violet-500 to-purple-600",
];
function initials(name: string) {
  return name.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join("").toUpperCase();
}

const iCls = "w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/50 transition-colors";
const lCls = "text-xs font-medium text-muted-foreground mb-1.5 block";

// ── Owned Club Card ───────────────────────────────────────────
function OwnedClubCard({
  club,
  onSaved,
  onDeleted,
}: {
  club: Club;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const isCC = club.club_type === "community";
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [kicking, setKicking] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    name: club.name, description: club.description || "",
    category: club.category || "social", meeting_time: club.meeting_time || "",
    location: club.location || "", contact: club.contact || "",
    kakao_link: club.kakao_link || "", website: club.website || "",
    country: club.country || "",
  });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const loadMembers = useCallback(async () => {
    setMembersLoading(true);
    try {
      const d = await api("GET", `/clubs/${club.id}/members`);
      setMembers(d.members || []);
    } catch { /* ignore */ }
    finally { setMembersLoading(false); }
  }, [club.id]);

  const toggleMembers = () => {
    if (!membersOpen) loadMembers();
    setMembersOpen(v => !v);
  };

  const handleSave = async () => {
    setSaving(true); setSaveMsg("");
    try {
      await api("PATCH", `/clubs/${club.id}`, editForm);
      setSaveMsg("Saved!");
      onSaved();
      setTimeout(() => { setEditOpen(false); setSaveMsg(""); }, 800);
    } catch (e: unknown) {
      setSaveMsg(e instanceof Error ? e.message : "Failed");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${club.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await api("DELETE", `/clubs/${club.id}`);
      onDeleted();
    } catch { setDeleting(false); }
  };

  const handleKick = async (userId: number, memberName: string) => {
    if (!confirm(`Remove ${memberName} from ${club.name}?`)) return;
    setKicking(userId);
    try {
      await api("DELETE", `/clubs/${club.id}/kick/${userId}`);
      setMembers(prev => prev.filter(m => m.user_id !== userId));
    } catch { /* ignore */ }
    finally { setKicking(null); }
  };

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${
      isCC ? "border-violet-500/20 bg-violet-500/3" : "border-indigo-500/20 bg-indigo-500/3"
    }`}>
      {/* Header row */}
      <div className="p-4 flex items-start gap-3">
        {/* Avatar */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 ${
          isCC ? "bg-gradient-to-br from-violet-500 to-indigo-600" : "bg-gradient-to-br from-indigo-500 to-cyan-600"
        }`}>
          {club.name[0]?.toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
              isCC ? "bg-violet-500/15 text-violet-400" : "bg-indigo-500/15 text-indigo-400"
            }`}>
              {isCC ? "🌍 Community" : "🎓 Club"}
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 flex items-center gap-1">
              <Crown size={9} /> Owner
            </span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Users size={10} /> {club.member_count}
            </span>
          </div>
          <h3 className="text-sm font-bold text-foreground truncate">{club.name}</h3>
          <p className="text-[11px] text-muted-foreground">
            {isCC ? (club.country || "South Korea") : club.university} · {club.category}
          </p>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => { setEditOpen(v => !v); setMembersOpen(false); }}
            title="Edit"
            className={`p-1.5 rounded-lg transition-colors ${editOpen ? "bg-indigo-500/15 text-indigo-400" : "text-muted-foreground hover:text-indigo-400 hover:bg-indigo-500/10"}`}
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={toggleMembers}
            title="Manage members"
            className={`p-1.5 rounded-lg transition-colors ${membersOpen ? "bg-indigo-500/15 text-indigo-400" : "text-muted-foreground hover:text-indigo-400 hover:bg-indigo-500/10"}`}
          >
            <Users size={13} />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            title="Delete"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
          >
            {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
          </button>
        </div>
      </div>

      {/* Edit panel */}
      {editOpen && (
        <div className="border-t border-border bg-muted/30 p-4 space-y-3">
          <p className="text-xs font-semibold text-foreground mb-1">Edit details</p>
          <div>
            <label className={lCls}>Name *</label>
            <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} className={iCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lCls}>Category</label>
              <select value={editForm.category} onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))} className={iCls}>
                {(isCC ? COMM_CATS : CLUB_CATS).map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            {isCC ? (
              <div>
                <label className={lCls}>Country</label>
                <input value={editForm.country} onChange={e => setEditForm(p => ({ ...p, country: e.target.value }))} placeholder="e.g. Uzbekistan" className={iCls} />
              </div>
            ) : (
              <div>
                <label className={lCls}>Meeting Time</label>
                <input value={editForm.meeting_time} onChange={e => setEditForm(p => ({ ...p, meeting_time: e.target.value }))} placeholder="Every Wed 6pm" className={iCls} />
              </div>
            )}
          </div>
          <div>
            <label className={lCls}>Description</label>
            <textarea rows={2} value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} className={iCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lCls}>Location</label>
              <input value={editForm.location} onChange={e => setEditForm(p => ({ ...p, location: e.target.value }))} className={iCls} />
            </div>
            <div>
              <label className={lCls}>KakaoTalk Link</label>
              <input value={editForm.kakao_link} onChange={e => setEditForm(p => ({ ...p, kakao_link: e.target.value }))} className={iCls} />
            </div>
          </div>
          <div>
            <label className={lCls}>Website</label>
            <input value={editForm.website} onChange={e => setEditForm(p => ({ ...p, website: e.target.value }))} placeholder="https://..." className={iCls} />
          </div>
          {saveMsg && (
            <p className={`text-xs text-center ${saveMsg === "Saved!" ? "text-emerald-400" : "text-red-400"}`}>{saveMsg}</p>
          )}
          <div className="flex gap-2">
            <button onClick={() => setEditOpen(false)} className="flex-1 py-2 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-2 rounded-xl bg-indigo-500 text-white text-xs font-medium hover:bg-indigo-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
              Save
            </button>
          </div>
        </div>
      )}

      {/* Members panel (with kick) */}
      {membersOpen && (
        <div className="border-t border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-foreground">Members</p>
            <Link href={`/community/${club.id}`} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
              Open page <ExternalLink size={10} />
            </Link>
          </div>
          {membersLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 size={16} className="animate-spin text-muted-foreground" />
            </div>
          ) : members.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No approved members yet.</p>
          ) : (
            <div className="space-y-2">
              {members.map((m) => {
                const grad = AVATAR_GRADIENTS[m.user_id % AVATAR_GRADIENTS.length];
                const isCreator = m.name.includes("(Creator)");
                const displayName = m.name.replace(" (Creator)", "");
                return (
                  <div key={m.user_id} className="flex items-center gap-3 p-2.5 rounded-xl bg-background border border-border">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${grad} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                      {initials(displayName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-foreground truncate">{displayName}</p>
                        {isCreator && <Crown size={10} className="text-amber-400 shrink-0" />}
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {[m.country, m.university].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    {!isCreator && (
                      <button
                        onClick={() => handleKick(m.user_id, displayName)}
                        disabled={kicking === m.user_id}
                        title="Remove member"
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0 disabled:opacity-50"
                      >
                        {kicking === m.user_id
                          ? <Loader2 size={12} className="animate-spin" />
                          : <UserX size={12} />}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Joined Club Card ──────────────────────────────────────────
function JoinedClubCard({ club, onLeft }: { club: Club; onLeft: () => void }) {
  const isCC = club.club_type === "community";
  const [leaving, setLeaving] = useState(false);

  const handleLeave = async () => {
    if (!confirm(`Leave "${club.name}"?`)) return;
    setLeaving(true);
    try {
      await api("POST", `/clubs/${club.id}/leave`);
      onLeft();
    } catch { setLeaving(false); }
  };

  return (
    <div className={`flex items-center gap-3 p-4 rounded-2xl border transition-all hover:shadow-sm ${
      isCC ? "border-violet-500/15 bg-violet-500/3" : "border-border bg-card"
    }`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 ${
        isCC ? "bg-gradient-to-br from-violet-500 to-indigo-600" : "bg-gradient-to-br from-indigo-500 to-cyan-600"
      }`}>
        {club.name[0]?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
            isCC ? "bg-violet-500/15 text-violet-400" : "bg-indigo-500/15 text-indigo-400"
          }`}>
            {isCC ? "Community" : "Club"}
          </span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Users size={10} /> {club.member_count}
          </span>
        </div>
        <p className="text-sm font-semibold text-foreground truncate">{club.name}</p>
        <p className="text-[11px] text-muted-foreground truncate">
          {isCC ? (club.country || "South Korea") : club.university}
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Link
          href={`/community/${club.id}`}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
          title="Open"
        >
          <ExternalLink size={13} />
        </Link>
        <button
          onClick={handleLeave}
          disabled={leaving}
          title="Leave"
          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
        >
          {leaving ? <Loader2 size={13} className="animate-spin" /> : <LogOut size={13} />}
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, refreshUser, logout } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"profile" | "clubs">("profile");

  // Profile form
  const [form, setForm] = useState({
    name: user?.name || "",
    university: user?.university || "",
    visa_type: user?.visa_type || "",
    country: user?.country || "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Clubs
  const [createdClubs, setCreatedClubs] = useState<Club[]>([]);
  const [joinedClubs, setJoinedClubs] = useState<Club[]>([]);
  const [clubsLoading, setClubsLoading] = useState(true);

  const loadClubs = useCallback(async () => {
    try {
      const d = await api("GET", "/clubs/mine");
      setCreatedClubs(d.created || []);
      setJoinedClubs(d.joined || []);
    } catch { /* ignore */ }
    finally { setClubsLoading(false); }
  }, []);

  useEffect(() => { if (user) loadClubs(); }, [user, loadClubs]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setProfileError("");
    try {
      const token = getToken();
      const res = await fetch(`${API}/auth/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: unknown) {
      setProfileError(err instanceof Error ? err.message : "Failed");
    } finally { setSaving(false); }
  };

  // Avatar initials
  const avatarInit = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  return (
    <DashboardLayout>
      <div className="max-w-2xl">
        {/* ── Profile header ── */}
        <div className="flex items-center gap-4 mb-8 p-5 rounded-2xl border border-border bg-card">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xl font-black shrink-0 shadow-lg">
            {avatarInit}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground truncate">{user?.name || "Your Profile"}</h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {user?.university && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <GraduationCap size={11} /> {user.university}
                </span>
              )}
              {user?.country && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Globe size={11} /> {user.country}
                </span>
              )}
              {user?.visa_type && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  {user.visa_type}
                </span>
              )}
            </div>
          </div>
          {/* Sign out */}
          <button
            onClick={() => { logout(); router.push("/"); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/10 transition-colors shrink-0"
            title="Sign out"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 p-1 rounded-xl bg-muted/50 border border-border mb-6 w-fit">
          {([
            { key: "profile", icon: Settings, label: "Profile" },
            { key: "clubs",   icon: Users,    label: `My Clubs & Communities (${createdClubs.length + joinedClubs.length})` as string },
          ] as const).map(t => (
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

        {/* ═══════════════════════════════
             PROFILE TAB
        ═══════════════════════════════ */}
        {tab === "profile" && (
          <form onSubmit={handleSaveProfile} className="p-6 rounded-2xl border border-border bg-card space-y-4">
            <div>
              <label className={lCls}>Full Name</label>
              <input
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className={iCls}
              />
            </div>
            <div>
              <label className={lCls}>University</label>
              <input
                value={form.university}
                onChange={e => setForm(p => ({ ...p, university: e.target.value }))}
                placeholder="e.g. JBNU"
                className={iCls}
              />
            </div>
            <div>
              <label className={lCls}>Visa Type</label>
              <select
                value={form.visa_type}
                onChange={e => setForm(p => ({ ...p, visa_type: e.target.value }))}
                className={iCls}
              >
                <option value="">Not set</option>
                {["D-2", "D-4", "F-2", "F-4", "E-2", "Other"].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={lCls}>Country of Origin</label>
              <input
                value={form.country}
                onChange={e => setForm(p => ({ ...p, country: e.target.value }))}
                placeholder="e.g. Uzbekistan"
                className={iCls}
              />
            </div>

            {profileError && <p className="text-xs text-red-400">{profileError}</p>}

            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors disabled:opacity-60"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <CheckCircle2 size={14} /> : <Settings size={14} />}
              {saved ? "Saved!" : "Save Changes"}
            </button>

            {/* Sign out */}
            <button
              type="button"
              onClick={() => { logout(); router.push("/"); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-500/25 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors"
            >
              <LogOut size={14} /> Sign out
            </button>
          </form>
        )}

        {/* ═══════════════════════════════
             MY CLUBS TAB
        ═══════════════════════════════ */}
        {tab === "clubs" && (() => {
          // Split by type
          const ownedClubs  = createdClubs.filter(c => c.club_type === "club");
          const ownedComms  = createdClubs.filter(c => c.club_type === "community");
          const joinedClubsOnly = joinedClubs.filter(c => c.club_type === "club");
          const joinedComms = joinedClubs.filter(c => c.club_type === "community");

          const SectionHeader = ({ emoji, title, count, createLink }: { emoji: string; title: string; count: number; createLink?: boolean }) => (
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span>{emoji}</span>{title}
                <span className="text-xs font-normal text-muted-foreground">({count})</span>
              </h2>
              {createLink && (
                <Link href="/community" className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  <Plus size={11} /> Create
                </Link>
              )}
            </div>
          );

          const EmptyState = ({ msg, link }: { msg: string; link: string }) => (
            <div className="py-5 rounded-2xl border border-dashed border-border text-center">
              <p className="text-xs text-muted-foreground">{msg}</p>
              <Link href={link} className="mt-1 inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                Browse →
              </Link>
            </div>
          );

          return (
            <div className="space-y-8">
              {clubsLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 size={20} className="animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {/* ── 🎓 CLUBS ── */}
                  <div>
                    <SectionHeader emoji="🎓" title="Clubs" count={ownedClubs.length + joinedClubsOnly.length} createLink />

                    {/* Owned clubs */}
                    {ownedClubs.length > 0 && (
                      <div className="space-y-3 mb-3">
                        {ownedClubs.map(club => (
                          <OwnedClubCard key={club.id} club={club} onSaved={loadClubs} onDeleted={loadClubs} />
                        ))}
                      </div>
                    )}

                    {/* Joined clubs */}
                    {joinedClubsOnly.length > 0 && (
                      <div className="space-y-2">
                        {joinedClubsOnly.map(club => (
                          <JoinedClubCard key={club.id} club={club} onLeft={loadClubs} />
                        ))}
                      </div>
                    )}

                    {ownedClubs.length === 0 && joinedClubsOnly.length === 0 && (
                      <EmptyState msg="No clubs yet." link="/community" />
                    )}
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-border" />

                  {/* ── 🌍 COMMUNITIES ── */}
                  <div>
                    <SectionHeader emoji="🌍" title="Communities" count={ownedComms.length + joinedComms.length} createLink />

                    {/* Owned communities */}
                    {ownedComms.length > 0 && (
                      <div className="space-y-3 mb-3">
                        {ownedComms.map(club => (
                          <OwnedClubCard key={club.id} club={club} onSaved={loadClubs} onDeleted={loadClubs} />
                        ))}
                      </div>
                    )}

                    {/* Joined communities */}
                    {joinedComms.length > 0 && (
                      <div className="space-y-2">
                        {joinedComms.map(club => (
                          <JoinedClubCard key={club.id} club={club} onLeft={loadClubs} />
                        ))}
                      </div>
                    )}

                    {ownedComms.length === 0 && joinedComms.length === 0 && (
                      <EmptyState msg="No communities yet." link="/community" />
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })()}
      </div>
    </DashboardLayout>
  );
}
