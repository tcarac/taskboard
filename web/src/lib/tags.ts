import type { Ticket } from "../api/client";

export const NO_TAG = "Без тега";

// Имена тегов тикета.
export function tagNames(ticket: Ticket): string[] {
  return (ticket.labels || []).map((l) => l.name);
}

// Разбирает строку вида "волна 1, этап-4" в список уникальных тегов.
export function parseTags(input: string): string[] {
  const seen = new Set<string>();
  for (const raw of input.split(",")) {
    const tag = raw.trim();
    if (tag) seen.add(tag);
  }
  return [...seen];
}

// Уникальные теги со всех тикетов, отсортированные с учётом чисел («волна 2» раньше «волна 10»).
export function allTags(tickets: Ticket[]): string[] {
  const set = new Set<string>();
  tickets.forEach((t) => tagNames(t).forEach((n) => set.add(n)));
  return [...set].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

// Секции по тегам. Тикет с несколькими тегами попадает в каждую свою секцию.
// Тикеты без тегов собираются в секцию NO_TAG в конце.
export function groupByTag(tickets: Ticket[]): { tag: string; tickets: Ticket[] }[] {
  const groups = allTags(tickets).map((tag) => ({
    tag,
    tickets: tickets.filter((t) => tagNames(t).includes(tag)),
  }));
  const untagged = tickets.filter((t) => tagNames(t).length === 0);
  if (untagged.length > 0) groups.push({ tag: NO_TAG, tickets: untagged });
  return groups;
}
