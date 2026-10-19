import data from "@/data/guides.json";

// ICOM's guide text, bundled with the app so it works offline (the immigration
// office queue often has bad signal). Copied from backend/data/guides.json by
// `npm run sync-guides`.
export type Guide = { slug: string; title: string; url: string; updated: string; chunks: string[] };
export const GUIDES = data as Guide[];

export const GUIDE_ORDER = ["visa", "banking", "insurance", "housing", "transport", "language", "living", "faq"];
export const GUIDE_ICONS: Record<string, string> = {
  visa: "document-text-outline", banking: "card-outline", insurance: "medkit-outline", housing: "home-outline",
  transport: "bus-outline", language: "language-outline", living: "cafe-outline", faq: "help-circle-outline",
};
export const sortedGuides = () => [...GUIDES].sort((a, b) => GUIDE_ORDER.indexOf(a.slug) - GUIDE_ORDER.indexOf(b.slug));

/** Split a chunk into readable paragraphs: questions on their own line. */
export function paragraphs(chunk: string): string[] {
  return chunk.split(/(?<=[.!?])\s+(?=[A-Z0-9])/).reduce<string[]>((acc, s) => {
    if (s.endsWith("?") || !acc.length) acc.push(s);
    else if (acc[acc.length - 1].endsWith("?")) acc.push(s);
    else acc[acc.length - 1] += " " + s;
    return acc;
  }, []);
}
