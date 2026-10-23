// Invite links: icom.ai.kr/?ref=<code> (a student's own code, or a campaign tag
// like "kakao-jbnu"). The first ref someone arrives with is kept for 30 days and
// sent when they sign up. A club invite also remembers the club, so the new
// student lands back on it after creating an account.

const REF_KEY = "icom_ref";
const CLUB_KEY = "icom_invite_club";
const DAYS_30 = 30 * 86_400_000;

const clean = (raw: string) => raw.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40);

function readJson<T>(key: string): T | null {
  try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : null; } catch { return null; }
}
function writeJson(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage off */ }
}

/** Keep the ref from the current URL, unless an earlier one is still fresh (first invite wins). */
export function captureRef(search: string = typeof window !== "undefined" ? window.location.search : "") {
  const ref = clean(new URLSearchParams(search).get("ref") || "");
  if (!ref) return;
  const saved = readJson<{ ref: string; at: number }>(REF_KEY);
  if (saved && Date.now() - saved.at < DAYS_30) return;
  writeJson(REF_KEY, { ref, at: Date.now() });
}

export function savedRef(): string | undefined {
  const saved = readJson<{ ref: string; at: number }>(REF_KEY);
  return saved && Date.now() - saved.at < DAYS_30 ? saved.ref : undefined;
}

export function rememberClubInvite(clubId: number | string) {
  writeJson(CLUB_KEY, { id: String(clubId), at: Date.now() });
}

/** Where to go after signing in or finishing onboarding: the club someone was invited to, else `fallback`. */
export function afterAuthPath(fallback: string): string {
  const club = readJson<{ id: string; at: number }>(CLUB_KEY);
  try { localStorage.removeItem(CLUB_KEY); } catch { /* storage off */ }
  return club && Date.now() - club.at < DAYS_30 ? `/community/${club.id}?invited=1` : fallback;
}

/** Share a link with the phone's share sheet, or copy it on a computer. Returns "shared" | "copied" | "failed". */
export async function shareLink(url: string, text: string): Promise<"shared" | "copied" | "failed"> {
  if (typeof navigator !== "undefined" && navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
    try { await navigator.share({ text, url }); return "shared"; } catch (e) {
      if ((e as Error).name === "AbortError") return "failed";   // they closed the share sheet
    }
  }
  try { await navigator.clipboard.writeText(`${text} ${url}`); return "copied"; } catch { return "failed"; }
}
