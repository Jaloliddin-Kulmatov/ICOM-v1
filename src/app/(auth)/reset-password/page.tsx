"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import AuthCard, { FormMessage } from "@/components/auth/auth-card";

export default function ResetPasswordPage() {
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // The token comes from the link in the email (?token=...).
  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token") || "");
  }, []);

  const mismatch = confirm.length > 0 && confirm !== password;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return;
    setLoading(true); setError("");
    const { data, error: err } = await api.post<{ message: string }>("/auth/reset-password", { token, password });
    setLoading(false);
    if (data) setDone(true); else setError(err || "Something went wrong. Please try again.");
  };

  const footer = <Link href="/login?force=1" className="text-indigo-500 hover:text-indigo-400 font-medium">Back to sign in</Link>;

  if (token === "") {
    return (
      <AuthCard title="Link not valid" footer={footer}>
        <FormMessage tone="error">
          This page needs the link from your reset email. <Link href="/forgot-password" className="underline">Ask for a new link</Link>.
        </FormMessage>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Choose a new password" subtitle="Use at least 6 characters." footer={footer}>
      {done ? (
        <div className="space-y-4">
          <FormMessage tone="ok">Password changed. You can sign in with it now, on the website or in the app.</FormMessage>
          <Link href="/login?force=1"><Button size="lg" className="w-full gap-2">Sign in <ArrowRight size={15} /></Button></Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && (
            <FormMessage tone="error">
              {error} {error.includes("expired") && <Link href="/forgot-password" className="underline">Ask for a new link</Link>}
            </FormMessage>
          )}
          <div className="space-y-1.5">
            <label htmlFor="pw" className="text-xs font-medium text-foreground">New password</label>
            <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              icon={<Lock size={14} />} required minLength={6} autoComplete="new-password" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="pw2" className="text-xs font-medium text-foreground">Type it again</label>
            <Input id="pw2" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
              icon={<Lock size={14} />} required minLength={6} autoComplete="new-password" />
            {mismatch && <p className="text-xs text-red-400">The two passwords don&apos;t match.</p>}
          </div>
          <Button type="submit" size="lg" className="w-full gap-2" disabled={loading || !token || password.length < 6 || password !== confirm}>
            {loading ? <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin-slow" />
              : <>Save new password <ArrowRight size={15} /></>}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
