import Image from "next/image";
import { site } from "@/content/site";
import { Footer, Header } from "@/components/chrome";
import Reveal from "@/components/reveal";

/* ── Hero ─────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section id="top" className="gutter relative">
      <div className="shell grid grid-cols-1 gap-y-12 pt-14 md:pt-20 lg:grid-cols-12 lg:gap-x-12">
        {/* Текстова колонка */}
        <div className="flex flex-col justify-between lg:col-span-7">
          <div>
            <p className="label reveal flex items-center gap-3">
              <span aria-hidden className="inline-block h-px w-8 bg-accent" />
              {site.location}
            </p>

            <h1 className="reveal display mt-6 text-[clamp(2.5rem,8.5vw,6rem)]">
              {site.name}
            </h1>

            <p className="reveal mt-6 max-w-xl text-lg leading-relaxed text-ink-soft md:text-xl">
              {site.role}
              <span aria-hidden className="mx-2 text-accent">
                ·
              </span>
              <span className="serif-accent text-ink">{site.orgShort}</span>
            </p>

            <p className="reveal mt-5 max-w-lg text-base leading-relaxed text-muted">
              {site.statement}
            </p>

            <div className="reveal mt-9 flex flex-wrap items-center gap-3">
              <a
                href="#work"
                className="group inline-flex items-center gap-3 bg-ink px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-accent"
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
                className="inline-flex items-center border border-line-strong px-6 py-3 text-sm font-semibold transition-colors hover:border-accent hover:text-accent"
              >
                Написати листа
              </a>
            </div>
          </div>

          {/* Смуга фактів під кнопками */}
          <dl className="reveal mt-14 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-line pt-8 sm:grid-cols-4">
            {site.facts.map((fact) => (
              <div key={fact.k}>
                <dt className="label">{fact.k}</dt>
                <dd className="mt-2 text-sm font-semibold leading-snug text-ink-soft">
                  {fact.v}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Портрет */}
        <div className="reveal lg:col-span-5">
          <figure className="relative">
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-paper-2">
              <Image
                src={site.portrait}
                alt={site.portraitAlt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover object-center"
              />
            </div>
            {/* Бурштинова смуга — прив'язка до акценту */}
            <span aria-hidden className="absolute -bottom-3 left-0 h-1.5 w-24 bg-accent" />
            <figcaption className="label mt-7">
              {site.shortName} — {site.role}
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
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
            <span className="text-accent">◆</span>
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
  index,
  title,
  children,
}: {
  id: string;
  index: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="gutter scroll-mt-14">
      <div className="shell border-t border-line py-16 md:py-24">
        <div className="grid grid-cols-1 gap-y-10 lg:grid-cols-12 lg:gap-x-12">
          <div className="lg:col-span-3">
            <h2 className="reveal flex items-baseline gap-4">
              <span className="label">{index}</span>
              <span className="display text-3xl md:text-4xl">{title}</span>
            </h2>
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
    <Section id="about" index="01" title="Про мене">
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

      {/* Заклад — дані з lcptodcz.lviv.ua */}
      <div className="reveal mt-12 max-w-2xl border-l-2 border-accent pl-6">
        <p className="label">Місце роботи</p>
        <a
          href={site.orgLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block text-xl font-bold leading-snug tracking-[-0.02em] transition-colors hover:text-accent"
        >
          {site.org} ↗
        </a>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Державний професійно-технічний навчальний заклад у системі Державної
          служби зайнятості. Підпорядкований через Львівський обласний центр
          зайнятості.
        </p>
        <address className="mt-5 space-y-1 text-sm not-italic text-muted">
          <p>{site.orgContacts.address}</p>
          <p>
            <a href={`mailto:${site.orgContacts.email}`} className="link-underline">
              {site.orgContacts.email}
            </a>
            {" · "}
            <a href={`tel:${site.orgContacts.phone.replace(/\D/g, "")}`} className="link-underline">
              {site.orgContacts.phone}
            </a>
          </p>
        </address>
      </div>
    </Section>
  );
}

/* ── Проєкти: індексний список ────────────────────────────────── */

function Work() {
  return (
    <Section id="work" index="02" title="Проєкти">
      <p className="reveal mb-10 max-w-xl text-base leading-relaxed text-muted">
        Шість робіт, які показують як я думаю. Для кожної — що саме я зробив і що
        змінилося.
      </p>

      <ul className="divide-y divide-line border-y border-line">
        {site.projects.map((project) => {
          const Tag = project.href ? "a" : "div";
          return (
            <li key={project.index} className="reveal">
              <Tag
                {...(project.href
                  ? { href: project.href, target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="group grid grid-cols-1 gap-x-8 gap-y-3 py-7 md:grid-cols-12 md:items-baseline"
              >
                <span className="label md:col-span-1">{project.index}</span>

                <span className="md:col-span-4">
                  <span className="block text-xl font-bold tracking-[-0.02em] transition-colors group-hover:text-accent md:text-2xl">
                    {project.title}
                  </span>
                  <span className="label mt-1.5 block">
                    {project.kind} · {project.year}
                  </span>
                </span>

                <span className="text-sm leading-relaxed text-muted md:col-span-5">
                  {project.outcome}
                </span>

                <span className="flex flex-wrap items-center gap-2 md:col-span-2 md:justify-end">
                  {project.stack.length > 0 ? (
                    project.stack.map((tool) => (
                      <span
                        key={tool}
                        className="label border border-line px-2 py-1 text-ink-soft"
                      >
                        {tool}
                      </span>
                    ))
                  ) : (
                    <span aria-hidden className="label opacity-0">
                      —
                    </span>
                  )}
                </span>
              </Tag>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

/* ── Досвід ───────────────────────────────────────────────────── */

function Experience() {
  return (
    <Section id="experience" index="03" title="Досвід">
      <ol className="divide-y divide-line border-y border-line">
        {site.experience.map((item) => (
          <li
            key={`${item.period}-${item.role}`}
            className="reveal grid grid-cols-1 gap-x-8 gap-y-2 py-6 md:grid-cols-12 md:items-baseline"
          >
            <span className="label md:col-span-3">{item.period}</span>
            <span className="text-lg font-bold md:col-span-4">{item.role}</span>
            <span className="text-sm text-ink-soft md:col-span-5">
              {item.org}
              {item.note ? <span className="block text-muted">{item.note}</span> : null}
            </span>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/* ── Контакт ──────────────────────────────────────────────────── */

function Contact() {
  return (
    <Section id="contact" index="04" title="Контакти">
      <p className="reveal max-w-2xl text-2xl font-bold leading-snug tracking-[-0.02em] md:text-4xl">
        Відкритий до викладання, консультацій і спільних курсів.
      </p>

      <div className="reveal mt-10 flex flex-col gap-8">
        {/* Email видимим текстом — конвертує краще за будь-яку форму */}
        <a
          href={`mailto:${site.email}`}
          className="link-underline w-fit text-xl font-bold tracking-[-0.02em] md:text-3xl"
        >
          {site.email}
        </a>

        <ul className="flex flex-wrap gap-x-8 gap-y-3 border-t border-line pt-8">
          {site.socials.map((social) => (
            <li key={social.label}>
              <a
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="label link-underline text-ink-soft"
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
        <Work />
        <Experience />
        <Contact />
      </main>
      <Footer />
      <Reveal />
    </>
  );
}
