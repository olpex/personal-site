"use client";

import { useEffect } from "react";

/**
 * Adds data-visible="true" to every .reveal element once it scrolls into view.
 * Pure IntersectionObserver — no animation library. Re-observes nodes that
 * appear later (e.g. after filtering certificates), otherwise they stay at
 * opacity 0 and look like "not rendered" / підгальмовування.
 */
export default function Reveal() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      document
        .querySelectorAll<HTMLElement>(".reveal")
        .forEach((n) => n.setAttribute("data-visible", "true"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-visible", "true");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );

    const observe = (el: HTMLElement) => {
      if (el.hasAttribute("data-visible")) return;
      observer.observe(el);
    };

    document.querySelectorAll<HTMLElement>(".reveal").forEach(observe);

    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          if (node.classList.contains("reveal")) observe(node);
          node
            .querySelectorAll<HTMLElement>(".reveal:not([data-visible])")
            .forEach(observe);
        }
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
