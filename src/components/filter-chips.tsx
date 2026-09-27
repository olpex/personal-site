"use client";

import { useEffect, useRef, useState } from "react";

type FilterGroup = { name: string; slug: string; count: number };

export default function FilterChips({
  groups,
  onChange,
}: {
  groups: FilterGroup[];
  onChange: (active: string | null) => void;
}) {
  const [active, setActive] = useState<string | null>(null);

  const handleSelect = (slug: string | null) => {
    setActive(slug);
    onChange(slug);
  };

  return (
    <div
      role="group"
      aria-label="Фільтр за темою"
      className="flex flex-wrap gap-2"
    >
      <button
        type="button"
        aria-pressed={active === null}
        onClick={() => handleSelect(null)}
        className={`rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide transition-colors ${
          active === null
            ? "border-ink bg-ink text-paper"
            : "border-line bg-paper text-ink-soft hover:border-line-strong hover:text-ink"
        }`}
      >
        Усі
      </button>
      {groups.map((g) => (
        <button
          key={g.slug}
          type="button"
          aria-pressed={active === g.slug}
          onClick={() => handleSelect(g.slug)}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide transition-colors ${
            active === g.slug
              ? "border-accent bg-accent text-white"
              : "border-line bg-paper text-ink-soft hover:border-line-strong hover:text-ink"
          }`}
        >
          {g.name}{" "}
          <span className="ml-1 opacity-60">({g.count})</span>
        </button>
      ))}
    </div>
  );
}
