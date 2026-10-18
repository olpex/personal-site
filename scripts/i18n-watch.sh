#!/usr/bin/env bash
# i18n-watch.sh — авто-переклад змін uk-контенту сайту (DeepL) + коміт/пуш.
#
# Кроки:
#   1. Прибирає сліди можливого soft-reset від містка (site_chat_bot.py робить
#      щохвилинний `git reset --soft origin/master`, який "розкомічує" чужі
#      коміти): якщо HEAD != origin/master — коміт відновлюється пушем, а
#      розкомічені зміни додаються назад у коміт.
#   2. Запускає scripts/i18n-sync.ts (переклад нових/змінених uk-текстів через DeepL).
#   3. Якщо site-en.ts або i18n-memory.json змінились — комітить і пушить АТОМАРНО
#      в одному прогоні (add лише двох файлів → commit → push), щоб місток між
#      прогонами не встиг "розкомітити".
#   4. Vercel підхоплює пуш і деплоїть (до ~1 хв).
#
# Ключ DeepL: DEEPL_API_KEY у ~/.hermes/.env. Ключ GitHub: ~/push_site.sh.

set -uo pipefail

REPO="$HOME/projects/personal-site"
BRANCH="master"
LOG="$REPO/scripts/i18n-watch.log"
PUSH="$HOME/push_site.sh"
GEN_FILES=(src/content/site-en.ts src/content/i18n-memory.json)

cd "$REPO" || exit 1

log() { echo "[$(date '+%m-%d %H:%M:%S')] $*" >> "$LOG"; }

log "=== запуск ==="

# 0. Якщо HEAD відрізняється від origin/master — це або незапушений наш коміт,
#    або наслідок soft-reset містка. Обидва випадки вирішує пуш.
need_push=0
git fetch -q origin "$BRANCH" || log "fetch не вдався (офлайн?)"
if [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/$BRANCH)" ]; then
  need_push=1
  log "HEAD != origin/$BRANCH — відновлюю/запушую"
  # Розкомічені (soft-reset) зміни генерованих файлів — назад у індекс:
  git add "${GEN_FILES[@]}" 2>/dev/null || true
  # Якщо є ще незакомічені зміни ДЖЕРЕЛ (сесія агента) — не чіпаємо: вони не наші.
fi

# 1. Синхронізація перекладів (DeepL)
OUT=$(npx --no-install tsx scripts/i18n-sync.ts 2>&1)
CODE=$?
log "sync: $(echo "$OUT" | tail -1) (exit $CODE)"

# 2. Зміни генерованих файлів → коміт + пуш одним прогоном
if ! git diff --quiet -- "${GEN_FILES[@]}" || [ "$need_push" = "1" ]; then
  git add "${GEN_FILES[@]}"
  if git commit -q -m "i18n: авто-переклад uk→en (DeepL) — синхронізація"; then
    log "commit ok"
  else
    log "commit: нема чого комітувати"
  fi
  if [ -x "$PUSH" ]; then
    PUSH_OUT=$(bash "$PUSH" 2>&1 | tail -2)
    log "push: $(echo "$PUSH_OUT" | tail -1)"
  else
    if git push -q origin "$BRANCH" 2>>"$LOG"; then
      log "push ok (git push)"
    else
      log "push НЕ вдався"
    fi
  fi
fi

log "=== готово ==="
