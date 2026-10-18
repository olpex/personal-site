"use client";

import { useMemo } from "react";
import { site } from "@/content/site";
import { siteEn } from "@/content/site-en";
import { deepMergeEn } from "@/lib/i18n";
import { useLang } from "@/components/lang-context";

type Site = typeof site;

/**
 * Контент поточної мови.
 *
 * uk — об'єкт `site` без змін (SSR і перший рендер українською).
 * en — `site`, заміщений англійськими полями з site-en.ts; усе, що не
 * перекладено (цитати відгуків, назви й видавці сертифікатів, href тощо),
 * залишається з uk-джерела. Мемоізовано: об'єкт будується один раз на
 * зміну мови, а не на кожен рендер.
 */
export function useSite(): Site {
  const { lang } = useLang();
  return useMemo(() => (lang === "en" ? deepMergeEn(site, siteEn) : site), [lang]);
}

export type LocalizedSite = Site;
