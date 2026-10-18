"use client";

import { useEffect, useMemo, useRef } from "react";
import { findRanges, tokenize } from "@/lib/search";
import { useLang } from "@/components/lang-context";
import { t } from "@/lib/ui-strings";

/** Ім'я реєстру підсвічування (CSS Custom Highlight API). */
const HIGHLIGHT = "site-search";

export type SearchJump = { id: string; label: string; count: number };

/* Синоніми запиту англійською: контент укр./angl. змішаний (цитати, назви
 * сертифікатів лишились оригінальними), тож «teacher» має знаходити
 * «викладач», «courses» — «курс». Додаються ДО нормалізованого запиту,
 * тому працюють і в фільтрі, і в підсвічуванні. */
const EN_SYNONYMS: Record<string, string[]> = {
  teacher: ["викладач", "педагог"],
  courses: ["курс"],
  course: ["курс"],
  certificates: ["сертифікат"],
  certificate: ["сертифікат"],
  reviews: ["відгук"],
  review: ["відгук"],
  projects: ["проєкт"],
  project: ["проєкт"],
  security: ["безпек", "кібербезпек"],
  design: ["дизайн"],
  web: ["веб"],
  ai: ["штучн", "інтелект", "ші"],
  osint: ["розвідк"],
  digital: ["цифров"],
  data: ["обробк", "інформац"],
  information: ["інформац"],
  topics: ["тем"],
  contact: ["контакт"],
  about: ["про мене"],
};

function expandTokens(tokens: string[]): string[] {
  const out: string[] = [];
  for (const token of tokens) {
    out.push(token);
    const syn = EN_SYNONYMS[token];
    if (syn) out.push(...syn);
  }
  return [...new Set(out)];
}

/**
 * Миттєвий пошук по сторінці: поле + лічильник + перехід до знайденого.
 *
 * Смуга ЛИПКА (sticky): сторінка довга (відгуки, сертифікати), і поле, яке
 * зникає при прокрутці, змушувало б щоразу повертатися нагору.
 *
 * Фільтрує не цей компонент, а `page.tsx` — тут лише введення, показ
 * підсумку й підсвічування. Так «знайдено N з M» рахується з ТИХ САМИХ
 * списків, які потім рендеряться.
 */
export default function SiteSearch({
  query,
  onChange,
  total,
  found,
  sections,
}: {
  query: string;
  onChange: (value: string) => void;
  total: number;
  found: number;
  sections: SearchJump[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { lang } = useLang();
  const searching = query.trim().length > 0;
  const hits = useMemo(() => sections.filter((s) => s.count > 0), [sections]);
  /* Секції, у яких справді шукаємо, — рядком: масив `sections` батько
     перестворює на кожен рендер, і залежність від нього змушувала б
     перераховувати підсвічування на кожну літеру без потреби. */
  const scopeIds = useMemo(() => sections.map((s) => s.id).join(" "), [sections]);

  /* «/» — фокус у поле, «Esc» — скинути (як у пошуку браузера). Ctrl/⌘+K —
     звичний для багатьох скорочений. Слухаємо лише коли користувач не
     набирає текст в іншому полі (у чаті теж є textarea). */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const el = event.target as HTMLElement | null;
      const typing =
        !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if (!typing && event.key === "/") {
        event.preventDefault();
        inputRef.current?.focus();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        return;
      }
      if (event.key === "Escape" && searching) {
        onChange("");
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onChange, searching]);

  /* Підсвічування збігів — CSS Custom Highlight API.
     Чому саме він: <mark> у React-розмітці вимагав би переписувати текст
     вузлів, і кожен наступний рендер повертав би все назад. Highlight
     працює з Range поверх наявного DOM — нічого не змінює, тому React і
     браузер не конфліктують. Якщо API немає (старі браузери) — пошук
     працює так само, просто без підсвічування. */
  useEffect(() => {
    const css = CSS as unknown as {
      highlights?: { set(name: string, value: unknown): void; delete(name: string): void };
    };
    const Ctor = (window as unknown as {
      Highlight?: new (...ranges: Range[]) => unknown;
    }).Highlight;
    if (!css.highlights || !Ctor) return;

    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      if (cancelled || !css.highlights) return;
      css.highlights.delete(HIGHLIGHT);
      if (!searching) return;

      const tokens = expandTokens(tokenize(query));
      if (tokens.length === 0) return;

      /* Підсвічуємо ЛИШЕ те, що фільтрується. Якщо взяти весь <main>,
         знайдеться й «консультацій» у «Контактах» — при тому, що
         лічильник показує «нічого не знайдено»: текст там не фільтрується,
         а отже й не може бути результатом пошуку. */
      const roots = scopeIds
        .split(" ")
        .map((id) => document.getElementById(id))
        .filter((el): el is HTMLElement => el !== null);
      if (roots.length === 0) return;

      /* Під час пошуку показуємо знайдене ОДРАЗУ: інакше картки, які
         щойно змонтувались, лишаються з opacity 0 до появи у в'юпорті
         (їхня поява — справа IntersectionObserver), і результат виглядає
         як «нічого не знайшлося». */
      roots.forEach((root) =>
        root
          .querySelectorAll<HTMLElement>(".reveal:not([data-visible])")
          .forEach((el) => el.setAttribute("data-visible", "true")),
      );

      const ranges: Range[] = [];
      for (const root of roots) {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        while (walker.nextNode() && ranges.length < 400) {
          const node = walker.currentNode as Text;
          const parent = node.parentElement;
          if (!parent) continue;
          // Поля введення й службові тексти не підсвічуємо.
          if (parent.closest("input, textarea, select, script, style, [data-no-highlight]")) continue;
          for (const [start, end] of findRanges(node.data, tokens)) {
            const range = document.createRange();
            range.setStart(node, start);
            range.setEnd(node, end);
            ranges.push(range);
            if (ranges.length >= 400) break;
          }
        }
      }
      if (ranges.length > 0) css.highlights.set(HIGHLIGHT, new Ctor(...ranges));
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [query, searching, scopeIds]);

  return (
    <div
      data-no-highlight
      className="site-search-bar gutter z-40 border-b border-line/70 bg-paper/92 backdrop-blur-md"
    >
      <div className="shell flex flex-wrap items-center gap-x-5 gap-y-2 py-2.5">
        <form
          role="search"
          onSubmit={(event) => event.preventDefault()}
          className="flex min-w-0 flex-1 items-center gap-3"
        >
          <span aria-hidden className="shrink-0 text-muted">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4">
              <circle cx="6.2" cy="6.2" r="4.6" />
              <path d="M9.7 9.7 14 14" strokeLinecap="round" />
            </svg>
          </span>
          <label htmlFor="site-search" className="label sr-only">
            {t("searchLabel", lang)}
          </label>
          <input
            id="site-search"
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => onChange(event.target.value)}
            placeholder={t("searchPlaceholder", lang)}
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
            className="site-search-input min-w-0 flex-1"
          />
          {searching ? (
            <button
              type="button"
              onClick={() => {
                onChange("");
                inputRef.current?.focus();
              }}
              aria-label={t("searchClear", lang)}
              title={t("searchClear", lang)}
              className="site-search-clear shrink-0"
            >
              ×
            </button>
          ) : (
            <span aria-hidden className="label hidden shrink-0 text-muted lg:block">
              / або ⌘K
            </span>
          )}
        </form>

        {searching ? (
          <>
            <p aria-live="polite" className="label shrink-0 tabular-nums text-ink-soft">
              {/* Дві візуальні форми (цифра на вузькому екрані, фраза на
                  широкому) озвучені як ОДНА: інакше читач екрана почув би
                  «22/89Знайдено 22 із 89». */}
              <span aria-hidden className="sm:hidden">
                {found}/{total}
              </span>
              <span aria-hidden className="hidden sm:inline">
                {found > 0
                  ? `${t("searchFound", lang)} ${found} ${t("searchFoundOf", lang)} ${total}`
                  : t("searchNothing", lang)}
              </span>
              <span className="sr-only">
                {found > 0
                  ? `${t("searchFound", lang)} ${found} ${t("searchFoundOf", lang)} ${total}`
                  : t("searchNothing", lang)}
              </span>
            </p>
            {/* Перехід до знайденого: без нього доводиться прокручувати
                сторінку навпомацки. На вузьких екранах ховаємо — там місця
                немає, а лічильник уже показує, що щось є. */}
            {found > 0 ? (
              <nav
                aria-label={t("searchBySections", lang)}
                className="hidden min-w-0 items-center gap-4 overflow-x-auto overscroll-x-contain md:flex [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {hits.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    onClick={(event) => {
                      /* Прокручуємо ПІСЛЯ перемальовування: фільтр різко
                         скорочує сторінку, і браузер, порахувавши позицію за
                         старим макетом, промахується повз секцію. Два кадри —
                         щоб устигли пройти і рендер, і перерахунок макета.
                         Фокус лишаємо в полі: людина далі набирає або тисне Esc. */
                      event.preventDefault();
                      const id = section.id;
                      requestAnimationFrame(() =>
                        requestAnimationFrame(() =>
                          document.getElementById(id)?.scrollIntoView({ block: "start" }),
                        ),
                      );
                    }}
                    className="label link-wave shrink-0 whitespace-nowrap text-ink"
                  >
                    {section.label} ({section.count})
                  </a>
                ))}
              </nav>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
