"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { useAuth } from "@/lib/auth";
import { Settings, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    university: user?.university || "",
    visa_type: user?.visa_type || "",
    country: user?.country || "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const token = localStorage.getItem("icon_token");
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
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/50 transition-colors";
  const labelCls = "text-xs font-medium text-muted-foreground mb-1.5 block";

  return (
    <DashboardLayout>
      <div className="max-w-xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center">
            <Settings size={20} className="text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Settings</h1>
            <p className="text-xs text-muted-foreground">Update your profile information</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-6 rounded-2xl border border-white/8 bg-white/3 space-y-4">
          <div>
            <label className={labelCls}>Full Name</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>University</label>
            <input value={form.university} onChange={e => setForm(p => ({ ...p, university: e.target.value }))} placeholder="e.g. JBNU" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Visa Type</label>
            <select value={form.visa_type} onChange={e => setForm(p => ({ ...p, visa_type: e.target.value }))} className={inputCls}>
              <option value="">Not set</option>
              {["D-2", "D-4", "F-2", "F-4", "E-2", "Other"].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Country of Origin</label>
            <input value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} placeholder="e.g. Uzbekistan" className={inputCls} />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <Button type="submit" disabled={saving} className="w-full gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <CheckCircle2 size={14} /> : null}
            {saved ? "Saved!" : "Save Changes"}
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
}
