import { NextResponse } from "next/server";

export const runtime = "nodejs";

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

/** Файли з чату. Стеля — ліміт тіла запиту на Vercel (~4.5 МБ), тому
 *  тримаємо 4 МБ: більший файл платформа відкине ще до нашого коду. */
const MAX_FILE_BYTES = 4 * 1024 * 1024;

/** Виконувані формати не приймаємо — це чат, а не файлообмінник. */
const BLOCKED_EXT = new Set([
  "exe", "msi", "bat", "cmd", "com", "scr", "pif", "dll", "app", "action",
  "sh", "bash", "js", "mjs", "vbs", "ps1", "jar",
]);

type ReplyEntry = {
  name?: string;
  createdAt?: string;
  closed?: boolean;
  messages?: { text: string; at: string; from?: string }[];
  /** Репліки відвідувача, збережені на сервері: тоді історія не залежить
   *  від браузера й доступна з будь-якого пристрою. */
  visitor?: { text: string; at: string }[];
};

type RepliesFile = {
  replies?: Record<string, ReplyEntry>;
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

/**
 * Читає файл разом із його SHA — SHA потрібен для запису через Contents API
 * (без нього GitHub відхиляє оновлення як конфлікт).
 */
async function readRepliesWithSha(): Promise<{ data: RepliesFile; sha: string }> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.raw+json",
    "User-Agent": "oparashchuk-site",
  };
  // Токен піднімає ліміт з 60 до 5000 запитів на годину — без нього
  // опитування з боку відвідувачів швидко впирається в стелю.
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const url = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}&cb=${Date.now()}`;
  const res = await fetch(url, { headers, cache: "no-store" });
  if (!res.ok) throw new Error(`github ${res.status}`);

  // Без Accept: raw заголовок X-GitHub-SHA не потрапляє у відповідь, тому
  // беремо метадані окремо, а вміст — із того ж запиту.
  const text = await res.text();
  const data = JSON.parse(text) as RepliesFile;

  const metaRes = await fetch(url, { headers: { ...headers, Accept: "application/json" }, cache: "no-store" });
  let sha = "";
  if (metaRes.ok) {
    const meta = (await metaRes.json()) as { sha?: string };
    sha = meta.sha ?? "";
  }
  return { data, sha };
}

async function readReplies(): Promise<RepliesFile> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.data;
  const { data } = await readRepliesWithSha();
  cache = { at: Date.now(), data };
  return data;
}

/**
 * Реєструє звернення у файлі — щоб місток знав про нього ДО першої відповіді.
 *
 * Навіщо: раніше про нове звернення знав лише Telegram. Місток не бачив його
 * у файлі, тож коли власник відповідав без кнопки «Відповісти», адресат
 * «вгадувався» — і текст ішов чужій людині.
 *
 * Помилку НЕ піднімаємо: реєстрація допоміжна, і питання вже полетіло
 * в Telegram. Краще втратити запис, ніж зламати надсилання.
 */
async function registerTicket(code: string, name: string, text: string): Promise<void> {
  if (!process.env.GITHUB_TOKEN) return;
  try {
    const { data, sha } = await readRepliesWithSha();
    const replies = data.replies ?? {};
    const entry = replies[code] ?? { messages: [] };
    entry.name = name;
    entry.createdAt = entry.createdAt ?? new Date().toISOString().replace("Z", "").slice(0, 19);
    // Репліку відвідувача зберігаємо теж — тоді історія живе на сервері,
    // а не лише в браузері, і її видно з будь-якого пристрою.
    entry.visitor = entry.visitor ?? [];
    entry.visitor.push({ text, at: new Date().toISOString().replace("Z", "").slice(0, 19) });
    replies[code] = entry;
    data.replies = replies;

    const body = {
      message: `chat(site): звернення #${code}`,
      content: Buffer.from(JSON.stringify(data, null, 2) + "\n", "utf-8").toString("base64"),
      branch: BRANCH,
      ...(sha ? { sha } : {}),
    };
    await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "User-Agent": "oparashchuk-site",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    cache = null; // наступне читання має взяти свіже
  } catch {
    /* допоміжний крок: не ламаємо надсилання через нього */
  }
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
    const visitor = (entry.visitor ?? []).filter((m) => (m.text ?? "").trim().length > 0);
    return NextResponse.json({
      ok: true,
      messages,
      visitor,
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

  const ct = request.headers.get("content-type") ?? "";
  const isMultipart = ct.includes("multipart/form-data");

  let name = "";
  let message = "";
  let company = "";
  let given = "";
  let action = "";
  let file: File | null = null;

  if (isMultipart) {
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return NextResponse.json({ ok: false, error: "Некоректний запит." }, { status: 400 });
    }
    name = clean(form.get("name"), 80);
    message = clean(form.get("message"), 2000);
    company = clean(form.get("company"), 60);
    given = clean(form.get("code"), 12).toLowerCase();
    action = clean(form.get("action"), 20);
    const f = form.get("file");
    if (f instanceof File && f.size > 0) file = f;
  } else {
    let payload: Record<string, unknown>;
    try {
      payload = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ ok: false, error: "Некоректний запит." }, { status: 400 });
    }
    name = clean(payload.name, 80);
    message = clean(payload.message, 2000);
    company = clean(payload.company, 60);
    given = clean(payload.code, 12).toLowerCase();
    action = clean(payload.action, 20);
  }

  // Honeypot: реальні люди цього поля не бачать.
  if (company) return NextResponse.json({ ok: true, id: "" });

  // Закриття розмови З БОКУ ВІДВІДУВАЧА: нічого не надсилаємо в Telegram,
  // лише повідомляємо містку, щоб власник знав, що діалог завершено.
  if (action === "close") {
    const code = given;
    if (!/^[a-z0-9]{8}$/.test(code)) {
      return NextResponse.json({ ok: false, error: "Невірний код." }, { status: 400 });
    }
    try {
      const text = [
        "🔒 Відвідувач закрив розмову",
        "",
        `Код: #${code}`,
        "",
        "Якщо потрібно — напишіть на пошту.",
      ].join("\n");
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
      });
    } catch {
      /* не критично: розмова вже закрита на боці відвідувача */
    }
    return NextResponse.json({ ok: true, id: code });
  }

  if (name.length < 2) {
    return NextResponse.json({ ok: false, error: "Як до вас звертатися?" }, { status: 400 });
  }

  // Достатньо тексту АБО файлу — саме щоб можна було надіслати лише документ.
  const hasFile = Boolean(file);
  if (!hasFile && message.length < 2) {
    return NextResponse.json(
      { ok: false, error: "Напишіть питання або додайте файл." },
      { status: 400 },
    );
  }

  if (file) {
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { ok: false, error: `Файл завеликий — максимум ${Math.round(MAX_FILE_BYTES / 1024 / 1024)} МБ.` },
        { status: 400 },
      );
    }
    if (file.size === 0) {
      return NextResponse.json({ ok: false, error: "Файл порожній." }, { status: 400 });
    }
    const ext = (file.name.split(".").pop() ?? "").toLowerCase();
    if (ext && BLOCKED_EXT.has(ext)) {
      return NextResponse.json({ ok: false, error: "Такий тип файлу надіслати не можна." }, { status: 400 });
    }
    if (file.name.length > 120) {
      return NextResponse.json({ ok: false, error: "Назва файлу занадто довга." }, { status: 400 });
    }
  }

  // Код: або наявний (продовження розмови), або новий.
  const isFollowUp = /^[a-z0-9]{8}$/.test(given);
  const code = isFollowUp ? given : ticketId();

  // Що показуємо у стрічці як репліку відвідувача. Для файлу — іконка й назва,
  // щоб історія не залежала від того, чи браузер ще тримає сам файл.
  const sizeKb = file ? Math.max(1, Math.round(file.size / 1024)) : 0;
  const attachment = file ? `📎 ${file.name} (${sizeKb} КБ)` : "";
  const visitorText = [message, attachment].filter(Boolean).join("\n") || "(файл)";

  // Реєструємо звернення у файлі ОДНОЧАСНО з надсиланням у Telegram: місток
  // має бачити розмову ДО першої відповіді, інакше адресат «вгадується».
  const registered = registerTicket(code, name, visitorText);

  const header = isFollowUp ? "Уточнення з сайту" : "Нове питання з сайту";

  try {
    let ok = false;
    let description = "";

    if (file) {
      // Файл надсилаємо як документ: Telegram збереже оригінальну назву,
      // а власник завантажить його одним кліком. Підпис несе код розмови,
      // тож кнопка «Відповісти» на цьому повідомленні працює як завжди.
      const caption = [
        `${header} — з файлом`,
        "",
        `Ім'я: ${name}`,
        "",
        message || "(без тексту — лише файл)",
        "",
        `Код: #${code}`,
        "",
        "Щоб відповісти — натисніть «Відповісти» на ЦЬОМУ повідомленні.",
      ].join("\n");

      const tg = new FormData();
      tg.append("chat_id", chatId);
      tg.append("caption", caption.slice(0, 1024));
      tg.append("document", file, file.name);

      const res = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
        method: "POST",
        body: tg,
      });
      const json = (await res.json()) as { ok?: boolean; description?: string };
      ok = Boolean(res.ok && json.ok);
      description = json.description ?? "";
      if (!ok) console.error("telegram sendDocument failed:", res.status, description);
    } else {
      const text = [
        header,
        "",
        `Ім'я: ${name}`,
        "",
        message,
        "",
        `Код: #${code}`,
        "",
        "Щоб відповісти — натисніть «Відповісти» на ЦЬОМУ повідомленні.",
      ].join("\n");

      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
      });
      const json = (await res.json()) as { ok?: boolean; description?: string };
      ok = Boolean(res.ok && json.ok);
      description = json.description ?? "";
      if (!ok) console.error("telegram send failed:", res.status, description);
    }

    if (!ok) {
      return NextResponse.json(
        { ok: false, error: "Не вдалося надіслати. Спробуйте ще раз." },
        { status: 502 },
      );
    }

    await registered.catch(() => {});
    return NextResponse.json({ ok: true, id: code });
  } catch (error) {
    console.error("telegram request error:", error);
    return NextResponse.json(
      { ok: false, error: "Не вдалося надіслати. Спробуйте ще раз." },
      { status: 502 },
    );
  }
}
