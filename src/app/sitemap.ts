import type { MetadataRoute } from "next";
import { site } from "@/content/site";

// Фіксована дата оновлення контенту — інфраструктура домену зафіксована 2026-09-18,
// останній змістовий апдейт — цей коміт. Не ставити new Date() на кожен білд,
// щоб не шуміти в індексі краулера.
const LAST_CONTENT_UPDATE = new Date("2026-09-27T00:00:00.000Z");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: site.url,
      lastModified: LAST_CONTENT_UPDATE,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${site.url}/forum`,
      lastModified: LAST_CONTENT_UPDATE,
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];
}
