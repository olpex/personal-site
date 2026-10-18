/**
 * АНГЛІЙСЬКІ ТЕКСТИ — дзеркало src/content/site.ts для перемикача мови.
 *
 * Правила (важливо знати перед редагуванням):
 *  • uk у src/content/site.ts — джерело правди; en заміщує лише те,
 *    що перекладено, решта береться з uk-джерела (deepMerge).
 *  • Відгуки: цитати, імена й назви курсів НЕ перекладаються — цитата
 *    належить авторові, а не редакторові (та сама політика, що й в uk).
 *    Перекладаються лише підписи: група напряму, дата, примітка.
 *  • Сертифікати: title/issuer — офіційні назви видавця, не перекладаються;
 *    перекладаються група, note і hrefLabel.
 *  • Теми форуму зберігаються у public/forum.json УКРАЇНСЬКОЮ: значення
 *    валідує API і читає місток у Telegram. forumTopicLabels — тільки
 *    для показу на сторінці.
 */

import type { Project, Social } from "./site";
import type { Lang } from "@/lib/lang";

export const siteEn = {
  name: "Oleh Parashchuk",
  shortName: "O. Parashchuk",
  role: "Information Technology Teacher",
  org: "Lviv Centre of Professional and Technical Education of the State Employment Service",
  orgShort: "LCPTO SES",
  location: "Lviv",
  statement:
    "I teach seven subject areas — from information processing and the Digital World to AI, cybersecurity/OSINT, web design and graphic design — as intensive modules where every learner finishes with a completed project and clear assessment criteria. I also teach profile subjects within specialty 4113 “Information and Software Processing Operator”.",
  portraitAlt: "Oleh Parashchuk — portrait of a teacher, Lviv",

  about: [
    "Information technology teacher — highest-category specialist with a master's degree. I teach 7 profile courses and 8 subjects within profession 4113 “Information and Software Processing Operator”. Over 30 years of teaching, the last 7 continuously at LCPTO SES.",
    "My focus is what matters right now: cybersecurity and OSINT, applying AI at work and in education, web design. I build courses as short modules with practice on real cases from my learners and daily feedback, explaining complex things in plain language — no fluff, no jargon. I keep learning myself: Google Cybersecurity, Cisco, Palo Alto Cybersecurity Foundation, Prometheus OSINT, EPAM AI Tools for Education, Google AI Academy, Moodle 4.0 — administration and features.",
  ],

  method: [
    {
      title: "Short modules, not a monolith",
      body: "The course is split into topics, each closed with practice. Learners leave every class with a done step, not with lecture notes.",
    },
    {
      title: "Live demonstrations",
      body: "I show the tool in action and immediately have learners repeat it themselves — instead of telling how it works.",
    },
    {
      title: "Learners' real tasks",
      body: "We work through cases from their own jobs: whatever hurts becomes the class example.",
    },
    {
      title: "Plain language and daily contact",
      body: "Questions can be asked right away — I stay available between classes, not only in the classroom.",
    },
  ] as { title: string; body: string }[],

  facts: [
    { k: "Category", v: "Highest-category specialist · master's degree" },
    { k: "Projects", v: "7 learning projects" },
    { k: "Certificates", v: "20 certificates, including international ones" },
    { k: "Reviews", v: "50+ positive · 2025–2026" },
  ] as { k: string; v: string }[],

  educationLabel:
    "Education: Daugavpils University (Republic of Latvia) — master in informatics and mathematics, Faculty of Physics and Mathematics (1989–1994); master in economics, Faculty of Economics (1995–2000)",

  reviewStats: [
    { k: "2025–2026", v: "56 positive reviews" },
    {
      k: "5 areas",
      v: "AI · cybersecurity & OSINT · information processing · digital world · graphic design",
    },
  ] as { k: string; v: string }[],

  projects: [
    {
      index: "01",
      title: "Computer Information Processing Technologies",
      kind: "Course · 72 h",
      year: "2026",
      outcome:
        "Data processing, office applications, cloud storage and visualisation. Learners finish with a final project on their own data — with my study guides, quizzes and daily feedback.",
      stack: ["Data processing", "Cloud storage"],
    },
    {
      index: "02",
      title: "Digital World for Beginners",
      kind: "Course",
      year: "2026",
      outcome:
        "Basic digital literacy from scratch: files, the cloud, communication and safe use of online services. All practice is built on the learners' everyday scenarios.",
      stack: ["Digital literacy", "Cloud"],
    },
    {
      index: "03",
      title: "Artificial Intelligence: Career Development",
      kind: "Course",
      year: "2026",
      outcome:
        "How to set tasks for AI, automate routine, verify facts and work ethically. The focus is on learners' career scenarios; built on EPAM AI-tools and the Google AI Academy.",
      stack: ["AI", "Career"],
    },
    {
      index: "04",
      title: "Digital Security and OSINT Basics",
      kind: "Course · 72 h",
      year: "2026",
      outcome:
        "Security hygiene, source verification, working with open data and hands-on OSINT practice with fact-checking. Based on my Google Cybersecurity, Cisco and Prometheus OSINT certifications.",
      stack: ["OSINT", "Verification"],
    },
    {
      index: "05",
      title: "WEB Design Basics",
      kind: "Course · 144 h",
      year: "2026",
      outcome:
        "The largest course in the area: grids, typography, prototypes and publishing a website. The final stage is the defence of each learner's own website. Tools: HTML/CSS, WordPress, Adobe Photoshop/Illustrator/InDesign.",
      stack: ["Grids", "Typography"],
    },
    {
      index: "06",
      title: "Graphic Design",
      kind: "Course · 72 h",
      year: "2026",
      outcome:
        "Composition, colour and typography, work in graphics editors and Figma. Learners create layouts for social media and print — from a logo to a presentation — and finish with their own portfolio.",
      stack: ["Figma", "Photoshop"],
    },
    {
      index: "07",
      title: "Author's Learning Platform",
      kind: "Materials · open access",
      year: "2026",
      outcome:
        "Nine ready-made presentations for in-class sessions of the “Digital World for Beginners” course — with teacher's notes for every slide (from cybersecurity basics to government online services). Modules of the “Artificial Intelligence” course are in progress. I teach online (Google Classroom, Meet, Zoom) and administer Moodle 4.0.",
      stack: ["Presentations", "Study guides", "Quizzes"],
      href: "https://cources.lovable.app/",
    },
  ] as Project[],

  socials: [
    { label: "Author's learning platform", href: "https://cources.lovable.app/" },
    { label: "LinkedIn", href: "https://linkedin.com/in/oleg-p-42225a111/" },
    { label: "YouTube — @youritperson", href: "https://youtube.com/@youritperson" },
    { label: "Telegram — @User132309", href: "https://t.me/User132309" },
  ] as Social[],

  keywords: [
    "Information processing",
    "Digital world",
    "Artificial intelligence",
    "Digital security",
    "OSINT",
    "Web design",
    "Moodle",
    "Google Classroom",
  ] as string[],
};

/* ── Підписи, що перекладаються «поверх» uk-даних ──────────────────── */

/** Напрями відгуків: uk-значення в даних → en для показу. */
export const reviewGroupLabels: Record<string, { en: string; short: string }> = {
  "ШІ та штучний інтелект": { en: "AI & artificial intelligence", short: "AI" },
  "Кібербезпека й цифрова безпека": { en: "Cyber & digital security", short: "Cybersecurity" },
  "Графічний дизайн": { en: "Graphic design", short: "Graphic design" },
  "Цифровий світ": { en: "Digital world", short: "Digital world" },
  "Технології комп'ютерної обробки інформації": {
    en: "Information processing technologies",
    short: "Information processing",
  },
};

/** Групи сертифікатів: uk-значення в даних → en для показу. */
export const certGroupLabels: Record<string, string> = {
  "Штучний інтелект": "Artificial intelligence",
  "Кібербезпека й OSINT": "Cybersecurity & OSINT",
  "Хмарні платформи й контент": "Cloud platforms & content",
};

/** Місяці у датах відгуків («жовтень 2025» → «October 2025»). */
export const monthsEn: Record<string, string> = {
  січень: "January",
  лютий: "February",
  березень: "March",
  квітень: "April",
  травень: "May",
  червень: "June",
  липень: "July",
  серпень: "August",
  вересень: "September",
  жовтень: "October",
  листопад: "November",
  грудень: "December",
};

/** Примітки карток сертифікатів. */
export const certNoteLabels: Record<string, string> = {
  "6 міс., сертифікат": "6 months, certificate",
  "1 міс.": "1 month",
};

/** Підписи посилань карток сертифікатів. */
export const certHrefLabels: Record<string, string> = {
  "Перевірити сертифікат на Coursera": "Verify the certificate on Coursera",
  "Перевірити спеціалізацію на Coursera": "Verify the specialization on Coursera",
  "Переглянути сертифікат (Google Drive)": "View the certificate (Google Drive)",
  "Техноматика — інтерактивні курси e-learning":
    "Technomatika — interactive e-learning courses",
};

/** Теми форуму: показ, не значення. Значення в даних лишаються uk. */
export const forumTopicLabels: Record<string, string> = {
  "Штучний інтелект": "Artificial intelligence",
  "Кібербезпека й OSINT": "Cybersecurity & OSINT",
  "WEB-дизайн": "Web design",
  "Графічний дизайн": "Graphic design",
  "Цифровий світ": "Digital world",
  "Обробка інформації": "Information processing",
  Співпраця: "Collaboration",
  Особисте: "Personal",
  Інше: "Other",
};

/* ── Хелпери локалізації підписів ──────────────────────────────────── */

export function reviewGroupLong(group: string, lang: Lang): string {
  if (lang !== "en") return group;
  return reviewGroupLabels[group]?.en ?? group;
}

export function reviewGroupShort(group: string, lang: Lang): string {
  if (lang !== "en") return group;
  return reviewGroupLabels[group]?.short ?? group;
}

/** «жовтень 2025» → «October 2025»; незнайомий формат лишається як є. */
export function formatReviewDate(ukDate: string, lang: Lang): string {
  if (lang !== "en") return ukDate;
  const [month, ...rest] = ukDate.trim().split(" ");
  const en = monthsEn[month];
  return en ? [en, ...rest].join(" ") : ukDate;
}

export function certGroupLabel(group: string, lang: Lang): string {
  if (lang !== "en") return group;
  return certGroupLabels[group] ?? group;
}

export function certNoteLabel(note: string, lang: Lang): string {
  if (lang !== "en") return note;
  const exact = certNoteLabels[note];
  if (exact) return exact;
  return note
    .replace(/(\d+)\s*міс\./g, (_m, n: string) => `${n} month${Number(n) === 1 ? "" : "s"}`)
    .replace(/сертифікат/g, "certificate");
}

export function certHrefLabel(label: string | undefined, lang: Lang): string | undefined {
  if (!label || lang !== "en") return label;
  return certHrefLabels[label] ?? label;
}

export function forumTopicLabel(topic: string, lang: Lang): string {
  if (lang !== "en") return topic;
  return forumTopicLabels[topic] ?? topic;
}
