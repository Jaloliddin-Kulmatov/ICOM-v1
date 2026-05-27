"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { api } from "./api";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  university?: string;
  visa_type?: string;
  country?: string;
  role: string;
  is_verified: boolean;
}

type GoogleMode = "login" | "register";

export interface AuthError {
  message: string;
  code?: string;   // "NO_ACCOUNT" | "ACCOUNT_EXISTS" | ...
  status?: number;
}

export interface GoogleAuthSuccess {
  created: boolean;          // was a NEW account created in this call?
  profileComplete: boolean;  // are university/visa/country all filled in?
}

interface AuthCtx {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  register: (data: RegisterData) => Promise<string | null>;
  loginWithGoogle: (
    accessToken: string,
    mode?: GoogleMode
  ) => Promise<{ ok: GoogleAuthSuccess } | { error: AuthError }>;
  logout: () => void;
  refreshUser: () => void;
  deleteAccount: (confirm: string) => Promise<string | null>;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  university?: string;
  visa_type?: string;
  country?: string;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  loading: true,
  login: async () => null,
  register: async () => null,
  loginWithGoogle: async () => ({ error: { message: "AuthContext not mounted" } }),
  logout: () => {},
  refreshUser: () => {},
  deleteAccount: async () => null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem("icon_token");
    if (!token) { setLoading(false); return; }
    const { data } = await api.get<{ user: UserProfile }>("/auth/me");
    setUser(data?.user ?? null);
    setLoading(false);
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const login = async (email: string, password: string) => {
    const { data, error } = await api.post<{ token: string; user: UserProfile }>(
      "/auth/login",
      { email, password }
    );
    if (error) return error;
    localStorage.setItem("icon_token", data!.token);
    localStorage.setItem("icom_has_account", "1"); // remember this device has signed in before
    setUser(data!.user);
    return null;
  };

  const register = async (payload: RegisterData) => {
    const { data, error } = await api.post<{ token: string; user: UserProfile }>(
      "/auth/register",
      payload
    );
    if (error) return error;
    localStorage.setItem("icon_token", data!.token);
    localStorage.setItem("icom_has_account", "1");
    setUser(data!.user);
    return null;
  };

  const loginWithGoogle = async (
    accessToken: string,
    mode?: GoogleMode
  ): Promise<{ ok: GoogleAuthSuccess } | { error: AuthError }> => {
    const result = await api.post<{
      token: string;
      user: UserProfile;
      created?: boolean;
      profile_complete?: boolean;
    }>("/auth/google", { access_token: accessToken, mode });
    if (result.error) {
      return { error: { message: result.error, code: result.code, status: result.status } };
    }
    localStorage.setItem("icon_token", result.data!.token);
    localStorage.setItem("icom_has_account", "1");
    setUser(result.data!.user);
    return {
      ok: {
        created: !!result.data!.created,
        // Default to false (force onboarding) if the backend hasn't been
        // redeployed yet with the new fields.
        profileComplete: !!result.data!.profile_complete,
      },
    };
  };

  const logout = () => {
    localStorage.removeItem("icon_token");
    setUser(null);
  };

  const deleteAccount = async (confirm: string): Promise<string | null> => {
    const { error } = await api.delete<{ message: string }>("/auth/me", { confirm });
    if (error) return error;
    localStorage.removeItem("icon_token");
    localStorage.removeItem("icom_has_account");
    setUser(null);
    return null;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout, refreshUser: fetchMe, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
