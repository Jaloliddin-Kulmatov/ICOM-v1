import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, TOKEN_KEY } from "./api";
import { getItem, removeItem, setItem } from "./storage";
import type { User } from "./types";

type AuthState = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  register: (form: { name: string; email: string; password: string; university: string; country: string; visa_type: string }) => Promise<string | null>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  deleteAccount: () => Promise<string | null>;
};

const AuthContext = createContext<AuthState | null>(null);

/** The signed-in user, null when signed out, "offline" when the server can't be reached. */
async function loadMe(): Promise<User | null | "offline"> {
  const token = await getItem(TOKEN_KEY);
  if (!token) return null;
  const { data, status } = await api.get<{ user: User }>("/auth/me");
  if (data) return data.user;
  if (status === 401 || status === 422) { await removeItem(TOKEN_KEY); return null; }
  return "offline";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const result = await loadMe();
    if (result !== "offline") setUser(result);
  }, []);

  // On launch: signed in from a saved token, if it's still valid.
  useEffect(() => {
    let alive = true;
    loadMe().then((result) => {
      if (!alive) return;
      if (result !== "offline") setUser(result);
      setLoading(false);
    });
    return () => { alive = false; };
  }, []);

  const finish = async (data: { token: string; user: User } | null, error: string | null) => {
    if (!data) return error || "Something went wrong.";
    await setItem(TOKEN_KEY, data.token);
    setUser(data.user);
    return null;
  };

  const value: AuthState = {
    user, loading, refresh,
    signIn: async (email, password) => {
      const { data, error } = await api.post<{ token: string; user: User }>("/auth/login", { email: email.trim(), password });
      return finish(data, error);
    },
    register: async (form) => {
      const { data, error } = await api.post<{ token: string; user: User }>("/auth/register", form);
      return finish(data, error);
    },
    signOut: async () => {
      const { unregisterPush } = await import("./notifications");
      await unregisterPush();
      await removeItem(TOKEN_KEY);
      setUser(null);
    },
    deleteAccount: async () => {
      const { error } = await api.delete("/auth/me", { confirm: "DELETE" });
      if (error) return error;
      await removeItem(TOKEN_KEY);
      setUser(null);
      return null;
    },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
