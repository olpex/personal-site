/**
 * Спільні константи й типи форуму.
 *
 * І серверний роут (/api/forum), і клієнтська сторінка /forum, і місток
 * із Telegram читають перелік тем звідси — щоб форма, валідація й підписи
 * не розійшлися.
 *
 * Схема даних (public/forum.json):
 *   { "forum": { "<id>": { topic, name, question, at, answers: [...], pending? } } }
 *
 * pending = true ставить сайт при реєстрації; місток знімає його, коли
 * власник відповідає. На сторінці показуються лише ті записи, що мають
 * відповідь, — питання без відповіді лишаються приватними.
 */

export const FORUM_TOPICS = [
  "Штучний інтелект",
  "Кібербезпека й OSINT",
  "WEB-дизайн",
  "Графічний дизайн",
  "Цифровий світ",
  "Обробка інформації",
  "Співпраця",
  "Особисте",
  "Інше",
] as const;

export type ForumTopic = (typeof FORUM_TOPICS)[number];

export function isTopic(value: unknown): value is ForumTopic {
  return typeof value === "string" && (FORUM_TOPICS as readonly string[]).includes(value);
}

export type ForumAnswer = { text: string; at: string };

export type ForumEntry = {
  id: string;
  topic: string;
  name: string;
  question: string;
  at: string;
  answers: ForumAnswer[];
};

/** Активність запису: остання відповідь, а якщо її немає — час питання. */
export function lastActivity(entry: Pick<ForumEntry, "at" | "answers">): number {
  const stamps = [entry.at, ...(entry.answers ?? []).map((a) => a.at)];
  let best = 0;
  for (const s of stamps) {
    const t = toDate(s)?.getTime() ?? 0;
    if (t > best) best = t;
  }
  return best;
}

/** «2026-09-29T15:04:05» і «2026-09-29 15:04:05» — обидві форми як UTC. */
function toDate(raw: string): Date | null {
  const value = (raw || "").trim();
  if (!value) return null;
  const norm = value.replace(" ", "T");
  const withZone = /[Zz]|[+-]\d{2}:?\d{2}$/.test(norm) ? norm : `${norm}Z`;
  const date = new Date(withZone);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Дата у людському вигляді, київський час. Обидві сторони (SSR і клієнт)
 *  мусять дати однаковий рядок — тому timeZone задано явно. */
export function formatForumDate(raw: string): string {
  const date = toDate(raw);
  if (!date) return "";
  return new Intl.DateTimeFormat("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Kyiv",
  }).format(date);
}

/** Дата й час — для позначки «відредаговано»/відповіді. */
export function formatForumDateTime(raw: string): string {
  const date = toDate(raw);
  if (!date) return "";
  return new Intl.DateTimeFormat("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Kyiv",
  }).format(date);
}

/** Анкори/слаги для фільтра тем — транслітерація, як у решті сторінки. */
export function slugify(text: string): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ie", ж: "zh",
    з: "z", и: "y", і: "i", ї: "i", й: "i", к: "k", л: "l", м: "m", н: "n",
    о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
    ч: "ch", ш: "sh", щ: "shch", ь: "", ю: "iu", я: "ia", "'": "", " ": "-",
  };
  return text
    .toLowerCase()
    .split("")
    .map((ch) => (ch in map ? map[ch] : /[a-z0-9-]/.test(ch) ? ch : ""))
    .join("")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}