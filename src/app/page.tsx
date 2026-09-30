"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { site } from "@/content/site";
import { Footer, Header } from "@/components/chrome";
import Reveal from "@/components/reveal";
import CertIndex from "@/components/cert-index";
import FilterChips from "@/components/filter-chips";
import ContactModal from "@/components/contact-modal";

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
              <h1 className="hero-name relative leading-[0.9] text-ink">{site.name}</h1>
              {/* Риска — ПОЗА h1: маска хмари стоїть на h1, і дитина
                  всередині теж обрізалася б хмарою. */}
              <span aria-hidden className="hero-name-rule" />
            </div>

            <p className="reveal mt-5 max-w-xl text-xl leading-relaxed text-ink-soft md:text-2xl [--reveal-delay:200ms]">
              <span className="hero-role">{site.role}</span>
              <span aria-hidden className="mx-2 text-[var(--gold)]">
                ·
              </span>
              <span className="serif-accent text-ink">{site.orgShort}</span>
            </p>
          </div>

          <div className="order-3 lg:order-none">
            <p className="reveal mt-6 max-w-lg text-[15px] leading-[1.75] text-muted [--reveal-delay:550ms]">
              {site.statement}
            </p>

            <div className="reveal mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center [--reveal-delay:700ms]">
              <a
                href="#work"
                className="group btn-wave-invert inline-flex min-h-12 items-center justify-center gap-3 bg-ink px-7 py-3 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-ink-soft sm:justify-start"
              >
                <span className="wave-span inline-flex items-center gap-3">
                  Дивитись проєкти
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
                label="Написати листа"
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

            БЕЗ sticky: раніше тут було lg:sticky lg:top-20, і при
            прокрутці фото «відклеювалось» від документа — сповзало
            вниз на ~126px, наздоганяючи сторінку ривком. Власник
            попросив, щоб фото було нерухоме й лишалось у тому
            положенні, у якому сторінка завантажилась (перевірено
            заміром: раніше docTop 137px→263px, тепер стабільний). */}
        <div className="reveal portrait-reveal order-2 lg:order-none lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1">
          <figure className="mx-auto w-full max-w-[440px] lg:mx-0 lg:max-w-none">
            {/* Кадр має вміститися в перший екран, тому його висота
                обмежена часткою вікна (max-h), а не лише пропорцією:
                на широкому мобільному 4:5 давало 750px — більше за екран.
                object-top тримає голову в кадрі, обрізаючи піджак.
                На десктопі обмеження знімається — там портрет високий. */}
            <div className="relative aspect-[4/5] max-h-[52vh] w-full overflow-hidden bg-paper md:aspect-[3/4] lg:max-h-none lg:aspect-[4/5]">
              <Image
                src={site.portrait}
                alt={site.portraitAlt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover object-[center_6%] lg:object-top"
              />
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
          {site.facts.map((fact, idx) => {
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

/* Анкори для індексу тем: кирилиця в id валідна, але транслітерація
   дає коротші й читабельніші посилання. */
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

/* ── Маркі-стрічка ────────────────────────────────────────────── */

function Keywords() {
  const items = [...site.keywords, ...site.keywords];
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
      <span className="sr-only">{site.keywords.join(", ")}</span>
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
    <section id={id} className="gutter scroll-mt-14">
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
              <div className="mt-8 hidden lg:sticky lg:top-20 lg:block">{aside}</div>
            ) : null}
          </div>
          <div className="lg:col-span-9">{children}</div>
        </div>
      </div>
    </section>
  );
}

/* ── Про мене ─────────────────────────────────────────────────── */

function About() {
  return (
    <Section id="about" title="Про мене">
      <div className="max-w-2xl space-y-5">
        {site.about.map((paragraph, i) => (
          <p
            key={i}
            className={`reveal leading-relaxed ${
              i === 0 ? "text-lg text-ink-soft md:text-xl" : "text-base text-muted"
            }`}
          >
            {paragraph}
          </p>
        ))}
      </div>
      <p className="reveal mt-8 max-w-2xl border-l-2 border-accent pl-6 text-sm leading-relaxed text-muted">
        {site.educationLabel}
      </p>
    </Section>
  );
}

/* ── Відгуки слухачів ─────────────────────────────────────────── */

function Reviews() {
  /* Фільтр за напрямом — той самий механізм, що в «Сертифікатах»:
     людина обирає тему й бачить лише її. Без фільтра секція з 55
     цитатами читалась як суцільна стіна, де не видно, що саме
     підтверджують відгуки. Групи дають відповідь «у чому я сильний»,
     а лічильник — масштаб. */
  const order = [
    "ШІ та штучний інтелект",
    "Кібербезпека й цифрова безпека",
    "Графічний дизайн",
    "Цифровий світ",
    "Технології комп'ютерної обробки інформації",
  ];

  /* Довга назва напряму в кожній картці повторювалась і перетворювалась
     на шум — підписуємо коротко, але незмінно. */
  const shortGroup: Record<string, string> = {
    "ШІ та штучний інтелект": "ШІ",
    "Кібербезпека й цифрова безпека": "Кібербезпека",
    "Графічний дизайн": "Графічний дизайн",
    "Цифровий світ": "Цифровий світ",
    "Технології комп'ютерної обробки інформації": "Обробка інформації",
  };

  const groups = order
    .map((name) => ({ name, items: site.reviews.filter((r) => r.group === name) }))
    .filter((g) => g.items.length > 0);

  const [reviewFilter, setReviewFilter] = useState<string | null>(null);
  const reviewGroups = groups.map((g) => ({
    name: shortGroup[g.name] ?? g.name,
    slug: slug(g.name),
    count: g.items.length,
  }));
  const visibleGroups = reviewFilter
    ? groups.filter((g) => slug(g.name) === reviewFilter)
    : groups;

  const card = (review: (typeof site.reviews)[number], i = 0) => (
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
          {shortGroup[review.group] ?? review.group} · {review.date}
        </p>
      </div>
    </li>
  );

  const plural = (n: number) =>
    n === 1 ? "відгук" : n < 5 ? "відгуки" : "відгуків";

  return (
    <Section
      id="reviews"
      title="Відгуки"
      aside={
        <dl className="flex flex-col gap-5">
          {site.reviewStats.map((stat) => (
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
        <FilterChips groups={reviewGroups} onChange={setReviewFilter} />
        {reviewFilter !== null ? (
          <p className="text-xs text-muted">
            Показано {visibleGroups.reduce((n, g) => n + g.items.length, 0)} з{" "}
            {site.reviews.length} ·{" "}
            <button
              type="button"
              onClick={() => setReviewFilter(null)}
              className="link-wave text-ink underline decoration-line underline-offset-4 hover:text-ink"
            >
              скинути фільтр
            </button>
          </p>
        ) : null}
      </div>

      <p className="reveal mb-12 max-w-xl text-base leading-relaxed text-muted">
        {site.reviews.length} відгуків слухачів за напрямами, які я викладаю.
        Цитати наведено дослівно.
      </p>

      <div className="reveal space-y-12">
        {visibleGroups.map((group) => (
          <div key={group.name} id={`review-${slug(group.name)}`} className="scroll-mt-16">
            <div className="group-rule mb-6 flex items-baseline justify-between gap-4 pb-3">
              <h3 className="text-base font-bold tracking-[-0.01em]">{group.name}</h3>
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
        Відгуки наведено дослівно, без редакторських правок. Показано схвальні
        відгуки за напрямами, які я викладаю.
      </p>
    </Section>
  );
}

/* ── Як я навчаю ───────────────────────────────────────────────── */

function Method() {
  /* Ставимо одразу після «Про мене»: спершу хто я, потім як веду
     заняття — і лише тоді відгуки, які це підтверджують. */
  return (
    <Section id="method" title="Як я навчаю">
      <ol className="reveal card-grid grid-cols-1 sm:grid-cols-2">
        {site.method.map((item, i) => (
          <li
            key={item.title}
            style={{ "--reveal-delay": `${i * 90}ms` } as React.CSSProperties}
            className="reveal flex flex-col gap-3 bg-paper-2 p-6 md:p-8"
          >
            <span className="label text-accent-ink">{String(i + 1).padStart(2, "0")}</span>
            <span className="text-lg font-bold leading-snug tracking-[-0.01em]">
              {item.title}
            </span>
            <span className="text-sm leading-relaxed text-muted">{item.body}</span>
          </li>
        ))}
      </ol>
    </Section>
  );
}

function Work() {
  /* Проєкти як картки, а не 12-колонкова таблиця: назви курсів різної
     довжини й у таблиці ламались на два рядки, а стек дрібними чипами
     праворуч читався як службова колонка. Картка дає назві дихати. */
  return (
    <Section
      id="work"
      title="Проєкти"
      aside={
        /* Ліва колонка на всю висоту секції лишалась білою. Коротка
           довідка дає їй призначення і відповідає на питання, яке
           виникає при погляді на шість курсів: за якими критеріями
           вони складені. */
        <dl className="space-y-5">
          <div>
            <dt className="label">Обсяг</dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-muted">
              Затверджені програми — 72 і 144 години; формат — короткі
              модулі з практикою.
            </dd>
          </div>
          <div>
            <dt className="label">Підсумок</dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-muted">
              Де є підсумковий проєкт, слухачі захищають власну роботу —
              проєкт на своїх даних або власний сайт.
            </dd>
          </div>
          <div>
            <dt className="label">Матеріали</dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-muted">
              Презентації та нотатки викладача до кожного слайда —{" "}
              <a
                href="https://cources.lovable.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="link-wave font-medium text-accent-ink underline decoration-accent/30 underline-offset-4 hover:text-ink hover:decoration-ink/30"
              >
                у відкритому доступі ↗
              </a>
              .
            </dd>
          </div>
        </dl>
      }
    >
      <ul className="reveal card-grid grid-cols-1 md:grid-cols-2">
        {site.projects.map((project) => {
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
                    Відкрити{" "}
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

function CertCard({ cert }: { cert: (typeof site.certificates)[number] }) {
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
        {cert.note ? <span> · {cert.note}</span> : null}
        {cert.credentialId ? (
          <span className="block pt-1.5 font-mono text-xs tracking-wide text-muted">
            ID {cert.credentialId}
          </span>
        ) : null}
        {cert.href ? (
          <span className="mt-2 block text-xs font-semibold tracking-wide text-accent-ink">
            {cert.hrefLabel ?? "Перевірити"}{" "}
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
          aria-label={`${cert.title} — ${cert.hrefLabel ?? "відкрити перевірку"}`}
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

function Certificates() {
  /* Сертифікати згруповано за темою: двадцять карток одним списком
     читались як рівна стіна, у якій не видно, що людина вміє. Групи
     дають відповідь на питання «в чому я сильний», а лічильник —
     масштаб. Порядок груп збігається з переліком напрямів на сайті. */
  const order = ["Штучний інтелект", "Кібербезпека й OSINT", "Хмарні платформи й контент"];
  const groups = order
    .map((name) => ({ name, items: site.certificates.filter((c) => c.group === name) }))
    .filter((g) => g.items.length > 0);

  const [certFilter, setCertFilter] = useState<string | null>(null);
  const certGroups = groups.map((g) => ({
    name: g.name,
    slug: slug(g.name),
    count: g.items.length,
  }));
  const visibleGroups = certFilter
    ? groups.filter((g) => slug(g.name) === certFilter)
    : groups;

  return (
    <Section
      id="certs"
      title="Сертифікати"
      aside={
        /* Індекс тем замість порожньої колонки. Підсвічує поточну тему
           при прокрутці — інакше читався б як статична довідка. */
        <div>
          <CertIndex
            groups={groups.map((g) => ({
              name: g.name,
              slug: slug(g.name),
              count: g.items.length,
            }))}
          />
          <p className="pt-3 text-xs leading-relaxed text-muted">
            {site.certificates.length} програм · {groups.length} теми
          </p>
        </div>
      }
    >
      <div className="reveal mb-6 flex flex-col gap-3">
        <FilterChips groups={certGroups} onChange={setCertFilter} />
        {certFilter !== null ? (
          <p className="text-xs text-muted">
            Показано {visibleGroups.reduce((n, g) => n + g.items.length, 0)} з {site.certificates.length} ·{" "}
            <button
              type="button"
              onClick={() => setCertFilter(null)}
              className="link-wave text-ink underline decoration-line underline-offset-4 hover:text-ink"
            >
              скинути фільтр
            </button>
          </p>
        ) : null}
      </div>
      <p className="reveal mb-12 max-w-xl text-base leading-relaxed text-muted">
        {site.certificates.length} програм підвищення кваліфікації за трьома
        темами. Кожна картка веде на сторінку перевірки або курсу.
      </p>

      <div className="reveal space-y-12">
        {visibleGroups.map((group) => (
          <div key={group.name} id={`cert-${slug(group.name)}`} className="scroll-mt-16">
            <div className="group-rule mb-6 flex items-baseline justify-between gap-4 pb-3">
              <h3 className="text-base font-bold tracking-[-0.01em]">{group.name}</h3>
              <span className="label shrink-0">
                {group.items.length}{" "}
                {group.items.length === 1
                  ? "сертифікат"
                  : group.items.length < 5
                    ? "сертифікати"
                    : "сертифікатів"}
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
        Сертифікати Coursera / Credly верифікуються за ID на ім&apos;я Oleg
        Parashchuk; для інших програм — офіційна сторінка курсу, де видають
        сертифікат після завершення.
      </p>
    </Section>
  );
}

/* ── Контакт ──────────────────────────────────────────────────── */

function Contact() {
  return (
    <Section id="contact" title="Контакти">
      <p className="reveal max-w-2xl text-2xl font-bold leading-snug tracking-[-0.02em] md:text-4xl">
        Відкритий до викладання, консультацій і спільних курсів.
      </p>

      <div className="reveal mt-10 flex flex-col gap-8">
        {/* Два канали, навмисно розділені:
            • кнопка чату в куті (ChatWidget) — живе листування, відповідь
              приходить туди ж, у вікно;
            • ця кнопка — лист на пошту, для тих, кому зручніше поштою. */}
        <ContactModal trigger="button" />

        <p className="max-w-lg text-sm leading-relaxed text-ink-soft">
          Або запитайте в чаті — кнопка в правому нижньому куті. Публічні
          питання й відповіді збираються{" "}
          <Link
            href="/forum"
            className="link-wave font-medium text-accent-ink underline decoration-accent/30 underline-offset-4 hover:text-ink hover:decoration-ink/30"
          >
            на форумі
          </Link>
          .
        </p>

        <ul className="flex flex-wrap gap-x-8 gap-y-1 border-t border-line pt-7">
          {site.socials.map((social) => (
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

/* ── Сторінка ─────────────────────────────────────────────────── */

export default function Home() {
  return (
    <>
      <Header />
      <main id="main">
        <Hero />
        <Keywords />
        <About />
        <Method />
        <Work />
        <Reviews />
        <Certificates />
        <Contact />
      </main>
      <Footer />
      <Reveal />
    </>
  );
}
