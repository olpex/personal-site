"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { site } from "@/content/site";
import { useSite } from "@/lib/use-site";
import { haystack, tokenize } from "@/lib/search";
import {
  certGroupLabel,
  certHrefLabel,
  certNoteLabel,
  formatReviewDate,
  reviewGroupLong,
  reviewGroupShort,
} from "@/content/site-en";
import { useLang } from "@/components/lang-context";
import { t } from "@/lib/ui-strings";
import { expandTokenGroups, matchesGroups } from "@/lib/search-expand";
import { Footer, Header } from "@/components/chrome";
import Reveal from "@/components/reveal";
import CertIndex from "@/components/cert-index";
import FilterChips from "@/components/filter-chips";
import ContactModal from "@/components/contact-modal";
import SiteSearch from "@/components/site-search";

/* ── Миттєвий пошук: що саме вважається текстом картки ────────────────
   Типи елементів беремо з самих даних (`typeof site.x[number]`), бо контент
   оголошено `as const` — власні копії типів розійшлися б із джерелом.
   Функції стоять на рівні модуля (а не всередині компонентів), бо ними
   користуються ДВІ речі: фільтрація списків і лічильник «знайдено N з M».
   Один опис полів — цифра не може розійтися з тим, що на екрані. */
type MethodItem = (typeof site.method)[number];
type ProjectItem = (typeof site.projects)[number];
type ReviewItem = (typeof site.reviews)[number];
type CertItem = (typeof site.certificates)[number];

const methodText = (item: MethodItem) => haystack(item.title, item.body);
const projectText = (item: ProjectItem) =>
  haystack(item.title, item.kind, item.year, item.outcome, item.stack);
const reviewText = (item: ReviewItem) =>
  haystack(item.quote, item.author, item.date, item.group, item.course);
const certText = (item: CertItem) =>
  haystack(item.title, item.issuer, item.year, item.note, item.credentialId, item.group);

/** Замітка для секції, де за запитом нічого не знайшлося: без неї порожня
    секція читається як зламана, а не як результат фільтрації. */
function NoHits({ what }: { what: { uk: string; en: string } }) {
  const { lang } = useLang();
  return (
    <p className="text-sm leading-relaxed text-muted">
      {lang === "uk"
        ? `За поточним запитом ${what.uk} — змініть слово або скиньте пошук у полі вгорі.`
        : `${t("noHitsPrefix", lang)} ${what.en} ${t("noHitsSuffix", lang)}`}
    </p>
  );
}

/* ── CountUp: лічильник як на годиннику ──────────────────────────── */
function CountUp({
  target,
  duration = 1400,
  delay = 0,
  suffix = "",
}: {
  target: number;
  duration?: number;
  delay?: number;
  /** Суфікс показуємо лише біля фінального числа — «+» у «50+»;
      під час рахунку він блимав би поруч із проміжними значеннями. */
  suffix?: string;
}) {
  const [value, setValue] = useState(1);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }
    let start: number | null = null;
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    const tick = (now: number) => {
      if (start === null) start = now;
      const elapsed = now - start;
      if (elapsed < delay) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const p = Math.min((elapsed - delay) / duration, 1);
      setValue(Math.max(1, Math.round(easeOutCubic(p) * target)));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, delay]);

  return (
    <>
      {value}
      {value === target ? suffix : ""}
    </>
  );
}

/* ── Hero ─────────────────────────────────────────────────────── */

function Hero() {
  const s = useSite();
  const { lang } = useLang();
  return (
    <section id="top" className="gutter grain-hero relative">
      {/* На мобільному порядок інший, ніж на десктопі: ім'я -> роль ->
          ПОРТРЕТ -> опис із кнопками. Портрет мусить потрапити в перший
          екран, бо це обличчя сайту; опис читають уже після нього. Кнопка
          «Написати» лишається доступною в липкій шапці, тож CTA не губиться.

          Технічно: обгортка лівої колонки на мобільному має display:contents,
          тому її діти стають прямими елементами сітки й піддаються order.
          На десктопі вона знову блок — і тримає заголовок, опис і кнопки
          разом у лівій колонці, як було. */}
      <div className="shell grid grid-cols-1 gap-y-8 pt-6 md:pt-8 lg:grid-cols-12 lg:gap-x-12 lg:gap-y-12 lg:pt-20">
        {/* Текстова колонка */}
        <div className="contents lg:block lg:col-span-7 lg:row-start-1">
          <div className="order-1 lg:order-none">
            {/* Ім'я проявляється крізь хмару-трафарет: чорна хмара (растр
                cloud-mask.png) проходить по сектору імені по діагоналі з
                лівого нижнього кута в правий верхній за 1,5 с, ніби
                зафарбовуючи трафарет — літери прізвища, імені, по
                батькові. Далі, як і раніше: золота риска, потім золота
                хвиля по рядку ролі. Хореографія — globals.css. */}
            <div className="hero-name-stage reveal relative text-[clamp(2.6rem,8.5vw,5.75rem)] [--reveal-distance:0px]">
              <h1 className="hero-name relative leading-[0.9] text-ink">{s.name}</h1>
              {/* Риска — ПОЗА h1: маска хмари стоїть на h1, і дитина
                  всередині теж обрізалася б хмарою. */}
              <span aria-hidden className="hero-name-rule" />
            </div>

            <p className="reveal mt-5 max-w-xl text-xl leading-relaxed text-ink-soft md:text-2xl [--reveal-delay:200ms]">
              <span className="hero-role">{s.role}</span>
              <span aria-hidden className="mx-2 text-[var(--gold)]">
                ·
              </span>
              {/* Повна назва закладу (а не скорочення): власник попросив
                «Львівський центр професійно-технічної освіти Державної
                служби зайнятості України» — і відповідний переклад в EN. */}
              <span className="serif-accent text-ink">{s.org}</span>
            </p>
          </div>

          <div className="order-3 lg:order-none">
            <p className="reveal mt-6 max-w-lg text-[15px] leading-[1.75] text-muted [--reveal-delay:550ms]">
              {s.statement}
            </p>

            <div className="reveal mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center [--reveal-delay:700ms]">
              <a
                href="#work"
                className="group btn-wave-invert inline-flex min-h-12 items-center justify-center gap-3 bg-ink px-7 py-3 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-ink-soft sm:justify-start"
              >
                <span className="wave-span inline-flex items-center gap-3">
                  {t("heroCtaProjects", lang)}
                  <span
                    aria-hidden
                    className="transition-transform duration-300 group-hover:translate-y-0.5"
                  >
                    ↓
                  </span>
                </span>
              </a>
              <ContactModal
                trigger="secondary"
                className="btn-wave inline-flex min-h-12 items-center justify-center border border-line-strong bg-paper px-7 py-3 text-sm font-semibold tracking-wide transition-colors hover:border-ink hover:text-ink sm:justify-start"
              />
            </div>
          </div>
        </div>

        {/* Портрет. На десктопі займає обидва рядки сітки — так смуга
            фактів лягає під кнопки, закриваючи порожнечу ліворуч, а
            портрет лишається високим.

            Клас portrait-reveal — окремий, повільніший ритм появи:
            власник просив, щоб фото проявлялося плавно за ~1.5с, а не
            різко разом із текстом (текст лишається на 0.7s).

            Ефект «розквітання» (варіант 6 з прев'ю, 2026-10-01): кадр
            входить із розмиття 13px, масштабу 0.76 і прозорості 0.35 —
            фігура проявляється, розкривається й набирає різкість.
            Затримка 300ms: портрет рушає, коли ім'я вже майже
            зафарбоване хмарою.

            У прев'ю цей варіант мав ще й маску силуету, але заміряно,
            що її внесок — 0.63 рівня з 255 (око не бачить): тло фото
            заматоване точно в колір паперу, тож силуету немає з чим
            контрастувати. Маску прибрано — деталі в globals.css.

            БЕЗ sticky: раніше тут було lg:sticky lg:top-20, і при
            прокрутці фото «відклеювалось» від документа — сповзало
            вниз на ~126px, наздоганяючи сторінку ривком. Власник
            попросив, щоб фото було нерухоме й лишалось у тому
            положенні, у якому сторінка завантажилась (перевірено
            заміром: раніше docTop 137px→263px, тепер стабільний). */}
        <div className="reveal portrait-reveal [--reveal-delay:300ms] order-2 lg:order-none lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1">
          <figure className="mx-auto w-full max-w-[440px] lg:mx-0 lg:max-w-none">
            {/* Кадр має вміститися в перший екран, тому його висота
                обмежена часткою вікна (max-h), а не лише пропорцією:
                на широкому мобільному 4:5 давало 750px — більше за екран.
                object-top тримає голову в кадрі, обрізаючи піджак.
                На десктопі обмеження знімається — там портрет високий. */}
            {/* Плівка (варіант 9, 2026-10-01): спалах кольору паперу плюс
                зерно, що «кипить» і осідає. Два шари лежать ПОВЕРХ фото
                всередині кадру (overflow-hidden обрізає їх по рамці).
                Механіку, заміри й пастки див. у globals.css. */}
            <div className="portrait-frame relative aspect-[4/5] max-h-[52vh] w-full overflow-hidden bg-paper md:aspect-[3/4] lg:max-h-none lg:aspect-[4/5]">
              <Image
                src={s.portrait}
                alt={s.portraitAlt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover object-[center_6%] lg:object-top"
              />
              <span aria-hidden className="portrait-flash" />
              <span aria-hidden className="portrait-grain" />
            </div>
            {/* Тонка теракотова базова лінія — знак ательє, не декор. */}
            <span aria-hidden className="hero-baseline mt-3 block h-px w-full bg-accent/70" />
          </figure>
        </div>

        {/* Смуга фактів — окремий рядок сітки, тому на мобільному вона
            стоїть ПІСЛЯ портрета, а на десктопі підіймається під кнопки
            й закриває порожнечу в лівій колонці.
            Числові факти анімуються лічильником від 0 до значення
            (від 1, як просили) — легка затримка для кожного наступного. */}
        <dl className="reveal order-4 lg:order-none grid grid-cols-2 gap-x-6 gap-y-7 border-t border-line pt-8 sm:grid-cols-4 lg:col-span-7 lg:col-start-1 lg:row-start-2 lg:self-end">
          {s.facts.map((fact, idx) => {
            /* «50+» — число і знак окремо: «+» показуємо лише коли
               лічильник дійшов до кінця, інакше він блимав би біля
               проміжних значень (3+, 17+ …). */
            const parts = fact.v.match(/^(\d+(?:[.,]\d+)?)(\+|%)?\s*(.*)$/);
            const figureStr = parts?.[1];
            const suffix = parts?.[2] ?? "";
            const rest = parts?.[3] ?? "";
            const numeric = figureStr ? parseInt(figureStr, 10) : null;

            return (
              <div key={fact.k}>
                <dt className="label">{fact.k}</dt>
                {numeric !== null ? (
                  <dd className="mt-2.5">
                    <span className="stat-figure block text-4xl tabular-nums text-ink md:text-5xl">
                      <CountUp target={numeric} delay={idx * 140} suffix={suffix} />
                    </span>
                    <span className="mt-1.5 block text-sm font-medium leading-snug text-ink-soft">
                      {rest}
                    </span>
                  </dd>
                ) : (
                  <dd className="mt-2.5 text-sm font-semibold leading-snug text-ink-soft">
                    {fact.v}
                  </dd>
                )}
              </div>
            );
          })}
        </dl>
      </div>

    </section>
  );
}

/* ── Маркі-стрічка ────────────────────────────────────────────── */

function Keywords() {
  const s = useSite();
  const items = [...s.keywords, ...s.keywords];
  return (
    <div className="marquee mt-16 overflow-hidden border-y border-line py-4 md:mt-20">
      <div className="marquee-track" aria-hidden>
        {items.map((word, i) => (
          <span
            key={`${word}-${i}`}
            className="label flex shrink-0 items-center gap-6 pr-6 text-ink-soft"
          >
            {word}
            <span className="text-accent-ink">◆</span>
          </span>
        ))}
      </div>
      <span className="sr-only">{s.keywords.join(", ")}</span>
    </div>
  );
}

/* ── Секція-обгортка з нумерацією ─────────────────────────────── */

function Section({
  id,
  title,
  aside,
  children,
}: {
  id: string;
  title: string;
  /* Липкий блок у лівій колонці. Порожня ліва колонка на всю висоту
     довгої секції читалась як недороблена — aside дає оку точку
     повернення й водночас працює як навігація по секції. */
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="gutter">
      <div className="shell border-t border-line py-16 md:py-24">
        <div className="grid grid-cols-1 gap-y-10 lg:grid-cols-12 lg:gap-x-12">
          <div className="lg:col-span-3">
            <h2 className="reveal display text-3xl md:text-4xl">{title}</h2>
            {/* Обгортка має розмір 64×3 — саме її бачить спостерігач
                появи. Внутрішня смуга лише масштабується. */}
            <span aria-hidden className="reveal mt-5 block h-[3px] w-16">
              <span className="accent-rule" />
            </span>
            {aside ? (
              <div className="mt-8 hidden lg:sticky lg:top-[calc(var(--header-h)+var(--site-search-h)+16px)] lg:block">{aside}</div>
            ) : null}
          </div>
          <div className="lg:col-span-9">{children}</div>
        </div>
      </div>
    </section>
  );
}

/* ── Про мене ─────────────────────────────────────────────────── */

function About({
  paragraphs,
  educationMatches,
  searching,
}: {
  paragraphs: string[];
  educationMatches: boolean;
  searching: boolean;
}) {
  const s = useSite();
  const { lang } = useLang();
  return (
    <Section id="about" title={t("sectionAbout", lang)}>
      <div className="max-w-2xl space-y-5">
        {paragraphs.map((paragraph) => (
          <p
            key={paragraph.slice(0, 32)}
            className={`reveal leading-relaxed ${
              /* Провідний абзац лишається провідним і після фільтрації:
                 стиль прив'язаний до СПРАВЖНЬОГО першого абзацу, а не до
                 першого у відфільтрованому списку. */
              paragraph === s.about[0]
                ? "text-lg text-ink-soft md:text-xl"
                : "text-base text-muted"
            }`}
          >
            {paragraph}
          </p>
        ))}
      </div>
      {!searching || educationMatches ? (
        <p className="reveal mt-8 max-w-2xl border-l-2 border-accent pl-6 text-sm leading-relaxed text-muted">
          {s.educationLabel}
        </p>
      ) : null}
      {searching && paragraphs.length === 0 && !educationMatches ? (
        <NoHits what={{ uk: "у розділі «Про мене» нічого", en: "the About section" }} />
      ) : null}
    </Section>
  );
}

/* ── Відгуки слухачів ─────────────────────────────────────────── */

function Reviews({
  items,
  total,
  searching,
}: {
  items: ReviewItem[];
  total: number;
  searching: boolean;
}) {
  const { lang } = useLang();
  /* Фільтр за напрямом — той самий механізм, що в «Сертифікатах»:
     людина обирає тему й бачить лише її. Без фільтра секція з 56
     цитатами читалась як суцільна стіна, де не видно, що саме
     підтверджують відгуки. Групи дають відповідь «у чому я сильний»,
     а лічильник — масштаб. Порядок груп фіксований за uk-назвами:
     значення `group` у даних завжди uk (en — лише підписи). */
  const order = [
    "ШІ та штучний інтелект",
    "Кібербезпека й цифрова безпека",
    "Графічний дизайн",
    "Цифровий світ",
    "Технології комп'ютерної обробки інформації",
  ];

  /* Довга назва напряму в кожній картці повторювалась і перетворювалась
     на шум — підписуємо коротко, але незмінно (en — з мапи підписів). */
  const groups = order
    .map((name) => ({ name, items: items.filter((r) => r.group === name) }))
    .filter((g) => g.items.length > 0);

  const [reviewFilter, setReviewFilter] = useState<string | null>(null);

  /* Пошук і чип теми — два різні механізми над одним списком. Коли людина
     починає шукати, знімаємо чип: інакше він «тримав» би порожню групу, і
     секція виглядала б зламаною. */
  useEffect(() => {
    if (searching) setReviewFilter(null);
  }, [searching]);
  const reviewGroups = groups.map((g) => ({
    name: reviewGroupShort(g.name, lang),
    slug: slug(g.name),
    count: g.items.length,
  }));
  const visibleGroups = reviewFilter
    ? groups.filter((g) => slug(g.name) === reviewFilter)
    : groups;

  const card = (review: ReviewItem, i = 0) => (
    <li
      style={{ "--reveal-delay": `${Math.min(i, 5) * 70}ms` } as React.CSSProperties}
      key={`${review.author}-${review.quote.slice(0, 24)}`}
      className="review-card reveal flex flex-col gap-4"
    >
      <span aria-hidden className="review-dash" />
      <blockquote className="text-base leading-relaxed text-ink-soft">
        {review.quote}
      </blockquote>
      <div className="pt-1">
        <p className="hand text-lg leading-tight text-ink">{review.author}</p>
        <p className="label mt-2">
          {reviewGroupShort(review.group, lang)} · {formatReviewDate(review.date, lang)}
        </p>
      </div>
    </li>
  );

  const plural = (n: number) => {
    if (lang === "en") return n === 1 ? "review" : "reviews";
    return n === 1 ? "відгук" : n < 5 ? "відгуки" : "відгуків";
  };

  return (
    <Section
      id="reviews"
      title={t("sectionReviews", lang)}
      aside={
        <dl className="flex flex-col gap-5">
          {useSite().reviewStats.map((stat) => (
            <div key={stat.k}>
              <dt className="label">{stat.k}</dt>
              <dd className="mt-1.5 text-sm font-semibold leading-snug text-ink-soft">
                {stat.v}
              </dd>
            </div>
          ))}
        </dl>
      }
    >
      <div className="reveal mb-6 flex flex-col gap-3">
        <FilterChips groups={reviewGroups} onChange={setReviewFilter} allLabel={t("filterAll", lang)} />
        {reviewFilter !== null ? (
          <p className="text-xs text-muted">
            {t("filterShown", lang)} {visibleGroups.reduce((n, g) => n + g.items.length, 0)}{" "}
            {lang === "uk" ? "з" : "of"} {total} ·{" "}
            <button
              type="button"
              onClick={() => setReviewFilter(null)}
              className="link-wave text-ink underline decoration-line underline-offset-4 hover:text-ink"
            >
              {t("filterReset", lang)}
            </button>
          </p>
        ) : null}
      </div>

      <p className="reveal mb-12 max-w-xl text-base leading-relaxed text-muted">
        {searching
          ? `${t("filterShown", lang)} ${items.length} ${lang === "uk" ? "з" : "of"} ${total} ${t("reviewsSearching", lang)}`
          : `${total} ${t("reviewsIntro", lang)}`}
      </p>
      {searching && items.length === 0 ? <NoHits what={{ uk: "у відгуках нічого", en: "the reviews" }} /> : null}

      <div className="reveal space-y-12">
        {visibleGroups.map((group) => (
          <div key={group.name} id={`review-${slug(group.name)}`}>
            <div className="group-rule mb-6 flex items-baseline justify-between gap-4 pb-3">
              <h3 className="text-base font-bold tracking-[-0.01em]">{reviewGroupLong(group.name, lang)}</h3>
              <span className="label shrink-0">
                {group.items.length} {plural(group.items.length)}
              </span>
            </div>
            <ul className="review-flow">
              {group.items.map((review, i) => card(review, i))}
            </ul>
          </div>
        ))}
      </div>

      <p className="reveal mt-8 max-w-2xl text-xs leading-relaxed text-muted">
        {t("reviewsNote", lang)}
      </p>
    </Section>
  );
}

/* ── Як я навчаю ───────────────────────────────────────────────── */

function Method({ items }: { items: MethodItem[]; searching: boolean }) {
  const { lang } = useLang();
  /* Ставимо одразу після «Про мене»: спершу хто я, потім як веду
     заняття — і лише тоді відгуки, які це підтверджують. */
  return (
    <Section id="method" title={t("sectionMethod", lang)}>
      {items.length === 0 ? (
        <NoHits what={{ uk: "у розділі «Як я навчаю» нічого", en: "the How I teach section" }} />
      ) : (
        <ol className="reveal card-grid grid-cols-1 sm:grid-cols-2">
          {items.map((item, i) => (
            <li
              key={item.title}
              style={{ "--reveal-delay": `${i * 90}ms` } as CSSProperties}
              className="reveal flex flex-col gap-3 bg-paper-2 p-6 md:p-8"
            >
              {/* Номер — за місцем у ПОВНОМУ переліку: після фільтрації
                  «01, 03» читається як «третій принцип», а не як збій. */}
              <span className="label text-accent-ink">
                {String(items.indexOf(item) + 1).padStart(2, "0")}
              </span>
              <span className="text-lg font-bold leading-snug tracking-[-0.01em]">
                {item.title}
              </span>
              <span className="text-sm leading-relaxed text-muted">{item.body}</span>
            </li>
          ))}
        </ol>
      )}
    </Section>
  );
}

function Work({ items }: { items: ProjectItem[]; searching: boolean }) {
  const s = useSite();
  const { lang } = useLang();
  /* Проєкти як картки, а не 12-колонкова таблиця: назви курсів різної
     довжини й у таблиці ламались на два рядки, а стек дрібними чипами
     праворуч читався як службова колонка. Картка дає назві дихати. */
  return (
    <Section
      id="work"
      title={t("sectionWork", lang)}
      aside={
        /* Ліва колонка на всю висоту секції лишалась білою. Коротка
           довідка дає їй призначення і відповідає на питання, яке
           виникає при погляді на сім курсів: за якими критеріями
           вони складені. */
        <dl className="space-y-5">
          <div>
            <dt className="label">{t("workAsideVolume", lang)}</dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-muted">
              {t("workAsideVolumeText", lang)}
            </dd>
          </div>
          <div>
            <dt className="label">{t("workAsideResult", lang)}</dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-muted">
              {t("workAsideResultText", lang)}
            </dd>
          </div>
          <div>
            <dt className="label">{t("workAsideMaterials", lang)}</dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-muted">
              {t("workAsideMaterialsText", lang)}{" "}
              <a
                href="https://cources.lovable.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="link-wave font-medium text-accent-ink underline decoration-accent/30 underline-offset-4 hover:text-ink hover:decoration-ink/30"
              >
                {t("workAsideMaterialsLink", lang)}
              </a>
              .
            </dd>
          </div>
        </dl>
      }
    >
      {items.length === 0 ? <NoHits what={{ uk: "у розділі «Проєкти» нічого", en: "the Projects section" }} /> : null}
      <ul className="reveal card-grid grid-cols-1 md:grid-cols-2">
        {items.map((project) => {
          const inner = (
            <>
              <span className="label flex items-center justify-between gap-3">
                <span>{project.index}</span>
                <span>
                  {project.kind} · {project.year}
                </span>
              </span>

              <span className="text-xl font-bold leading-tight tracking-[-0.02em] transition-colors group-hover:text-accent-ink md:text-2xl">
                {project.title}
              </span>

              <span className="mt-1 text-sm leading-relaxed text-muted">
                {project.outcome}
              </span>

              <span className="mt-auto flex flex-wrap items-center gap-2 pt-5">
                {project.stack.map((tool) => (
                  <span key={tool} className="label border border-line px-2 py-1 text-ink-soft">
                    {tool}
                  </span>
                ))}
                {project.href ? (
                  <span className="label text-accent-ink transition-colors group-hover:text-ink">
                    {t("openCard", lang)}{" "}
                    <span aria-hidden className="nudge">↗</span>
                  </span>
                ) : null}
              </span>
            </>
          );
          const cls =
            "card-inner group flex h-full flex-col gap-2 p-6 md:p-8";
          return (
            <li key={project.index} className="bg-paper">
              {project.href ? (
                <a
                  href={project.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cls}
                >
                  {inner}
                </a>
              ) : (
                <span className={cls}>{inner}</span>
              )}
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

/* ── Сертифікати ──────────────────────────────────────────────── */

function CertCard({ cert }: { cert: CertItem }) {
  const { lang } = useLang();
  const hrefLabel = certHrefLabel(cert.hrefLabel, lang);
  const inner = (
    <>
      <span className="label flex items-center justify-between gap-2">
        <span>{cert.year}</span>
        {cert.href ? (
          <span
            aria-hidden
            className="shrink-0 text-[10px] tracking-[0.12em] text-accent-ink transition-colors group-hover:text-ink"
          >
            ↗
          </span>
        ) : null}
      </span>
      <span className="text-[15px] font-bold leading-snug tracking-[-0.01em] transition-colors group-hover:text-accent-ink">
        {cert.title}
      </span>
      <span className="mt-auto pt-1 text-sm leading-snug text-muted">
        <span>{cert.issuer}</span>
        {cert.note ? <span> · {certNoteLabel(cert.note, lang)}</span> : null}
        {cert.credentialId ? (
          <span className="block pt-1.5 font-mono text-xs tracking-wide text-muted">
            ID {cert.credentialId}
          </span>
        ) : null}
        {cert.href ? (
          <span className="mt-2 block text-xs font-semibold tracking-wide text-accent-ink">
            {hrefLabel ?? t("verifyDefault", lang)}{" "}
            <span aria-hidden className="nudge">→</span>
          </span>
        ) : null}
      </span>
    </>
  );
  const cls =
    "card-inner reveal group flex h-full flex-col gap-2 p-5 text-left";

  return (
    <li className="bg-paper">
      {cert.href ? (
        <a
          href={cert.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${cert.title} — ${hrefLabel ?? t("verifyAria", lang)}`}
          className={cls}
        >
          {inner}
        </a>
      ) : (
        <span className={cls}>{inner}</span>
      )}
    </li>
  );
}

function Certificates({
  items,
  total,
  searching,
}: {
  items: CertItem[];
  total: number;
  searching: boolean;
}) {
  const s = useSite();
  const { lang } = useLang();
  /* Сертифікати згруповано за темою: двадцять карток одним списком
     читались як рівна стіна, у якій не видно, що людина вміє. Групи
     дають відповідь на питання «в чому я сильний», а лічильник —
     масштаб. Порядок груп збігається з переліком напрямів на сайті;
     значення `group` завжди uk, en — лише підписи (certGroupLabel). */
  const order = ["Штучний інтелект", "Кібербезпека й OSINT", "Хмарні платформи й контент"];
  const groups = order
    .map((name) => ({ name, items: items.filter((c) => c.group === name) }))
    .filter((g) => g.items.length > 0);

  const [certFilter, setCertFilter] = useState<string | null>(null);

  /* Так само, як у відгуках: пошук знімає чип теми, щоб чип не «тримав»
     порожню групу. */
  useEffect(() => {
    if (searching) setCertFilter(null);
  }, [searching]);
  const certGroups = groups.map((g) => ({
    name: certGroupLabel(g.name, lang),
    slug: slug(g.name),
    count: g.items.length,
  }));
  const visibleGroups = certFilter
    ? groups.filter((g) => slug(g.name) === certFilter)
    : groups;

  const certNoun = (n: number) => {
    if (lang === "en") return n === 1 ? "certificate" : "certificates";
    return n === 1 ? "сертифікат" : n < 5 ? "сертифікати" : "сертифікатів";
  };

  return (
    <Section
      id="certs"
      title={t("sectionCerts", lang)}
      aside={
        /* Індекс тем замість порожньої колонки. Підсвічує поточну тему
           при прокрутці — інакше читався б як статична довідка. */
        <div>
          <CertIndex
            groups={groups.map((g) => ({
              name: certGroupLabel(g.name, lang),
              slug: slug(g.name),
              count: g.items.length,
            }))}
          />
          <p className="pt-3 text-xs leading-relaxed text-muted">
            {s.certificates.length} {t("certsAsidePrograms", lang)} · {groups.length}{" "}
            {groups.length === 1 ? t("certsAsideTopicsOne", lang) : t("certsAsideTopicsFew", lang)}
          </p>
        </div>
      }
    >
      <div className="reveal mb-6 flex flex-col gap-3">
        <FilterChips groups={certGroups} onChange={setCertFilter} allLabel={t("filterAll", lang)} />
        {certFilter !== null ? (
          <p className="text-xs text-muted">
            {t("filterShown", lang)} {visibleGroups.reduce((n, g) => n + g.items.length, 0)}{" "}
            {lang === "uk" ? "з" : "of"} {total} ·{" "}
            <button
              type="button"
              onClick={() => setCertFilter(null)}
              className="link-wave text-ink underline decoration-line underline-offset-4 hover:text-ink"
            >
              {t("filterReset", lang)}
            </button>
          </p>
        ) : null}
      </div>
      <p className="reveal mb-12 max-w-xl text-base leading-relaxed text-muted">
        {searching
          ? `${t("filterShown", lang)} ${items.length} ${lang === "uk" ? "з" : "of"} ${total} ${t("certsSearching", lang)}`
          : `${total} ${t("certsIntro", lang)}`}
      </p>
      {searching && items.length === 0 ? <NoHits what={{ uk: "у сертифікатах нічого", en: "the certificates" }} /> : null}

      <div className="reveal space-y-12">
        {visibleGroups.map((group) => (
          <div key={group.name} id={`cert-${slug(group.name)}`}>
            <div className="group-rule mb-6 flex items-baseline justify-between gap-4 pb-3">
              <h3 className="text-base font-bold tracking-[-0.01em]">{certGroupLabel(group.name, lang)}</h3>
              <span className="label shrink-0">
                {group.items.length}{" "}
                {certNoun(group.items.length)}
              </span>
            </div>
            <ul className="card-grid auto-rows-fr grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((cert) => (
                <CertCard key={`${cert.year}-${cert.title}`} cert={cert} />
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="reveal mt-8 max-w-2xl text-xs leading-relaxed text-muted">
        {t("certsNote", lang)}
      </p>
    </Section>
  );
}

/* ── Контакт ──────────────────────────────────────────────────── */

function Contact() {
  const { lang } = useLang();
  return (
    <Section id="contact" title={t("sectionContact", lang)}>
      <p className="reveal max-w-2xl text-2xl font-bold leading-snug tracking-[-0.02em] md:text-4xl">
        {t("contactLead", lang)}
      </p>

      <div className="reveal mt-10 flex flex-col gap-8">
        {/* Два канали, навмисно розділені:
            • кнопка чату в куті (ChatWidget) — живе листування, відповідь
              приходить туди ж, у вікно;
            • ця кнопка — лист на пошту, для тих, кому зручніше поштою. */}
        <ContactModal trigger="button" />

        <p className="max-w-lg text-sm leading-relaxed text-ink-soft">
          {t("contactOrChat", lang)}{" "}
          <Link
            href="/forum"
            className="link-wave font-medium text-accent-ink underline decoration-accent/30 underline-offset-4 hover:text-ink hover:decoration-ink/30"
          >
            {t("contactOrChatLink", lang)}
          </Link>
          .
        </p>

        <ul className="flex flex-wrap gap-x-8 gap-y-1 border-t border-line pt-7">
          {useSite().socials.map((social) => (
            <li key={social.label}>
              <a
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="label link-underline flex h-11 items-center text-ink-soft"
              >
                {social.label} ↗
              </a>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

/* Анкори для індексу тем: кирилиця в id валідна, але транслітерація
   дає коротші й читабельніші посилання. Групи завжди фільтруються за
   uk-значенням `group`, тож анкори однакові в обох мов. */
function slug(text: string) {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ie", ж: "zh",
    з: "z", и: "y", і: "i", ї: "i", й: "i", к: "k", л: "l", м: "m", н: "n",
    о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
    ч: "ch", ш: "sh", щ: "shch", ь: "", ю: "iu", я: "ia", "'": "", " ": "-",
  };
  return text
    .toLowerCase()
    .split("")
    .map((c) => map[c] ?? c)
    .join("");
}

/* ── Сторінка ─────────────────────────────────────────────────── */

export default function Home() {
  /* ── Миттєвий пошук по сторінці ──────────────────────────────────────
     Стан живе тут, у спільному предку секцій: фільтруються «Про мене»,
     «Як я навчаю», «Проєкти», «Відгуки» й «Сертифікати» одночасно.
     Списки фільтруються ОДИН раз — і з них же рахується «знайдено N з M»,
     тож цифра в полі не може розійтися з тим, що на екрані.
     Фільтруємо на клієнті (а не на сервері) навмисно: контент і так уже
     в сторінці, тож результат видно на кожну літеру, без мережі. */
  const s = useSite();
  const { lang } = useLang();
  const [query, setQuery] = useState("");
  const rawTokens = useMemo(() => tokenize(query), [query]);
  /* Групи синонімів: en-запит має знаходити й укр. контент («teacher» →
     «викладач»). AND за групами, АБО всередині групи — інакше жоден
     en-синонім не дав би збігу з укр. текстом. */
  const tokenGroups = useMemo(() => expandTokenGroups(rawTokens), [rawTokens]);
  const searching = rawTokens.length > 0;

  const aboutItems = useMemo(
    () => (tokenGroups.length === 0 ? [...s.about] : s.about.filter((p) => matchesGroups(haystack(p), tokenGroups))),
    [s.about, tokenGroups],
  );
  const educationMatches = useMemo(
    () => matchesGroups(haystack(s.educationLabel), tokenGroups),
    [s.educationLabel, tokenGroups],
  );
  const methodItems = useMemo(
    () => (tokenGroups.length === 0 ? [...s.method] : s.method.filter((m) => matchesGroups(methodText(m), tokenGroups))),
    [s.method, tokenGroups],
  );
  const projectItems = useMemo(
    () => (tokenGroups.length === 0 ? [...s.projects] : s.projects.filter((p) => matchesGroups(projectText(p), tokenGroups))),
    [s.projects, tokenGroups],
  );
  const reviewItems = useMemo(
    () => (tokenGroups.length === 0 ? [...s.reviews] : s.reviews.filter((r) => matchesGroups(reviewText(r), tokenGroups))),
    [s.reviews, tokenGroups],
  );
  const certItems = useMemo(
    () => (tokenGroups.length === 0 ? [...s.certificates] : s.certificates.filter((c) => matchesGroups(certText(c), tokenGroups))),
    [s.certificates, tokenGroups],
  );

  /* «Знайдено N з M»: M — кількість одиниць контенту, які взагалі шукаються
     (абзаци + принципи + проєкти + відгуки + сертифікати). */
  const total =
    s.about.length +
    1 +
    s.method.length +
    s.projects.length +
    s.reviews.length +
    s.certificates.length;
  const found =
    aboutItems.length +
    (educationMatches ? 1 : 0) +
    methodItems.length +
    projectItems.length +
    reviewItems.length +
    certItems.length;

  return (
    <>
      <Header />
      <main id="main">
        <Hero />
        <Keywords />
        <SiteSearch
          query={query}
          onChange={setQuery}
          total={total}
          found={found}
          sections={[
            {
              id: "about",
              label: t("sectionAbout", lang),
              count: aboutItems.length + (educationMatches ? 1 : 0),
            },
            { id: "method", label: t("sectionMethod", lang), count: methodItems.length },
            { id: "work", label: t("sectionWork", lang), count: projectItems.length },
            { id: "reviews", label: t("sectionReviews", lang), count: reviewItems.length },
            { id: "certs", label: t("sectionCerts", lang), count: certItems.length },
          ]}
        />
        <About
          paragraphs={aboutItems}
          educationMatches={educationMatches}
          searching={searching}
        />
        <Method items={methodItems} searching={searching} />
        <Work items={projectItems} searching={searching} />
        <Reviews items={reviewItems} total={s.reviews.length} searching={searching} />
        <Certificates items={certItems} total={s.certificates.length} searching={searching} />
        <Contact />
      </main>
      <Footer />
      <Reveal />
    </>
  );
}
