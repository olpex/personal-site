import { NextResponse } from "next/server";

/**
 * Віддає відповідь на конкретне звернення з сайту.
 *
 * Джерело — public/replies.json у публічному репозиторії: коли Олег
 * відповідає в Telegram, файл оновлюється одним комітом, і відвідувач
 * бачить відповідь у вікні без передеплою сайту.
 *
 * Спочатку пробуємо raw.githubusercontent (свіжий стан), потім — власний
 * origin (те, що вміщено в деплой). Якщо обидва недоступні — чесно
 * повертаємо "відповіді ще немає", а не помилку.
 */

const RAW =
  "https://raw.githubusercontent.com/olpex/personal-site/master/public/replies.json";

type Entry = { reply?: string; answeredAt?: string };
type Store = { replies?: Record<string, Entry> };

async function loadStore(request: Request): Promise<Store | null> {
  const sources = [
    RAW,
    new URL("/replies.json", request.url).toString(),
  ];
  for (const url of sources) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) continue;
      return (await res.json()) as Store;
    } catch {
      // пробуємо наступне джерело
    }
  }
  return null;
}

export async function GET(request: Request) {
  const id = (new URL(request.url).searchParams.get("id") ?? "").trim();
  if (!/^[a-z0-9]{6,24}$/.test(id)) {
    return NextResponse.json({ ok: false, error: "Некоректний код." }, { status: 400 });
  }

  const store = await loadStore(request);
  if (!store) {
    return NextResponse.json({ ok: true, replied: false });
  }

  const entry = store.replies?.[id];
  if (!entry?.reply) {
    return NextResponse.json({ ok: true, replied: false });
  }
  return NextResponse.json({
    ok: true,
    replied: true,
    reply: entry.reply,
    answeredAt: entry.answeredAt ?? null,
  });
}
