/**
 * Мови сайту. Чистий модуль без "use client": імпортується і серверним
 * кодом (forum.ts), і клієнтськими компонентами — тому тут тільки типи
 * й константи, без React.
 *
 * uk — основна мова: SSR і перший клієнтський рендер завжди українською.
 * en — перемикається клієнтом, вибір зберігається в localStorage.
 */
export type Lang = "uk" | "en";

export const LANG_STORAGE_KEY = "oparashchuk:lang";

export function isLang(value: unknown): value is Lang {
  return value === "uk" || value === "en";
}
