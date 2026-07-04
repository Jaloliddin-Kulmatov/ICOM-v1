import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api } from "./api";
import { getItem, removeItem, setItem, TOKEN_KEY } from "./storage";
import type { UserProfile } from "./types";

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  university?: string;
  visa_type?: string;
  country?: string;
}

interface AuthCtx {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  register: (data: RegisterData) => Promise<string | null>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (patch: Partial<RegisterData>) => Promise<string | null>;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  loading: true,
  login: async () => null,
  register: async () => null,
  logout: async () => {},
  refreshUser: async () => {},
  updateProfile: async () => null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = await getItem(TOKEN_KEY);
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    const { data, status } = await api.get<{ user: UserProfile }>("/auth/me");
    if (data?.user) {
      setUser(data.user);
    } else if (status === 401 || status === 422) {
      // Token expired or invalid — clear it so the app returns to login.
      await removeItem(TOKEN_KEY);
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const { data, error } = await api.post<{ token: string; user: UserProfile }>(
      "/auth/login",
      { email, password }
    );
    if (error) return error;
    await setItem(TOKEN_KEY, data!.token);
    setUser(data!.user);
    return null;
  };

  const register = async (payload: RegisterData) => {
    const { data, error } = await api.post<{ token: string; user: UserProfile }>(
      "/auth/register",
      payload
    );
    if (error) return error;
    await setItem(TOKEN_KEY, data!.token);
    setUser(data!.user);
    return null;
  };

  const updateProfile = async (patch: Partial<RegisterData>) => {
    const { data, error } = await api.patch<{ user: UserProfile }>("/auth/me", patch);
    if (error) return error;
    if (data?.user) setUser(data.user);
    return null;
  };

  const logout = async () => {
    await removeItem(TOKEN_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshUser, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
