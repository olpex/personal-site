import { NextResponse } from "next/server";

/**
 * Канал живого чату на сайті.
 *
 * POST — нове питання: код звернення + відправка в Telegram власника.
 * GET  — відповіді власника за кодом (читаються з public/replies.json).
 *
 * Чому GitHub Contents API, а не raw.githubusercontent: raw віддає кеш CDN
 * до 5 хвилин, тобто відповідь «зависала» б. Contents API віддає свіже
 * приблизно за 5 секунд — перевірено виміром.
 *
 * Чому не Vercel Blob/KV: сховища в проєкті немає, а його створення через
 * CLI зламане. Репозиторій і без того публічний і вже виконує роль сховища.
 *
 * Токен бота й chat_id живуть лише в env Vercel. Це ОКРЕМИЙ бот від того,
 * що обслуговує чат Hermes: інакше два поллери на одному токені крадуть
 * одне в одного оновлення.
 */

const REPO = "olpex/personal-site";
const FILE_PATH = "public/replies.json";
const BRANCH = "master";

/** Скільки тримаємо відповіді в памʼяті інстансу (оберігає ліміт GitHub). */
const CACHE_TTL_MS = 8000;

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 10;

type RepliesFile = {
  replies?: Record<
    string,
    {
      name?: string;
      createdAt?: string;
      closed?: boolean;
      messages?: { text: string; at: string; from?: string }[];
    }
  >;
};

let cache: { at: number; data: RepliesFile } | null = null;

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function rateLimited(ip: string) {
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || now > b.resetAt) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) if (now > v.resetAt) buckets.delete(k);
    }
    return false;
  }
  b.count += 1;
  return b.count > MAX_PER_WINDOW;
}

function clientIp(request: Request) {
  const fwd = request.headers.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0].trim() : request.headers.get("x-real-ip")) ?? "unknown";
}

/** Короткий ідентифікатор звернення. ЗАВЖДИ 8 символів base36 — саме таку
 *  довжину вимагає розпізнавач коду в Telegram-мості, інакше випадкове
 *  слово на кшталт «#education» пройшло б за код. */
function ticketId() {
  return (
    Date.now().toString(36).slice(-5).padStart(5, "0") +
    Math.random().toString(36).slice(2, 5).padEnd(3, "0")
  );
}

function clean(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

async function readReplies(): Promise<RepliesFile> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.data;

  const headers: Record<string, string> = {
    Accept: "application/vnd.github.raw+json",
    "User-Agent": "oparashchuk-site",
  };
  // Токен (необовʼязковий) піднімає ліміт з 60 до 5000 запитів на годину —
  // без нього опитування з боку відвідувачів швидко впирається в стелю.
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const res = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}&cb=${Date.now()}`,
    { headers, cache: "no-store" },
  );
  if (!res.ok) throw new Error(`github ${res.status}`);

  const text = await res.text();
  const data = JSON.parse(text) as RepliesFile;
  cache = { at: Date.now(), data };
  return data;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = (url.searchParams.get("code") ?? "").trim().toLowerCase();
  if (!/^[a-z0-9]{8}$/.test(code)) {
    return NextResponse.json({ ok: false, error: "Невірний код." }, { status: 400 });
  }

  try {
    const data = await readReplies();
    const entry = data.replies?.[code];
    if (!entry) {
      // Питань із таким кодом ще немає (або відповідь ще не опубліковано).
      return NextResponse.json({ ok: true, messages: [], closed: false, waiting: true });
    }
    const messages = (entry.messages ?? []).filter((m) => (m.text ?? "").trim().length > 0);
    return NextResponse.json({
      ok: true,
      messages,
      closed: Boolean(entry.closed),
      waiting: messages.length === 0,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Не вдалося перевірити відповідь." },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  const token = process.env.TELEGRAM_SITE_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_SITE_CHAT_ID;
  if (!token || !chatId) {
    return NextResponse.json(
      { ok: false, error: "Чат тимчасово недоступний. Скористайтеся поштою." },
      { status: 503 },
    );
  }

  if (rateLimited(clientIp(request))) {
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

  // Honeypot: реальні люди цього поля не бачать.
  if (clean(payload.company, 60)) return NextResponse.json({ ok: true, id: "" });

  const name = clean(payload.name, 80);
  const message = clean(payload.message, 2000);
  if (name.length < 2) {
    return NextResponse.json({ ok: false, error: "Як до вас звертатися?" }, { status: 400 });
  }
  if (message.length < 2) {
    return NextResponse.json({ ok: false, error: "Напишіть питання." }, { status: 400 });
  }

  // Код: або наявний (продовження розмови), або новий.
  const given = clean(payload.code, 12).toLowerCase();
  const code = /^[a-z0-9]{8}$/.test(given) ? given : ticketId();

  const text = [
    "Нове питання з сайту",
    "",
    `Ім'я: ${name}`,
    "",
    message,
    "",
    `Код: #${code}`,
    "",
    "Щоб відповісти — натисніть «Відповісти» на ЦЬОМУ повідомленні.",
  ].join("\n");

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
    });
    const json = (await res.json()) as { ok?: boolean; description?: string };
    if (!res.ok || !json.ok) {
      console.error("telegram send failed:", res.status, json.description);
      return NextResponse.json(
        { ok: false, error: "Не вдалося надіслати питання. Спробуйте ще раз." },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, id: code });
  } catch (error) {
    console.error("telegram request error:", error);
    return NextResponse.json(
      { ok: false, error: "Не вдалося надіслати питання. Спробуйте ще раз." },
      { status: 502 },
    );
  }
}
