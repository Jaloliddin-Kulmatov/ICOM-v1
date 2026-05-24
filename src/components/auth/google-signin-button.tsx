"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import { Button } from "@/components/ui/button";

interface Props {
  onSuccess: (accessToken: string) => void | Promise<void>;
  onError: (msg: string) => void;
  loading: boolean;
  setLoading: (b: boolean) => void;
  label?: string;
  disabled?: boolean;
}

/**
 * Google Sign-In button. Only mount this when GoogleOAuthProvider is present
 * (i.e. NEXT_PUBLIC_GOOGLE_CLIENT_ID is set). Otherwise `useGoogleLogin`
 * will throw because there is no provider context.
 */
export default function GoogleSignInButton({
  onSuccess,
  onError,
  loading,
  setLoading,
  label = "Continue with Google",
  disabled = false,
}: Props) {
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        await onSuccess(tokenResponse.access_token);
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      onError("Google sign-in failed. Please try again.");
    },
  });

  return (
    <Button
      variant="outline"
      className="w-full gap-2.5 mb-4 h-11 hover:bg-accent/80 transition-colors"
      type="button"
      onClick={() => handleGoogleLogin()}
      disabled={disabled || loading}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin shrink-0" />
      ) : (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
      )}
      {loading ? "Signing in…" : label}
    </Button>
  );
}

/** True at build time iff NEXT_PUBLIC_GOOGLE_CLIENT_ID was set when bundled. */
export const GOOGLE_AUTH_ENABLED = !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
