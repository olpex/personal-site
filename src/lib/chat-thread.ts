/**
 * Порядок реплік у стрічці чату.
 *
 * Сайт не має права писати в репозиторій, тому репліки відвідувача живуть
 * лише в його браузері (localStorage), а відповіді власника — у
 * public/replies.json. Ці два списки треба зшити в один потік.
 *
 * Наївне «спершу всі мої, потім усі його» ламає розмову: після уточнення
 * відповідь опинилася б не на своєму місці. Тому кожна локальна репліка
 * пам'ятає `after` — скільки відповідей власника вже було на момент її
 * надсилання. Це дає точне чергування навіть після перезавантаження.
 */

export type OwnerMsg = { text: string; at: string; from?: string };
export type LocalMsg = { text: string; at: string; after: number };
export type Row = { from: "visitor" | "owner"; text: string; key: string };

export function buildRows(local: LocalMsg[], owner: OwnerMsg[]): Row[] {
  const rows: Row[] = [];
  let li = 0;
  let oi = 0;
  while (li < local.length || oi < owner.length) {
    const canTakeLocal = li < local.length && local[li].after <= oi;
    if (canTakeLocal || oi >= owner.length) {
      rows.push({ from: "visitor", text: local[li].text, key: `v${li}` });
      li += 1;
    } else {
      rows.push({ from: "owner", text: owner[oi].text, key: `o${oi}` });
      oi += 1;
    }
  }
  return rows;
}
