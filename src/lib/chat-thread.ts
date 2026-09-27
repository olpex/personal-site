/**
 * Порядок реплік у стрічці чату.
 *
 * Джерело правди — сервер: репліки відвідувача пише сайт (`visitor[]`),
 * відповіді власника — місток із Telegram (`messages[]`). Обидва мають
 * мітку часу, тож стрічка впорядковується за нею.
 *
 * Раніше репліки відвідувача жили лише в localStorage, а порядок тримався
 * на полі `after` (скільком відповідям передувала репліка). Це ламалося,
 * щойно людина відкривала сайт з іншого пристрою — історія зникала.
 *
 * Мітки часу приходять у двох формах: місток пише «2026-09-27T23:23:32»
 * (локальний час), сайт — «2026-09-27 23:23:32». Обидві нормалізуємо,
 * інакше «T» і пробіл розвели б однаковий час у різні боки.
 */

export type Msg = { text: string; at: string };
export type Row = { from: "visitor" | "owner"; text: string; key: string };

/** «2026-09-27T23:23:32» і «2026-09-27 23:23:32» → однаковий вигляд. */
export function normTime(at: string): string {
  return (at || "").replace("T", " ").slice(0, 19);
}

export function buildRows(visitor: Msg[], owner: Msg[]): Row[] {
  const all = [
    ...visitor.map((m, i) => ({
      from: "visitor" as const,
      text: m.text,
      key: `v${i}`,
      at: normTime(m.at),
    })),
    ...owner.map((m, i) => ({
      from: "owner" as const,
      text: m.text,
      key: `o${i}`,
      at: normTime(m.at),
    })),
  ];

  all.sort((a, b) => {
    if (a.at !== b.at) return a.at < b.at ? -1 : 1;
    // Однакова секунда: питання перед відповіддю (природний хід розмови).
    return a.from === b.from ? 0 : a.from === "visitor" ? -1 : 1;
  });

  return all.map(({ from, text, key }) => ({ from, text, key }));
}
