# DESIGN.md: oparashchuk.com

## Джерело
- URL: https://oparashchuk.com (+ https://oparashchuk.com/forum)
- Дата знімка: 2026-10-02
- Доказова база: Firecrawl `branding` + `images` + full-page screenshot; computed styles реального браузера (1200 елементів); сирий HTML; sitemap
- Firecrawl confidence: buttons 0.95 · colors 0.90 · overall 0.925
- Стек: **Tailwind** (без сторонньої бібліотеки компонентів), Next.js

## Еталонний скріншот
![Повносторінковий скріншот oparashchuk.com](./.firecrawl/oparashchuk-home-screenshot.png)

Візуальне джерело істини для макета, ієрархії та щільності. Токени нижче описують ту саму сторінку машиночитано.

## Дизайн-резюме
Редакційний «паперовий» стиль: тепле майже-біле тло (`#FCFCF9`), майже-чорний текст (`#0A0A0B`),
гострі кути як основна мова форми, засічкові заголовки проти гротескного тіла, теракотово-янтарний
акцент, що використовується ощадливо. Щільність: широка сітка 1152px, дрібний службовий текст 10–12px,
різкий контраст масштабів (92px → 11px). Фактура: зерно плівки на hero, marquee-стрічка між секціями.
Тон: professional / medium energy; аудиторія — студенти й фахівці в ШІ, OSINT, вебдизайні.

## Дизайн-токени

### Кольори (ролі)
| Роль | Значення | Використання |
|---|---|---|
| paper | `#FCFCF9` | тло сторінки (theme-color) |
| paper-2 | `#F2EDE6` | вторинні блоки, підкладки |
| ink | `#0A0A0B` | основний текст, заливка кнопок (theme-color) |
| ink-soft | `#1C1E22` | підзаголовки, другорядний текст |
| muted | `#6B7280` | службовий текст, підписи |
| amber | `#8C3A18` | акцент: риски, наведення на посилання |
| amber-deep | `#5C2410` | посилання, темніший акцент |
| line | `rgba(10,10,11,0.08)` | бордюри, розділювачі (976 входжень) |
| line-strong | `rgba(10,10,11,0.18)` | бордюр кнопок-окреслень |
| white | `#FFFFFF` | текст на темних кнопках |

Зауваження щодо Firecrawl: він позначив `primary` як `#6B7280`, а `link` як `#5C2410`/`#6B7280` — це
евристика за частотою в CSS. Реальні ролі за computed styles: основний колір — `#0A0A0B`, акцент — `#8C3A18`.
Правило: усі «лінії» — чорнильний колір із низькою альфою, а не сірий hex.

### Типографіка
| Роль | Шрифт | Вага | Розмір |
|---|---|---|---|
| Ім'я (H1 hero) | Cormorant Garamond (italic) | 600 | 92px / lh 0.9 |
| Заголовки секцій H2 | Spectral | 400 | 36px / lh 0.92 |
| Службовий H2 (контакт) | Spectral | 700 | 18px / lh 28px |
| Підзаголовки H3 | Manrope | 700 | 16px / lh 24px |
| Тіло | Manrope | 400 / 500 | 16px |
| Службовий/капс | Manrope | 600 | 11–12px |
| Моно-лейбли | JetBrains Mono | 400 | 10–11px |
| Рукописний акцент | Caveat | 500 | 16.8px |

Стеки з фолбеками (з Firecrawl):
- heading: `"Cormorant Garamond", "Cormorant Garamond Fallback", "Spectral", "Spectral Fallback", Georgia, serif`
- body/paragraph: `Manrope, ui-sans-serif, system-ui, sans-serif`
- mono: `"JetBrains Mono", ui-monospace, monospace`

Шкала (частота): 16px → 11px → 14px → 12px → 16.8px → 10px → 18px → 24px → 36px → 92px.
Три «голоси»: засічковий заголовок · гротескне тіло · моно-службовий. Не змішувати.

### Простір і сітка
- Контейнер `max-width: 1152px` + клас `gutter`; базова одиниця ритму — 8/4px (Tailwind-шкала)
- Радіуси: `0` — основна мова (849 елементів); `12px` — лише поля форм; pill — іконкові кнопки
- Тіні: м'які чорнильні — `rgba(10,10,11,.18) 0 24px 64px -20px`
- Розділювачі: `border-y` + `border-line` (marquee), `border-b border-line/60` (хедер)

## Компоненти
- **Хедер:** sticky, `border-b border-line/60`, тло `paper/90` + backdrop-blur, компактна висота
- **Кнопка-заливка (primary):** тло `#0A0A0B`, текст `#FFFFFF`, radius 0, `padding 12px 28px`, 14px/600, без тіні
- **Кнопка-окреслення (secondary):** тло `#FCFCF9`, текст `#0A0A0B`, бордюр ~`#D0D0CE` / `rgba(10,10,11,.18)`, radius 0
- **Утилітарна пігулка:** 11px/400, `padding 8px 14px`, бордюр `line`, radius 0
- **Кнопка у формі:** тло `ink`, білий текст, radius 12px, 14px/600 — єдиний округлений елемент
- **Секції:** `id` + `scroll-mt-14`, клас `gutter`, H2 36px
- **Marquee:** `border-y border-line`, `py-4`
- **Hero:** `grain-hero` (зерно), портрет, ім'я 92px
- **Футер:** `border-t border-line/70`
- **Аватар-маскот у лейблах:** коло `bg-ink`, літери «ОП» 10px extrabold, білі

## Патерни сторінки
Головна: header → hero (#top) → marquee → about → method → work → reviews → certs → contact → footer.
Форум: header → «Форум» (H1) → «Задати питання» → «Питання й відповіді».
Кожна секція самодостатня, однакові відступи, власний `id` для якорів. Клампи в типографіці на мобільних.

## Стиль контенту
Перша особа, спокійний академічний тон, короткі абзаци. CTA — дієслово + напрямок
(«Дивитись проєкти ↓», «Написати листа»). Заголовки-іменники: «Про мене», «Як я навчаю», «Проєкти»,
«Відгуки», «Сертифікати», «Контакти». Службові лейбли — капсом/моно.

## Інструкції для агента-розробника
1. Тло `#FCFCF9`, текст `#0A0A0B`. Ніколи не використовувати чисто білий/чорний як основу.
2. Заголовки — Cormorant Garamond 600 (ім'я) і Spectral 400 (H2); тіло — Manrope; лейбли — JetBrains Mono.
3. Тримати radius 0 як мову форми; 12px — лише для полів форм.
4. Лінії — `rgba(10,10,11,0.08)`; акцент `#8C3A18` максимум 1–2 рази на екран.
5. Контейнер 1152px, відступи в ритмі Tailwind (4/8px).
6. Службовий текст 10–12px, uppercase/mono, колір `#6B7280`.
7. Зберігати зерно на hero — це візитівка сайту.

## Rerun Inputs
workflow: firecrawl-website-design-clone
source_url: https://oparashchuk.com (+/forum)
target_stack: Next.js + Tailwind
assets: `.firecrawl/oparashchuk-home-screenshot.png`, `home-branding.json`, `forum-full.json`
output: DESIGN.md
