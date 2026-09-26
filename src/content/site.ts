/**
 * ЄДИНЕ МІСЦЕ ДЛЯ КОНТЕНТУ САЙТУ.
 * Джерела: резюме Олег Паращук (2026-08-18) + LinkedIn oleg-p-42225a111 + ЛЦПТО Реєстр (години).
 * Загальна інформація про заклад — навмисно не виноситься.
 */

export type Project = {
  index: string;
  title: string;
  kind: string;
  year: string;
  outcome: string;
  stack: string[];
  href?: string;
  cover?: string;
};

export type Social = {
  label: string;
  href: string;
};

export type Certificate = {
  title: string;
  issuer: string;
  year: string;
  note?: string;
  /** Пряме посилання для перевірки: credential або сторінка курсу */
  href?: string;
  /** Підпис посилання, що побачить відвідувач */
  hrefLabel?: string;
  credentialId?: string;
};

export const site = {
  name: "Паращук Олег Леонідович",
  shortName: "О. Паращук",
  role: "Викладач інформаційних технологій",
  org: "Львівський центр професійно-технічної освіти Державної служби зайнятості",
  orgShort: "ЛЦПТО ДСЗ",
  location: "Львів",
  statement:
    "Викладаю п'ять напрямів — від обробки інформації та «Цифрового світу» до ШІ, кібербезпеки/OSINT і вебдизайну — як інтенсивні модулі, де кожен слухач завершує з готовим проєктом і чіткими критеріями оцінювання.",
  email: "olppara@gmail.com",
  portrait: "/portrait.jpg",
  portraitAlt: "Паращук Олег Леонідович — портрет",

  about: [
    "Викладач інформаційних технологій — спеціаліст вищої категорії, ступінь магістра. Веду 7 профільних предметів для професій 4112 «Оператор комп'ютерного набору» та 4113 «Оператор з обробки інформації та ПЗ» — інформаційна безпека й англійська за професійним спрямуванням включно. Понад 30 років у викладанні, останні 7 — безперервно в ЛЦПТО ДСЗ.",
    "Мій фокус — те, що актуально зараз: кібербезпека й OSINT, застосування ШІ в роботі та навчанні, вебдизайн. Будую курси як короткі модулі з практикою на реальних кейсах слухачів і щоденним зворотним зв'язком, пояснюю складне простою мовою — без води й жаргону. Під це системно навчаюсь сам: Google Cybersecurity, Cisco, Palo Alto Cybersecurity Foundation, Prometheus OSINT, EPAM AI-tools for Education, Google Академія ШІ, Moodle 4.0 — адміністрування й функціонал.",
  ],
  facts: [
    { k: "Категорія", v: "Спеціаліст вищої категорії · магістр" },
    { k: "Фокус", v: "ШІ · кібербезпека й OSINT · вебдизайн" },
    { k: "Програм", v: "5 напрямів · 72–144 год" },
    { k: "Сертифікація", v: "20 · Google · Cisco · Prometheus" },
  ],

  projects: [
    {
      index: "01",
      title: "Технології комп'ютерної обробки інформації",
      kind: "Курс · 72 год",
      year: "2026",
      outcome:
        "Обробка даних, офісні застосунки, хмарні сховища та візуалізація. Слухачі завершують підсумковим проєктом на власних даних — з моїми конспектами, тестами й щоденним фідбеком.",
      stack: ["Обробка даних", "Хмарні сховища"],
    },
    {
      index: "02",
      title: "Цифровий світ для початківців",
      kind: "Курс",
      year: "2026",
      outcome:
        "Базова цифрова грамотність з нуля: файли, хмара, комунікація та безпечна робота з сервісами. Вся практика — на щоденних сценаріях самих слухачів.",
      stack: ["Цифрова грамотність", "Хмара"],
    },
    {
      index: "03",
      title: "Штучний інтелект: розвиток кар'єри",
      kind: "Курс",
      year: "2026",
      outcome:
        "Як ставити задачі ШІ, автоматизувати рутину, перевіряти факти й працювати етично. Фокус — на кар'єрних сценаріях слухачів; спираюсь на EPAM AI-tools та Google Академію ШІ.",
      stack: ["ШІ", "Кар'єра"],
    },
    {
      index: "04",
      title: "Основи цифрової безпеки і OSINT",
      kind: "Курс · 72 год",
      year: "2026",
      outcome:
        "Гігієна безпеки, перевірка джерел, робота з відкритими даними та практика OSINT на кейсах із верифікацією. Базується на моїх сертифікаціях Google Cybersecurity, Cisco, Prometheus OSINT.",
      stack: ["OSINT", "Верифікація"],
    },
    {
      index: "05",
      title: "Основи WEB-дизайну",
      kind: "Курс · 144 год",
      year: "2026",
      outcome:
        "Найбільший за обсягом курс напряму: сітки, типографіка, прототипи та публікація сайту. Фінал — захист власного сайту слухача. Інструменти: HTML/CSS, WordPress, Adobe Photoshop/Illustrator/InDesign.",
      stack: ["Сітки", "144 год"],
    },
    {
      index: "06",
      title: "Презентації та нотатки до курсів",
      kind: "Матеріали · у відкритому доступі",
      year: "2026",
      outcome:
        "Дев'ять готових презентацій для аудиторних занять курсу «Цифровий світ для початківців» — з нотатками викладача до кожного слайда (від основ кібербезпеки до державних онлайн-сервісів). Модулі курсу «Штучний інтелект» готуються. Веду заняття онлайн (Google Classroom / Meet), адмініструю Moodle 4.0.",
      stack: ["Презентації", "Нотатки"],
      href: "https://cources.lovable.app/",
    },
  ] as Project[],

  educationLabel: "Освіта: Даугавпілський університет — бакалавр інформатики та математики (1989–1994), бакалавр економіки (1995–2000)",

  socials: [
    { label: "Презентації курсів — Цифровий світ і ШІ", href: "https://cources.lovable.app/" },
    { label: "LinkedIn", href: "https://linkedin.com/in/oleg-p-42225a111/" },
    { label: "YouTube — @youritperson", href: "https://youtube.com/@youritperson" },
    { label: "Telegram — @User132309", href: "https://t.me/User132309" },
  ] as Social[],

  /* ── Сертифікати ──────────────────────────────────────────────
   * Звірено з резюме (14) + LinkedIn (10). Резюме містило узагальнене
   * "Google AI" — на LinkedIn це 6 окремих сертифікатів Google (лютий 2026)
   * з верифікованими ID. Додано відсутній на сайті GIZ/Articulate (LinkedIn).
   * Для кожного — href: або прямий credential (Coursera/Credly), або
   * офіційна сторінка курсу (Prometheus, EdEra, Google, Palo Alto, EPAM).
   * Сортування: newest-first.
   */
  certificates: [
    // 2026 — Google (Coursera) — верифіковані на Oleg Parashchuk
    {
      title: "AI Fundamentals",
      issuer: "Google · Coursera",
      year: "2026",
      credentialId: "JGBEAPJC7LL5",
      href: "https://www.coursera.org/account/accomplishments/records/JGBEAPJC7LL5",
      hrefLabel: "Перевірити сертифікат на Coursera",
    },
    {
      title: "Design Prompts for Everyday Work Tasks",
      issuer: "Google · Coursera",
      year: "2026",
      credentialId: "UW8TH8BBE3XG",
      href: "https://www.coursera.org/account/accomplishments/records/UW8TH8BBE3XG",
      hrefLabel: "Перевірити сертифікат на Coursera",
    },
    {
      title: "AI for Writing and Communicating",
      issuer: "Google · Coursera",
      year: "2026",
      credentialId: "CRSZ2RZ5WF42",
      href: "https://www.coursera.org/account/accomplishments/records/CRSZ2RZ5WF42",
      hrefLabel: "Перевірити сертифікат на Coursera",
    },
    {
      title: "AI for Data Analysis",
      issuer: "Google · Coursera",
      year: "2026",
      credentialId: "XV4KAQSSP9NM",
      href: "https://www.coursera.org/account/accomplishments/records/XV4KAQSSP9NM",
      hrefLabel: "Перевірити сертифікат на Coursera",
    },
    {
      title: "AI for Content Creation",
      issuer: "Google · Coursera",
      year: "2026",
      credentialId: "MFFQBYPAOPT9",
      href: "https://www.coursera.org/account/accomplishments/records/MFFQBYPAOPT9",
      hrefLabel: "Перевірити сертифікат на Coursera",
    },
    {
      title: "AI for Research and Insights",
      issuer: "Google · Coursera",
      year: "2026",
      credentialId: "UMGRIEWG1CZM",
      href: "https://www.coursera.org/account/accomplishments/records/UMGRIEWG1CZM",
      hrefLabel: "Перевірити сертифікат на Coursera",
    },
    {
      title: "AI for Brainstorming and Planning",
      issuer: "Google · Coursera",
      year: "2026",
      credentialId: "K9MXJ6FHOV05",
      href: "https://www.coursera.org/account/accomplishments/records/K9MXJ6FHOV05",
      hrefLabel: "Перевірити сертифікат на Coursera",
    },
    // 2025
    {
      title: "Академія ШІ для освітян",
      issuer: "Google",
      year: "2025",
      href: "https://rsvp.withgoogle.com/events/ai-academy-for-educators-cohort3",
      hrefLabel: "Сторінка програми «Академія ШІ для освітян»",
    },
    {
      title: "AI-tools for Education",
      issuer: "EPAM · IT Ukraine",
      year: "2025",
      href: "https://itukraine.org.ua/en/teachers-internship-online-program-2025/",
      hrefLabel: "Програма Teachers Internship — AI Tools for Education",
    },
    {
      title: "OSINT — розвідка з відкритих джерел та інфобезпека",
      issuer: "Prometheus",
      year: "2025",
      href: "https://prometheus.org.ua/prometheus-free/osint-open-source-intelligence/",
      hrefLabel: "Сторінка курсу на Prometheus",
    },
    {
      title: "Фактчек: довіряй-перевіряй",
      issuer: "EdEra / VoxUkraine",
      year: "2025",
      href: "https://study.ed-era.com/courses/course/5129",
      hrefLabel: "Сторінка курсу на EdEra",
    },
    // 2024
    {
      title: "Google Cybersecurity — спеціалізація (8 курсів)",
      issuer: "Google · Coursera",
      year: "2024",
      note: "6 міс., сертифікат",
      credentialId: "UWNNNRLVUU74",
      href: "https://www.coursera.org/account/accomplishments/specialization/UWNNNRLVUU74",
      hrefLabel: "Перевірити спеціалізацію на Coursera",
    },
    {
      title: "Кібербезпека для освітян — просунутий рівень для тренерів",
      issuer: "Skills4Recovery · Mondo / GIZ",
      year: "2024",
      href: "https://skills4recovery.org/uk/",
      hrefLabel: "Проєкт Skills4Recovery (GIZ)",
    },
    {
      title: "Кібербезпека для освітян",
      issuer: "Skills4Recovery · Mondo / GIZ",
      year: "2024",
      note: "1 міс.",
      href: "https://skills4recovery.org/uk/",
      hrefLabel: "Проєкт Skills4Recovery (GIZ)",
    },
    {
      title: "Introduction to Cybersecurity",
      issuer: "Cisco Networking Academy",
      year: "2024",
      href: "https://www.credly.com/badges/f674c228-0348-431b-b6c8-e6dcfc07f792/linked_in_profile",
      hrefLabel: "Перевірити бейдж на Credly",
    },
    {
      title: "Cybersecurity Foundation",
      issuer: "Palo Alto Networks",
      year: "2024",
      href: "https://www.paloaltonetworks.com/services/education/academy/educator",
      hrefLabel: "Програма Palo Alto Cybersecurity Academy",
    },
    {
      title: "Основи кібербезпеки для бізнесу",
      issuer: "GOOGLE / ISSP",
      year: "2024",
      href: "https://rsvp.withgoogle.com/events/cybersecurity-sme-ua",
      hrefLabel: "Програма Google «Безпечніше з Google»",
    },
    {
      title: "Створюємо електронний навчальний контент в Articulate",
      issuer: "GIZ (Німеччина) & Техноматика",
      year: "2024",
      href: "https://tmx-learning.com/ua/services/interactive-learning",
      hrefLabel: "Техноматика — інтерактивні курси e-learning",
    },
    // 2023
    {
      title: "Адміністрування Moodle 4.0",
      issuer: "Skills4Recovery · Mondo / GIZ",
      year: "2023",
      href: "https://skills4recovery.org/uk/",
      hrefLabel: "Проєкт Skills4Recovery (GIZ)",
    },
    {
      title: "Опанування функціоналу Moodle 4.0",
      issuer: "Skills4Recovery · Mondo / GIZ",
      year: "2023",
      href: "https://skills4recovery.org/uk/",
      hrefLabel: "Проєкт Skills4Recovery (GIZ)",
    },
  ] as Certificate[],

  keywords: [
    "Обробка інформації",
    "Цифровий світ",
    "Штучний інтелект",
    "Цифрова безпека",
    "OSINT",
    "WEB-дизайн",
    "Moodle",
    "Google Classroom",
  ],

  /* Канонічний URL сайту — для metadataBase, OG, sitemap, robots.
   * Порядок: явний NEXT_PUBLIC_SITE_URL → автодомен Vercel (prod → preview) →
   * localhost для розробки. Не хардкодити домен: він зміниться після
   * підключення власного. */
  url:
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3111"),
} as const;
