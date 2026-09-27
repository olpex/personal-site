"use client";

import { useEffect, useState } from "react";
import { site } from "@/content/site";
import ContactModal from "@/components/contact-modal";

const NAV = [
  { id: "about", label: "Про мене" },
  { id: "method", label: "Як навчаю" },
  { id: "work", label: "Проєкти" },
  { id: "reviews", label: "Відгуки" },
  { id: "certs", label: "Сертифікати" },
  { id: "contact", label: "Контакти" },
] as const;

export function Header() {
  const [active, setActive] = useState<string | null>(null);

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
        rootMargin: "-56px 0px -55% 0px",
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
    // scrollIntoView на горизонтальній осі
    el.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, [active]);

  return (
    <header className="gutter sticky top-0 z-50 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="shell flex h-14 items-center justify-between gap-4 md:gap-6">
        <nav
          aria-label="Основна навігація"
          className="nav-tight flex min-w-0 flex-1 items-center gap-3 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] md:gap-7 [&::-webkit-scrollbar]:hidden"
        >
          {NAV.map((item) => {
            const isActive = active === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                aria-current={isActive ? "page" : undefined}
                className={`label link-underline flex h-11 shrink-0 items-center whitespace-nowrap transition-colors ${
                  isActive ? "nav-active text-ink" : "text-ink-soft"
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="hidden shrink-0 sm:block">
          <ContactModal trigger="link" />
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="gutter rule border-b-0">
      <div className="shell flex flex-col gap-4 py-8 md:flex-row md:items-center md:justify-between">
        <p className="label">
          © {new Date().getFullYear()} {site.name}
        </p>
        <a href="#top" className="label link-underline flex h-11 w-fit items-center">
          Вгору ↑
        </a>
      </div>
    </footer>
  );
}
