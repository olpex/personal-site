/**
 * i18n-sync — автоматичний переклад контенту сайту з української англійською (DeepL).
 *
 * Навіщо: uk-тексти живуть в src/content/site.ts (джерело правди). Щоб після
 * будь-якої правки не просити переклад окремо, цей скрипт сам добирає нові та
 * змінені рядки через DeepL і перегенеровує src/content/site-en.ts.
 *
 * Як працює:
 *   1. Обходить перекладні поля site.ts (спека SPEC нижче) і збирає ті рядки,
 *      яких немає в кеші src/content/i18n-memory.json (кеш чинний лише тоді,
 *      коли uk-текст не змінився).
 *   2. Перекладає зібране через DeepL (по 40 текстів на запит).
 *   3. Складає src/content/site-en.ts: siteEn + мапи підписів і пише кеш.
 *
 * Свідомо НЕ перекладається:
 *   • ім'я та скорочення закладу — фіксовані значення з i18n-config.json;
 *   • цитати відгуків, імена авторів, назви курсів у відгуках;
 *   • назви й видавці сертифікатів (офіційні назви);
 *   • seoTitle / seoDescription (мета лишається українською).
 *   Машиновий переклад не сміє переписувати чужі цитати — політика сайту.
 *
 * Запуск:
 *   npx tsx scripts/i18n-sync.ts           # синхронізувати, переписати site-en.ts
 *   npx tsx scripts/i18n-sync.ts --dry     # лише показати, що буде перекладено
 *   npx tsx scripts/i18n-sync.ts --seed    # разово: наповнити кеш із наявного site-en.ts
 *
 * Ключ DeepL: змінна DEEPL_API_KEY (або рядок DEEPL_API_KEY=... у ~/.hermes/.env).
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { site } from "../src/content/site";
import { FORUM_TOPICS } from "../src/lib/forum";
import {
  certGroupLabels as prevCertGroupLabels,
  certHrefLabels as prevCertHrefLabels,
  certNoteLabels as prevCertNoteLabels,
  forumTopicLabels as prevForumTopicLabels,
  reviewGroupLabels as prevReviewGroupLabels,
  siteEn as prevSiteEn,
} from "../src/content/site-en";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const CONFIG_PATH = join(ROOT, "src/content/i18n-config.json");
const MEMORY_PATH = join(ROOT, "src/content/i18n-memory.json");
const OUT_PATH = join(ROOT, "src/content/site-en.ts");

const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const SEED = args.includes("--seed");
const QUIET = args.includes("--quiet");

/* ── Спека: що саме перекладається ─────────────────────────────────── */

/** Прості рядкові поля site.ts. */
const STRING_FIELDS = ["role", "statement", "portraitAlt", "educationLabel"] as const;

/** Поля — масиви рядків. */
const STRING_ARRAY_FIELDS = ["about", "keywords"] as const;

/** Масиви об'єктів: поля-рядки та (необов'язково) вкладені масиви рядків. */
const OBJECT_ARRAY_FIELDS: readonly {
  path: string;
  fields: readonly string[];
  arrayFields?: readonly string[];
}[] = [
  { path: "method", fields: ["title", "body"] },
  { path: "facts", fields: ["k", "v"] },
  { path: "reviewStats", fields: ["k", "v"] },
  { path: "projects", fields: ["title", "kind", "outcome"], arrayFields: ["stack"] },
  { path: "socials", fields: ["label"] },
];

/** Мапи підписів: ключі беруться з uk-даних. */
const MAP_SOURCES: readonly { name: string; from: string; field: string }[] = [
  { name: "reviewGroupLabels", from: "reviews", field: "group" },
  { name: "certGroupLabels", from: "certificates", field: "group" },
  { name: "certNoteLabels", from: "certificates", field: "note" },
  { name: "certHrefLabels", from: "certificates", field: "hrefLabel" },
];

/* ── Типи ──────────────────────────────────────────────────────────── */

type Dict = Record<string, unknown>;
type Memory = {
  v: number;
  texts: Record<string, { uk: string; en: string }>;
  maps: Record<string, Record<string, string>>;
};
type Config = {
  fixed: Record<string, string>;
  terms: [string, string][];
  reviewGroupShort: Record<string, string>;
};

/* ── Утиліти ───────────────────────────────────────────────────────── */

function readJson<T>(path: string, fallback: T): T {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function log(...parts: unknown[]): void {
  if (!QUIET) console.log(...parts);
}

function loadKey(): string | null {
  if (process.env.DEEPL_API_KEY) return process.env.DEEPL_API_KEY;
  const envPath = join(homedir(), ".hermes/.env");
  if (!existsSync(envPath)) return null;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    if (line.startsWith("DEEPL_API_KEY=")) return line.slice("DEEPL_API_KEY=".length).trim();
  }
  return null;
}

/** Підстановка термінів (імена, назви закладів) ДО перекладу. */
function applyTerms(text: string, terms: Config["terms"]): string {
  let out = text;
  for (const [uk, en] of terms) out = out.split(uk).join(en);
  return out;
}

/* ── DeepL ─────────────────────────────────────────────────────────── */

async function deeplTranslate(texts: string[], key: string): Promise<string[]> {
  const endpoint = key.endsWith(":fx")
    ? "https://api-free.deepl.com/v2/translate"
    : "https://api.deepl.com/v2/translate";
  const out: string[] = [];
  const BATCH = 40;
  for (let i = 0; i < texts.length; i += BATCH) {
    const batch = texts.slice(i, i + BATCH);
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: batch, source_lang: "UK", target_lang: "EN-US" }),
    });
    if (!res.ok) throw new Error(`DeepL HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = (await res.json()) as { translations: { text: string }[] };
    if (data.translations.length !== batch.length) {
      throw new Error(`DeepL повернув ${data.translations.length} перекладів на ${batch.length}`);
    }
    out.push(...data.translations.map((t) => t.text));
  }
  return out;
}

/* ── Серіалізація TS ───────────────────────────────────────────────── */

function keyRepr(k: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k) ? k : JSON.stringify(k);
}

function serialize(value: unknown, pad = ""): string {
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null || value === undefined) return "null";
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const inner = value.map((v) => serialize(v, pad + "  ")).join(",\n" + pad + "  ");
    return `[\n${pad}  ${inner},\n${pad}]`;
  }
  const entries = Object.entries(value as Dict).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return "{}";
  const inner = entries
    .map(([k, v]) => `${keyRepr(k)}: ${serialize(v, pad + "  ")}`)
    .join(",\n" + pad + "  ");
  return `{\n${pad}  ${inner},\n${pad}}`;
}

/* ── Стан ──────────────────────────────────────────────────────────── */

const config = readJson<Config>(CONFIG_PATH, { fixed: {}, terms: [], reviewGroupShort: {} });
const memory = readJson<Memory>(MEMORY_PATH, { v: 1, texts: {}, maps: {} });
memory.texts ??= {};
memory.maps ??= {};

const uk = site as unknown as Dict;
const prev = prevSiteEn as unknown as Dict;

/** Зібрані «промахи»: унікальний uk-текст → ключі, які його чекають. */
const misses = new Map<string, string[]>();
/** Результати перекладу: uk-текст → en-текст. */
const translated = new Map<string, string>();

function seedMapFor(mapName: string): Record<string, string> | undefined {
  switch (mapName) {
    case "reviewGroupLabels":
      return Object.fromEntries(
        Object.entries(prevReviewGroupLabels as unknown as Record<string, { en: string }>).map(
          ([k, v]) => [k, v.en],
        ),
      );
    case "certGroupLabels":
      return prevCertGroupLabels as unknown as Record<string, string>;
    case "certNoteLabels":
      return prevCertNoteLabels as unknown as Record<string, string>;
    case "certHrefLabels":
      return prevCertHrefLabels as unknown as Record<string, string>;
    case "forumTopicLabels":
      return prevForumTopicLabels as unknown as Record<string, string>;
    default:
      return undefined;
  }
}

/** Кешований переклад поля; якщо немає — реєструє потребу й повертає "". */
function lookupText(key: string, ukText: string, seedText?: string): string {
  const cached = memory.texts[key];
  if (cached && cached.uk === ukText) return cached.en;
  const done = translated.get(ukText);
  if (done !== undefined) return done;
  if (SEED && seedText) {
    memory.texts[key] = { uk: ukText, en: seedText };
    return seedText;
  }
  const keys = misses.get(ukText) ?? [];
  keys.push(key);
  misses.set(ukText, keys);
  return "";
}

/** Те саме для мап підписів. */
function lookupMap(mapName: string, ukValue: string): string {
  const cached = memory.maps[mapName]?.[ukValue];
  if (cached) return cached;
  const done = translated.get(ukValue);
  if (done !== undefined) return done;
  const seedValue = SEED ? seedMapFor(mapName)?.[ukValue] : undefined;
  if (seedValue) {
    (memory.maps[mapName] ??= {})[ukValue] = seedValue;
    return seedValue;
  }
  const keys = misses.get(ukValue) ?? [];
  keys.push(`${mapName}\u0000${ukValue}`);
  misses.set(ukValue, keys);
  return "";
}

/* ── Обхід: збирає структуру (перший прохід — з реєстрацією промахів) ── */

function build(resolveText: (key: string, ukText: string, seed?: string) => string,
               resolveMap: (mapName: string, ukValue: string) => string):
  { en: Dict; maps: Record<string, Dict> } {
  const en: Dict = {};

  for (const [k, v] of Object.entries(config.fixed)) en[k] = v;

  for (const field of STRING_FIELDS) {
    const value = uk[field];
    if (typeof value === "string") en[field] = resolveText(field, value, prev[field] as string | undefined);
  }

  for (const field of STRING_ARRAY_FIELDS) {
    const arr = uk[field];
    if (!Array.isArray(arr)) continue;
    const prevArr = Array.isArray(prev[field]) ? (prev[field] as string[]) : [];
    en[field] = (arr as string[]).map((t, i) => resolveText(`${field}[${i}]`, t, prevArr[i]));
  }

  for (const spec of OBJECT_ARRAY_FIELDS) {
    const arr = uk[spec.path];
    if (!Array.isArray(arr)) continue;
    const prevArr = Array.isArray(prev[spec.path]) ? (prev[spec.path] as Dict[]) : [];
    en[spec.path] = (arr as Dict[]).map((item, i) => {
      const clone: Dict = { ...item };
      for (const field of spec.fields) {
        const value = item[field];
        if (typeof value === "string") {
          clone[field] = resolveText(
            `${spec.path}[${i}].${field}`,
            value,
            prevArr[i]?.[field] as string | undefined,
          );
        }
      }
      for (const field of spec.arrayFields ?? []) {
        const value = item[field];
        if (!Array.isArray(value)) continue;
        const prevInner = Array.isArray(prevArr[i]?.[field])
          ? (prevArr[i][field] as string[])
          : [];
        clone[field] = (value as string[]).map((t, j) =>
          resolveText(`${spec.path}[${i}].${field}[${j}]`, t, prevInner[j]),
        );
      }
      return clone;
    });
  }

  /* Мапи підписів */
  const harvested = new Map<string, Set<string>>();
  const addKey = (name: string, value: unknown): void => {
    if (typeof value !== "string" || value.length === 0) return;
    const set = harvested.get(name) ?? new Set<string>();
    set.add(value);
    harvested.set(name, set);
  };
  for (const src of MAP_SOURCES) {
    const arr = uk[src.from];
    if (!Array.isArray(arr)) continue;
    for (const item of arr as Dict[]) addKey(src.name, item[src.field]);
  }
  for (const topic of FORUM_TOPICS as readonly string[]) addKey("forumTopicLabels", topic);

  const maps: Record<string, Dict> = {};
  for (const [name, values] of harvested) {
    const out: Record<string, unknown> = {};
    for (const ukValue of values) {
      const value = resolveMap(name, ukValue) || ukValue;
      out[ukValue] =
        name === "reviewGroupLabels"
          ? { en: value, short: config.reviewGroupShort[ukValue] ?? value }
          : value;
    }
    maps[name] = out;
  }

  return { en, maps };
}

/* ── Фаза 1: збір ──────────────────────────────────────────────────── */

build(lookupText, lookupMap);

const uniqueTexts = [...misses.keys()];
const chars = uniqueTexts.reduce((n, t) => n + t.length, 0);
log(
  `i18n-sync: до перекладу ${uniqueTexts.length} унікальних рядків (${chars} симв. із 500 000/міс на Free-плані)`,
);

async function main(): Promise<void> {
  /* ── Фаза 2: переклад ── */


if (uniqueTexts.length > 0) {
  if (DRY) {
    for (const t of uniqueTexts.slice(0, 12)) log("  •", t.replace(/\s+/g, " ").slice(0, 110));
    if (uniqueTexts.length > 12) log(`  … ще ${uniqueTexts.length - 12}`);
    log("i18n-sync: --dry — файли не змінено.");
    process.exit(0);
  }
  const key = loadKey();
  if (!key) {
    console.error("i18n-sync: немає DEEPL_API_KEY — перекласти нічим, файли не змінено.");
    process.exit(1);
  }
  let ok = false;
  for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
    try {
      const prepared = uniqueTexts.map((t) => applyTerms(t, config.terms));
      const result = await deeplTranslate(prepared, key);
      result.forEach((value, i) => translated.set(uniqueTexts[i], value));
      ok = true;
    } catch (err) {
      console.error(`i18n-sync: спроба ${attempt} — ${(err as Error).message}`);
      if (attempt < 3) await new Promise((r) => setTimeout(r, 4000));
    }
  }
  if (!ok) {
    console.error("i18n-sync: DeepL недоступний — site-en.ts лишено без змін.");
    process.exit(1);
  }
  /* Запис у кеш результатів */
  for (const [ukText, keys] of misses) {
    const enText = translated.get(ukText);
    if (!enText) continue;
    for (const k of keys) {
      const sep = k.indexOf("\u0000");
      if (sep === -1) {
        memory.texts[k] = { uk: ukText, en: enText };
      } else {
        const name = k.slice(0, sep);
        (memory.maps[name] ??= {})[k.slice(sep + 1)] = enText;
      }
    }
  }
}

/* ── Фаза 3: складання файлу (кеш уже повний) ──────────────────────── */

const { en, maps } = build(
  (key, ukText, seed) => lookupTextAfterTranslate(key, ukText, seed),
  (name, ukValue) => lookupMapAfterTranslate(name, ukValue),
);

function lookupTextAfterTranslate(key: string, ukText: string, seedText?: string): string {
  const cached = memory.texts[key];
  if (cached && cached.uk === ukText) return cached.en;
  const done = translated.get(ukText);
  if (done !== undefined) return done;
  /* Немає перекладу — лишаємо uk-текст: краще зрозумілий uk, ніж порожньо. */
  log(`i18n-sync: увага — без перекладу лишилось поле ${key}`);
  return seedText ?? ukText;
}

function lookupMapAfterTranslate(name: string, ukValue: string): string {
  return memory.maps[name]?.[ukValue] ?? translated.get(ukValue) ?? ukValue;
}

const header = `/**
 * АНГЛІЙСЬКІ ТЕКСТИ — ФАЙЛ ЗГЕНЕРОВАНО. НЕ РЕДАГУВАТИ ВРУЧНУ.
 *
 * Джерело правди — src/content/site.ts (українською). Переклад робить
 * scripts/i18n-sync.ts через DeepL: змінили uk-текст — синхронізація
 * оновлює цей файл автоматично.
 *
 * Кеш перекладів — src/content/i18n-memory.json (щоб не платити двічі за те
 * саме). Постійні значення (ім'я, назва закладу, короткі підписи) —
 * src/content/i18n-config.json. Хелпери підписів — src/content/i18n-labels.ts.
 *
 * Свідомо НЕ перекладається: цитати відгуків (належать авторам), назви та
 * видавці сертифікатів (офіційні назви), seoTitle/seoDescription.
 */
`;

const body =
  header +
  "\nexport const siteEn = " +
  serialize(en) +
  ";\n" +
  (Object.keys(maps).length
    ? "\n" +
      Object.entries(maps)
        .map(([name, value]) => `export const ${name} = ${serialize(value)};\n`)
        .join("\n")
    : "");

if (DRY) {
  log("i18n-sync: --dry — файли не змінено.");
} else {
  writeFileSync(OUT_PATH, body, "utf8");
  writeFileSync(MEMORY_PATH, JSON.stringify(memory, null, 2) + "\n", "utf8");
  log(
    `i18n-sync: ${OUT_PATH.replace(ROOT + "/", "")} оновлено; кеш: ${Object.keys(memory.texts).length} текстів, ${Object.values(memory.maps).reduce((n, m) => n + Object.keys(m).length, 0)} підписів`,
  );
  }
}

void main().catch((err: unknown) => {
  console.error(`i18n-sync: помилка — ${(err as Error).message}`);
  process.exit(1);
});
