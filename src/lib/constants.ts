export const UNIVERSITIES = [
  // ── Jeollabuk-do ──────────────────────────────────────────────
  { id: "jbnu",      name: "Jeonbuk National University",          shortName: "JBNU",      color: "#1a56db", city: "Jeonju",     province: "Jeollabuk-do",     students: 1200, intl: true,  featured: true  },
  { id: "wonkwang", name: "Wonkwang University",                   shortName: "WKU",       color: "#6B21A8", city: "Iksan",      province: "Jeollabuk-do",     students: 480,  intl: false, featured: false },

  // ── Seoul ──────────────────────────────────────────────────────
  { id: "snu",       name: "Seoul National University",            shortName: "SNU",       color: "#003876", city: "Seoul",      province: "Seoul",            students: 3240, intl: true,  featured: true  },
  { id: "yonsei",   name: "Yonsei University",                    shortName: "Yonsei",    color: "#00205B", city: "Seoul",      province: "Seoul",            students: 2890, intl: true,  featured: true  },
  { id: "korea",    name: "Korea University",                     shortName: "KU",        color: "#8B0000", city: "Seoul",      province: "Seoul",            students: 2650, intl: true,  featured: true  },
  { id: "hanyang",  name: "Hanyang University",                   shortName: "HYU",       color: "#E31837", city: "Seoul",      province: "Seoul",            students: 2100, intl: true,  featured: false },
  { id: "khu",      name: "Kyung Hee University",                 shortName: "KHU",       color: "#003087", city: "Seoul",      province: "Seoul",            students: 1450, intl: true,  featured: false },
  { id: "cau",      name: "Chung-Ang University",                 shortName: "CAU",       color: "#DA291C", city: "Seoul",      province: "Seoul",            students: 1320, intl: true,  featured: false },
  { id: "ewha",     name: "Ewha Womans University",               shortName: "Ewha",      color: "#007B5E", city: "Seoul",      province: "Seoul",            students: 1340, intl: true,  featured: false },
  { id: "sogang",   name: "Sogang University",                    shortName: "Sogang",    color: "#9B1B30", city: "Seoul",      province: "Seoul",            students: 980,  intl: true,  featured: false },
  { id: "hongik",   name: "Hongik University",                    shortName: "Hongik",    color: "#3B1FA8", city: "Seoul",      province: "Seoul",            students: 1100, intl: false, featured: false },
  { id: "hufs",     name: "Hankuk University of Foreign Studies", shortName: "HUFS",      color: "#1D4ED8", city: "Seoul",      province: "Seoul",            students: 1280, intl: true,  featured: false },
  { id: "seoultech",name: "Seoul Nat'l University of S&T",        shortName: "SeoulTech", color: "#0369A1", city: "Seoul",      province: "Seoul",            students: 820,  intl: false, featured: false },
  { id: "uos",      name: "University of Seoul",                  shortName: "UOS",       color: "#065F46", city: "Seoul",      province: "Seoul",            students: 760,  intl: false, featured: false },
  { id: "konkuk",   name: "Konkuk University",                    shortName: "KKU",       color: "#166534", city: "Seoul",      province: "Seoul",            students: 920,  intl: false, featured: false },
  { id: "dongguk",  name: "Dongguk University",                   shortName: "DGU",       color: "#92400E", city: "Seoul",      province: "Seoul",            students: 870,  intl: false, featured: false },
  { id: "kookmin",  name: "Kookmin University",                   shortName: "KMU",       color: "#1E3A5F", city: "Seoul",      province: "Seoul",            students: 750,  intl: false, featured: false },
  { id: "sookmyung",name: "Sookmyung Women's University",         shortName: "SMU",       color: "#831843", city: "Seoul",      province: "Seoul",            students: 680,  intl: false, featured: false },
  { id: "sejong",   name: "Sejong University",                    shortName: "Sejong",    color: "#B45309", city: "Seoul",      province: "Seoul",            students: 700,  intl: false, featured: false },
  { id: "kwangwoon",name: "Kwangwoon University",                 shortName: "KWU",       color: "#0C4A6E", city: "Seoul",      province: "Seoul",            students: 640,  intl: false, featured: false },

  // ── Gyeonggi-do ───────────────────────────────────────────────
  { id: "skku",     name: "Sungkyunkwan University",              shortName: "SKKU",      color: "#00529B", city: "Suwon",      province: "Gyeonggi-do",      students: 1760, intl: true,  featured: false },
  { id: "ajou",     name: "Ajou University",                      shortName: "Ajou",      color: "#1D4ED8", city: "Suwon",      province: "Gyeonggi-do",      students: 890,  intl: false, featured: false },
  { id: "gachon",   name: "Gachon University",                    shortName: "Gachon",    color: "#065F46", city: "Seongnam",   province: "Gyeonggi-do",      students: 720,  intl: false, featured: false },
  { id: "myongji",  name: "Myongji University",                   shortName: "MJU",       color: "#6B21A8", city: "Yongin",     province: "Gyeonggi-do",      students: 680,  intl: false, featured: false },
  { id: "hanyangERICA", name: "Hanyang University ERICA",         shortName: "HYU ERICA",color: "#BE1B28", city: "Ansan",      province: "Gyeonggi-do",      students: 610,  intl: false, featured: false },
  { id: "dankook",  name: "Dankook University",                   shortName: "DKU",       color: "#B45309", city: "Yongin",     province: "Gyeonggi-do",      students: 650,  intl: false, featured: false },

  // ── Incheon ────────────────────────────────────────────────────
  { id: "inha",     name: "Inha University",                      shortName: "Inha",      color: "#1E3A8A", city: "Incheon",    province: "Incheon",          students: 1050, intl: true,  featured: false },
  { id: "inu",      name: "Incheon National University",          shortName: "INU",       color: "#0369A1", city: "Incheon",    province: "Incheon",          students: 780,  intl: false, featured: false },
  { id: "yonseiIntl", name: "Yonsei University (Songdo)",         shortName: "Yonsei Int'l", color: "#00205B", city: "Incheon", province: "Incheon",         students: 340,  intl: true,  featured: false },

  // ── Daejeon ────────────────────────────────────────────────────
  { id: "kaist",    name: "KAIST",                                shortName: "KAIST",     color: "#003087", city: "Daejeon",    province: "Daejeon",          students: 1840, intl: true,  featured: true  },
  { id: "cnu",      name: "Chungnam National University",         shortName: "CNU",       color: "#166534", city: "Daejeon",    province: "Daejeon",          students: 1120, intl: true,  featured: false },
  { id: "hanbat",   name: "Hanbat National University",           shortName: "HNU",       color: "#0C4A6E", city: "Daejeon",    province: "Daejeon",          students: 560,  intl: false, featured: false },

  // ── Busan ──────────────────────────────────────────────────────
  { id: "pnu",      name: "Pusan National University",            shortName: "PNU",       color: "#1E3A8A", city: "Busan",      province: "Busan",            students: 1680, intl: true,  featured: false },
  { id: "donga",    name: "Dong-A University",                    shortName: "DAU",       color: "#B45309", city: "Busan",      province: "Busan",            students: 880,  intl: false, featured: false },
  { id: "bufs",     name: "Busan University of Foreign Studies",  shortName: "BUFS",      color: "#065F46", city: "Busan",      province: "Busan",            students: 650,  intl: false, featured: false },
  { id: "kyungsung",name: "Kyungsung University",                 shortName: "KSU",       color: "#6B21A8", city: "Busan",      province: "Busan",            students: 520,  intl: false, featured: false },
  { id: "kosin",    name: "Kosin University",                     shortName: "Kosin",     color: "#0C4A6E", city: "Busan",      province: "Busan",            students: 430,  intl: false, featured: false },

  // ── Daegu ──────────────────────────────────────────────────────
  { id: "knu",      name: "Kyungpook National University",        shortName: "KNU",       color: "#1E40AF", city: "Daegu",      province: "Daegu",            students: 1420, intl: true,  featured: false },
  { id: "yeungnam", name: "Yeungnam University",                  shortName: "YU",        color: "#92400E", city: "Gyeongsan",  province: "Daegu",            students: 960,  intl: false, featured: false },
  { id: "keimyung", name: "Keimyung University",                  shortName: "KMU",       color: "#166534", city: "Daegu",      province: "Daegu",            students: 740,  intl: false, featured: false },
  { id: "daegucat", name: "Daegu Catholic University",            shortName: "DCU",       color: "#7C2D12", city: "Daegu",      province: "Daegu",            students: 580,  intl: false, featured: false },

  // ── Gwangju ────────────────────────────────────────────────────
  { id: "chonnam",  name: "Chonnam National University",          shortName: "CNNU",      color: "#1D4ED8", city: "Gwangju",    province: "Gwangju",          students: 1240, intl: true,  featured: false },
  { id: "chosun",   name: "Chosun University",                    shortName: "Chosun",    color: "#B45309", city: "Gwangju",    province: "Gwangju",          students: 820,  intl: false, featured: false },
  { id: "gist",     name: "GIST",                                 shortName: "GIST",      color: "#0C4A6E", city: "Gwangju",    province: "Gwangju",          students: 480,  intl: true,  featured: false },

  // ── Ulsan ──────────────────────────────────────────────────────
  { id: "unist",    name: "UNIST",                                shortName: "UNIST",     color: "#1E3A8A", city: "Ulsan",      province: "Ulsan",            students: 760,  intl: true,  featured: false },
  { id: "ulsan",    name: "University of Ulsan",                  shortName: "UOU",       color: "#065F46", city: "Ulsan",      province: "Ulsan",            students: 520,  intl: false, featured: false },

  // ── Gangwon-do ─────────────────────────────────────────────────
  { id: "kangwon",  name: "Kangwon National University",          shortName: "KNU",       color: "#00529B", city: "Chuncheon",  province: "Gangwon-do",       students: 740,  intl: false, featured: false },
  { id: "hallym",   name: "Hallym University",                    shortName: "Hallym",    color: "#166534", city: "Chuncheon",  province: "Gangwon-do",       students: 580,  intl: false, featured: false },
  { id: "yonseiMirae", name: "Yonsei University (Wonju)",         shortName: "Yonsei Mirae", color: "#00205B", city: "Wonju",  province: "Gangwon-do",       students: 320,  intl: false, featured: false },

  // ── Chungcheong ────────────────────────────────────────────────
  { id: "cbnu",     name: "Chungbuk National University",         shortName: "CBNU",      color: "#0C4A6E", city: "Cheongju",   province: "Chungcheong",      students: 860,  intl: false, featured: false },
  { id: "hoseo",    name: "Hoseo University",                     shortName: "Hoseo",     color: "#6B21A8", city: "Cheonan",    province: "Chungcheong",      students: 620,  intl: false, featured: false },
  { id: "kongju",   name: "Kongju National University",           shortName: "KNU",       color: "#065F46", city: "Gongju",     province: "Chungcheong",      students: 540,  intl: false, featured: false },

  // ── Gyeongsang ─────────────────────────────────────────────────
  { id: "postech",  name: "POSTECH",                              shortName: "POSTECH",   color: "#1E40AF", city: "Pohang",     province: "Gyeongsang",       students: 980,  intl: true,  featured: false },
  { id: "gnu",      name: "Gyeongsang National University",       shortName: "GNU",       color: "#166534", city: "Jinju",      province: "Gyeongsang",       students: 860,  intl: false, featured: false },
  { id: "changwon", name: "Changwon National University",         shortName: "CWNU",      color: "#0C4A6E", city: "Changwon",   province: "Gyeongsang",       students: 620,  intl: false, featured: false },
  { id: "inje",     name: "Inje University",                      shortName: "Inje",      color: "#7C2D12", city: "Gimhae",     province: "Gyeongsang",       students: 480,  intl: false, featured: false },

  // ── Jeollanam-do ───────────────────────────────────────────────
  { id: "mokpo",    name: "Mokpo National University",            shortName: "MNU",       color: "#1D4ED8", city: "Mokpo",      province: "Jeollanam-do",     students: 420,  intl: false, featured: false },
  { id: "sunchon",  name: "Sunchon National University",          shortName: "SCNU",      color: "#065F46", city: "Suncheon",   province: "Jeollanam-do",     students: 390,  intl: false, featured: false },

  // ── Jeju-do ────────────────────────────────────────────────────
  { id: "jeju",     name: "Jeju National University",             shortName: "JNU",       color: "#0891B2", city: "Jeju",       province: "Jeju-do",          students: 480,  intl: false, featured: false },
];

export const COUNTRIES = [
  { code: "CN", name: "China", flag: "🇨🇳" },
  { code: "VN", name: "Vietnam", flag: "🇻🇳" },
  { code: "MN", name: "Mongolia", flag: "🇲🇳" },
  { code: "UZ", name: "Uzbekistan", flag: "🇺🇿" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "TH", name: "Thailand", flag: "🇹🇭" },
  { code: "ID", name: "Indonesia", flag: "🇮🇩" },
  { code: "FR", name: "France", flag: "🇫🇷" },
];

export const JOB_CATEGORIES = [
  "All",
  "Part-time",
  "Internship",
  "Research",
  "Teaching",
  "Remote",
  "Full-time",
];

export const VISA_TYPES = [
  { code: "D-2", label: "D-2 (Student)", compatible: true },
  { code: "D-4", label: "D-4 (Language)", compatible: true },
  { code: "F-2", label: "F-2 (Resident)", compatible: true },
  { code: "E-7", label: "E-7 (Specialist)", compatible: true },
];

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/community", label: "Community" },
  { href: "/jobs", label: "Jobs" },
  { href: "/universities", label: "Universities" },
  { href: "/support", label: "Support" },
];

export const SUPPORT_CATEGORIES = [
  { id: "visa", title: "Visa & Immigration", icon: "Passport", description: "D-2, D-4, extensions, and changes" },
  { id: "housing", title: "Housing & Dorms", icon: "Home", description: "Dormitory applications and off-campus" },
  { id: "banking", title: "Banking & Finance", icon: "CreditCard", description: "Open bank accounts, remittance" },
  { id: "insurance", title: "Health Insurance", icon: "Shield", description: "NHIS enrollment and hospital guide" },
  { id: "transport", title: "Transportation", icon: "Train", description: "T-money, subway, KTX discounts" },
  { id: "language", title: "Korean Language", icon: "BookOpen", description: "TOPIK resources, language programs" },
];

export const PLATFORM_STATS = [
  { label: "International Students", value: "28,000+", suffix: "" },
  { label: "Partner Universities", value: "47", suffix: "" },
  { label: "Job Listings", value: "1,200+", suffix: "" },
  { label: "Countries Represented", value: "89", suffix: "" },
];
