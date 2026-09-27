import { NextResponse } from "next/server";

/**
 * Приймає питання з форми на сайті й надсилає його в Telegram Олегу.
 *
 * Свідомі рішення:
 * - Токен і chat_id живуть ТІЛЬКИ у змінних середовища Vercel. Клієнт їх
 *   не бачить: форма ходить на цей роут, а не в api.telegram.org напряму.
 * - getUpdates тут не викликається НІКОЛИ: той самий бот полить gateway
 *   Hermes, і getUpdates украв би апдейти. Надсилання (sendMessage) не
 *   конфліктує з полінгом.
 * - Rate limit у пам'яті процесу: на serverless він слабкий (кожна
 *   інстанція має свою мапу), але відбиває простий флуд з однієї сторінки.
 * - Honeypot + мінімальний час заповнення — від ботів, без капчі.
 */

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 4;
const MIN_FILL_MS = 1200;

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function rateLimited(ip: string) {
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || now > b.resetAt) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  b.count += 1;
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (now > v.resetAt) buckets.delete(k);
  }
  return b.count > MAX_PER_WINDOW;
}

function clientIp(request: Request) {
  const fwd = request.headers.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0] : request.headers.get("x-real-ip")) ?? "unknown";
}

function clean(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Короткий читабельний ідентифікатор звернення — щоб відповідь мала до чого
 *  прив'язатись. Завжди РІВНО 8 символів base36: розпізнавач у Telegram-мості
 *  вимагає саме такої довжини, тому частину від часу доповнюємо нулями. */
function ticketId() {
  return (
    Date.now().toString(36).slice(-5).padStart(5, "0") +
    Math.random().toString(36).slice(2, 5).padEnd(3, "0")
  );
}

export async function POST(request: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return NextResponse.json(
      { ok: false, error: "Канал зв'язку не налаштовано." },
      { status: 500 },
    );
  }

  const ip = clientIp(request);
  if (rateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "Забагато повідомлень. Спробуйте за кілька хвилин." },
      { status: 429 },
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Некоректний запит." }, { status: 400 });
  }

  // Honeypot: поле, якого людина не бачить. Заповнене — це бот.
  if (clean(payload.company, 60)) {
    return NextResponse.json({ ok: true, id: "-" });
  }
  // Заповнення за 1.2 с — теж ознака бота.
  const elapsed = Number(payload.elapsed ?? 0);
  if (Number.isFinite(elapsed) && elapsed > 0 && elapsed < MIN_FILL_MS) {
    return NextResponse.json({ ok: true, id: "-" });
  }

  const name = clean(payload.name, 80);
  const contact = clean(payload.contact, 120);
  const message = typeof payload.message === "string"
    ? payload.message.trim().slice(0, 2000)
    : "";

  if (name.length < 2) {
    return NextResponse.json({ ok: false, error: "Вкажіть ім'я." }, { status: 400 });
  }
  if (message.length < 10) {
    return NextResponse.json(
      { ok: false, error: "Опишіть питання — хоча б кілька слів." },
      { status: 400 },
    );
  }

  const id = ticketId();
  const text =
    `📬 <b>Питання з сайту</b>\n\n` +
    `<b>Ім'я:</b> ${escapeHtml(name)}\n` +
    (contact ? `<b>Контакт:</b> ${escapeHtml(contact)}\n` : "") +
    `\n${escapeHtml(message)}\n\n` +
    `<i>Код звернення:</i> <code>#${id}</code>\n` +
    `Щоб відповісти — напишіть у відповідь на це повідомлення.`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    const data = (await res.json()) as { ok?: boolean; description?: string };

    if (!res.ok || !data.ok) {
      console.error("telegram sendMessage failed:", res.status, data.description);
      return NextResponse.json(
        { ok: false, error: "Не вдалося надіслати. Спробуйте ще раз." },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, id });
  } catch (error) {
    console.error("telegram request error:", error);
    return NextResponse.json(
      { ok: false, error: "Не вдалося надіслати. Спробуйте ще раз." },
      { status: 502 },
    );
  }
}
