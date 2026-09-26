import type { Metadata, Viewport } from "next";
import { Caveat, JetBrains_Mono, Manrope, Spectral } from "next/font/google";
import { site } from "@/content/site";
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
    default: `${site.name} — ${site.role}`,
    template: `%s — ${site.name}`,
  },
  description: site.statement,
  keywords: [...site.keywords],
  authors: [{ name: site.name }],
  creator: site.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "profile",
    locale: "uk_UA",
    url: site.url,
    siteName: site.name,
    title: `${site.name} — ${site.role}`,
    description: site.statement,
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: `${site.name} — ${site.role}, ${site.orgShort}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — ${site.role}`,
    description: site.statement,
    images: ["/og.jpg"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f2ed" },
    { media: "(prefers-color-scheme: dark)", color: "#121110" },
  ],
};

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: site.name,
  jobTitle: site.role,
  email: `mailto:${site.email}`,
  url: site.url,
  worksFor: { "@type": "Organization", name: site.org },
  address: { "@type": "PostalAddress", addressCountry: "UA", addressLocality: site.location },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
      </body>
    </html>
  );
}
