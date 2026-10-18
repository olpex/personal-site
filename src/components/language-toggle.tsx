"use client";

import { useLang } from "@/components/lang-context";

/**
 * Перемикач мови UA/EN.
 *
 * Компактна пара кнопок у стилі `.label` шапки: активна мова підсвічена,
 * дві інертні абревіатури — і українська, і англійська завжди видимі, тож
 * перемикання працює в обидва боки одним кліком. Висота збігається з
 * пунктами навігації (h-11), щоб шапка не сіпалась.
 */
export default function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, ready } = useLang();
  const activeLang = ready ? lang : "uk";

  const btn = (code: "uk" | "en", title: string) => {
    const isActive = activeLang === code;
    return (
      <button
        type="button"
        onClick={() => setLang(code)}
        aria-pressed={isActive}
        title={title}
        className={`label flex h-11 items-center whitespace-nowrap px-1 text-[11px] tracking-[0.08em] transition-colors ${
          isActive ? "text-ink" : "text-muted hover:text-ink"
        }`}
      >
        {code === "uk" ? "UA" : "EN"}
      </button>
    );
  };

  return (
    <div
      role="group"
      aria-label="Мова сайту / Site language"
      className={`flex shrink-0 items-center ${
        compact ? "border-l border-line/70 pl-3" : ""
      }`}
      data-no-highlight
    >
      {btn("uk", "Українська")}
      <span aria-hidden className="label px-0.5 text-muted">
        /
      </span>
      {btn("en", "English")}
    </div>
  );
}
