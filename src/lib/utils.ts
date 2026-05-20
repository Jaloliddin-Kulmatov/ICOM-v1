import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parse a date string from the backend. Old records used datetime.utcnow().isoformat()
 * without a timezone marker, which browsers misinterpret as local time. If there's no
 * Z or +HH:MM suffix, we assume UTC and append "Z".
 */
function parseBackendDate(date: string | Date): Date {
  if (typeof date !== "string") return new Date(date);
  const hasTz = /Z$|[+-]\d{2}:?\d{2}$/.test(date);
  return new Date(hasTz ? date : date + "Z");
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parseBackendDate(date));
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const target = parseBackendDate(date);
  const diffMs = now.getTime() - target.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.substring(0, length) + "..." : str;
}

export function generateAvatar(name: string): string {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4`;
}
