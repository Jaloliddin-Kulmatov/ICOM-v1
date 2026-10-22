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

  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),

  delete: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "DELETE",
      body: body ? JSON.stringify(body) : undefined,
    }),
};

/** Upload a file as multipart/form-data (the browser sets the boundary). */
export async function uploadFile<T>(path: string, field: string, file: File): Promise<ApiResult<T>> {
  const token = getToken();
  const form = new FormData();
  form.append(field, file);
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      body: form,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { data: null, error: json.error || "Upload failed", status: res.status };
    return { data: json as T, error: null, status: res.status };
  } catch {
    return { data: null, error: "Could not reach the server. Check your connection.", status: 0 };
  }
}

/** Download an authenticated file and hand it to the browser as a save. With `body`, it's a JSON POST. */
export async function downloadFile(path: string, fallbackName: string, body?: unknown): Promise<string | null> {
  const token = getToken();
  try {
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    if (body !== undefined) headers["Content-Type"] = "application/json";
    const res = await fetch(`${BASE}${path}`, body === undefined ? { headers }
      : { method: "POST", headers, body: JSON.stringify(body) });
    if (!res.ok) return (await res.json().catch(() => ({}))).error || "Download failed";
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fallbackName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return null;
  } catch {
    return "Could not reach the server. Check your connection.";
  }
}
