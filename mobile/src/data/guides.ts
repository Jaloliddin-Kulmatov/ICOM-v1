// Support guide content, condensed from the web app's /support pages.
// Each guide is a list of sections; a section is a heading plus bullet steps.

import type { Ionicons } from "@expo/vector-icons";

export interface GuideSection {
  heading: string;
  bullets: string[];
}

export interface Guide {
  slug: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  sections: GuideSection[];
}

export const GUIDES: Guide[] = [
  {
    slug: "visa",
    title: "Visa & Immigration",
    icon: "document-text",
    description: "D-2, D-4, extensions, and status changes",
    sections: [
      {
        heading: "Know your visa",
        bullets: [
          "D-2: degree students (bachelor's, master's, PhD). Allows part-time work with permission.",
          "D-4: Korean language trainees. Part-time work possible after 6 months, with permission.",
          "D-10: job-seeker visa for after graduation — up to 2 years to find employment.",
          "F-2: long-term resident. Few work restrictions.",
        ],
      },
      {
        heading: "Extend your stay (do this 4+ weeks before expiry)",
        bullets: [
          "Book a visit at hikorea.go.kr → Reserve Visit → your local immigration office.",
          "Prepare: passport, ARC, application form, enrollment certificate, transcript, proof of finances (bank statement), and the ₩60,000 fee.",
          "Your university's international office can pre-check your documents — use them.",
          "Overstaying even one day means fines and can hurt future applications. Set a reminder.",
        ],
      },
      {
        heading: "Part-time work permission",
        bullets: [
          "You MUST get 'Permission for Activities Outside Status' BEFORE starting any job — even one shift.",
          "Apply on HiKorea with your work contract, enrollment certificate, and grades (usually needs GPA above C).",
          "Hour limits: undergrad D-2 up to 25h/week during semester (more on breaks); D-4 up to 20h after 6 months.",
          "TOPIK level can raise your allowed hours.",
        ],
      },
      {
        heading: "After graduation",
        bullets: [
          "Switch D-2 → D-10 (job seeker) or directly to E-7 if you already have a job offer.",
          "E-7 requires a job matching your major and a sponsoring company.",
          "Start the E-7 paperwork with your employer at least a month before your D-2 expires.",
        ],
      },
    ],
  },
  {
    slug: "housing",
    title: "Housing & Dorms",
    icon: "home",
    description: "Dormitories, one-rooms, and deposits",
    sections: [
      {
        heading: "Options at a glance",
        bullets: [
          "Dormitory (기숙사): cheapest and easiest — apply through your university before each semester. Spots fill fast.",
          "One-room (원룸): studio near campus. Deposit ₩3–10M, rent ₩300–500K/month.",
          "Goshiwon (고시원): tiny furnished rooms, no deposit, ₩250–450K/month. Good landing spot for your first month.",
          "Share house: private room + shared kitchen/living. Deposit under ₩1M usually.",
        ],
      },
      {
        heading: "The jeonse/wolse system",
        bullets: [
          "Wolse (월세) = deposit + monthly rent. This is what most students use.",
          "The deposit (보증금) comes back when you move out, minus damages — photograph everything on move-in day.",
          "Never send deposit money before signing a contract and checking the building's registry (등기부등본).",
        ],
      },
      {
        heading: "Signing safely",
        bullets: [
          "Use a licensed realtor (공인중개사) — the fee (~0.3–0.5% of deposit) buys you legal protection.",
          "Get every promise in writing on the contract, including repairs and move-out terms.",
          "After moving in, register your address at the district office (주민센터) within 14 days — it also protects your deposit legally.",
          "Ask your international office about university-verified listings before searching alone.",
        ],
      },
    ],
  },
  {
    slug: "banking",
    title: "Banking & Finance",
    icon: "card",
    description: "Accounts, cards, and sending money home",
    sections: [
      {
        heading: "Open an account",
        bullets: [
          "Bring: passport, ARC (Alien Registration Card), and enrollment certificate.",
          "Student-friendly banks: KB Kookmin, Shinhan, Woori, Hana — big branches near universities often have English-speaking staff.",
          "Some banks restrict new accounts in your first 6 months — a limited (한도) account still works for salary and transfers.",
          "Get the bank's app set up in-branch before you leave; ask them to enable transfers.",
        ],
      },
      {
        heading: "Cards & everyday payments",
        bullets: [
          "Your check card (체크카드) works everywhere and doubles as a T-money transit card if you ask.",
          "KakaoPay / Naver Pay / Toss cover most online payments once linked to your account.",
          "Korean online shopping sometimes needs extra identity verification — your ARC-linked phone number is essential.",
        ],
      },
      {
        heading: "Sending money home",
        bullets: [
          "Compare rates: banks are safest but priciest; licensed apps like Wise, SentBe, E9pay, and Hanpass are usually cheaper.",
          "You'll need your foreign bank's SWIFT/IBAN details and sometimes proof of income source.",
          "Annual limits apply without extra documentation (typically USD 50K equivalent).",
        ],
      },
    ],
  },
  {
    slug: "insurance",
    title: "Health Insurance",
    icon: "shield-checkmark",
    description: "NHIS enrollment and using hospitals",
    sections: [
      {
        heading: "NHIS — you're (probably) already enrolled",
        bullets: [
          "International students are AUTOMATICALLY enrolled in National Health Insurance (NHIS) from arrival.",
          "Student rate is roughly ₩70–80K/month (a ~50%+ discount is applied for D-2/D-4 students).",
          "Bills come monthly — set up auto-pay at your bank or pay at any convenience store. Unpaid bills can block visa extensions.",
        ],
      },
      {
        heading: "Using hospitals & pharmacies",
        bullets: [
          "Clinic (의원) first for small things — a visit costs ₩5–15K with NHIS.",
          "University hospitals need a referral for the insurance discount to fully apply.",
          "Pharmacies (약국) fill prescriptions; basic meds like painkillers don't need one.",
          "Emergency: call 119 (they have interpreters). Emergency rooms are open 24/7.",
        ],
      },
      {
        heading: "Money-savers",
        bullets: [
          "NHIS covers annual free health checkups — check nhis.or.kr.",
          "Keep receipts: you can claim back overpaid medical costs at year end.",
          "1339 is the 24/7 medical info hotline with English support.",
        ],
      },
    ],
  },
  {
    slug: "transport",
    title: "Transportation",
    icon: "train",
    description: "T-money, buses, subway, KTX",
    sections: [
      {
        heading: "Get a T-money card",
        bullets: [
          "Buy at any convenience store (₩2,500–4,000), top up with cash there or at station machines.",
          "Works on buses, subways, and taxis in every Korean city.",
          "Transfers are free/discounted within 30 min when you tap out AND in.",
          "A 'Climate Card' (기후동행카드) or regional passes can beat pay-per-ride if you commute daily — compare monthly costs.",
        ],
      },
      {
        heading: "Apps you need",
        bullets: [
          "Naver Map or Kakao Map — Google Maps barely works for directions in Korea.",
          "Kakao T for taxis (works without Korean phone calls).",
          "Korail Talk app for train tickets (KTX/ITX).",
        ],
      },
      {
        heading: "Intercity travel",
        bullets: [
          "KTX: fastest (Seoul–Busan ~2.5h). Book early for cheaper seats; youth discounts exist via 'Naeil-ro' passes for ages 13–34.",
          "Express buses are half the price of KTX and reach everywhere — terminals in every city.",
          "Jeonju ↔ Seoul: ~1.5h by KTX from Iksan, or ~2.5h by express bus.",
        ],
      },
    ],
  },
  {
    slug: "language",
    title: "Korean Language",
    icon: "book",
    description: "TOPIK and free ways to learn",
    sections: [
      {
        heading: "Why TOPIK matters",
        bullets: [
          "TOPIK level unlocks scholarships (GKS requires level 3+), more part-time hours, and jobs.",
          "Level 3–4 is the sweet spot employers ask for; level 6 is near-native.",
          "It runs ~6 times a year — register early at topik.go.kr, seats sell out.",
        ],
      },
      {
        heading: "Free / cheap ways to study",
        bullets: [
          "Your university's Korean language center — many offer free evening classes for enrolled students.",
          "King Sejong Institute (세종학당) has subsidized classes in most cities.",
          "Apps: 'TTMIK (Talk To Me In Korean)', Anki decks for vocab, and 'HelloTalk' for language exchange.",
          "Join a language-exchange club on ICOM's Community tab — teaching your language is free tutoring.",
        ],
      },
      {
        heading: "Survival phrases first",
        bullets: [
          "Learn Hangul in a weekend — it makes everything else 10x easier.",
          "Prioritize: ordering food, taxi directions, bank/immigration vocabulary.",
          "Set your phone's keyboard to Korean and practice typing early.",
        ],
      },
    ],
  },
  {
    slug: "faq",
    title: "FAQ",
    icon: "help-circle",
    description: "Quick answers to common questions",
    sections: [
      {
        heading: "Arrival",
        bullets: [
          "Apply for your ARC within 90 days of arrival (book on hikorea.go.kr — slots fill up weeks ahead).",
          "You need the ARC for: bank account, phone plan, and most apps. Do it first.",
          "A prepaid SIM works before the ARC; switch to a plan after.",
        ],
      },
      {
        heading: "Work & money",
        bullets: [
          "Can I work part-time? Yes, with permission — see the Visa guide.",
          "Minimum wage (2026): check moel.go.kr — always confirm your contract states it.",
          "Getting paid in cash with no contract is risky and can violate your visa terms.",
        ],
      },
      {
        heading: "Everyday life",
        bullets: [
          "Trash is sorted: general (with paid bags), food waste, and recycling — fines apply for mixing.",
          "Most banks/offices close at 4pm on weekdays; plan immigration/bank errands around class.",
          "Emergency numbers: 112 (police), 119 (fire/ambulance), 1345 (immigration info, English OK), 1330 (tourism/translation help).",
        ],
      },
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
