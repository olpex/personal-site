"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Плаваюча кнопка чату в куті + вікно, що розкривається з неї.
 *
 * Схема: питання → /api/chat → Telegram власника (окремий бот) → власник
 * тисне «Відповісти» на цьому повідомленні → місток (cron) кладе відповідь
 * у public/replies.json → це вікно саме підтягує її сюди.
 *
 * Код звернення зберігається в localStorage, тож відповідь знайде людину
 * навіть після перезавантаження сторінки.
 *
 * Згортання: якщо людина мовчить IDLE_MS, вікно згортається в кнопку —
 * але сесія лишається живою, і коли надійде відповідь, кнопка сама
 * приверне увагу й розкриє вікно (якщо людина на сторінці).
 */

const STORE_KEY = "oparashchuk:chat-code";

/** Скільки чекати без дій, перш ніж згорнути вікно в кнопку. */
const IDLE_MS = 8 * 60 * 1000;

/** Як часто перепитувати відповідь, поки людина чекає. */
const POLL_MS = 7000;

/** Після надсилання чекаємо відповідь не вічно. */
const WAIT_TIMEOUT_MS = 30 * 60 * 1000;

type Msg = { text: string; at: string; from?: string };

function readCode(): string {
  try {
    const v = localStorage.getItem(STORE_KEY);
    return v && /^[a-z0-9]{8}$/.test(v) ? v : "";
  } catch {
    return "";
  }
}

function saveCode(code: string) {
  try {
    if (code) localStorage.setItem(STORE_KEY, code);
    else localStorage.removeItem(STORE_KEY);
  } catch {
    /* приватний режим — просто не зберігаємо */
  }
}

export default function ChatWidget({ enabled = true }: { enabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [nudge, setNudge] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [closed, setClosed] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const openedAt = useRef(0);
  const lastAct = useRef(Date.now());
  const sentAt = useRef(0);
  const codeRef = useRef("");

  useEffect(() => {
    const saved = readCode();
    if (saved) {
      setCode(saved);
      codeRef.current = saved;
      sentAt.current = Date.now();
    }
  }, []);

  const touch = useCallback(() => {
    lastAct.current = Date.now();
  }, []);

  /* Опитування відповіді: лише коли є код і ще немає відповіді. */
  const poll = useCallback(async (silent = true) => {
    const id = codeRef.current;
    if (!id) return;
    try {
      const res = await fetch(`/api/chat?code=${encodeURIComponent(id)}`, { cache: "no-store" });
      const json = (await res.json()) as { ok?: boolean; messages?: Msg[]; closed?: boolean };
      if (!json.ok) return;
      if (json.messages && json.messages.length > 0) {
        setMessages(json.messages);
        setState("sent");
        sentAt.current = 0;
        if (document.visibilityState === "visible") {
          setOpen(true);
          lastAct.current = Date.now();
        } else {
          setNudge(true);
        }
      }
      if (json.closed) setClosed(true);
    } catch {
      if (!silent) setError("Немає зв'язку. Спробуйте ще раз.");
    }
  }, []);

  useEffect(() => {
    if (!code || messages.length > 0 || closed) return;
    void poll();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible" && Date.now() - sentAt.current < WAIT_TIMEOUT_MS) {
        void poll();
      }
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [code, messages.length, closed, poll]);

  /* Згортання за бездіяльністю: вікно ховається, сесія лишається. */
  useEffect(() => {
    if (!open) return;
    const timer = window.setInterval(() => {
      if (Date.now() - lastAct.current > IDLE_MS) {
        setOpen(false);
        setNudge(false);
      }
    }, 15000);
    return () => window.clearInterval(timer);
  }, [open]);

  /* Клік поза вікном — теж згортання (але не закриття сесії). */
  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current && !panelRef.current.contains(target)) {
        const btn = document.getElementById("chat-widget-button");
        if (btn && btn.contains(target)) return;
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    lastAct.current = Date.now();
    const el = panelRef.current;
    if (el) {
      const first = el.querySelector<HTMLInputElement>("input, textarea");
      first?.focus();
    }
  }, [open]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setState("sending");
    setError("");
    touch();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(data.get("name") ?? ""),
          message: String(data.get("message") ?? ""),
          company: String(data.get("company") ?? ""), // honeypot
          code: codeRef.current,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; id?: string; error?: string };
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Не вдалося надіслати.");
        setState("error");
        return;
      }
      const id = json.id ?? "";
      if (id) {
        codeRef.current = id;
        setCode(id);
        saveCode(id);
      }
      sentAt.current = Date.now();
      form.reset();
      setState("sent");
    } catch {
      setError("Немає зв'язку. Перевірте інтернет.");
      setState("error");
    }
  }

  const field =
    "mt-1.5 w-full border border-line-strong bg-transparent px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-accent";

  /* Поки бот не налаштований, віджет не показуємо: краще нічого, ніж
     кнопка, яка при натисканні видає помилку. */
  if (!enabled) return null;

  const hasReply = messages.length > 0;

  return (
    <>
      {/* Плаваюча кнопка: завжди в куті, розкриває вікно. */}
      <button
        id="chat-widget-button"
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setNudge(false);
          touch();
        }}
        aria-label={open ? "Згорнути чат" : "Відкрити чат"}
        aria-expanded={open}
        className={`chat-fab fixed bottom-5 right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-ink text-paper shadow-lg transition-transform hover:scale-105 ${
          nudge ? "chat-fab-nudge" : ""
        }`}
      >
        {open ? (
          <span aria-hidden className="text-xl leading-none">×</span>
        ) : (
          <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M21 12a8 8 0 0 1-8 8H7l-4 3v-4.5A8 8 0 0 1 3 12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8Z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        {nudge ? (
          <span aria-hidden className="absolute right-0 top-0 h-3.5 w-3.5 rounded-full border-2 border-paper bg-accent" />
        ) : null}
      </button>

      {/* Вікно: розкривається з кнопки, згортається за бездіяльності. */}
      {open ? (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Чат із викладачем"
          className="chat-panel fixed bottom-24 right-5 z-[60] flex max-h-[min(70vh,32rem)] w-[min(23rem,calc(100vw-2.5rem))] flex-col border border-line-strong bg-paper shadow-2xl"
        >
          <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
            <div>
              <p className="text-sm font-bold tracking-[-0.01em]">Запитати напряму</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                Питання прийде мені в Telegram — відповім тут же.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setNudge(false);
              }}
              aria-label="Згорнути"
              className="-mr-1 -mt-0.5 shrink-0 text-lg leading-none text-muted transition-colors hover:text-ink"
            >
              ×
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            {hasReply ? (
              <div className="flex flex-col gap-3">
                <p className="text-[11px] uppercase tracking-wider text-muted">Відповідь</p>
                {messages.map((m, i) => (
                  <p
                    key={i}
                    className="whitespace-pre-line border-l-2 border-accent pl-3 text-sm leading-relaxed text-ink-soft"
                  >
                    {m.text}
                  </p>
                ))}
                {!closed ? (
                  <p className="text-[11px] leading-relaxed text-muted">
                    Можете поставити уточнення нижче — я відповім у цьому ж вікні.
                  </p>
                ) : null}
              </div>
            ) : state === "sent" ? (
              <div>
                <p className="text-sm leading-relaxed text-ink-soft">
                  Питання надіслано. Відповідь з&apos;явиться тут — можете згорнути
                  вікно й повернутися пізніше, вона вас чекатиме.
                </p>
                {code ? (
                  <p className="mt-3 text-[11px] text-muted">
                    Код звернення: <code className="text-ink">#{code}</code>
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-ink-soft">
                Напишіть питання — я відповім особисто, зазвичай протягом дня.
              </p>
            )}
          </div>

          <form onSubmit={onSubmit} className="border-t border-line px-4 py-3">
            {!hasReply ? (
              <label className="block">
                <span className="label text-[11px]">Ім&apos;я</span>
                <input
                  name="name"
                  required
                  minLength={2}
                  maxLength={80}
                  autoComplete="name"
                  onInput={touch}
                  className={field}
                  placeholder="Як до вас звертатися"
                />
              </label>
            ) : (
              <input type="hidden" name="name" value="Уточнення" />
            )}

            <label className="mt-3 block">
              <span className="label text-[11px]">
                {hasReply ? "Уточнення" : "Питання"}
              </span>
              <textarea
                name="message"
                required
                minLength={2}
                maxLength={2000}
                rows={3}
                onInput={touch}
                className={`${field} resize-y`}
                placeholder={hasReply ? "Що уточнити?" : "Що вас цікавить?"}
              />
            </label>

            <input
              type="text"
              name="company"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
              className="absolute left-[-9999px] h-0 w-0 opacity-0"
            />

            {error ? <p className="mt-2 text-xs text-accent-ink">{error}</p> : null}

            <button
              type="submit"
              disabled={state === "sending"}
              className="mt-3 flex h-10 w-full items-center justify-center bg-ink px-4 text-sm font-semibold text-paper transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {state === "sending" ? "Надсилаю…" : hasReply ? "Надіслати уточнення" : "Відправити"}
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}
