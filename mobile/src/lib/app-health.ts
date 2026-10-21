import { Platform } from "react-native";
import { API_URL, APP_VERSION } from "./config";

/** "1.2.10" > "1.2.9". Missing parts count as 0. */
export function isOlder(version: string, than: string): boolean {
  const a = version.split(".").map((n) => parseInt(n, 10) || 0);
  const b = than.split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) < (b[i] || 0);
  }
  return false;
}

export type AppConfig = { min_version: string; latest_version: string; message: string; ios_url: string; android_url: string };

export async function fetchAppConfig(): Promise<AppConfig | null> {
  try {
    const res = await fetch(`${API_URL}/app/config`);
    return res.ok ? await res.json() : null;
  } catch {
    return null;   // offline: never block the app on this
  }
}

/** Sends a crash to the server log (Render → Logs, search "[app-error]"). Never throws. */
export function reportError(error: unknown, extra: { screen?: string; fatal?: boolean } = {}) {
  const e = error instanceof Error ? error : new Error(String(error));
  fetch(`${API_URL}/app/errors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: e.message, stack: e.stack || "", version: APP_VERSION, platform: Platform.OS, ...extra }),
  }).catch(() => {});
}

type GlobalHandler = (error: Error, isFatal?: boolean) => void;
type ErrorUtilsShape = { getGlobalHandler: () => GlobalHandler; setGlobalHandler: (h: GlobalHandler) => void };

/** Report uncaught JS errors too (they don't reach React's error boundary). */
export function installCrashReporter() {
  const eu = (globalThis as unknown as { ErrorUtils?: ErrorUtilsShape }).ErrorUtils;
  if (!eu) return;
  const previous = eu.getGlobalHandler();
  eu.setGlobalHandler((error, isFatal) => {
    reportError(error, { fatal: !!isFatal });
    previous(error, isFatal);
  });
}
