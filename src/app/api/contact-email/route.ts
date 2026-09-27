import { NextResponse } from "next/server";

/**
 * Приймає повідомлення з поштової форми на сайті й надсилає його листом
 * на адресу власника (MAIL_TO) через Gmail API від імені того ж акаунта.
 *
 * Чому Gmail API, а не SMTP: у акаунта вже є OAuth-токен зі скоупом
 * gmail.send, і це єдиний канал, який тут справді перевірено. Секрети
 * (client_id / client_secret / refresh_token) живуть лише в env Vercel —
 * браузер їх не бачить, форма ходить на цей роут.
 *
 * Reply-To ставимо на адресу відвідувача, тож у Gmail достатньо натиснути
 * «Відповісти» — лист піде людині, а не самому собі.
 *
 * getUpdates/Telegram тут не задіяні: це суто поштовий канал.
 */

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

/** RFC 2047 для кириличних тем у заголовку листа. */
function encodeHeader(value: string) {
  return `=?UTF-8?B?${Buffer.from(value, "utf-8").toString("base64")}?=`;
}

function base64url(value: string) {
  return Buffer.from(value, "utf-8").toString("base64url");
}

async function gmailAccessToken() {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    console.error("gmail token refresh failed:", res.status, await res.text());
    return null;
  }
  const data = (await res.json()) as { access_token?: string };
  return data.access_token ?? null;
}

export async function POST(request: Request) {
  const mailTo = process.env.MAIL_TO;
  if (!mailTo) {
    return NextResponse.json(
      { ok: false, error: "Поштовий канал не налаштовано." },
      { status: 500 },
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

  // Ті самі запобіжники, що й були: honeypot і мінімальний час заповнення.
  if (clean(payload.company, 60)) return NextResponse.json({ ok: true });
  const elapsed = Number(payload.elapsed ?? 0);
  if (Number.isFinite(elapsed) && elapsed > 0 && elapsed < MIN_FILL_MS) {
    return NextResponse.json({ ok: true });
  }

  const name = clean(payload.name, 80);
  const email = clean(payload.email, 120);
  const message = typeof payload.message === "string"
    ? payload.message.replace(/\r\n/g, "\n").trim().slice(0, 4000)
    : "";

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Вкажіть коректну електронну адресу." },
      { status: 400 },
    );
  }
  if (message.length < 10) {
    return NextResponse.json(
      { ok: false, error: "Опишіть питання — хоча б кілька слів." },
      { status: 400 },
    );
  }

  const accessToken = await gmailAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { ok: false, error: "Поштовий канал тимчасово недоступний." },
      { status: 502 },
    );
  }

  const subject = name ? `Питання з сайту — ${name}` : "Питання з сайту";
  const body = [
    `Ім'я: ${name || "не вказано"}`,
    `Пошта: ${email}`,
    "",
    message,
    "",
    "— надіслано з форми на oparashchuk.com",
  ].join("\n");

  // Заголовки збираємо вручну: кирилиця в Subject мусить бути RFC 2047,
  // інакше Gmail показує «=?UTF-8?...?=» замість тексту.
  const raw = [
    `To: ${mailTo}`,
    `From: ${mailTo}`,
    `Reply-To: ${email}`,
    `Subject: ${encodeHeader(subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(body, "utf-8").toString("base64"),
  ].join("\r\n");

  try {
    const res = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw: base64url(raw) }),
      },
    );
    if (!res.ok) {
      console.error("gmail send failed:", res.status, await res.text());
      return NextResponse.json(
        { ok: false, error: "Не вдалося надіслати лист. Спробуйте ще раз." },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("gmail request error:", error);
    return NextResponse.json(
      { ok: false, error: "Не вдалося надіслати лист. Спробуйте ще раз." },
      { status: 502 },
    );
  }
}
