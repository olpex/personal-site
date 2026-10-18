/**
 * Синоніми запиту англійською для миттєвого пошуку.
 *
 * Контент змішаний (цитати відгуків і назви сертифікатів лишились
 * оригінальними в обох мовах), тож en-запит «teacher» мусить знаходити
 * «викладач», «courses» — «курс».
 *
 * ВАЖЛИВО: пошук — AND за СЛОВАМИ запиту. Синоніми одного слова — це
 * АБО всередині групи: запит «teacher» = група [teacher, викладач,
 * педагог], збіг = ХОЧА Б один токен групи в тексті. Плоский список
 * зламав би AND: «teacher» не зустрічається в укр. цитатах, і навіть
 * збіг за «викладач» давав би 0 результатів.
 */
const EN_SYNONYMS: Record<string, string[]> = {
  teacher: ["викладач", "педагог"],
  teachers: ["викладач", "педагог"],
  courses: ["курс"],
  course: ["курс"],
  certificates: ["сертифікат"],
  certificate: ["сертифікат"],
  reviews: ["відгук"],
  review: ["відгук"],
  projects: ["проєкт"],
  project: ["проєкт"],
  security: ["безпек", "кібербезпек"],
  design: ["дизайн"],
  web: ["веб"],
  ai: ["штучн", "інтелект", "ші"],
  osint: ["розвідк"],
  digital: ["цифров"],
  data: ["обробк", "інформац"],
  information: ["інформац"],
  topics: ["тем"],
  contact: ["контакт"],
  about: ["про мене"],
};

/** Групи токенів: [оригінал + синоніми] для кожного слова запиту. */
export function expandTokenGroups(tokens: string[]): string[][] {
  return tokens.map((token) => {
    const syn = EN_SYNONYMS[token];
    return syn ? [token, ...syn] : [token];
  });
}

/** AND за групами, АБО всередині групи. Порожні групи → true. */
export function matchesGroups(hay: string, groups: string[][]): boolean {
  if (groups.length === 0) return true;
  for (const group of groups) {
    if (group.length === 0) continue;
    if (!group.some((token) => hay.includes(token))) return false;
  }
  return true;
}

/** Плоский список для підсвічування: підсвічуємо все, що могло збігтися. */
export function expandTokens(tokens: string[]): string[] {
  return [...new Set(expandTokenGroups(tokens).flat())];
}
