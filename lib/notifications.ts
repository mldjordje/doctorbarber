export type NotificationItem = {
  id: string;
  type: string;
  message: string;
  relatedBookingId?: string | number | null;
  createdAt?: string;
  readAt?: string | null;
};

export type ParsedNotification = {
  clientName?: string;
  phone?: string;
  service?: string;
  date?: string;
  time?: string;
  rest?: string;
};

/**
 * Poruke stizu kao jedan string iz API-ja, npr:
 * "Otkazan termin: Aleksa Vasiljevic (0604210893) - Sisanje, 28/08/2026 u 12:00. Otkazano: 24/08/2026 20:30."
 * Razbijamo ih u polja da bismo mogli da ih prikazemo kao strukturu.
 * Ako format ne odgovara, vraca se prazan objekat i prikazuje se sirova poruka.
 */
export function parseNotificationMessage(message: string): ParsedNotification {
  const parsed: ParsedNotification = {};
  if (!message) {
    return parsed;
  }

  const main = /^[^:]*:\s*(.+?)\s*\((\d[\d\s/+-]*)\)\s*-\s*(.+?),\s*(\d{2}\/\d{2}\/\d{4})\s+u\s+(\d{1,2}:\d{2})/i.exec(
    message
  );

  if (!main) {
    return parsed;
  }

  parsed.clientName = main[1].trim();
  parsed.phone = main[2].replace(/\s+/g, "");
  parsed.service = main[3].trim();
  parsed.date = main[4];
  parsed.time = main[5];

  const tail = message.slice(main[0].length).replace(/^[.\s]+/, "").trim();
  if (tail) {
    parsed.rest = tail;
  }

  return parsed;
}

export function parseSqlDate(value?: string | null): Date | null {
  if (!value) {
    return null;
  }

  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(normalized);

  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Broj dana izmedju danas i prosledjenog datuma (0 = danas, 1 = juce). */
export function daysAgo(date: Date, now = new Date()): number {
  return Math.round((startOfDay(now) - startOfDay(date)) / 86400000);
}

export type RelativeTimeLabels = {
  now: string;
  minutes: (value: number) => string;
  hours: (value: number) => string;
  yesterday: string;
  days: (value: number) => string;
};

export function formatRelativeTime(
  date: Date,
  labels: RelativeTimeLabels,
  now = new Date()
): string {
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

  if (diffMinutes < 1) {
    return labels.now;
  }
  if (diffMinutes < 60) {
    return labels.minutes(diffMinutes);
  }

  const diffDays = daysAgo(date, now);
  if (diffDays === 0) {
    return labels.hours(Math.floor(diffMinutes / 60));
  }
  if (diffDays === 1) {
    return labels.yesterday;
  }
  if (diffDays < 7) {
    return labels.days(diffDays);
  }

  return date.toLocaleDateString("sr-RS", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatClock(date: Date): string {
  return date.toLocaleTimeString("sr-RS", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** Grupise notifikacije po danu, cuvajuci redosled iz API-ja. */
export function groupByDay<T extends { createdAt?: string }>(
  items: T[]
): { key: string; date: Date | null; items: T[] }[] {
  const groups: { key: string; date: Date | null; items: T[] }[] = [];

  items.forEach((item) => {
    const date = parseSqlDate(item.createdAt);
    const key = date ? String(startOfDay(date)) : "unknown";
    const existing = groups.find((group) => group.key === key);

    if (existing) {
      existing.items.push(item);
      return;
    }

    groups.push({ key, date, items: [item] });
  });

  return groups;
}
