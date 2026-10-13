/**
 * Миттєвий пошук по сторінці — логіка збігів.
 *
 * Перевіряємо саме ті властивості, від яких залежить довіра до поля:
 *  • пошук не залежить від регістру й від того, який апостроф набрали
 *    («комп'ютер» / «компʼютер» / «компютер» — те саме);
 *  • кілька слів = «І», а не «АБО» (ширший запит не дає більше збігів);
 *  • лічильник «знайдено N з M» рахується з тих самих списків, які
 *    рендеряться, тож фільтр мусить бути тим самим предикатом;
 *  • підсвічування повертає зсуви У ВИХІДНОМУ рядку — нормалізація
 *    змінює довжину (апострофи), і наївний indexOf підсвітив би не те.
 *
 * Запуск: npx tsx scripts/test-search.ts
 */
import { findRanges, filterBy, haystack, matches, norm, tokenize } from "../src/lib/search";

let ok = true;
function check(good: boolean, label: string) {
  console.log(`  ${good ? "✓" : "✗"} ${label}`);
  if (!good) ok = false;
}

const hit = (text: string, query: string) => matches(haystack(text), tokenize(query));

// ── 1. Нормалізація ──────────────────────────────────────────────────
check(norm("  Комп'ютер  ") === "компютер", "регістр, пробіли й апостроф прибрано");
check(norm("Компʼютер") === norm("Комп'ютер"), "різні апострофи — той самий текст");
check(norm("Питання\u00a0до\u2009мене") === "питання до мене", "нерозривні пробіли = звичайні");
check(JSON.stringify(tokenize("  Фігма   та  ШІ ")) === JSON.stringify(["фігма", "та", "ші"]),
  "токени ріжуться по пробілах");
check(tokenize("   ").length === 0 && tokenize("").length === 0, "порожній запит — жодного токена");

// ── 2. Збіг ──────────────────────────────────────────────────────────
check(matches(haystack("Курс про Figma"), []), "без запиту видно все");
check(hit("Курс про Figma", "figma"), "збіг без урахування регістру");
check(hit("Працюємо у Figma та Photoshop", "figma photoshop"), "кілька слів — це «І»");
check(!hit("Працюємо у Figma", "figma blender"), "зайве слово — немає збігу");
check(hit("Теорія ймовірностей", "рія"), "пошук усередині слова (підрядок)");
check(hit("Комп'ютерна графіка", "компютерна"), "апостроф у тексті не заважає");
check(hit("Навчаю OSINT", "осінт") === false, "інший алфавіт — не збіг (укр. «і» ≠ лат. «i»)");

// ── 3. Поля картки ───────────────────────────────────────────────────
const card = { title: "Основи WEB дизайну", stack: ["Figma", "HTML"], note: undefined, hours: 72 };
check(hit(haystack(card), "figma"), "масив усередині об'єкта теж шукається");
check(hit(haystack(card), "72"), "числове поле шукається");
check(!matches(haystack(card), tokenize("undefined")), "порожнє поле не додає сміття");

// ── 4. Фільтр списку ─────────────────────────────────────────────────
const list = [
  { title: "Основи WEB дизайну", stack: ["Figma"] },
  { title: "ШІ: розвиток кар'єри", stack: ["ChatGPT"] },
];
const text = (item: (typeof list)[number]) => haystack(item.title, item.stack);
check(filterBy(list, tokenize("figma"), text).length === 1, "фільтр лишає одну картку");
check(filterBy(list, tokenize("дизайн chatgpt"), text).length === 0, "«І» між картками не діє");
check(filterBy(list, [], text).length === list.length, "без запиту список повний");
check(filterBy(list, [], text) !== list, "без запиту повертається копія, а не той самий масив");

// ── 5. Зсуви для підсвічування ───────────────────────────────────────
const line = "Комп'ютерна графіка та комп'ютерні ігри";
const [first] = findRanges(line, ["компютерн"]);
check(line.slice(first[0], first[1]) === "Комп'ютерн",
  "зсув у ВИХІДНОМУ рядку покриває апостроф");
check(findRanges(line, ["компютерн"]).length === 2, "знайдено обидва входження");
check(JSON.stringify(findRanges(line, ["дизайн"])) === "[]", "немає збігу — немає діапазонів");
check(JSON.stringify(findRanges(line, [])) === "[]", "без запиту не підсвічуємо");
check(findRanges("Line Break", ["break"]).length === 1, "другий рядок теж");

console.log(ok ? "\nРЕЗУЛЬТАТ: ✓ УСІ ПЕРЕВІРКИ ПРОЙДЕНО" : "\nРЕЗУЛЬТАТ: ✗ Є ПОМИЛКИ");
process.exit(ok ? 0 : 1);
