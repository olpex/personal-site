import Image from "next/image";
import { site } from "@/content/site";
import { Footer, Header } from "@/components/chrome";
import Reveal from "@/components/reveal";
import CertIndex from "@/components/cert-index";

/* ── Hero ─────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section id="top" className="gutter relative">
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
            <h1 className="reveal display text-[clamp(2.5rem,8.5vw,6rem)]">
              {site.name}
            </h1>

            <p className="reveal mt-6 max-w-xl text-lg leading-relaxed text-ink-soft md:text-xl">
              {site.role}
              <span aria-hidden className="mx-2 text-accent-ink">
                ·
              </span>
              <span className="serif-accent text-ink">{site.orgShort}</span>
            </p>
          </div>

          <div className="order-3 lg:order-none">
            <p className="reveal mt-5 max-w-lg text-base leading-relaxed text-muted">
              {site.statement}
            </p>

            <div className="reveal mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <a
                href="#work"
                className="lift group inline-flex min-h-12 items-center justify-center gap-3 bg-accent-solid px-6 py-3 text-sm font-semibold text-white hover:bg-ink sm:justify-start"
              >
                Дивитись проєкти
                <span
                  aria-hidden
                  className="transition-transform duration-300 group-hover:translate-y-0.5"
                >
                  ↓
                </span>
              </a>
              <a
                href={`mailto:${site.email}`}
                className="inline-flex min-h-12 items-center justify-center border border-line-strong px-6 py-3 text-sm font-semibold transition-colors hover:border-accent-ink hover:text-accent-ink sm:justify-start"
              >
                Написати листа
              </a>
            </div>
          </div>
        </div>

        {/* Портрет. На десктопі займає обидва рядки сітки — так смуга
            фактів лягає під кнопки, закриваючи порожнечу ліворуч, а
            портрет лишається високим. */}
        <div className="reveal order-2 lg:order-none lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1">
          <figure className="mx-auto w-full max-w-[440px] lg:mx-0 lg:max-w-none lg:sticky lg:top-20">
            {/* Кадр має вміститися в перший екран, тому його висота
                обмежена часткою вікна (max-h), а не лише пропорцією:
                на широкому мобільному 4:5 давало 750px — більше за екран.
                object-top тримає голову в кадрі, обрізаючи піджак.
                На десктопі обмеження знімається — там портрет високий. */}
            <div className="relative aspect-[4/5] max-h-[52vh] w-full overflow-hidden bg-paper-2 md:aspect-[3/4] lg:max-h-none">
              <Image
                src={site.portrait}
                alt={site.portraitAlt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover object-[center_6%] lg:object-top"
              />
            </div>
            {/* Бурштинова смуга на всю ширину — свідома базова лінія,
                а не обірваний маркер. */}
            <span aria-hidden className="mt-4 block h-1.5 w-full bg-accent" />
          </figure>
        </div>

        {/* Смуга фактів — окремий рядок сітки, тому на мобільному вона
            стоїть ПІСЛЯ портрета, а на десктопі підіймається під кнопки
            й закриває порожнечу в лівій колонці.
            Факт, значення якого починається з числа, дістає велику цифру:
            «54» очима читається за частку секунди. */}
        <dl className="reveal order-4 lg:order-none grid grid-cols-2 gap-x-6 gap-y-7 border-t border-line pt-8 sm:grid-cols-4 lg:col-span-7 lg:col-start-1 lg:row-start-2 lg:self-end">
          {site.facts.map((fact) => {
            const parts = fact.v.match(/^(\d+(?:[.,]\d+)?%?)\s*(.*)$/);
            const figure = parts?.[1];
            const rest = parts?.[2];

            return (
              <div key={fact.k}>
                <dt className="label">{fact.k}</dt>
                {figure ? (
                  <dd className="mt-2.5">
                    <span className="stat-figure block text-4xl text-ink md:text-5xl">
                      {figure}
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
  /* Двадцять цитат поспіль робили секцію найважчою на сторінці — 41%
     її висоти, і відгуки заступали те, що людина вміє. Схвальні цитати
     працюють як доказ, а не як архів, тому на видноті вісім найповніших
     за змістом, а решта — під розкриттям, доступна тим, хто читає уважно.
     Нічого не викинуто: до всіх двадцяти можна дійти. */
  const order = [
    "ШІ та штучний інтелект",
    "Кібербезпека й цифрова безпека",
    "Графічний дизайн",
    "Технології комп'ютерної обробки інформації",
  ];

  /* Довга назва напряму в кожній картці повторювалась і перетворювалась
     на шум — підписуємо коротко, але незмінно. */
  const shortGroup: Record<string, string> = {
    "ШІ та штучний інтелект": "ШІ",
    "Кібербезпека й цифрова безпека": "Кібербезпека",
    "Графічний дизайн": "Графічний дизайн",
    "Технології комп'ютерної обробки інформації": "Обробка інформації",
  };

  const featured = site.reviews.filter((r) => r.featured);
  const rest = site.reviews.filter((r) => !r.featured);

  const card = (review: (typeof site.reviews)[number], dim = false, i = 0) => (
    <li
      style={{ "--reveal-delay": `${Math.min(i, 5) * 70}ms` } as React.CSSProperties}
      key={`${review.author}-${review.quote.slice(0, 24)}`}
      className={`review-card reveal flex flex-col gap-4 ${dim ? "opacity-90" : ""}`}
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
      <ul className="reveal review-flow">
        {featured.map((review, i) => card(review, false, i))}
      </ul>

      {rest.length > 0 ? (
        <details className="reveal group mt-6 border border-line">
          <summary className="label flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-ink-soft transition-colors hover:text-accent-ink">
            <span>
              Показати решту {rest.length}{" "}
              {rest.length < 5 ? "відгуки" : "відгуків"}
            </span>
            <span
              aria-hidden
              className="shrink-0 text-lg leading-none transition-transform duration-300 group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <ul className="review-flow">
            {rest.map((review, i) => card(review, true, i))}
          </ul>
        </details>
      ) : null}

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
                className="font-medium text-accent-ink underline decoration-accent/30 underline-offset-4 transition-colors hover:text-ink hover:decoration-ink/30"
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
      <p className="reveal mb-12 max-w-xl text-base leading-relaxed text-muted">
        {site.certificates.length} програм підвищення кваліфікації за трьома
        темами. Кожна картка веде на сторінку перевірки або курсу.
      </p>

      <div className="reveal space-y-12">
        {groups.map((group) => (
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
        {/* Email видимим текстом — конвертує краще за будь-яку форму */}
        <a
          href={`mailto:${site.email}`}
          className="link-underline flex h-12 w-fit items-center text-xl font-bold tracking-[-0.02em] md:text-3xl"
        >
          {site.email}
        </a>

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
