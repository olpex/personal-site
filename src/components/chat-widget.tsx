"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { buildRows, type Msg } from "@/lib/chat-thread";

/**
 * Плаваюча кнопка чату + вікно-переписка.
 *
 * Схема: питання → /api/chat → Telegram власника (окремий бот) → власник
 * тисне «Відповісти» на цьому повідомленні → місток (cron) дописує відповідь
 * у public/replies.json → це вікно саме підтягує її сюди.
 *
 * Це ПЕРЕПИСКА, а не одна відповідь: людина може уточнювати скільки завгодно
 * разів, і обидві сторони бачать усю розмову.
 *
 * Історія живе НА СЕРВЕРІ: репліки відвідувача пише сайт, відповіді — місток
 * із Telegram. Браузер не є джерелом правди: після перезавантаження або
 * відкриття з іншого пристрою переписка відновиться.
 */

const CODE_KEY = "oparashchuk:chat-code";
const MSG_KEY = "oparashchuk:chat-local";
const NAME_KEY = "oparashchuk:chat-name";
const CLOSED_KEY = "oparashchuk:chat-closed";

/** Скільки чекати без дій, перш ніж згорнути вікно в кнопку. */
const IDLE_MS = 5 * 60 * 1000;

/** Як часто перепитувати відповідь. */
const POLL_MS = 7000;

/** Після надсилання чекаємо відповідь не вічно. */
const WAIT_TIMEOUT_MS = 30 * 60 * 1000;

/** Сесія на цьому браузері живе 5 хв — щоб наступний користувач на тому ж
 *  пристрої не побачив чужу переписку. Після цього код стирається. */
const SESSION_TTL_MS = 5 * 60 * 1000;
const CODE_AT_KEY = "oparashchuk:chat-code-at";


export default function ChatWidget({ enabled = true }: { enabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [nudge, setNudge] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "closed" | "error">("idle");
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [visitor, setVisitor] = useState<Msg[]>([]);
  const [owner, setOwner] = useState<Msg[]>([]);
  const [closed, setClosed] = useState(false);
  const [ready, setReady] = useState(false);
  const [draft, setDraft] = useState("");

  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastAct = useRef(Date.now());
  /* Доки розмова «гаряча» — опитуємо відповіді. Продовжуємо час при кожній
     події (надіслали / отримали), щоб опитування не спинялося після першої
     відповіді — саме через це уточнення власника не доходило. */
  const activeUntil = useRef(0);
  const codeRef = useRef("");

  const keepAlive = useCallback(() => {
    activeUntil.current = Date.now() + WAIT_TIMEOUT_MS;
    write(CODE_AT_KEY, String(Date.now()));
  }, []);

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
  function sessionExpired(): boolean {
    const raw = read(CODE_AT_KEY);
    if (!raw) return false;
    const at = Number(raw);
    if (!Number.isFinite(at)) return false;
    return Date.now() - at > SESSION_TTL_MS;
  }
  function clearSessionStorage() {
    write(CODE_KEY, "");
    write(CODE_AT_KEY, "");
    write(CLOSED_KEY, "");
    write(MSG_KEY, "");
  }

  // Сумісність зі старою версією: історія могла жити в MSG_KEY (localStorage).
  // Мігруємо її в стан, а джерело правди — сервер: наступне відкриття
  // підтягне ту саму історію з /api/chat і залежність від браузера зникне.
  function migrateLocal(): Msg[] {
    try {
      const raw = JSON.parse(read(MSG_KEY) || "[]") as unknown;
      if (!Array.isArray(raw)) return [];
      return raw
        .filter((m): m is Record<string, unknown> => Boolean(m) && typeof m === "object")
        .map((m) => ({
          text: String(m.text ?? ""),
          at: String(m.at ?? ""),
        }))
        .filter((m) => m.text.length > 0)
        .map((m) => ({
          text: m.text,
          // Стара форма писала «2026-09-27 23:23», нова — «2026-09-27T23:23:32».
          at: m.at.includes("T") || m.at.includes(":00") ? m.at : m.at,
        }));
    } catch {
      return [];
    }
  }

  useEffect(() => {
    const legacy = Boolean(read(CODE_KEY) && !read(CODE_AT_KEY));
    if (legacy || sessionExpired()) {
      clearSessionStorage();
    }
    const saved = read(CODE_KEY);
    // hasOld must be read AFTER possible clear — інакше стара історія
    // з MSG_KEY «просочиться» навіть після expiry/legacy wipe
    const hasOld = saved ? migrateLocal() : [];
    if (saved && /^[a-z0-9]{8}$/.test(saved) && !sessionExpired() && !legacy) {
      setCode(saved);
      codeRef.current = saved;
      keepAlive();
    } else if (saved) {
      clearSessionStorage();
    }
    // Показуємо локальну історію лише якщо сесія ще жива
    if (hasOld.length > 0 && saved && !legacy && !sessionExpired()) {
      setVisitor(hasOld);
      setState("sent");
    }
    if (read(CLOSED_KEY) === "1") {
      // Backward compat: старі «закриті» сесії теж чистимо — наступний
      // користувач на цьому пристрої має бачити пусте вікно
      clearSessionStorage();
    }
    const savedName = read(NAME_KEY);
    if (savedName) setDraft("");
    setReady(true);
  }, []);

  const touch = useCallback(() => {
    lastAct.current = Date.now();
  }, []);

  /* Опитування розмови — джерело правди СЕРВЕР. Раніше репліки відвідувача
     жили в localStorage й губилися між пристроями. Тепер обидва списки
     приходять із /api/chat і сортуються у стрічку. */
  const poll = useCallback(async (silent = true) => {
    const id = codeRef.current;
    if (!id) return;
    try {
      const res = await fetch(`/api/chat?code=${encodeURIComponent(id)}`, { cache: "no-store" });
      const json = (await res.json()) as {
        ok?: boolean;
        messages?: Msg[];
        visitor?: Msg[];
        closed?: boolean;
      };
      if (!json.ok) return;
      const srvVisitor = (json.visitor ?? []).filter((m) => (m.text ?? "").trim().length > 0);
      const srvOwner = (json.messages ?? []).filter((m) => (m.text ?? "").trim().length > 0);
      const was = owner.length;
      const now = srvOwner.length;
      if (srvVisitor.length > 0 || srvOwner.length > 0) {
        setVisitor(srvVisitor);
        setOwner(srvOwner);
      }
      if (now > was) {
        keepAlive();
        if (document.visibilityState === "visible") {
          lastAct.current = Date.now();
        } else {
          setNudge(true);
        }
      }
      if (json.closed) {
        // Сервер позначив розмову як закриту — чистимо локально, щоб
        // наступний користувач не побачив чужу переписку
        codeRef.current = "";
        activeUntil.current = 0;
        setCode("");
        setVisitor([]);
        setOwner([]);
        setClosed(false);
        setState("idle");
        clearSessionStorage();
      }
    } catch {
      if (!silent) setError("Немає зв'язку. Спробуйте ще раз.");
    }
  }, [owner.length]);

  useEffect(() => {
    if (!ready || !code) return;
    void poll();
    const timer = window.setInterval(() => {
      /* Опитуємо, доки розмова активна. Ніяких `messages.length > 0` —
         саме ця умова й зупиняла опитування після першої відповіді. */
      if (document.visibilityState !== "visible") return;
      if (Date.now() < activeUntil.current) void poll();
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [ready, code, poll]);

  /* Згортання за бездіяльністю: вікно ховається.
   * + Авто-очищення сесії: через 5 хв після останньої дії код стирається,
   *   і наступний відвідувач на тому ж пристрої побачить чисте вікно —
   *   чужу переписку не «підхопить». */
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (sessionExpired() && (codeRef.current || read(CODE_KEY))) {
        codeRef.current = "";
        activeUntil.current = 0;
        setCode("");
        setVisitor([]);
        setOwner([]);
        setClosed(false);
        setState("idle");
        clearSessionStorage();
      }
      if (!open) return;
      if (Date.now() - lastAct.current > IDLE_MS) {
        setOpen(false);
        setNudge(false);
      }
    }, 15000);
    return () => window.clearInterval(timer);
  }, [open]);

  /* Клік поза вікном — теж згортання (але не закриття розмови). */
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
    const first = el?.querySelector<HTMLInputElement>('input[name="name"]');
    first?.focus();
  }, [open]);

  /* Тримаємо прокрутку внизу — як у справжньому чаті. */
  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [open, visitor.length, owner.length]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const text = String(data.get("message") ?? "").trim();
    if (text.length < 2) return;
    setDraft(text);
    setState("sending");
    setError("");
    touch();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(data.get("name") ?? "") || read(NAME_KEY) || "Відвідувач",
          message: text,
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
        write(CODE_KEY, id);
        write(CODE_AT_KEY, String(Date.now()));
        write(CLOSED_KEY, "");
        setClosed(false);
        activeUntil.current = Date.now() + WAIT_TIMEOUT_MS;
      }
      const nm = String(data.get("name") ?? "").trim();
      if (nm) write(NAME_KEY, nm);

      // Оптимістично показуємо репліку одразу — сервер її зараз запише,
      // наступний опис узгодить список (чернетку замінить серверна версія).
      setVisitor((prev) => [...prev, { text, at: new Date().toISOString().replace("Z", "").slice(0, 19) }]);
      keepAlive();
      form.reset();
      setDraft("");
      setState("sent");
      // Негайно підтягуємо серверну стрічку — без очікування інтервалу.
      void poll(false);
    } catch {
      setError("Немає зв'язку. Перевірте інтернет.");
      setState("error");
    }
  }

  async function closeTalk() {
    const id = codeRef.current;
    // Notify owner (if possible) before wiping local code
    if (id) {
      try {
        await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "close", code: id }),
        });
      } catch {
        /* owner just won't get the toast — local close still happens */
      }
    }
    // Requirement: manual close OR 5-min timeout must wipe the window
    // so the next person on this device sees an empty form, not чужу переписку
    codeRef.current = "";
    activeUntil.current = 0;
    setCode("");
    setVisitor([]);
    setOwner([]);
    setClosed(false);
    setState("idle");
    setError("");
    setDraft("");
    clearSessionStorage();
    setOpen(false);
    touch();
  }

  function startNew() {
    codeRef.current = "";
    activeUntil.current = 0;
    setCode("");
    setVisitor([]);
    setOwner([]);
    setClosed(false);
    setState("idle");
    setError("");
    setDraft("");
    clearSessionStorage();
    // history lives on server; local leftover from old builds is dropped
    touch();
  }

  const field =
    "chat-field w-full border border-line-strong px-3 py-2.5 text-sm text-ink outline-none placeholder:text-muted";

  /* Поки бот не налаштований, віджет не показуємо: краще нічого, ніж
     кнопка, яка при натисканні видає помилку. */
  if (!enabled) return null;

  // Чернетка — власна репліка, яка ще не підтверджена сервером (поки
  // /api/chat не повернув її у `visitor`). Показуємо її разом із
  // серверною стрічкою, щоб після надсилання не було «провалу».
  const draftRows: import("@/lib/chat-thread").Msg[] =
    state === "sending" && draft ? [{ text: draft, at: "" }] : [];
  const rows = buildRows([...visitor, ...draftRows], owner);
  const hasCode = Boolean(code);
  const waiting = hasCode && owner.length === 0 && visitor.length > 0;

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
          <span aria-hidden className="text-xl leading-none">
            ×
          </span>
        ) : (
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path
              d="M21 12a8 8 0 0 1-8 8H7l-4 3v-4.5A8 8 0 0 1 3 12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8Z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {nudge ? (
          <span
            aria-hidden
            className="absolute right-0 top-0 h-3.5 w-3.5 rounded-full border-2 border-paper bg-accent"
          />
        ) : null}
      </button>

      {/* Вікно-переписка: розкривається з кнопки, згортається за бездіяльності. */}
      {open ? (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Чат із викладачем"
          className="chat-panel fixed bottom-24 right-5 z-[60] flex h-[min(70vh,32rem)] w-[min(23rem,calc(100vw-2.5rem))] flex-col"
        >
          <div className="chat-panel-header flex items-start justify-between gap-3 border-b border-line px-4 py-3">
            <div>
              <p className="flex items-center gap-2 text-sm font-bold tracking-[-0.01em]"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-[10px] font-extrabold text-white">ОП</span>Запитати напряму</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                {hasCode
                  ? "Пишіть уточнення — відповім у цьому вікні."
                  : "Питання прийде мені в Telegram — відповім тут же."}
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

          {/* Стрічка розмови */}
          <div ref={scrollRef} className="chat-scroll flex-1 overflow-y-auto px-4 py-4">
            {state === "idle" && rows.length === 0 ? (
              <div className="chat-empty px-4 py-5"><p className="text-sm leading-relaxed text-ink-soft">Напишіть питання — я відповім особисто, зазвичай протягом дня.</p><p className="mt-2 text-xs leading-relaxed text-muted">Можна уточнювати скільки завгодно — вся переписка збережеться тут.</p></div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {rows.map((row) => (
                  <div
                    key={row.key}
                    className={row.from === "visitor" ? "chat-row-visitor" : "chat-row-owner"}
                  >
                    <div className={row.from === "visitor" ? "chat-bubble-visitor" : "chat-bubble-owner"}>
                      {row.text}
                    </div>
                  </div>
                ))}
                {waiting ? (
                  <p className="chat-hint">Питання надіслано. Відповідь з&apos;явиться тут.</p>
                ) : null}
              </div>
            )}
          </div>

          <form onSubmit={onSubmit} className="border-t border-line bg-white/80 px-4 py-3 backdrop-blur-sm">
              {!hasCode ? (
                <label className="block">
                  <span className="label text-[11px]">Ім&apos;я</span>
                  <input
                    name="name"
                    required
                    minLength={2}
                    maxLength={80}
                    autoComplete="name"
                    onInput={touch}
                    className={`mt-1.5 ${field}`}
                    placeholder="Як до вас звертатися"
                  />
                </label>
              ) : null}

              <label className={hasCode ? "block" : "mt-3 block"}>
                <span className="label text-[11px]">{hasCode ? "Уточнення" : "Питання"}</span>
                <textarea
                  name="message"
                  required
                  minLength={2}
                  maxLength={2000}
                  rows={hasCode ? 2 : 3}
                  onInput={touch}
                  className={`mt-1.5 ${field} resize-none`}
                  placeholder={hasCode ? "Що уточнити?" : "Що вас цікавить?"}
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

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={state === "sending"}
                  className="flex h-10 flex-1 items-center justify-center rounded-xl bg-ink px-4 text-sm font-semibold text-paper shadow-sm transition-all hover:translate-y-[-1px] hover:shadow-md active:translate-y-0 disabled:opacity-60"
                >
                  {state === "sending" ? "Надсилаю…" : hasCode ? "Надіслати" : "Відправити"}
                </button>
                {hasCode ? (
                  <button
                    type="button"
                    onClick={closeTalk}
                    title="Закрити розмову"
                    className="flex h-10 items-center justify-center rounded-xl border border-line-strong bg-white px-3.5 text-xs font-semibold text-muted transition-colors hover:border-ink hover:text-ink"
                  >
                    Закрити
                  </button>
                ) : null}
              </div>

              {hasCode && code ? (
                <p className="mt-2 text-[10px] text-muted">
                  Код розмови: <code className="text-ink-soft">#{code}</code>
                </p>
              ) : null}
            </form>
        </div>
      ) : null}
    </>
  );
}
