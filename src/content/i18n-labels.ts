/**
 * Функції локалізації підписів (uk-значення в даних → en для показу).
 *
 * Мапи значень живуть у site-en.ts (їх генерує scripts/i18n-sync.ts,
 * кеш — i18n-memory.json), а хелпери — тут, щоб генератор не мав
 * щоразу копіювати функції. Усі хелпери повертають uk-значення для
 * lang !== "en".
 */

import type { Lang } from "@/lib/lang";
import {
  certGroupLabels,
  certHrefLabels,
  certNoteLabels,
  forumTopicLabels,
  reviewGroupLabels,
} from "./site-en";

const _cg = certGroupLabels as unknown as Record<string, string>;
const _ch = certHrefLabels as unknown as Record<string, string>;
const _cn = certNoteLabels as unknown as Record<string, string>;
const _ft = forumTopicLabels as unknown as Record<string, string>;
const _rg = reviewGroupLabels as unknown as Record<string, { en: string; short: string }>;

/** Місяці у датах відгуків («жовтень 2025» → «October 2025»). Статична мапа. */
const monthsEn: Record<string, string> = {
  січень: "January",
  лютий: "February",
  березень: "March",
  квітень: "April",
  травень: "May",
  червень: "June",
  липень: "July",
  серпень: "August",
  вересень: "September",
  жовтень: "October",
  листопад: "November",
  грудень: "December",
};

/** Напрями відгуків (довгий/короткий підпис). */
export function reviewGroupLong(group: string, lang: Lang): string {
  if (lang !== "en") return group;
  return _rg[group]?.en ?? group;
}

export function reviewGroupShort(group: string, lang: Lang): string {
  if (lang !== "en") return group;
  return _rg[group]?.short ?? group;
}

/** «жовтень 2025» → «October 2025»; незнайомий формат лишається як є. */
export function formatReviewDate(ukDate: string, lang: Lang): string {
  if (lang !== "en") return ukDate;
  const [month, ...rest] = ukDate.trim().split(" ");
  const en = monthsEn[month];
  return en ? [en, ...rest].join(" ") : ukDate;
}

/** Група сертифіката. */
export function certGroupLabel(group: string, lang: Lang): string {
  if (lang !== "en") return group;
  return _cg[group] ?? group;
}

/** Примітка картки сертифіката: точні збіги + шаблони «N міс.». */
export function certNoteLabel(note: string, lang: Lang): string {
  if (lang !== "en") return note;
  const exact = _cn[note];
  if (exact) return exact;
  return note
    .replace(/(\d+)\s*міс\./g, (_m, n: string) => `${n} month${Number(n) === 1 ? "" : "s"}`)
    .replace(/сертифікат/g, "certificate");
}

/** Підпис посилання картки сертифіката. */
export function certHrefLabel(label: string | undefined, lang: Lang): string | undefined {
  if (!label || lang !== "en") return label;
  return _ch[label] ?? label;
}

/** Тема форуму (лише для показу; значення в даних лишаються uk). */
export function forumTopicLabel(topic: string, lang: Lang): string {
  if (lang !== "en") return topic;
  return _ft[topic] ?? topic;
}
