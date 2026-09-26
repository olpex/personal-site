# Personal site — візитівка

Односторінковий сайт-візитівка: hero з портретом, проєкти, досвід, контакти.

## Стек

- Next.js 16 (App Router) + React 19
- Tailwind CSS 4
- Шрифти через `next/font` (Manrope / Spectral / JetBrains Mono) — самохостинг, без запитів до Google
- Без анімаційних бібліотек: reveal на `IntersectionObserver`

## Де редагувати контент

**Увесь контент — в одному файлі:** `src/content/site.ts`

Там ім'я, посада, проєкти, досвід, соцмережі, ключові слова. Більше нічого чіпати не треба.

## Фото

Поклади своє фото на повний зріст у `public/portrait.jpg` і зміни в `src/content/site.ts`:

```ts
portrait: "/portrait.jpg",
```

Пропорція кадру — 3:4, об'єкт зверху (`object-top`).

## Локальний запуск

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # прод-збірка
```

## Що вже зроблено «на оцінку»

- Адаптив від 320px
- Темна тема автоматично за `prefers-color-scheme`
- `prefers-reduced-motion` вимикає всі анімації
- Видимий фокус-рінг, skip-link, семантичні лендмарки
- SEO: metadata, OpenGraph, Twitter card, JSON-LD `Person`, `sitemap.xml`, `robots.txt`
