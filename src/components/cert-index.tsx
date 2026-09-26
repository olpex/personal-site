"use client";

import { useEffect, useState } from "react";

/**
 * Липкий індекс тем сертифікатів. Підсвічує тему, яку зараз видно.
 *
 * Навіщо: рейл стоїть на екрані постійно, тож без підсвічування він
 * читається як статична довідка, а не як орієнтир — людина не бачить,
 * у якій частині списку перебуває. Підсвічування робить його навігацією.
 */
export default function CertIndex({
  groups,
}: {
  groups: { name: string; slug: string; count: number }[];
}) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const sections = groups
      .map((g) => document.getElementById(`cert-${g.slug}`))
      .filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) return;

    /* Набір секцій, що зараз у смузі читання. Тримаємо його самі, бо
       подія дає лише змінені елементи — покладатись на неї саму не можна. */
    const seen = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) seen.add(entry.target.id);
          else seen.delete(entry.target.id);
        }

        /* Беремо найвищу з тих, що ЗАРАЗ у смузі. Якщо жодна не
           потрапила (секція між темами або самий верх сторінки) —
           лишаємо лічильник порожнім, а не показуємо випадкову тему:
           на верху сторінки підсвіченою виявлялась ОСТАННЯ тема. */
        const order = sections.map((s) => s.id).filter((id) => seen.has(id));
        setActive(order[0]?.replace(/^cert-/, "") ?? null);
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 },
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [groups]);

  return (
    <nav aria-label="Теми сертифікатів" className="space-y-3">
      {groups.map((g) => {
        const isActive = active === g.slug;
        return (
          <a
            key={g.slug}
            href={`#cert-${g.slug}`}
            aria-current={isActive ? "true" : undefined}
            className={`flex items-baseline justify-between gap-3 border-b pb-2 text-sm transition-colors ${
              isActive
                ? "border-accent text-ink"
                : "border-line text-muted hover:border-line-strong hover:text-accent-ink"
            }`}
          >
            <span className="flex items-baseline gap-2">
              {/* Акцентний маркер замість підкреслення: тримає позицію
                  рядка, коли стан перемикається, — нічого не зсувається. */}
              <span
                aria-hidden
                className={`inline-block h-1.5 w-1.5 shrink-0 translate-y-[-1px] transition-colors ${
                  isActive ? "bg-accent" : "bg-line-strong"
                }`}
              />
              {g.name}
            </span>
            <span className="label shrink-0">{g.count}</span>
          </a>
        );
      })}
    </nav>
  );
}
