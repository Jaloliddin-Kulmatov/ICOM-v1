import {
  GraduationCap, Dumbbell, Palette, PartyPopper, Languages, Code2, HeartHandshake,
  Briefcase, Flag, Church, LifeBuoy, type LucideIcon,
} from "lucide-react";

// One list of club/community categories for every page. The backend uses the
// same keys (backend/club_categories.py) and maps old names onto them.
export type CategoryInfo = { key: string; label: string; icon: LucideIcon; color: string };

export const CATEGORIES: CategoryInfo[] = [
  { key: "academic",            label: "Academic",            icon: GraduationCap,  color: "text-indigo-600 dark:text-indigo-300 bg-indigo-500/10 border-indigo-500/25" },
  { key: "sports & outdoor",    label: "Sports & Outdoor",    icon: Dumbbell,       color: "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/25" },
  { key: "arts & culture",      label: "Arts & Culture",      icon: Palette,        color: "text-pink-700 dark:text-pink-300 bg-pink-500/10 border-pink-500/25" },
  { key: "social",              label: "Social",              icon: PartyPopper,    color: "text-cyan-700 dark:text-cyan-300 bg-cyan-500/10 border-cyan-500/25" },
  { key: "language",            label: "Language",            icon: Languages,      color: "text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/25" },
  { key: "tech",                label: "Tech",                icon: Code2,          color: "text-blue-700 dark:text-blue-300 bg-blue-500/10 border-blue-500/25" },
  { key: "business",            label: "Business",            icon: Briefcase,      color: "text-slate-700 dark:text-slate-300 bg-slate-500/10 border-slate-500/25" },
  { key: "volunteer",           label: "Volunteer",           icon: HeartHandshake, color: "text-orange-700 dark:text-orange-300 bg-orange-500/10 border-orange-500/25" },
  { key: "national community",  label: "National community",  icon: Flag,           color: "text-violet-700 dark:text-violet-300 bg-violet-500/10 border-violet-500/25" },
  { key: "religion & culture",  label: "Religion & Culture",  icon: Church,         color: "text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/25" },
  { key: "support & community", label: "Support & Community", icon: LifeBuoy,       color: "text-teal-700 dark:text-teal-300 bg-teal-500/10 border-teal-500/25" },
];

const BY_KEY = new Map(CATEGORIES.map((c) => [c.key, c]));
const OLD_NAMES: Record<string, string> = {
  sports: "sports & outdoor", outdoor: "sports & outdoor", "health & wellness": "sports & outdoor",
  arts: "arts & culture", culture: "arts & culture", "food & culture": "arts & culture",
  technology: "tech",
};

/** Canonical key for any stored category (old names included). */
export function categoryKey(raw?: string | null, clubType?: string): string {
  const k = (raw || "").trim().toLowerCase();
  if (BY_KEY.has(k)) return k;
  if (k === "culture" && clubType === "community") return "national community";
  return OLD_NAMES[k] || "social";
}

export function categoryInfo(raw?: string | null, clubType?: string): CategoryInfo {
  return BY_KEY.get(categoryKey(raw, clubType))!;
}

/** Categories offered when creating or editing a club or community. */
export const CLUB_CATEGORY_KEYS = ["academic", "sports & outdoor", "arts & culture", "social", "language", "tech", "business", "volunteer"];
export const COMMUNITY_CATEGORY_KEYS = ["national community", "religion & culture", "support & community", "social", "language", "arts & culture", "tech", "academic", "sports & outdoor"];
