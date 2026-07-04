import Constants from "expo-constants";
import { getItem, TOKEN_KEY } from "./storage";

// Resolution order: EXPO_PUBLIC_API_URL (set in .env for local dev against
// http://<your-lan-ip>:5001/api) → app.json extra.apiUrl (production backend).
const BASE: string =
  process.env.EXPO_PUBLIC_API_URL ||
  (Constants.expoConfig?.extra?.apiUrl as string) ||
  "https://icom-backend.onrender.com/api";

export interface ApiResult<T> {
  data: T | null;
  error: string | null;
  status: number;
  code?: string;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResult<T>> {
  const token = await getItem(TOKEN_KEY);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  try {
    const res = await fetch(`${BASE}${path}`, { ...options, headers });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        data: null,
        error: json.error || "Something went wrong",
        status: res.status,
        code: json.code,
      };
    }
    return { data: json as T, error: null, status: res.status };
  } catch {
    return {
      data: null,
      // Render's free tier sleeps after 15 min — the first request can take
      // ~30s to wake it, so the copy nudges users to retry rather than quit.
      error: "Cannot connect to server. It may be waking up — try again in a few seconds.",
      status: 0,
    };
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),

  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),

  delete: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "DELETE", body: body ? JSON.stringify(body) : undefined }),
};
