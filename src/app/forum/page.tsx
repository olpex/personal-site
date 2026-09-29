import type { Metadata } from "next";
import ForumClient from "./forum-client";

/**
 * Сторінка форуму: питання й відповіді за темами курсів.
 *
 * Серверна обгортка — лише метадані для пошуку й соцмереж; уся
 * інтерактивність (список, фільтр, форма) — у ForumClient.
 */

export const metadata: Metadata = {
  title: "Форум — питання й відповіді",
  description:
    "Питання й відповіді за темами курсів: штучний інтелект, кібербезпека й OSINT, WEB-дизайн, графічний дизайн, цифровий світ, обробка інформації, а також співпраця. Запитуйте — відповідь з'явиться тут же.",
  alternates: { canonical: "/forum" },
  openGraph: {
    title: "Форум — питання й відповіді",
    description:
      "Питання за темами курсів: ШІ, кібербезпека й OSINT, вебдизайн, графічний дизайн та інші. Відповідаю особисто — відповідь з'являється на цій сторінці.",
    type: "website",
  },
};

export default function ForumPage() {
  return <ForumClient />;
}