// Same choices as the website (src/lib/profile-options.ts, club-categories.ts).
export const JOB_FIELDS = ["IT / Software", "Marketing", "Design", "Sales", "Business", "Research", "HR"];
export const CITIES = ["Seoul", "Seongnam", "Incheon", "Suwon", "Busan", "Daejeon", "Daegu", "Gwangju", "Jeonju", "Ulsan", "Sejong", "Remote"];
export const TOPIK_LEVELS = [0, 1, 2, 3, 4, 5, 6];
export const VISAS = ["D-2", "D-4", "D-10", "E-7", "F-2", "F-4", "Other"];
export const UNIVERSITIES = [
  { id: "jbnu", name: "JBNU" }, { id: "snu", name: "SNU" }, { id: "yonsei", name: "Yonsei" }, { id: "korea", name: "Korea Univ." },
  { id: "hanyang", name: "Hanyang" }, { id: "khu", name: "Kyung Hee" }, { id: "skku", name: "SKKU" }, { id: "kaist", name: "KAIST" },
  { id: "pnu", name: "Pusan Nat'l" }, { id: "knu", name: "Kyungpook Nat'l" }, { id: "cnu", name: "Chungnam Nat'l" }, { id: "other", name: "Other" },
];
export const COUNTRIES = ["Uzbekistan", "Vietnam", "China", "Mongolia", "Nepal", "Indonesia", "Kazakhstan", "Russia", "India", "Pakistan", "Bangladesh", "Myanmar", "Other"];

export const ARRIVAL_STEPS = [
  { id: "arc", title: "Apply for your ARC", note: "Within 90 days of arriving. Book on HiKorea.", guide: "visa" },
  { id: "bank", title: "Open a bank account", note: "Bring your ARC, passport and Korean phone number.", guide: "banking" },
  { id: "insurance", title: "Check your health insurance", note: "Students are enrolled in NHIS. Know how to pay.", guide: "insurance" },
  { id: "phone", title: "Get a Korean phone number", note: "Needed for banking apps and verification.", guide: "living" },
  { id: "tmoney", title: "Get a T-money card", note: "Buses, subway and convenience stores.", guide: "transport" },
  { id: "housing", title: "Sort out housing", note: "Dorm, goshiwon or one-room. Know your deposit.", guide: "housing" },
  { id: "work-permit", title: "Get a part-time work permit", note: "Needed before any part-time job or internship on D-2.", guide: "visa" },
];

export const CLUB_CATEGORIES: Record<string, string> = {
  academic: "Academic", "sports & outdoor": "Sports & Outdoor", "arts & culture": "Arts & Culture", social: "Social",
  language: "Language", tech: "Tech", business: "Business", volunteer: "Volunteer", "national community": "National community",
  "religion & culture": "Religion & Culture", "support & community": "Support & Community",
};

/** Whole days from today until a YYYY-MM-DD date; null if not a date. */
export function daysUntil(iso?: string | null): number | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split("-").map(Number);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.round((new Date(y, m - 1, d).getTime() - today.getTime()) / 86_400_000);
}

export function timeAgo(iso: string): string {
  const t = new Date(iso.endsWith("Z") ? iso : iso + "Z").getTime();
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} d ago`;
  return new Date(t).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}
