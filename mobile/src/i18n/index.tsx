import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getLocales } from "expo-localization";
import { getItem, setItem } from "@/lib/storage";
import { PLURALS, STRINGS } from "./strings";

// App menus and buttons in English, Uzbek, Russian and Korean. The English text
// is the key: t("Sign in"). Anything without a translation shows in English,
// so a missing string never breaks a screen. Content (jobs, guides) stays as is.

export type Lang = "en" | "uz" | "ru" | "ko";
export const LANGUAGES: { code: Lang; name: string }[] = [
  { code: "en", name: "English" },
  { code: "uz", name: "O‘zbekcha" },
  { code: "ru", name: "Русский" },
  { code: "ko", name: "한국어" },
];
const KEY = "lang";

type Vars = Record<string, string | number>;
export type T = (text: string, vars?: Vars) => string;

const fill = (s: string, vars?: Vars) =>
  vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : s;

export function translate(lang: Lang, text: string, vars?: Vars): string {
  return fill((lang !== "en" && STRINGS[text]?.[lang]) || text, vars);
}

/** Which plural form to use: English 1/other, Russian 1/2–4/5+, Uzbek and Korean never change. */
function pluralIndex(lang: Lang, n: number): number {
  if (lang === "en") return n === 1 ? 0 : 1;
  if (lang === "ru") {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return 0;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 1;
    return 2;
  }
  return 0;
}

/** Counted words: tn("internships", 3) → "3 internships" / "3 стажировки" / "3 ta amaliyot" / "인턴십 3개". */
export function translatePlural(lang: Lang, key: string, n: number): string {
  const forms = PLURALS[key]?.[lang] || PLURALS[key]?.en || [`{n} ${key}`];
  return fill(forms[Math.min(pluralIndex(lang, n), forms.length - 1)], { n });
}

function deviceLang(): Lang {
  const code = (getLocales()[0]?.languageCode || "en").toLowerCase();
  return (LANGUAGES.some((l) => l.code === code) ? code : "en") as Lang;
}

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: T; tn: (key: string, n: number) => string };
const LanguageContext = createContext<Ctx>({
  lang: "en", setLang: () => {}, t: (s, v) => fill(s, v), tn: (k, n) => translatePlural("en", k, n),
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(deviceLang);
  useEffect(() => {
    let live = true;
    getItem(KEY).then((saved) => {
      if (live && saved && LANGUAGES.some((l) => l.code === saved)) setLangState(saved as Lang);
    });
    return () => { live = false; };
  }, []);
  const setLang = useCallback((l: Lang) => { setLangState(l); setItem(KEY, l); }, []);
  const value = useMemo<Ctx>(() => ({
    lang, setLang,
    t: (text, vars) => translate(lang, text, vars),
    tn: (key, n) => translatePlural(lang, key, n),
  }), [lang, setLang]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useT = () => useContext(LanguageContext);
