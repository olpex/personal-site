/**
 * Об'єднання uk-джерела з en-заміщеннями.
 *
 * Правило: uk (src/content/site.ts) — джерело правди. en-об'єкт містить
 * ЛИШЕ ті поля, які перекладені; все інше береться з uk. Працює з простими
 * об'єктами й масивами (масиви заміщуються ЦІЛИМИ, без поштучного злиття:
 * переклад завжди має стільки ж елементів, скільки оригінал).
 */
export function deepMergeEn<T>(uk: T, en: unknown): T {
  if (Array.isArray(uk)) {
    return (Array.isArray(en) ? en : uk) as T;
  }
  if (uk && typeof uk === "object" && en && typeof en === "object") {
    const out: Record<string, unknown> = { ...(uk as Record<string, unknown>) };
    for (const [key, enVal] of Object.entries(en as Record<string, unknown>)) {
      if (enVal === undefined) continue; // поле не перекладено — лишається uk
      const ukVal = (uk as Record<string, unknown>)[key];
      out[key] =
        ukVal !== null && typeof ukVal === "object" ? deepMergeEn(ukVal, enVal) : enVal;
    }
    return out as T;
  }
  return (en === undefined ? uk : en) as T;
}
