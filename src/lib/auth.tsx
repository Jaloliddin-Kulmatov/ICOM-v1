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

interface AuthCtx {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  register: (data: RegisterData) => Promise<string | null>;
  loginWithGoogle: (accessToken: string) => Promise<string | null>;
  logout: () => void;
  refreshUser: () => void;
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
  loginWithGoogle: async () => null,
  logout: () => {},
  refreshUser: () => {},
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

  const loginWithGoogle = async (accessToken: string) => {
    const { data, error } = await api.post<{ token: string; user: UserProfile }>(
      "/auth/google",
      { access_token: accessToken }
    );
    if (error) return error;
    localStorage.setItem("icon_token", data!.token);
    localStorage.setItem("icom_has_account", "1");
    setUser(data!.user);
    return null;
  };

  const logout = () => {
    localStorage.removeItem("icon_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout, refreshUser: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
