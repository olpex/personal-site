"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { site } from "@/content/site";

/**
 * Кнопка «Написати» + модальне вікно зворотного зв'язку.
 *
 * Шлях питання: форма → /api/contact → Telegram Олегу.
 * Шлях відповіді: Олег відповідає в Telegram → відповідь лягає в
 * public/replies.json → це вікно саме підтягує її через /api/reply і
 * показує тут же. Код звернення зберігається в localStorage, тож
 * відвідувач побачить відповідь, навіть якщо закриє вкладку й повернеться.
 *
 * Чому <dialog>: Esc, фокус-пастка й інертність фону без власного коду.
 */
const STORE_KEY = "oparashchuk:contact-tickets";

type Ticket = { id: string; at: number };

function readTickets(): Ticket[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as Ticket[];
    return Array.isArray(list) ? list.slice(0, 5) : [];
  } catch {
    return [];
  }
}

function saveTicket(t: Ticket) {
  try {
    const list = readTickets().filter((x) => x.id !== t.id);
    localStorage.setItem(STORE_KEY, JSON.stringify([t, ...list].slice(0, 5)));
  } catch {
    /* приватний режим — просто не зберігаємо */
  }
}

/** Забуваємо звернення: людина хоче поставити нове питання. */
function clearTickets() {
  try {
    localStorage.removeItem(STORE_KEY);
  } catch {
    /* нічого не робимо */
  }
}

export default function ContactModal({
  trigger = "button",
}: {
  /** "button" — помітна кнопка (секція «Контакти»);
   *  "link" — компактне посилання у шапці. */
  trigger?: "button" | "link";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const openedAt = useRef<number>(0);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  const [ticket, setTicket] = useState("");
  const [reply, setReply] = useState("");
  const [checking, setChecking] = useState(false);
  const [nothingYet, setNothingYet] = useState(false);

  const open = () => {
    openedAt.current = Date.now();
    setState("idle");
    setError("");
    setNothingYet(false);
    /* reply НЕ очищаємо: якщо відповідь уже прийшла, людина має побачити
       її одразу при відкритті. Раніше тут стояло setReply("") — і
       відповідь зникала саме в момент, коли її відкривали. */
    ref.current?.showModal();
    /* Одноразова перевірка при відкритті: якщо в людини вже було звернення
       й відповідь щойно з'явилась — покажемо. Далі стежить інтервал, але
       лише поки питання справді в очікуванні. */
    if (ticket && !reply) void pull(ticket, true);
  };

  /* Періодична перевірка відповіді. Тягнемо лише коли вікно відкрите
     (showModal робить його :modal) і лише поки відповіді немає — інакше
     це зайвий трафік у кожного відвідувача на кожній сторінці. */
  const pull = useCallback(async (id: string, silent = false) => {
    if (!silent) setChecking(true);
    try {
      const res = await fetch(`/api/reply?id=${encodeURIComponent(id)}`, { cache: "no-store" });
      const json = (await res.json()) as { ok?: boolean; replied?: boolean; reply?: string };
      if (json.ok && json.replied && json.reply) {
        setReply(json.reply);
        setNothingYet(false);
        return true;
      }
      if (!silent) setNothingYet(true);
    } catch {
      if (!silent) setNothingYet(true);
    } finally {
      if (!silent) setChecking(false);
    }
    return false;
  }, []);

  /* Показуємо останнє звернення при відкритті: якщо відповідь уже є,
     людина побачить її одразу, без повторного надсилання. */
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const onClick = (event: MouseEvent) => {
      if (event.target === dialog) dialog.close();
    };
    dialog.addEventListener("click", onClick);
    return () => dialog.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (state !== "sent" || !ticket || reply) return;
    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      const got = await pull(ticket, true);
      if (got) cancelled = true;
    };
    void tick();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void tick();
    }, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [state, ticket, reply, pull]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setState("sending");
    setError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          contact: data.get("contact"),
          message: data.get("message"),
          company: data.get("company"), // honeypot
          elapsed: Date.now() - openedAt.current,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; id?: string; error?: string };
      if (!res.ok || !json.ok) {
        setError(json.error || "Не вдалося надіслати. Спробуйте ще раз.");
        setState("error");
        return;
      }
      const id = json.id ?? "";
      setTicket(id);
      setReply(""); // нове питання — стара відповідь не стосується
      if (id && id !== "-") saveTicket({ id, at: Date.now() });
      setState("sent");
      form.reset();
    } catch {
      setError("Немає зв'язку. Перевірте інтернет і спробуйте ще раз.");
      setState("error");
    }
  }

  /* Один раз на завантаженні: якщо в людини вже є звернення з відповіддю,
     показуємо її одразу — без повторного надсилання. Саме один раз, бо
     інакше після «поставити нове питання» стара відповідь поверталась би
     знову і знову. */
  const bootstrapped = useRef(false);
  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    const last = readTickets()[0];
    if (!last) return;
    void pull(last.id, true).then((got) => {
      if (got) setTicket(last.id);
    });
  }, [pull]);

  const field =
    "mt-2 w-full border border-line bg-paper px-3 py-2.5 text-sm text-ink placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]";

  return (
    <>
      {trigger === "button" ? (
        <button
          type="button"
          onClick={open}
          className="reveal group mt-10 flex h-12 w-fit items-center gap-3 border border-line-strong px-6 text-sm font-semibold tracking-wide text-ink transition-colors hover:border-accent hover:text-accent-ink"
        >
          Написати мені
          <span aria-hidden className="transition-transform group-hover:translate-x-1">
            →
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={open}
          className="label whitespace-nowrap border border-line-strong px-3 py-1.5 text-ink transition-colors hover:border-accent hover:text-accent"
        >
          Написати
        </button>
      )}

      <dialog
        ref={ref}
        aria-labelledby="contact-modal-title"
        className="contact-dialog m-auto w-[min(92vw,34rem)] border border-line bg-paper p-0 text-ink backdrop:bg-[rgba(15,16,19,0.55)] backdrop:backdrop-blur-[2px]"
      >
        <form onSubmit={onSubmit} className="flex flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
            <div>
              <h2 id="contact-modal-title" className="text-lg font-bold tracking-[-0.01em]">
                {reply ? "Відповідь" : state === "sent" ? "Питання надіслано" : "Напишіть мені"}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                {reply
                  ? "Олег відповів на ваше звернення."
                  : state === "sent"
                    ? "Відповідь з'явиться тут, у цьому вікні."
                    : "Питання про курси, консультації чи співпрацю — відповідаю особисто."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => ref.current?.close()}
              aria-label="Закрити"
              className="shrink-0 text-xl leading-none text-muted transition-colors hover:text-ink"
            >
              ×
            </button>
          </div>

          {reply ? (
            <div className="px-6 py-7">
              <p className="whitespace-pre-line border-l-2 border-accent pl-4 text-sm leading-relaxed text-ink-soft">
                {reply}
              </p>
              {ticket ? (
                <p className="mt-5 text-xs text-muted">
                  Код звернення: <code className="text-ink">#{ticket}</code>
                </p>
              ) : null}
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => ref.current?.close()}
                  className="flex h-11 items-center border border-line-strong px-5 text-sm font-semibold transition-colors hover:border-accent hover:text-accent-ink"
                >
                  Закрити
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearTickets();
                    setReply("");
                    setTicket("");
                    setState("idle");
                  }}
                  className="text-xs text-muted underline decoration-line underline-offset-4 hover:text-ink"
                >
                  поставити нове питання
                </button>
              </div>
            </div>
          ) : state === "sent" ? (
            <div className="px-6 py-8">
              <span aria-hidden className="block text-3xl">
                ✓
              </span>
              <p className="mt-4 text-sm leading-relaxed text-ink-soft">
                Дякую! Питання вже в мене. Я відповім особисто — зазвичай протягом
                дня. Не закривайте це вікно, щоб побачити відповідь одразу.
              </p>
              {ticket && ticket !== "-" ? (
                <p className="mt-4 text-xs leading-relaxed text-muted">
                  Код звернення: <code className="text-ink">#{ticket}</code> — назвіть
                  його, якщо захочете уточнити.
                </p>
              ) : null}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => ref.current?.close()}
                  className="flex h-11 items-center border border-line-strong px-5 text-sm font-semibold transition-colors hover:border-accent hover:text-accent-ink"
                >
                  Закрити
                </button>
                {ticket ? (
                  <button
                    type="button"
                    onClick={() => void pull(ticket)}
                    disabled={checking}
                    className="text-xs text-muted underline decoration-line underline-offset-4 hover:text-ink disabled:opacity-60"
                  >
                    {checking ? "перевіряю…" : "перевірити відповідь"}
                  </button>
                ) : null}
              </div>
              {nothingYet ? (
                <p className="mt-4 text-xs leading-relaxed text-muted">
                  Відповіді ще немає — я побачу питання в Telegram і відповім. Ця
                  сторінка перевіряє відповідь автоматично.
                </p>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-col gap-5 px-6 py-6">
              <label className="block">
                <span className="label">Ім&apos;я</span>
                <input
                  name="name"
                  required
                  minLength={2}
                  maxLength={80}
                  className={field}
                  placeholder="Як до вас звертатися"
                />
              </label>

              <label className="block">
                <span className="label">Контакт для відповіді</span>
                <input
                  name="contact"
                  maxLength={120}
                  className={field}
                  placeholder="Email або Telegram — необов'язково"
                />
              </label>

              <label className="block">
                <span className="label">Питання</span>
                <textarea
                  name="message"
                  required
                  minLength={10}
                  maxLength={2000}
                  rows={5}
                  className={`${field} resize-y`}
                  placeholder="Що вас цікавить? Який курс, які терміни, що хочете опанувати?"
                />
              </label>

              {/* Honeypot: люди не бачать, боти заповнюють. */}
              <input
                type="text"
                name="company"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden
                className="absolute left-[-9999px] h-0 w-0 opacity-0"
              />

              {error ? (
                <p className="border-l-2 border-accent pl-3 text-sm text-ink-soft">{error}</p>
              ) : null}

              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="submit"
                  disabled={state === "sending"}
                  className="flex h-11 items-center bg-ink px-6 text-sm font-semibold text-paper transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {state === "sending" ? "Надсилаю…" : "Надіслати"}
                </button>
                <a
                  href={`mailto:${site.email}`}
                  className="text-xs text-muted underline decoration-line underline-offset-4 hover:text-ink"
                >
                  або написати на {site.email}
                </a>
              </div>
            </div>
          )}
        </form>
      </dialog>
    </>
  );
}
