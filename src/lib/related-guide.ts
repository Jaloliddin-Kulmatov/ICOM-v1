// Point a chat question at the ICOM guide that covers its topic.
const TOPICS: { href: string; title: string; words: RegExp }[] = [
  { href: "/guide/visa", title: "Visa & Immigration guide", words: /\b(visa|arc|d-?2|d-?4|d-?10|e-?7|immigration|extend|extension|hikorea|work permit|part[- ]?time)\b|외국인등록|비자|출입국/i },
  { href: "/guide/banking", title: "Banking guide", words: /\b(bank|account|transfer|remit|atm|card|kakao ?bank|toss|shinhan|woori)\b|은행|계좌/i },
  { href: "/guide/insurance", title: "Health insurance guide", words: /\b(insurance|nhis|hospital|clinic|doctor|pharmacy|medical|sick)\b|보험|병원/i },
  { href: "/guide/housing", title: "Housing guide", words: /\b(housing|dorm|dormitory|rent|deposit|goshiwon|gosiwon|one[- ]room|apartment|landlord|jeonse|wolse)\b|기숙사|원룸|고시원/i },
  { href: "/guide/transport", title: "Transport guide", words: /\b(bus|subway|metro|train|ktx|t-?money|taxi|transport)\b|버스|지하철/i },
  { href: "/guide/language", title: "Korean language guide", words: /\b(topik|korean class|language school|learn korean|hangul)\b|한국어/i },
];

export function relatedGuide(text: string): { href: string; title: string } | null {
  let best: { href: string; title: string; hits: number } | null = null;
  for (const t of TOPICS) {
    const hits = (text.match(new RegExp(t.words.source, "gi")) || []).length;
    if (hits && (!best || hits > best.hits)) best = { href: t.href, title: t.title, hits };
  }
  return best ? { href: best.href, title: best.title } : null;
}
