"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import AuthCard, { FormMessage } from "@/components/auth/auth-card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const { data, error: err } = await api.post<{ message: string }>("/auth/forgot-password", { email: email.trim() });
    setLoading(false);
    if (data) setSent(data.message); else setError(err || "Something went wrong. Please try again.");
  };

  return (
    <AuthCard title="Forgot your password?" subtitle="We'll email you a link to choose a new one."
      footer={<Link href="/login?force=1" className="text-indigo-500 hover:text-indigo-400 font-medium">Back to sign in</Link>}>
      {sent ? (
        <FormMessage tone="ok">{sent}</FormMessage>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && <FormMessage tone="error">{error}</FormMessage>}
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-medium text-foreground">Email</label>
            <Input id="email" type="email" placeholder="your@university.ac.kr" value={email}
              onChange={(e) => setEmail(e.target.value)} icon={<Mail size={14} />} required autoComplete="email" />
          </div>
          <Button type="submit" size="lg" className="w-full gap-2" disabled={loading || !email.trim()}>
            {loading ? <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin-slow" />
              : <>Send reset link <ArrowRight size={15} /></>}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
