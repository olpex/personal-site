"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { LANG_STORAGE_KEY, isLang, type Lang } from "@/lib/lang";

/**
 * Джерело правди про мову.
 *
 * uk — стартова мова за замовчуванням: SSR і перший клієнтський рендер
 * ЗАВЖДИ українською (вимога власника + стабільний HTML для SEO й хідратації).
 * Перемикач лише клієнтський: вибір зберігається в localStorage, і наступні
 * відкриття сайту людина бачить своєю мовою.
 */

type LangContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  ready: boolean;
};

const LangContext = createContext<LangContextValue>({
  lang: "uk",
  setLang: () => {},
  toggleLang: () => {},
  ready: false,
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("uk");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      if (isLang(saved)) {
        setLangState(saved);
        // <html lang> мусить відповідати застосованій мові одразу після
        // хідратації: SSR завжди віддає uk, тож синхронізація тут.
        document.documentElement.lang = saved;
      }
    } catch {
      /* приватний режим — лишається uk */
    }
    setReady(true);
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState((prev) => {
      if (prev !== next) {
        document.documentElement.lang = next;
        try {
          localStorage.setItem(LANG_STORAGE_KEY, next);
        } catch {
          /* приватний режим — просто не зберігаємо */
        }
      }
      return next;
    });
    setReady(true);
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => {
      const next: Lang = prev === "uk" ? "en" : "uk";
      document.documentElement.lang = next;
      try {
        localStorage.setItem(LANG_STORAGE_KEY, next);
      } catch {
        /* приватний режим — просто не зберігаємо */
      }
      return next;
    });
  }, []);

  return (
    <LangContext.Provider value={{ lang, setLang, toggleLang, ready }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
