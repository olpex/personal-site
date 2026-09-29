"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Footer } from "@/components/chrome";
import ContactModal from "@/components/contact-modal";
import Reveal from "@/components/reveal";
import {
  FORUM_TOPICS,
  formatForumDate,
  formatForumDateTime,
  slugify,
  type ForumEntry,
} from "@/lib/forum";

/**
 * Форум: питання й відповіді за темами курсів.
 *
 * Потік: питання → /api/forum → Telegram власника → власник тисне
 * «Відповісти» → місток дописує відповідь у public/forum.json →
 * запис з'являється тут. Питання БЕЗ відповіді на сторінці не видно:
 * спершу його бачить лише автор (у блоці «Чекають відповіді») і власник.
 *
 * Чому коди в localStorage: браузер запам'ятовує id власних питань, і
 * коли власник відповідає — людина бачить статус, навіть якщо прийшла
 * з іншого пристрою (історія живе в репозиторії, а не в браузері).
 */

const CODES_KEY = "oparashchuk:forum-codes";
const NAME_KEY = "oparashchuk:forum-name";

/** Як часто перепитувати оновлення, поки вкладка активна. */
const POLL_MS = 45000;

type Mine = ForumEntry & { pending?: boolean };

function read(key: string): string {
  try {
    return localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function write(key: string, value: string) {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
    /* приватний режим — просто не зберігаємо */
  }
}

function readCodes(): string[] {
  const raw = read(CODES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string" && /^[a-z0-9]{8}$/.test(x));
  } catch {
    return [];
  }
}

function saveCodes(codes: string[]) {
  write(CODES_KEY, JSON.stringify(codes.slice(-30)));
}

export default function ForumClient() {
  const [entries, setEntries] = useState<ForumEntry[]>([]);
  const [mine, setMine] = useState<Mine[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [topicFilter, setTopicFilter] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [topic, setTopic] = useState<string>("");
  const [question, setQuestion] = useState("");
  const [formState, setFormState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [formError, setFormError] = useState("");

  const codesRef = useRef<string[]>([]);

  const load = useCallback(async (withCodes: string[] | null = null) => {
    const codes = withCodes ?? codesRef.current;
    const qs = codes.length ? `?mine=${encodeURIComponent(codes.join(","))}` : "";
    try {
      const res = await fetch(`/api/forum${qs}`, { cache: "no-store" });
      const json = (await res.json()) as {
        ok?: boolean;
        entries?: ForumEntry[];
        mine?: Mine[];
        error?: string;
      };
      if (!res.ok || !json.ok) {
        setLoadError(json.error ?? "Не вдалося завантажити форум.");
        return;
      }
      setEntries(json.entries ?? []);
      // Оптимістичні записи не губимо: якщо щойно надіслане питання ще не
      // долетіло до файла (реєстрація — допоміжний крок і може відмовити),
      // воно мусить лишатися у «Чекають відповіді» до наступного опитування.
      setMine((prev) => {
        const fromServer = json.mine ?? [];
        const known = new Set(fromServer.map((m) => m.id));
        const pending = prev.filter((m) => m.pending && !known.has(m.id));
        return [...fromServer, ...pending];
      });
      setLoadError("");
    } catch {
      setLoadError("Немає зв'язку. Спробуйте оновити сторінку.");
    } finally {
      setLoading(false);
    }
  }, [codesRef]);

  useEffect(() => {
    codesRef.current = readCodes();
    const savedName = read(NAME_KEY);
    if (savedName) setName(savedName);
    void load(codesRef.current);

    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      void load();
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [load, codesRef]);

  const topicCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of entries) {
      counts.set(e.topic, (counts.get(e.topic) ?? 0) + 1);
    }
    return counts;
  }, [entries]);

  const usedTopics = useMemo(
    () => FORUM_TOPICS.filter((t) => topicCounts.has(t)),
    [topicCounts],
  );

  const visible = useMemo(
    () =>
      topicFilter
        ? entries.filter((e) => slugify(e.topic) === topicFilter)
        : entries,
    [entries, topicFilter],
  );

  /* «Чекають відповіді» — власні питання, яких ще немає в публічному
     списку: або сервер ще не має запису, або відповіді ще немає. */
  const pendingMine = useMemo(() => {
    const answered = new Set(entries.map((e) => e.id));
    return mine.filter((m) => (m.pending || m.answers.length === 0 || !answered.has(m.id)) && m.question);
  }, [mine, entries]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (formState === "sending") return;

    const cleanName = name.trim();
    const cleanQuestion = question.trim();
    if (cleanName.length < 2) {
      setFormError("Як до вас звертатися? Хоча б ім'я.");
      setFormState("error");
      return;
    }
    if (!topic) {
      setFormError("Оберіть тему питання.");
      setFormState("error");
      return;
    }
    if (cleanQuestion.length < 10) {
      setFormError("Опишіть питання — хоча б кілька слів.");
      setFormState("error");
      return;
    }

    setFormState("sending");
    setFormError("");

    try {
      const res = await fetch("/api/forum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          topic,
          question: cleanQuestion,
          company: "", // honeypot — залишається порожнім
        }),
      });
      const json = (await res.json()) as { ok?: boolean; id?: string; error?: string };
      if (!res.ok || !json.ok) {
        setFormError(json.error ?? "Не вдалося надіслати. Спробуйте ще раз.");
        setFormState("error");
        return;
      }

      write(NAME_KEY, cleanName);
      const id = json.id ?? "";
      if (id) {
        const next = [...new Set([...codesRef.current, id])];
        codesRef.current = next;
        saveCodes(next);
        // Одразу показуємо питання у «Чекають відповіді», не чекаючи опитування.
        setMine((prev) => [
          {
            id,
            topic,
            name: cleanName,
            question: cleanQuestion,
            at: new Date().toISOString().replace("Z", "").slice(0, 19),
            answers: [],
            pending: true,
          },
          ...prev,
        ]);
      }
      setQuestion("");
      setFormState("sent");
    } catch {
      setFormError("Немає зв'язку. Перевірте інтернет і спробуйте ще раз.");
      setFormState("error");
    }
  }

  const field =
    "chat-field w-full border border-line-strong px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-muted";

  return (
    <>
      <header
        id="top"
        className="gutter sticky top-0 z-50 border-b border-line/60 bg-paper/90 backdrop-blur-md"
      >
        <div className="shell flex h-[52px] items-center justify-between gap-4 md:h-14">
          <Link
            href="/"
            className="label link-underline flex h-11 items-center text-ink-soft hover:text-ink"
          >
            ← На головну
          </Link>
          <div className="flex items-center gap-3">
            <a
              href="#ask"
              className="label link-underline hidden h-11 items-center text-muted hover:text-ink sm:flex"
            >
              Задати питання
            </a>
            <ContactModal trigger="link" />
          </div>
        </div>
      </header>

      <main id="main" className="gutter">
        <div className="shell border-b border-line py-14 md:py-20">
          <p className="label">Питання й відповіді</p>
          <h1 className="display mt-4 text-4xl md:text-6xl">Форум</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">
            Запитуйте про теми курсів — штучний інтелект, кібербезпеку й OSINT,
            вебдизайн, графічний дизайн, цифровий світ, обробку інформації — або
            про співпрацю. Відповідаю особисто, і відповідь з&apos;являється тут
            же, поряд із питанням.
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            Питання без відповіді на сторінці не показуються: спершу його
            бачите лише ви. Щойно відповім — воно з&apos;явиться у списку нижче.
          </p>
        </div>

        {/* ── Форма ─────────────────────────────────────────────── */}
        <section id="ask" className="scroll-mt-16 border-b border-line py-12 md:py-16">
          <div className="grid grid-cols-1 gap-y-10 lg:grid-cols-12 lg:gap-x-12">
            <div className="lg:col-span-3">
              <h2 className="reveal display text-3xl">Задати питання</h2>
              <span aria-hidden className="reveal mt-5 block h-[3px] w-16">
                <span className="accent-rule" />
              </span>
              <p className="mt-6 hidden text-sm leading-relaxed text-muted lg:block">
                Відповідь публікується на цій сторінці — її побачать усі, кому
                цікава та сама тема.
              </p>
            </div>

            <div className="lg:col-span-9">
              <form onSubmit={onSubmit} className="max-w-2xl space-y-6" noValidate>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="label">Ваше ім&apos;я</span>
                    <input
                      type="text"
                      name="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={80}
                      autoComplete="name"
                      placeholder="Наприклад, Марія"
                      className={`mt-2 ${field}`}
                    />
                  </label>
                  {/* honeypot: люди цього поля не бачать */}
                  <div className="hidden" aria-hidden>
                    <input type="text" name="company" tabIndex={-1} autoComplete="off" />
                  </div>
                  <div className="sm:col-span-2">
                    <span className="label">Тема</span>
                    <div role="group" aria-label="Тема питання" className="mt-2 flex flex-wrap gap-2">
                      {FORUM_TOPICS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          aria-pressed={topic === t}
                          onClick={() => setTopic(t)}
                          className={`rounded-full border px-3.5 py-2 text-[11px] font-semibold tracking-[0.08em] transition-colors ${
                            topic === t
                              ? "border-accent bg-accent text-white"
                              : "border-line bg-paper text-muted hover:border-line-strong hover:text-ink"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <label className="block">
                  <span className="label">Питання</span>
                  <textarea
                    name="question"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    maxLength={1500}
                    rows={5}
                    placeholder="Опишіть питання — чим конкретніше, тим корисніша відповідь."
                    className={`mt-2 resize-y ${field}`}
                  />
                  <span className="mt-2 block text-right text-xs text-muted">
                    {question.length}/1500
                  </span>
                </label>

                <div className="flex flex-wrap items-center gap-4">
                  <button
                    type="submit"
                    disabled={formState === "sending"}
                    className="btn-wave-invert inline-flex h-12 items-center justify-center gap-3 bg-ink px-7 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-ink-soft disabled:opacity-60"
                  >
                    <span className="wave-span">
                      {formState === "sending" ? "Надсилаю…" : "Надіслати питання"}
                    </span>
                  </button>
                  {formState === "sent" ? (
                    <p className="text-sm text-accent-ink" role="status">
                      Дякую! Питання надіслано — відповідь з&apos;явиться на цій
                      сторінці.
                    </p>
                  ) : formError ? (
                    <p className="text-sm text-accent-ink" role="alert">
                      {formError}
                    </p>
                  ) : null}
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* ── «Чекають відповіді» ───────────────────────────────── */}
        {pendingMine.length > 0 ? (
          <section className="border-b border-line py-10 md:py-12">
            <h2 className="label">Чекають відповіді</h2>
            <ul className="mt-4 space-y-3">
              {pendingMine.map((m) => (
                <li
                  key={m.id}
                  className="flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-[12px] border border-line bg-paper-2/50 px-5 py-4"
                >
                  <span className="label">{m.topic}</span>
                  <span className="min-w-0 flex-1 text-sm text-ink-soft">{m.question}</span>
                  <span className="label text-accent-ink">⏳ очікує відповіді</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* ── Список питань і відповідей ────────────────────────── */}
        <section className="py-12 md:py-16">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="display text-3xl">Питання й відповіді</h2>
            <button
              type="button"
              onClick={() => void load()}
              className="label link-underline h-11 text-muted hover:text-ink"
            >
              Оновити
            </button>
          </div>

          {usedTopics.length > 0 ? (
            <div role="group" aria-label="Фільтр за темою" className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                aria-pressed={topicFilter === null}
                onClick={() => setTopicFilter(null)}
                className={`rounded-full border px-3.5 py-2 text-[11px] font-semibold tracking-[0.08em] transition-colors ${
                  topicFilter === null
                    ? "border-ink bg-ink text-paper"
                    : "border-line bg-paper text-muted hover:border-line-strong hover:text-ink"
                }`}
              >
                Усі
              </button>
              {usedTopics.map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={topicFilter === slugify(t)}
                  onClick={() => setTopicFilter(slugify(t))}
                  className={`rounded-full border px-3.5 py-2 text-[11px] font-semibold tracking-[0.08em] transition-colors ${
                    topicFilter === slugify(t)
                      ? "border-accent bg-accent text-white"
                      : "border-line bg-paper text-muted hover:border-line-strong hover:text-ink"
                  }`}
                >
                  {t} <span className="ml-1 opacity-50">({topicCounts.get(t) ?? 0})</span>
                </button>
              ))}
            </div>
          ) : null}

          {loading ? (
            <p className="mt-10 text-sm text-muted">Завантажую…</p>
          ) : loadError ? (
            <p className="mt-10 text-sm text-accent-ink" role="alert">
              {loadError}
            </p>
          ) : visible.length === 0 ? (
            <div className="chat-empty mt-10 max-w-xl px-6 py-8 text-sm leading-relaxed text-muted">
              Поки що тут порожньо. Будьте першим — задайте питання у формі вище;
              після відповіді воно з&apos;явиться тут.
            </div>
          ) : (
            <ul className="mt-10 space-y-6">
              {visible.map((entry) => (
                <li
                  key={entry.id}
                  className="card-inner card-lift border border-line bg-paper p-6 md:p-8"
                >
                  <article>
                    <header className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <span className="label border border-line px-2 py-1 text-ink-soft">
                        {entry.topic}
                      </span>
                      <span className="label ml-auto">{formatForumDate(entry.at)}</span>
                    </header>

                    <p className="mt-4 text-xl font-bold leading-snug tracking-[-0.02em]">
                      {entry.question}
                    </p>
                    {entry.name ? (
                      <p className="mt-2 text-sm text-muted">— {entry.name}</p>
                    ) : null}

                    <div className="mt-5 space-y-5">
                      {entry.answers.map((a, i) => (
                        <div
                          key={i}
                          className="border-l-[3px] border-accent pl-4 md:pl-5"
                        >
                          <p className="label">
                            Відповідь
                            {entry.answers.length > 1 ? ` ${i + 1}` : ""} ·{" "}
                            {formatForumDateTime(a.at)}
                          </p>
                          <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-ink-soft">
                            {a.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <Footer />
      {/* Обов'язково: без цього .reveal-елементи (заголовок форми та
          акцентна смуга) лишаються з opacity: 0 НАЗАВЖДИ — вони видимі
          лише після появи IntersectionObserver. */}
      <Reveal />
    </>
  );
}