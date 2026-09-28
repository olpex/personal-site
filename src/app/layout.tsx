import type { Metadata, Viewport } from "next";
import { Caveat, JetBrains_Mono, Manrope, Spectral } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { site } from "@/content/site";
import ChatWidget from "@/components/chat-widget";
import GoogleAnalytics from "@/components/google-analytics";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const spectral = Spectral({
  variable: "--font-spectral",
  subsets: ["latin", "cyrillic"],
  weight: ["400"],
  style: ["italic"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

/* Рукописний шрифт — лише для імен авторів відгуків. Читати цілу
 * цитату рукописом важко, а підпис-від-руки дає відчуття справжнього
 * відгуку, не заважаючи читанню. */
const caveat = Caveat({
  variable: "--font-hand",
  subsets: ["latin", "cyrillic"],
  weight: ["600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.seoTitle,
    template: `%s — ${site.shortName}`,
  },
  description: site.seoDescription,
  keywords: [...site.keywords, "Львів", "ЛЦПТО ДСЗ", "курси Львів", "викладач ШІ Львів"],
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "profile",
    locale: "uk_UA",
    url: site.url,
    siteName: site.name,
    title: site.seoTitle,
    description: site.seoDescription,
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: `${site.name} — ${site.role}, ${site.orgShort}, Львів`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: site.seoTitle,
    description: site.seoDescription,
    images: ["/og.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  verification: undefined,
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcfcf9" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
  ],
};

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: site.name,
  alternateName: site.shortName,
  jobTitle: site.role,
  email: `mailto:${site.email}`,
  url: site.url,
  image: `${site.url}/portrait.webp`,
  worksFor: { "@type": "Organization", name: site.org, alternateName: site.orgShort },
  address: { "@type": "PostalAddress", addressCountry: "UA", addressLocality: site.location },
  knowsAbout: ["Штучний інтелект", "OSINT", "Цифрова безпека", "Кібербезпека", "WEB-дизайн", "Обробка інформації", "Moodle", "Google Classroom"],
  knowsLanguage: ["uk", "en"],
  alumniOf: { "@type": "CollegeOrUniversity", name: "Даугавпілський університет", location: "Латвія" },
  sameAs: site.socials.filter((s) => /^https:\/\//.test(s.href)).map((s) => s.href),
  aggregateRating: { "@type": "AggregateRating", ratingValue: "5", reviewCount: "55", bestRating: "5", worstRating: "1" },
} as const;

const orgSchema = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: site.org,
  alternateName: site.orgShort,
  url: "https://www.dcz.gov.ua/storinka/lvivskyy-centr-profesiyno-tehnichnoyi-osvity-derzhavnoyi-sluzhby-zaynyatosti",
  address: { "@type": "PostalAddress", addressCountry: "UA", addressLocality: site.location },
} as const;

function courseSchema() {
  const list = site.projects
    .filter((p) => !p.href || !p.href.includes("cources.lovable"))
    .map((p, i) => ({
      "@type": "Course" as const,
      "@id": `${site.url}#course-${p.index}`,
      name: p.title,
      courseCode: p.index,
      description: p.outcome,
      provider: { "@id": `${site.url}#org` },
      educationalLevel: "Професійно-технічна освіта",
      timeRequired: p.kind.includes("144") ? "PT144H" : p.kind.includes("72") ? "PT72H" : undefined,
      teaches: p.stack,
      position: i + 1,
    }));
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Курси",
    itemListElement: list.map((c, i) => ({ "@type": "ListItem", position: i + 1, item: c })),
  };
}

function breadcrumbSchema() {
  const items = [
    { name: "Головна", url: site.url },
    { name: "Про мене", url: `${site.url}#about` },
    { name: "Як навчаю", url: `${site.url}#method` },
    { name: "Проєкти", url: `${site.url}#work` },
    { name: "Відгуки", url: `${site.url}#reviews` },
    { name: "Сертифікати", url: `${site.url}#certs` },
    { name: "Контакти", url: `${site.url}#contact` },
  ];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

function reviewsSchema() {
  const top = site.reviews.slice(0, 8);
  return top.map((r) => ({
    "@context": "https://schema.org",
    "@type": "Review",
    author: { "@type": "Person", name: r.author },
    datePublished: r.date,
    reviewBody: r.quote,
    itemReviewed: { "@type": "Person", name: site.name, url: site.url },
    reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5", worstRating: "1" },
  }));
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  const course = courseSchema();
  const breadcrumb = breadcrumbSchema();
  const reviews = reviewsSchema();
  return (
    <html
      lang="uk"
      className={`${manrope.variable} ${spectral.variable} ${jetbrains.variable} ${caveat.variable} antialiased`}
    >
      <body className="grain bg-paper text-ink">
        <a
          href="#main"
          className="label sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
        >
          Перейти до вмісту
        </a>
        {children}
        {/* Кнопка чату показується лише коли бот налаштований: інакше
            відвідувач натрапив би на кнопку, що видає помилку. */}
        <ChatWidget enabled={Boolean(process.env.TELEGRAM_SITE_BOT_TOKEN)} />
        <Analytics />
        <GoogleAnalytics />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@id": `${site.url}#org`, ...orgSchema }) }}
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(course) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
        {reviews.map((r, i) => (
          <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(r) }} />
        ))}
      </body>
    </html>
  );
}
