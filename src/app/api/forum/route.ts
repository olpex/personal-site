import { NextResponse } from "next/server";
import { isTopic, type ForumAnswer } from "@/lib/forum";

export const runtime = "nodejs";

/**
 * Форум: питання й відповіді.
 *
 * POST — нове питання: реєстрація у public/forum.json + надсилання
 *        в Telegram власника (той самий бот, що й живий чат).
 * GET  — опубліковані записи (з відповідями) + «мої» запити за кодами.
 *
 * Чому той самий файл-сховище й Contents API, що в чаті: репозиторій уже
 * виконує роль сховища, Contents API віддає свіже за ~5 с (raw — до 5 хв
 * кешу). Окреме сховище не потрібне.
 *
 * Потік: сайт пише запис із pending=true → власник у Telegram тисне
 * «Відповісти» на повідомленні з кодом forum:<id> → місток дописує
 * відповідь і знімає pending → запис стає видимим на /forum.
 */

const REPO = "olpex/personal-site";
const FILE_PATH = "public/forum.json";
const BRANCH = "master";

/** Скільки тримаємо файл у пам'яті інстансу (оберігає ліміт GitHub). */
const CACHE_TTL_MS = 8000;

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 10;

type Entry = {
  topic?: string;
  name?: string;
  question?: string;
  at?: string;
  pending?: boolean;
  answers?: ForumAnswer[];
};

type ForumFile = { forum?: Record<string, Entry> };

let cache: { at: number; data: ForumFile } | null = null;

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

/** 8 символів base36 — узгоджено з розпізнавачем у містку («forum:xxxxxxxx»). */
function ticketId() {
  return (
    Date.now().toString(36).slice(-5).padStart(5, "0") +
    Math.random().toString(36).slice(2, 5).padEnd(3, "0")
  );
}

function clean(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.replace(/\r\n/g, "\n").trim().slice(0, max);
}

function readToken() {
  // Той самий env, що й у живого чату — окремого бота форум не потребує.
  return {
    token: process.env.TELEGRAM_SITE_BOT_TOKEN,
    chatId: process.env.TELEGRAM_SITE_CHAT_ID,
  };
}

async function ghHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.raw+json",
    "User-Agent": "oparashchuk-site",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

/** Читає forum.json разом із SHA (SHA потрібен для запису через Contents API). */
async function readForumWithSha(): Promise<{ data: ForumFile; sha: string }> {
  const headers = await ghHeaders();
  const url = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}&cb=${Date.now()}`;
  const res = await fetch(url, { headers, cache: "no-store" });
  if (!res.ok) throw new Error(`github ${res.status}`);
  const data = JSON.parse(await res.text()) as ForumFile;

  const metaRes = await fetch(url, {
    headers: { ...headers, Accept: "application/json" },
    cache: "no-store",
  });
  let sha = "";
  if (metaRes.ok) {
    const meta = (await metaRes.json()) as { sha?: string };
    sha = meta.sha ?? "";
  }
  return { data, sha };
}

async function readForum(): Promise<ForumFile> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.data;
  const { data } = await readForumWithSha();
  cache = { at: Date.now(), data };
  return data;
}

function toEntry(id: string, raw: Entry) {
  return {
    id,
    topic: typeof raw.topic === "string" ? raw.topic : "Інше",
    name: typeof raw.name === "string" ? raw.name : "",
    question: typeof raw.question === "string" ? raw.question : "",
    at: typeof raw.at === "string" ? raw.at : "",
    pending: Boolean(raw.pending),
    answers: Array.isArray(raw.answers)
      ? raw.answers.filter((a) => a && typeof a.text === "string" && a.text.trim())
      : [],
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mine = (url.searchParams.get("mine") ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => /^[a-z0-9]{8}$/.test(s))
    .slice(0, 20);

  try {
    const data = await readForum();
    const all = Object.entries(data.forum ?? {}).map(([id, raw]) => toEntry(id, raw));

    // Публічно — лише те, на що вже є відповідь. Нові записи спершу
    // проходять через власника, тож питання без відповіді не світимо.
    const published = all
      .filter((e) => e.answers.length > 0 && e.question)
      .sort((a, b) => {
        const ta = Math.max(...[a.at, ...a.answers.map((x) => x.at)].map((s) => Date.parse(`${s}Z`) || 0));
        const tb = Math.max(...[b.at, ...b.answers.map((x) => x.at)].map((s) => Date.parse(`${s}Z`) || 0));
        return tb - ta;
      })
      .slice(0, 200);

    // «Мої» — за кодами, які браузер зберіг після надсилання: щоб автор
    // бачив статус свого питання, навіть коли відповіді ще немає.
    const own = mine.length
      ? all.filter((e) => mine.includes(e.id))
      : [];

    return NextResponse.json({ ok: true, entries: published, mine: own });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Не вдалося завантажити форум." },
      { status: 502 },
    );
  }
}

/**
 * Реєструє питання у файлі — щоб місток бачив запис, навіть якщо перша
 * відповідь прийде раніше за наступний запис. Помилку не піднімаємо:
 * реєстрація допоміжна, а питання вже летить у Telegram.
 */
async function registerQuestion(id: string, entry: Entry): Promise<void> {
  if (!process.env.GITHUB_TOKEN) return;
  try {
    const { data, sha } = await readForumWithSha();
    const forum = data.forum ?? {};
    forum[id] = entry;
    data.forum = forum;

    const body = {
      message: `forum(site): питання ${id}`,
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
    cache = null;
  } catch {
    /* допоміжний крок: не ламаємо надсилання через нього */
  }
}

export async function POST(request: Request) {
  const { token, chatId } = readToken();
  if (!token || !chatId) {
    return NextResponse.json(
      { ok: false, error: "Форум тимчасово недоступний. Скористайтеся поштою." },
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

  // Honeypot — реальні люди цього поля не бачать.
  if (clean(payload.company, 60)) return NextResponse.json({ ok: true, id: "" });

  const name = clean(payload.name, 80);
  const topic = clean(payload.topic, 40);
  const question = clean(payload.question, 1500);

  if (name.length < 2) {
    return NextResponse.json({ ok: false, error: "Як до вас звертатися?" }, { status: 400 });
  }
  if (!isTopic(topic)) {
    return NextResponse.json({ ok: false, error: "Оберіть тему питання." }, { status: 400 });
  }
  if (question.length < 10) {
    return NextResponse.json(
      { ok: false, error: "Опишіть питання — хоча б кілька слів." },
      { status: 400 },
    );
  }

  const id = ticketId();
  const at = new Date().toISOString().replace("Z", "").slice(0, 19);

  // Реєструємо ОДНОЧАСНО з надсиланням: місток має бачити запис раніше,
  // ніж власник устигне відповісти.
  const registered = registerQuestion(id, {
    topic,
    name,
    question,
    at,
    answers: [],
    pending: true,
  });

  try {
    const text = [
      `Нове питання на форумі — ${topic}`,
      "",
      `Ім'я: ${name}`,
      "",
      question,
      "",
      `forum:${id}`,
      "",
      "Щоб опублікувати відповідь — натисніть «Відповісти» на ЦЬОМУ повідомленні.",
    ].join("\n");

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    });
    const json = (await res.json()) as { ok?: boolean; description?: string };
    if (!res.ok || !json.ok) {
      console.error("telegram send failed:", res.status, json.description ?? "");
      return NextResponse.json(
        { ok: false, error: "Не вдалося надіслати. Спробуйте ще раз." },
        { status: 502 },
      );
    }

    await registered.catch(() => {});
    return NextResponse.json({ ok: true, id });
  } catch (error) {
    console.error("forum send error:", error);
    return NextResponse.json(
      { ok: false, error: "Не вдалося надіслати. Спробуйте ще раз." },
      { status: 502 },
    );
  }
}