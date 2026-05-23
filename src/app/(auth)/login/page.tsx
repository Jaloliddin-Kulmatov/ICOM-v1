"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { useGoogleLogin } from "@react-oauth/google";

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle } = useAuth();
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const err = await login(email, password);
    setLoading(false);
    if (err) { setError(err); return; }
    router.push("/dashboard");
  };

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
          {/* Google OAuth */}
          <Button
            variant="outline"
            className="w-full gap-2.5 mb-4 h-11 hover:bg-accent/80 transition-colors"
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

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-card text-xs text-muted-foreground">or</span>
            </div>
          </div>

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
