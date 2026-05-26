const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("icon_token");
}

export interface ApiResult<T> {
  data: T | null;
  error: string | null;
  status: number;
  code?: string; // server-defined error code (e.g. "NO_ACCOUNT", "ACCOUNT_EXISTS")
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResult<T>> {
  const token = getToken();
  const headers: HeadersInit = {
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
      error: "Cannot connect to server. Please try again.",
      status: 0,
    };
  }
}

export const api = {
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),

  get: <T>(path: string) =>
    request<T>(path, { method: "GET" }),

  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),

  delete: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "DELETE",
      body: body ? JSON.stringify(body) : undefined,
    }),
};
