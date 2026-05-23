"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, ArrowRight, CheckCircle2, ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { UNIVERSITIES } from "@/lib/constants";
import { useGoogleLogin } from "@react-oauth/google";

const steps = [
  { label: "Account", hint: "Your login credentials" },
  { label: "University", hint: "Where you study" },
  { label: "Profile", hint: "Tell us about yourself" },
];

const VISA_OPTIONS = ["D-2", "D-4", "F-2", "F-4", "E-7", "Other"];

const COUNTRY_OPTIONS = [
  { flag: "🇺🇿", name: "Uzbekistan" },
  { flag: "🇨🇳", name: "China" },
  { flag: "🇻🇳", name: "Vietnam" },
  { flag: "🇲🇳", name: "Mongolia" },
  { flag: "🇳🇵", name: "Nepal" },
  { flag: "🇮🇩", name: "Indonesia" },
  { flag: "🇷🇺", name: "Russia" },
  { flag: "🇰🇿", name: "Kazakhstan" },
  { flag: "🇮🇳", name: "India" },
  { flag: "🇵🇰", name: "Pakistan" },
  { flag: "🇧🇩", name: "Bangladesh" },
  { flag: "🇵🇭", name: "Philippines" },
  { flag: "🇲🇾", name: "Malaysia" },
  { flag: "🇹🇭", name: "Thailand" },
  { flag: "🇲🇲", name: "Myanmar" },
  { flag: "🇰🇬", name: "Kyrgyzstan" },
  { flag: "🇹🇯", name: "Tajikistan" },
  { flag: "🇹🇲", name: "Turkmenistan" },
  { flag: "🇦🇿", name: "Azerbaijan" },
  { flag: "🇺🇦", name: "Ukraine" },
  { flag: "🇳🇬", name: "Nigeria" },
  { flag: "🇬🇭", name: "Ghana" },
  { flag: "🇰🇪", name: "Kenya" },
  { flag: "🇪🇹", name: "Ethiopia" },
  { flag: "🇸🇦", name: "Saudi Arabia" },
  { flag: "🇮🇷", name: "Iran" },
  { flag: "🇹🇷", name: "Turkey" },
  { flag: "🇫🇷", name: "France" },
  { flag: "🇩🇪", name: "Germany" },
  { flag: "🇺🇸", name: "USA" },
  { flag: "🇬🇧", name: "UK" },
  { flag: "🇧🇷", name: "Brazil" },
  { flag: "🌍", name: "Other" },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register, loginWithGoogle } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      setError("");
      const err = await loginWithGoogle(tokenResponse.access_token);
      setGoogleLoading(false);
      if (err) { setError(err); return; }
      router.push("/dashboard");
    },
    onError: () => {
      setError("Google sign-in failed. Please try again.");
    },
  });
  const [form, setForm] = useState({
    name: "", email: "", password: "",
    university: "", visa_type: "", country: "",
  });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const canNext = () => {
    if (step === 0) return form.name.trim() && isValidEmail(form.email) && form.password.length >= 6;
    if (step === 1) return !!form.university;
    return true;
  };

  const handleNext = async () => {
    setError("");
    if (step === 0) {
      if (!form.name.trim()) { setError("Please enter your full name."); return; }
      if (!isValidEmail(form.email)) { setError("Please enter a valid email address (e.g. you@gmail.com)."); return; }
      if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
      setStep(1); return;
    }
    if (step === 1) {
      if (!form.university) { setError("Please select your university."); return; }
      setStep(2); return;
    }
    setLoading(true);
    const err = await register(form);
    setLoading(false);
    if (err) { setError(err); return; }
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 mesh-gradient dot-grid">
      <div className="fixed top-1/3 right-1/4 w-72 h-72 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-7">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-glow">
              <span className="text-white font-black text-sm">IC</span>
            </div>
            <span className="text-xl font-bold text-foreground">ICOM<span className="text-indigo-500">.</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground mt-5 mb-0.5">Create account</h1>
          <p className="text-sm text-muted-foreground">{steps[step].hint}</p>
        </div>

        {/* Step dots */}
        <div className="flex items-center gap-2 mb-6 justify-center">
          {steps.map((s, i) => (
            <React.Fragment key={s.label}>
              <div className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                i === step ? "text-indigo-500" : i < step ? "text-emerald-500" : "text-muted-foreground"
              }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border transition-all ${
                  i < step
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-500"
                    : i === step
                    ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-500"
                    : "bg-muted border-border text-muted-foreground"
                }`}>
                  {i < step ? <CheckCircle2 size={11} /> : i + 1}
                </div>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < 2 && <div className={`flex-1 h-px max-w-8 ${i < step ? "bg-emerald-500/40" : "bg-border"}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="glass-card p-7">
          {error && (
            <div className="mb-4 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 animate-fade-in">
              {error}
            </div>
          )}

          {/* Step 0 — Account */}
          {step === 0 && (
            <div className="space-y-4 animate-fade-in">
              {/* Google OAuth */}
              <Button
                variant="outline"
                className="w-full gap-2.5 h-11 hover:bg-accent/80 transition-colors"
                type="button"
                onClick={() => handleGoogleLogin()}
                disabled={googleLoading || loading}
              >
                {googleLoading ? (
                  <Loader2 size={16} className="animate-spin shrink-0" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                {googleLoading ? "Signing in…" : "Continue with Google"}
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-card text-xs text-muted-foreground">or sign up with email</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Full Name</label>
                <Input placeholder="Your full name" value={form.name} onChange={(e) => set("name", e.target.value)} icon={<User size={14} />} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Email Address</label>
                <Input type="email" placeholder="you@gmail.com" value={form.email} onChange={(e) => { set("email", e.target.value); setError(""); }} icon={<Mail size={14} />} />
                {form.email && !isValidEmail(form.email) && (
                  <p className="text-[11px] text-red-400 pl-1">Enter a valid email (e.g. you@gmail.com)</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Password</label>
                <Input type="password" placeholder="Min. 6 characters" value={form.password} onChange={(e) => set("password", e.target.value)} icon={<Lock size={14} />} />
              </div>
            </div>
          )}

          {/* Step 1 — University */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="text-xs font-medium text-foreground block mb-2">Your University</label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto scrollbar-thin pr-1">
                  {UNIVERSITIES.map((u) => (
                    <button key={u.id} type="button" onClick={() => set("university", u.id)}
                      className={`p-3 rounded-xl border text-left transition-all text-xs ${
                        form.university === u.id
                          ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400"
                          : "border-border hover:border-border-medium hover:bg-accent text-muted-foreground hover:text-foreground"
                      }`}>
                      <div className="font-semibold mb-0.5">{u.shortName}</div>
                      <div className="text-[10px] opacity-70 truncate">{u.name}</div>
                    </button>
                  ))}
                  <button type="button" onClick={() => set("university", "other")}
                    className={`p-3 rounded-xl border text-left text-xs transition-all ${
                      form.university === "other"
                        ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-500"
                        : "border-dashed border-border text-muted-foreground hover:border-border-medium"
                    }`}>
                    <div className="font-semibold">Other</div>
                    <div className="text-[10px] opacity-60">Not listed</div>
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-2">Visa Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {VISA_OPTIONS.map((v) => (
                    <button key={v} type="button" onClick={() => set("visa_type", v)}
                      className={`py-2 rounded-xl border text-xs font-medium transition-all ${
                        form.visa_type === v
                          ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-500"
                          : "border-border text-muted-foreground hover:border-border-medium hover:text-foreground"
                      }`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Profile */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="text-xs font-medium text-foreground block mb-2">Country of Origin</label>
                <div className="grid grid-cols-3 gap-1.5 max-h-44 overflow-y-auto scrollbar-thin pr-1">
                  {COUNTRY_OPTIONS.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => set("country", c.name)}
                      className={`flex items-center gap-1.5 px-2 py-2 rounded-xl border text-xs font-medium transition-all ${
                        form.country === c.name
                          ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400"
                          : "border-border text-muted-foreground hover:border-border-medium hover:text-foreground hover:bg-accent"
                      }`}
                    >
                      <span className="text-base leading-none shrink-0">{c.flag}</span>
                      <span className="truncate">{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-500/8 border border-emerald-500/20 space-y-2">
                <p className="text-xs font-semibold text-emerald-500 flex items-center gap-1.5">
                  <CheckCircle2 size={13} /> You&apos;re all set!
                </p>
                {[
                  "Community access — immediately",
                  "Job listings — free forever",
                  "AI assistant — included",
                ].map((t) => (
                  <div key={t} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                    {t}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-6">
            {step > 0 && (
              <Button variant="outline" size="lg" className="gap-1" onClick={() => setStep(step - 1)}>
                <ChevronLeft size={14} />
              </Button>
            )}
            <Button size="lg" className="flex-1 gap-2" onClick={handleNext} disabled={!canNext() || loading}>
              {loading
                ? <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin-slow" />
                : step < 2 ? <>Continue <ArrowRight size={14} /></>
                : <>Create Account <ArrowRight size={14} /></>
              }
            </Button>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-5">
          Already have an account?{" "}
          <Link href="/login" className="text-indigo-500 hover:text-indigo-400 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
