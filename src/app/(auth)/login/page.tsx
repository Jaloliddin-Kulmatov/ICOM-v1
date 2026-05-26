"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import GoogleSignInButton, { GOOGLE_AUTH_ENABLED } from "@/components/auth/google-signin-button";

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle } = useAuth();
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [redirectChecked, setRedirectChecked] = useState(false);

  // First-time visitors → send to /register. They can still get here
  // explicitly via /login?force=1 (e.g. from the "Sign in" link on /register).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasAccount = localStorage.getItem("icom_has_account") === "1";
    const force = new URLSearchParams(window.location.search).get("force") === "1";
    if (!hasAccount && !force) {
      router.replace("/register");
      return;
    }
    setRedirectChecked(true);
  }, [router]);

  // Don't flash the login form before the redirect runs
  if (!redirectChecked) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const err = await login(email, password);
    setLoading(false);
    if (err) { setError(err); return; }
    router.push("/dashboard");
  };

  const handleGoogleSuccess = async (accessToken: string) => {
    setError("");
    const err = await loginWithGoogle(accessToken, "login");
    if (err) {
      // Distinct error UI when no account is linked → guide them to /register
      if (err.toLowerCase().includes("no icom account") || err.toLowerCase().includes("sign up first")) {
        setError("No account found for this Google email. Redirecting to sign up…");
        setTimeout(() => router.push("/register"), 1500);
        return;
      }
      setError(err);
      return;
    }
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 mesh-gradient dot-grid">
      {/* Background glow */}
      <div className="fixed top-1/3 left-1/4 w-72 h-72 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-glow">
              <span className="text-white font-black text-sm">IC</span>
            </div>
            <span className="text-xl font-bold text-foreground">ICOM<span className="text-indigo-500">.</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground mt-6 mb-1">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Sign in to your ICOM account</p>
        </div>

        {/* Card */}
        <div className="glass-card p-7">
          {/* Google OAuth — only when configured */}
          {GOOGLE_AUTH_ENABLED && (
            <>
              <GoogleSignInButton
                onSuccess={handleGoogleSuccess}
                onError={setError}
                loading={googleLoading}
                setLoading={setGoogleLoading}
                disabled={loading}
              />
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-card text-xs text-muted-foreground">or</span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 animate-fade-in">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Email</label>
              <Input
                type="email"
                placeholder="your@university.ac.kr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail size={14} />}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-foreground">Password</label>
                <Link href="/forgot-password" className="text-xs text-indigo-500 hover:text-indigo-400 transition-colors">
                  Forgot?
                </Link>
              </div>
              <Input
                type={showPw ? "text" : "password"}
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock size={14} />}
                iconRight={
                  <button type="button" onClick={() => setShowPw(!showPw)} className="text-muted-foreground hover:text-foreground">
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                }
                required
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" size="lg" className="w-full gap-2" disabled={loading}>
              {loading ? (
                <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin-slow" />
              ) : (
                <>Sign in <ArrowRight size={15} /></>
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-5">
          No account?{" "}
          <Link href="/register" className="text-indigo-500 hover:text-indigo-400 font-medium transition-colors">
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}
