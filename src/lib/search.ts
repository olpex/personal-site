/**
 * Миттєвий пошук по сторінці: нормалізація тексту й перевірка фрагмента.
 *
 * Чому окремий модуль, а не логіка «на місці» в компоненті: тим самим
 * предикатом користуються і секції (фільтрація карток), і рядок пошуку
 * (лічильник «знайдено N з M»), і підсвічування збігів. Одна реалізація —
 * лічильник фізично не може розійтися з тим, що видно на екрані.
 *
 * Пошук — це ПІДРЯДОК, а не «слово цілком»: власник просив фільтрувати
 * зміст «по мірі введення фрагмента», тож «вебд» мусить знаходити
 * «вебдизайн». Кілька слів у запиті = усі слова мусять бути в тексті (AND):
 * «курс дизайн» знаходить картку, де є і «курс», і «дизайн».
 */

/** Для пошуку апострофи не мають значення: «комп'ютер» і «компютер» —
 *  те саме слово, а пишуть його в укр. тексті щонайменше чотирма
 *  символами. Прибираємо з ОБОХ боків (запит і текст), тому порівняння
 *  лишається симетричним. */
const APOSTROPHES = new Set(["'", "\u2019", "\u02bc", "`", "\u00b4"]);

/** Різновиди пробілів (у текстах із Word трапляються нерозривні). */
const SPACES = /[\u00a0\u2009\u202f\u2007]/g;

/** Нормалізована форма тексту — саме в ній шукаємо. */
export function norm(value: string): string {
  let out = "";
  for (const ch of String(value ?? "")) {
    if (APOSTROPHES.has(ch)) continue;
    out += ch.toLowerCase();
  }
  return out.replace(SPACES, " ").replace(/\s+/g, " ").trim();
}

/** Слова запиту. Порожній запит → [] (тоді НІЧОГО не фільтруємо). */
export function tokenize(query: string): string[] {
  const q = norm(query);
  return q ? q.split(" ").filter(Boolean) : [];
}

/** Рядок із довільної кількості полів — те, у чому шукаємо. Розгортає
 *  масиви й прості об'єкти (картка курсу — це об'єкт із масивом усередині),
 *  тож викликати можна і `haystack(card)`, і явним переліком полів.
 *  Одразу нормалізуємо, щоб `matches` не робив це вдруге. */
export function haystack(...parts: unknown[]): string {
  const out: string[] = [];
  const walk = (value: unknown, depth: number) => {
    if (value === null || value === undefined) return;
    if (Array.isArray(value)) {
      if (depth > 6) return; // запобіжник від циклів у даних
      value.forEach((item) => walk(item, depth + 1));
      return;
    }
    if (typeof value === "string" || typeof value === "number") {
      out.push(String(value));
      return;
    }
    if (typeof value === "object" && depth <= 6) {
      Object.values(value as Record<string, unknown>).forEach((v) => walk(v, depth + 1));
    }
  };
  parts.forEach((part) => walk(part, 0));
  return norm(out.join(" · "));
}

/** Чи містить текст УСІ слова запиту. Порожній запит → true. */
export function matches(hay: string, tokens: string[]): boolean {
  if (tokens.length === 0) return true;
  for (const token of tokens) {
    if (!hay.includes(token)) return false;
  }
  return true;
}

/** Фільтрує список тим самим предикатом, що й секції. Приймає readonly
 *  масиви: контент сайту оголошено `as const`, тож його списки незмінні. */
export function filterBy<T>(items: readonly T[], tokens: string[], text: (item: T) => string): T[] {
  if (tokens.length === 0) return [...items];
  return items.filter((item) => matches(text(item), tokens));
}

type Span = [start: number, end: number];

/**
 * Зсуви знайдених фрагментів У ВИХІДНОМУ рядку — для підсвічування.
 *
 * Пастка: нормалізація ЗМІНЮЄ довжину рядка (прибрані апострофи, згорнуті
 * пробіли), тож індекси збігів у нормалізованому тексті не дорівнюють
 * індексам у справжньому. Тому будуємо карту «нормалізований індекс →
 * індекс у вихідному рядку» і повертаємо зсуви вже за нею.
 */
export function findRanges(text: string, tokens: string[]): Span[] {
  if (!text || tokens.length === 0) return [];
  let normed = "";
  const map: number[] = []; // map[i] — індекс у text для normed[i]
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (APOSTROPHES.has(ch)) continue;
    const low = ch.toLowerCase();
    // Деякі символи (лігатури, турецька İ) змінюють довжину при
    // toLowerCase — тоді лишаємо оригінал, карта важливіша за рідкісний регістр.
    normed += low.length === 1 ? low : ch;
    map.push(i);
  }
  if (!normed) return [];

  const spans: Span[] = [];
  for (const token of tokens) {
    let from = 0;
    for (;;) {
      const at = normed.indexOf(token, from);
      if (at === -1) break;
      const start = map[at];
      const end = (map[at + token.length - 1] ?? start) + 1;
      spans.push([start, end]);
      from = at + token.length;
      if (spans.length > 400) return spans; // стеля: сторінка довга, а підсвічування — косметика
    }
  }
  return spans;
}
