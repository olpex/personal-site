"use client";

import { useRef, useState } from "react";
import { site } from "@/content/site";
import { useLang } from "@/components/lang-context";
import { t } from "@/lib/ui-strings";

/**
 * Кнопка «Написати мені» + модальне вікно з ПОШТОВОЮ формою.
 *
 * Шлях: форма → /api/contact-email → лист на пошту власника (Gmail API).
 * Пошта відвідувача обов'язкова: без неї немає куди відповісти. Адресу
 * підставляємо в Reply-To, тож у Gmail достатньо натиснути «Відповісти» —
 * лист піде людині, а не самому собі.
 *
 * Живий чат із відповіддю у вікні — ОКРЕМИЙ віджет (chat-widget.tsx):
 * це різні канали, і змішувати їх в одному вікні означало б плутати
 * людину, куди саме пішло її питання.
 *
 * Чому <dialog>: Esc, фокус-пастка й інертність фону без власного коду.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

export default function ContactModal({
  trigger = "button",
  label,
  className,
}: {
  /** "button" — помітна кнопка (секція «Контакти»);
   *  "link" — компактне посилання у шапці.
   *  "secondary" — другорядна кнопка (hero секція). */
  trigger?: "button" | "link" | "secondary";
  /** Текст кнопки (за замовчуванням залежить від trigger) */
  label?: string;
  /** Класи кнопки — перевизначає дефолтні */
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const openedAt = useRef<number>(0);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  const { lang } = useLang();

  const open = () => {
    openedAt.current = Date.now();
    setState("idle");
    setError("");
    ref.current?.showModal();
  };

  const close = () => ref.current?.close();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const email = String(data.get("email") ?? "").trim();
    if (!EMAIL_RE.test(email)) {
      setError(t("modalErrorEmail", lang));
      setState("error");
      return;
    }

    setState("sending");
    setError("");

    try {
      const res = await fetch("/api/contact-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(data.get("name") ?? ""),
          email,
          message: String(data.get("message") ?? ""),
          company: String(data.get("company") ?? ""), // honeypot
          elapsed: Date.now() - openedAt.current,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setError(json.error || t("modalErrorSend", lang));
        setState("error");
        return;
      }
      form.reset();
      setState("sent");
    } catch {
      setError(t("modalErrorOffline", lang));
      setState("error");
    }
  }

  const field =
    "chat-field mt-2 w-full border border-line-strong bg-paper px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-muted";

  const buttonLabel =
    label ?? (trigger === "secondary" ? t("contactBtnEmail", lang) : trigger === "link" ? t("writeMe", lang) : t("contactBtn", lang));

  return (
    <>
      {trigger === "secondary" ? (
        <button
          type="button"
          onClick={open}
          className={
            className ??
            "btn-wave inline-flex min-h-12 items-center justify-center border border-line-strong bg-paper px-7 py-3 text-sm font-semibold tracking-wide transition-colors hover:border-ink hover:text-ink"
          }
        >
          <span className="wave-span">{buttonLabel}</span>
        </button>
      ) : trigger === "button" ? (
        <button
          type="button"
          onClick={open}
          className="reveal btn-wave-invert group inline-flex h-12 items-center justify-center gap-3 bg-ink px-7 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-ink-soft"
        >
          <span className="wave-span inline-flex items-center gap-3">
            {buttonLabel}
            <span aria-hidden className="transition-transform group-hover:translate-x-1">
              →
            </span>
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={open}
          className="label btn-wave whitespace-nowrap border border-line bg-paper px-3.5 py-2 text-[11px] tracking-[0.08em] text-ink transition-colors hover:border-ink hover:text-ink"
        >
          <span className="wave-span">{buttonLabel}</span>
        </button>
      )}

      <dialog
        ref={ref}
        aria-labelledby="contact-modal-title"
        className="contact-dialog m-auto w-[min(92vw,34rem)] p-0 text-ink backdrop:bg-[rgba(15,16,19,0.48)] backdrop:backdrop-blur-[6px]"
      >
        <form onSubmit={onSubmit} className="flex flex-col">
          <div className="chat-panel-header flex items-start justify-between gap-4 border-b border-line px-6 py-5">
            <div>
              <h2 id="contact-modal-title" className="flex items-center gap-2.5 text-lg font-bold tracking-[-0.01em]"><span aria-hidden className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-[10px] font-extrabold text-white">ОП</span><span>
                {state === "sent" ? t("modalTitleSent", lang) : t("modalTitle", lang)}</span>
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                {state === "sent"
                  ? t("modalSentText", lang)
                  : t("modalHint", lang)}
              </p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label={t("modalClose", lang)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/[0.04] text-lg leading-none text-muted transition-colors hover:bg-black/10 hover:text-ink"
            >
              ×
            </button>
          </div>

          {state === "sent" ? (
            <div className="bg-[#fcfcfd] px-6 py-8">
              <span aria-hidden className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-lg text-emerald-600">
                ✓
              </span>
              <p className="mt-4 text-sm leading-relaxed text-ink-soft">
                {t("modalSentThanks", lang)}
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={close}
                  className="flex h-11 items-center rounded-xl border border-line-strong bg-white px-5 text-sm font-semibold shadow-sm transition-all hover:border-ink hover:text-ink"
                >
                  {t("modalClose", lang)}
                </button>
                <a
                  href={`mailto:${site.email}`}
                  className="rounded-xl border border-line-strong bg-white px-4 py-2 text-xs font-semibold text-ink shadow-sm transition-colors hover:border-ink hover:text-ink"
                >
                  {t("modalAgain", lang)}
                </a>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-5 bg-[#fcfcfd] px-6 py-6">
              <label className="block">
                <span className="label">{t("modalName", lang)}</span>
                <input
                  name="name"
                  required
                  minLength={2}
                  maxLength={80}
                  autoComplete="name"
                  className={field}
                  placeholder={t("modalNamePh", lang)}
                />
              </label>

              <label className="block">
                <span className="label">{t("modalEmail", lang)}</span>
                <input
                  name="email"
                  type="email"
                  required
                  maxLength={120}
                  autoComplete="email"
                  className={field}
                  placeholder={t("modalEmailPh", lang)}
                />
              </label>

              <label className="block">
                <span className="label">{t("modalText", lang)}</span>
                <textarea
                  name="message"
                  required
                  minLength={10}
                  maxLength={4000}
                  rows={5}
                  className={`${field} resize-y`}
                  placeholder={t("modalTextPh", lang)}
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
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-ink-soft">{error}</p>
              ) : null}

              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="submit"
                  disabled={state === "sending"}
                  className="btn-wave-invert flex h-11 items-center rounded-xl bg-ink px-6 text-sm font-semibold text-paper shadow-sm transition-all hover:translate-y-[-1px] hover:shadow-md active:translate-y-0 disabled:opacity-60"
                >
                  <span className="wave-span">
                    {state === "sending" ? t("modalSending", lang) : t("modalSend", lang)}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={close}
                  className="rounded-xl border border-line-strong bg-white px-4 py-2 text-xs font-semibold text-ink shadow-sm transition-colors hover:border-ink hover:text-ink"
                >
                  {t("modalCancel", lang)}
                </button>
              </div>
            </div>
          )}
        </form>
      </dialog>
    </>
  );
}
