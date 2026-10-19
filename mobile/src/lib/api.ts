import { API_URL } from "./config";
import { getItem } from "./storage";

export const TOKEN_KEY = "icom_token";

export type ApiResult<T> = { data: T | null; error: string | null; status: number };

// The free server can take ~30 s to wake up, so allow a long first request.
const TIMEOUT_MS = 45_000;

async function request<T>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  const token = await getItem(TOKEN_KEY);
  const isForm = typeof FormData !== "undefined" && init.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isForm ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((init.headers as Record<string, string>) || {}),
  };
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${API_URL}${path}`, { ...init, headers, signal: ctl.signal });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = json.error || json.msg || (res.status === 401 ? "Please sign in again." : "Something went wrong. Please try again.");
      return { data: null, error: msg, status: res.status };
    }
    return { data: json as T, error: null, status: res.status };
  } catch {
    return { data: null, error: "Can't reach ICOM. Check your internet connection and try again.", status: 0 };
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string, body?: unknown) => request<T>(path, { method: "DELETE", body: body === undefined ? undefined : JSON.stringify(body) }),
  upload: <T>(path: string, form: FormData) => request<T>(path, { method: "POST", body: form }),
};
