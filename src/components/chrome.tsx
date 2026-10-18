"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { site } from "@/content/site";
import { useSite } from "@/lib/use-site";
import ContactModal from "@/components/contact-modal";
import LanguageToggle from "@/components/language-toggle";
import { useLang } from "@/components/lang-context";
import { t } from "@/lib/ui-strings";

const NAV = [
  { id: "about", label: { uk: "Про мене", en: "About me" } },
  { id: "method", label: { uk: "Як навчаю", en: "How I teach" } },
  { id: "work", label: { uk: "Проєкти", en: "Projects" } },
  { id: "reviews", label: { uk: "Відгуки", en: "Reviews" } },
  { id: "certs", label: { uk: "Сертифікати", en: "Certificates" } },
  { id: "contact", label: { uk: "Контакти", en: "Contact" } },
] as const;

export function Header() {
  const [active, setActive] = useState<string | null>(null);
  const { lang } = useLang();

  useEffect(() => {
    const ids = NAV.map((n) => n.id);
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const seen = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) seen.add((e.target as HTMLElement).id);
          else seen.delete((e.target as HTMLElement).id);
        }
        // найвища секція, що зараз у смузі читання
        const ordered = ids.filter((id) => seen.has(id));
        const next = ordered[0] ?? null;
        // коли над усіма секціями (hero) — нічого не підсвічуємо
        setActive(next);
      },
      {
        // 56px шапка + невеликий запас; нижній край — за серединою екрану
        rootMargin: "-112px 0px -55% 0px",
        threshold: 0,
      },
    );

    sections.forEach((s) => observer.observe(s));

    // ховаємо підсвічування коли вгорі сторінки
    const onScroll = () => {
      if (window.scrollY < 80) setActive((prev) => (prev === null ? prev : null));
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // тримаємо активний пункт у полі зору на мобільному
  useEffect(() => {
    if (!active) return;
    const el = document.querySelector<HTMLAnchorElement>(`a[href="#${active}"]`);
    if (!el) return;
    const nav = el.closest("nav");
    if (!nav) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    /* Прокручуємо ЛИШЕ смугу навігації, і лише по горизонталі.
       Було `el.scrollIntoView({block:"nearest"})` — і поки пункт лишався
       невидимим у вузькій смузі, браузер заодно смикав і СТОРІНКУ: лінк
       усередині sticky-шапки тягне вікно на ~108px. Через це кожен якір
       (навігація, індекс, перехід від пошуку) спинявся на 108px нижче
       потрібного. Тепер вертикаль вікна недоторкана за побудовою. */
    const shift =
      nav.scrollLeft +
      (el.getBoundingClientRect().left - nav.getBoundingClientRect().left) -
      (nav.clientWidth - el.offsetWidth) / 2;
    nav.scrollTo({
      left: Math.max(0, shift),
      behavior: reduce ? "auto" : "smooth",
    });
  }, [active]);

  return (
    <header className="gutter sticky top-0 z-50 border-b border-line/60 bg-paper/90 backdrop-blur-md">
      <div className="shell flex h-[52px] items-center justify-between gap-4 md:h-14 md:gap-6">
        <nav
          aria-label={t("nav", lang)}
          className="nav-tight flex min-w-0 flex-1 items-center gap-3 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] md:gap-7 [&::-webkit-scrollbar]:hidden"
        >
          {NAV.map((item) => {
            const isActive = active === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                aria-current={isActive ? "page" : undefined}
                className={`label link-underline flex h-11 shrink-0 items-center whitespace-nowrap text-[11px] tracking-[0.08em] transition-colors ${
                  isActive ? "nav-active text-ink" : "text-ink"
                }`}
              >
                {item.label[lang]}
              </a>
            );
          })}
          {/* Форум — окрема сторінка, не анкор секції: пункт стоїть
              останнім і веде на /forum, а не всередину сторінки. */}
          <Link
            href="/forum"
            className="label link-underline flex h-11 shrink-0 items-center whitespace-nowrap text-[11px] tracking-[0.08em] text-ink transition-colors hover:text-ink"
          >
            {t("navForum", lang)}
          </Link>
        </nav>

        <div className="flex shrink-0 items-center">
          <LanguageToggle compact />
          <div className="hidden shrink-0 sm:block">
            <ContactModal trigger="link" />
          </div>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  const { lang } = useLang();
  return (
    <footer className="gutter border-t border-line/70">
      <div className="shell flex flex-col gap-4 py-10 md:flex-row md:items-center md:justify-between">
        <p className="text-[11px] tracking-[0.08em] text-muted">
          © {new Date().getFullYear()} {site.name}
        </p>
        <div className="flex items-center gap-6">
          <Link
            href="/forum"
            className="label link-underline flex h-11 w-fit items-center text-ink"
          >
            {t("navForum", lang)}
          </Link>
          <a
            href="#top"
            onClick={(e) => {
              // id="top" має sticky-хедер, який завжди у в'юпорті, тому якір
              // не прокручує нічо → скролимо нагору завжди через JS.
              e.preventDefault();
              const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
              window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
            }}
            className="label link-underline flex h-11 w-fit items-center text-ink"
          >
            {lang === "uk" ? "Вгору ↑" : "Top ↑"}
          </a>
        </div>
      </div>
    </footer>
  );
}
