"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, Globe, FileText, ArrowRight, Loader2, CheckCircle2, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { UNIVERSITIES } from "@/lib/constants";
import { api } from "@/lib/api";

const VISA_OPTIONS = ["D-2", "D-4", "F-2", "F-4", "E-7", "Other"];

const COUNTRY_OPTIONS = [
  { flag: "🇺🇿", name: "Uzbekistan" }, { flag: "🇨🇳", name: "China" },
  { flag: "🇻🇳", name: "Vietnam" }, { flag: "🇲🇳", name: "Mongolia" },
  { flag: "🇳🇵", name: "Nepal" }, { flag: "🇮🇩", name: "Indonesia" },
  { flag: "🇷🇺", name: "Russia" }, { flag: "🇰🇿", name: "Kazakhstan" },
  { flag: "🇮🇳", name: "India" }, { flag: "🇵🇰", name: "Pakistan" },
  { flag: "🇧🇩", name: "Bangladesh" }, { flag: "🇵🇭", name: "Philippines" },
  { flag: "🇲🇾", name: "Malaysia" }, { flag: "🇹🇭", name: "Thailand" },
  { flag: "🇲🇲", name: "Myanmar" }, { flag: "🇰🇬", name: "Kyrgyzstan" },
  { flag: "🇹🇯", name: "Tajikistan" }, { flag: "🇹🇲", name: "Turkmenistan" },
  { flag: "🇦🇿", name: "Azerbaijan" }, { flag: "🇺🇦", name: "Ukraine" },
  { flag: "🇳🇬", name: "Nigeria" }, { flag: "🇬🇭", name: "Ghana" },
  { flag: "🇰🇪", name: "Kenya" }, { flag: "🇪🇹", name: "Ethiopia" },
  { flag: "🇸🇦", name: "Saudi Arabia" }, { flag: "🇮🇷", name: "Iran" },
  { flag: "🇹🇷", name: "Turkey" }, { flag: "🇫🇷", name: "France" },
  { flag: "🇩🇪", name: "Germany" }, { flag: "🇺🇸", name: "USA" },
  { flag: "🇬🇧", name: "UK" }, { flag: "🇧🇷", name: "Brazil" },
  { flag: "🌍", name: "Other" },
];

/**
 * /onboarding — forced profile completion for users who signed up via
 * Google (and therefore skipped the email/password registration form).
 *
 * Required: university, country, visa_type. Until all three are saved
 * the user cannot leave the page (the navbar is intentionally absent).
 */
export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading, refreshUser, logout } = useAuth();

  const [step, setStep] = useState<0 | 1>(0); // 0 = university, 1 = country + visa
  const [form, setForm] = useState({ university: "", country: "", visa_type: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ── Guard the route ────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/login"); return; }
    // Pre-fill anything that already exists (in case user came back to /onboarding)
    setForm({
      university: user.university || "",
      country: user.country || "",
      visa_type: user.visa_type || "",
    });
    // If the user actually already has everything, skip the page.
    if ((user.university || "").trim() && (user.country || "").trim() && (user.visa_type || "").trim()) {
      router.replace("/dashboard");
    }
  }, [user, authLoading, router]);

  const isValidUniversity = !!form.university.trim();
  const isValidProfile    = !!form.country.trim() && !!form.visa_type.trim();

  const handleNext = () => {
    setError("");
    if (!isValidUniversity) {
      setError("Please select your university.");
      return;
    }
    setStep(1);
  };

  const handleFinish = async () => {
    setError("");
    if (!isValidUniversity) { setStep(0); setError("Please select your university."); return; }
    if (!isValidProfile)    { setError("Please choose your country and visa type."); return; }

    setSaving(true);
    const { error: apiError } = await api.patch<{ user: unknown }>("/auth/me", {
      university: form.university.trim(),
      country: form.country.trim(),
      visa_type: form.visa_type.trim(),
    });
    setSaving(false);
    if (apiError) {
      setError(apiError);
      return;
    }
    await refreshUser();
    router.replace("/dashboard");
  };

  // Loading auth context
  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-background">
      <div className="w-full max-w-md">
        {/* Brand row + sign-out escape hatch */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <span className="text-white font-black text-sm">IC</span>
            </div>
            <span className="text-xl font-bold text-foreground">ICOM<span className="text-indigo-500">.</span></span>
          </Link>
          <button
            onClick={() => { logout(); router.push("/"); }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            title="Sign out"
          >
            <LogOut size={13} /> Sign out
          </button>
        </div>

        {/* Title */}
        <div className="text-center mb-7">
          <h1 className="text-2xl font-bold text-foreground mb-1.5">
            Welcome, {user.name?.split(" ")[0] || "there"} 👋
          </h1>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            We just need a few more details so we can match you with the right clubs, jobs,
            and information for your situation in Korea.
          </p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-6">
          {[0, 1].map((i) => (
            <div
              key={i}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                i <= step ? "bg-indigo-500" : "bg-border"
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
              {error}
            </div>
          )}

          {/* ── Step 0: University ── */}
          {step === 0 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/15 flex items-center justify-center">
                  <GraduationCap size={15} className="text-indigo-500" />
                </div>
                <h2 className="text-sm font-bold text-foreground">Your university</h2>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">University *</label>
                <select
                  value={form.university}
                  onChange={(e) => setForm((p) => ({ ...p, university: e.target.value }))}
                  className="w-full h-11 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all"
                  required
                >
                  <option value="">Select your university…</option>
                  {UNIVERSITIES.map((u) => (
                    <option key={u.id} value={u.name}>{u.name}</option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground">
                  Don&apos;t see yours? Pick the closest match — you can change this later in Settings.
                </p>
              </div>

              <button
                onClick={handleNext}
                disabled={!isValidUniversity}
                className="w-full h-11 rounded-xl bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                Next <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* ── Step 1: Country + Visa ── */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-violet-500/15 flex items-center justify-center">
                  <Globe size={15} className="text-violet-500" />
                </div>
                <h2 className="text-sm font-bold text-foreground">A little about you</h2>
              </div>

              {/* Country */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Country *</label>
                <select
                  value={form.country}
                  onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
                  className="w-full h-11 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all"
                  required
                >
                  <option value="">Select your country…</option>
                  {COUNTRY_OPTIONS.map((c) => (
                    <option key={c.name} value={c.name}>{c.flag} {c.name}</option>
                  ))}
                </select>
              </div>

              {/* Visa */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <FileText size={11} /> Visa type *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {VISA_OPTIONS.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, visa_type: v }))}
                      className={`h-10 rounded-xl border text-xs font-semibold transition-all ${
                        form.visa_type === v
                          ? "border-indigo-500 bg-indigo-500/10 text-indigo-500"
                          : "border-border bg-background text-muted-foreground hover:border-indigo-500/40 hover:text-foreground"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  D-2 = degree-seeking student. D-4 = language student. Not sure? Pick &quot;Other&quot;.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="flex-1 h-11 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-accent transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={!isValidProfile || saving}
                  className="flex-1 h-11 rounded-xl bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <><Loader2 size={14} className="animate-spin" /> Saving…</>
                  ) : (
                    <><CheckCircle2 size={14} /> Finish</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-[11px] text-muted-foreground mt-5">
          You can update these details anytime in Settings.
        </p>
      </div>
    </div>
  );
}
