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

export type Review = {
  /** Ім'я так, як у формі закладу */
  author: string;
  /** Місяць і рік, коли надіслано */
  date: string;
  /** Курс, який назвав автор відгуку */
  course: string;
  /** Текст відгуку — без правок і скорочень */
  quote: string;
  /** Чи показувати у блоці на сайті */
  featured?: boolean;
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
    { k: "Результат", v: "71% слухачів — високий рівень знань" },
    { k: "Відгуки", v: "12 з іменами · 2025–2026" },
  ],

  /* ── Відгуки ──────────────────────────────────────────────────
   * Джерело: Google-форма опитування слухачів ЛЦПТО ДСЗ (публічна
   * таблиця відповідей). Взято лише ті, де викладача названо поіменно —
   * це унеможливлює плутанину з іншими викладачами закладу.
   * Тексти не редаговано. featured — ті, що найточніше показують
   * результат навчання; решта лишаються в даних.
   */
  reviews: [
    /* Цитати наведено ДОСЛІВНО, як у формі. Скорочення позначено «…».
     * Правлено лише подвійні пробіли й пропущений пробіл після «!!!» —
     * жодного слова не змінено. Усі автори прямо називають мене. */
    {
      author: "Алла Міненко",
      date: "лютий 2026",
      course: "ШІ: розвиток карʼєри та профзростання",
      quote:
        "Матеріал поданий структуровано, доступно, зрозумілою мовою з практичними прикладами. … Після навчання з’являється чітке розуміння можливостей штучного інтелекту та його використанні на практиці, а також підвищується самооцінка. Рекомендую тим, хто хоче системно освоїти сучасні AI-технології.",
      featured: true,
    },
    {
      author: "Тихонова Маргарита",
      date: "липень 2025",
      course: "ШІ: розвиток карʼєри та професійне зростання",
      quote:
        "Окрема подяка за професійне та натхненне викладання – викладач Олег Паращук подавав матеріал структуровано, цікаво, з великою кількістю інструментів, прикладів та практичних кейсів.",
      featured: true,
    },
    {
      author: "Лукашук Наталія",
      date: "липень 2025",
      course: "ШІ",
      quote:
        "Дякуючи надзвичайно толерантному, викладачу Олегу Леонідовичу Паращуку, глибоко зануреному в тему ШІ, поглибила свої знання і взнала багато нового та корисного та навчилась на прикладах застосовувати отримані знання.",
      featured: true,
    },
    {
      author: "Микитів Андріана",
      date: "березень 2026",
      course: "Технології компʼютерної обробки інформації",
      quote:
        "Задоволена, викладач Олег Паращук професіонал своєї справи. Буду звертатись ще і рекомендувати іншим. … Якість курсів на найкращому рівні. Витримка до учнів теж.",
      featured: true,
    },
    {
      author: "Семенюк Ольга",
      date: "квітень 2026",
      course: "ШІ: розвиток карʼєри та профзростання",
      quote:
        "Було надихаюче та змістовно. Особливо сподобалося, що інформація була не лише теоретичною, а й підкріплена практичними прикладами. … Було достатньо часу для запитань і обговорення. Плюс було достатньо практичних завдань і кейсів, також презентації і корисних посилань.",
      featured: true,
    },
    {
      author: "Оксана Зорихина",
      date: "липень 2026",
      course: "ШІ: розвиток карʼєри та професійне зростання",
      quote:
        "Курс дуже сподобався, дізналась про нові нейронки для використання в роботі і щоденній рутині, викладач Олег Паращук уважний до учнів і не ігнорує запитання, яки по-за темою заняття, відповідає на всі запитання.",
      featured: true,
    },
    {
      author: "Котурга Катерина",
      date: "червень 2025",
      course: "ШІ: розвиток карʼєри та проф. зростання",
      quote:
        "Прекрасний викладач Олег Паращук! Дуже цікаво і доступно викладав матеріал!!! Щиро дякую!!!",
    },
    {
      author: "Тімошевська Ірина",
      date: "лютий 2026",
      course: "ШІ: розвиток карʼєри",
      quote:
        "Відмінно. Пан Олег пояснював дуже добре. Для мене це перше таке грунтовне ознайомлення з ШІ для користувачів. Багато цікавих і корисних посилань на застосунки було надано.",
    },
    {
      author: "Гайдук Ірина",
      date: "лютий 2026",
      course: "ШІ: розвиток карʼєри та профзростання",
      quote:
        "Лектор дуже цікаво та доступно подає матеріал. Курс містить багато актуальної та корисної інформації, яку легко сприймати.",
    },
    {
      author: "Марін Олена Іванівна",
      date: "березень 2026",
      course: "ШІ",
      quote:
        "Сподобалось все: і матеріал, і його великий об’єм, дуже багато цікавої корисної інформації, навіть не очікувала, що так багато є про це, і викладач – Олег Леонідович: спокійна, приємна людина, дуже доступно гарно викладає матеріал.",
    },
    {
      author: "Дмитрієва Тетяна",
      date: "червень 2026",
      course: "ШІ: розвиток карʼєри та профзростання",
      quote:
        "Дуже корисний курс, багато цінної інформації, актуально на теперешній час та майбутне. Відмінно! Щиро дякую викладачу цього курсу - пану Олегу Паращуку.",
    },
    {
      author: "Гусак Юлія",
      date: "серпень 2026",
      course: "ШІ: розвиток карʼєри та профзростання",
      quote:
        "Дуже корисний, змістовний, актуальний та інформативний курс. Вдячна пану Олегу за чудову подачу і навчання на курсі.",
    },
  ] as Review[],

  /* Підсумкові цифри для блоку відгуків. Джерела: Google-форма
   * опитування слухачів + «Моніторинг якості професійного навчання»
   * на сайті ЛЦПТО ДСЗ (професія 4113, блоки 2023 і 2024 років). */
  reviewStats: [
    { k: "2025–2026", v: "12 відгуків, де названо мене" },
    { k: "71%", v: "високий рівень знань — моніторинг ЛЦПТО ДСЗ" },
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
      kind: "Матеріали · відкритий доступ",
      year: "2026",
      outcome:
        "Дев'ять готових презентацій для аудиторних занять курсу «Цифровий світ для початківців» — з нотатками викладача до кожного слайда (від основ кібербезпеки до державних онлайн-сервісів). Модулі курсу «Штучний інтелект» готуються. Веду заняття онлайн (Google Classroom, Meet, Zoom), адмініструю Moodle 4.0.",
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
