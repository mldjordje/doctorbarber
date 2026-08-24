"use client";

import { useEffect, useMemo, useState } from "react";

import AdminShell from "@/components/admin/AdminShell";
import { useLanguage, type Language } from "@/lib/useLanguage";
import {
  formatClock,
  formatRelativeTime,
  groupByDay,
  parseNotificationMessage,
  parseSqlDate,
  daysAgo,
  type NotificationItem,
} from "@/lib/notifications";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const adminKey = process.env.NEXT_PUBLIC_ADMIN_KEY || "";

const PAGE_SIZE = 20;

type StatusState = {
  type: "idle" | "loading" | "success" | "error";
  message?: string;
};

type FilterKey = "all" | "unread";

export default function AdminNotificationsPage() {
  const { language } = useLanguage();
  const text: Record<Language, Record<string, string>> = {
    sr: {
      apiMissing: "API nije podesen. Dodaj NEXT_PUBLIC_API_BASE_URL u .env.",
      adminMissing: "Dodaj NEXT_PUBLIC_ADMIN_KEY u .env da bi CMS radio.",
      cannotLoad: "Ne mogu da preuzmem notifikacije.",
      genericError: "Doslo je do greske.",
      cannotMark: "Ne mogu da oznacim procitano.",
      markedAll: "Sve notifikacije su procitane.",
      title: "Notifikacije",
      subtitleAll: "Sve aktivnosti sa sajta na jednom mestu",
      refresh: "Osvezi",
      markAllRead: "Procitaj sve",
      filterAll: "Sve",
      filterUnread: "Neprocitano",
      noItems: "Nema notifikacija.",
      noUnread: "Sve je procitano.",
      emptyHint: "Nove aktivnosti se pojavljuju ovde automatski.",
      markRead: "Oznaci procitano",
      loadMore: "Prikazi jos",
      today: "Danas",
      yesterday: "Juce",
      call: "Pozovi",
      openAppointment: "Otvori termin",
      justNow: "upravo sada",
      minutesAgo: "pre {v} min",
      hoursAgo: "pre {v} h",
      daysAgo: "pre {v} dana",
      typeCancelled: "Otkazan termin",
      typeCreated: "Nov termin",
      typeConfirmed: "Potvrdjen termin",
      typeRescheduled: "Pomeren termin",
      unreadDot: "Neprocitano",
    },
    en: {
      apiMissing: "API is not configured. Add NEXT_PUBLIC_API_BASE_URL to .env.",
      adminMissing: "Add NEXT_PUBLIC_ADMIN_KEY to .env so CMS can work.",
      cannotLoad: "Unable to load notifications.",
      genericError: "Something went wrong.",
      cannotMark: "Unable to mark as read.",
      markedAll: "All notifications marked as read.",
      title: "Notifications",
      subtitleAll: "All site activity in one place",
      refresh: "Refresh",
      markAllRead: "Read all",
      filterAll: "All",
      filterUnread: "Unread",
      noItems: "No notifications.",
      noUnread: "Everything is read.",
      emptyHint: "New activity shows up here automatically.",
      markRead: "Mark read",
      loadMore: "Show more",
      today: "Today",
      yesterday: "Yesterday",
      call: "Call",
      openAppointment: "Open appointment",
      justNow: "just now",
      minutesAgo: "{v} min ago",
      hoursAgo: "{v} h ago",
      daysAgo: "{v} days ago",
      typeCancelled: "Cancelled appointment",
      typeCreated: "New appointment",
      typeConfirmed: "Confirmed appointment",
      typeRescheduled: "Rescheduled",
      unreadDot: "Unread",
    },
    de: {
      apiMissing: "API ist nicht konfiguriert. Füge NEXT_PUBLIC_API_BASE_URL zu .env hinzu.",
      adminMissing: "Füge NEXT_PUBLIC_ADMIN_KEY zu .env hinzu, damit das CMS funktioniert.",
      cannotLoad: "Benachrichtigungen konnten nicht geladen werden.",
      genericError: "Etwas ist schiefgelaufen.",
      cannotMark: "Konnte nicht als gelesen markieren.",
      markedAll: "Alle Benachrichtigungen als gelesen markiert.",
      title: "Benachrichtigungen",
      subtitleAll: "Alle Aktivitäten an einem Ort",
      refresh: "Aktualisieren",
      markAllRead: "Alle lesen",
      filterAll: "Alle",
      filterUnread: "Ungelesen",
      noItems: "Keine Benachrichtigungen.",
      noUnread: "Alles gelesen.",
      emptyHint: "Neue Aktivitäten erscheinen hier automatisch.",
      markRead: "Als gelesen markieren",
      loadMore: "Mehr anzeigen",
      today: "Heute",
      yesterday: "Gestern",
      call: "Anrufen",
      openAppointment: "Termin öffnen",
      justNow: "gerade eben",
      minutesAgo: "vor {v} Min",
      hoursAgo: "vor {v} Std",
      daysAgo: "vor {v} Tagen",
      typeCancelled: "Termin abgesagt",
      typeCreated: "Neuer Termin",
      typeConfirmed: "Termin bestätigt",
      typeRescheduled: "Verschoben",
      unreadDot: "Ungelesen",
    },
    it: {
      apiMissing: "API non configurata. Aggiungi NEXT_PUBLIC_API_BASE_URL in .env.",
      adminMissing: "Aggiungi NEXT_PUBLIC_ADMIN_KEY in .env per usare il CMS.",
      cannotLoad: "Impossibile caricare le notifiche.",
      genericError: "Si e verificato un errore.",
      cannotMark: "Impossibile segnare come letto.",
      markedAll: "Tutte le notifiche sono state segnate come lette.",
      title: "Notifiche",
      subtitleAll: "Tutte le attività in un unico posto",
      refresh: "Aggiorna",
      markAllRead: "Leggi tutto",
      filterAll: "Tutte",
      filterUnread: "Non lette",
      noItems: "Nessuna notifica.",
      noUnread: "Tutto letto.",
      emptyHint: "Le nuove attività appaiono qui automaticamente.",
      markRead: "Segna come letto",
      loadMore: "Mostra altro",
      today: "Oggi",
      yesterday: "Ieri",
      call: "Chiama",
      openAppointment: "Apri appuntamento",
      justNow: "proprio ora",
      minutesAgo: "{v} min fa",
      hoursAgo: "{v} h fa",
      daysAgo: "{v} giorni fa",
      typeCancelled: "Appuntamento annullato",
      typeCreated: "Nuovo appuntamento",
      typeConfirmed: "Appuntamento confermato",
      typeRescheduled: "Spostato",
      unreadDot: "Non letta",
    },
  };
  const t = text[language];

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [status, setStatus] = useState<StatusState>({ type: "loading" });
  const [filter, setFilter] = useState<FilterKey>("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const typeLabel = (type: string) => {
    if (type.includes("cancel")) return t.typeCancelled;
    if (type.includes("reschedul")) return t.typeRescheduled;
    if (type.includes("confirm")) return t.typeConfirmed;
    if (type.includes("book") || type.includes("creat")) return t.typeCreated;
    return type.replace(/_/g, " ");
  };

  const typeTone = (type: string) => {
    if (type.includes("cancel")) return "danger";
    if (type.includes("reschedul")) return "warn";
    if (type.includes("confirm")) return "ok";
    return "info";
  };

  const withCount = (template: string, value: number) =>
    template.replace("{v}", String(value));

  const relativeLabels = {
    now: t.justNow,
    minutes: (value: number) => withCount(t.minutesAgo, value),
    hours: (value: number) => withCount(t.hoursAgo, value),
    yesterday: t.yesterday,
    days: (value: number) => withCount(t.daysAgo, value),
  };

  const fetchNotifications = async () => {
    if (!apiBaseUrl) {
      setStatus({ type: "error", message: t.apiMissing });
      return;
    }

    if (!adminKey) {
      setStatus({ type: "error", message: t.adminMissing });
      return;
    }

    setStatus({ type: "loading" });

    try {
      const response = await fetch(
        `${apiBaseUrl}/notifications.php?limit=100&includeUnreadCount=1`,
        { headers: { "X-Admin-Key": adminKey } }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || t.cannotLoad);
      }

      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
      setStatus({ type: "idle" });
    } catch (error) {
      const message = error instanceof Error ? error.message : t.genericError;
      setStatus({ type: "error", message });
    }
  };

  const markAllRead = async () => {
    if (!apiBaseUrl || !adminKey) {
      return;
    }

    const previous = notifications;
    setNotifications((prev) =>
      prev.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() }))
    );

    try {
      const response = await fetch(`${apiBaseUrl}/notifications.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Key": adminKey },
        body: JSON.stringify({ adminAction: "mark_all_read" }),
      });

      if (!response.ok) {
        throw new Error(t.cannotMark);
      }

      setStatus({ type: "success", message: t.markedAll });
    } catch (error) {
      setNotifications(previous);
      const message = error instanceof Error ? error.message : t.genericError;
      setStatus({ type: "error", message });
    }
  };

  const markRead = async (id: string) => {
    if (!apiBaseUrl || !adminKey) {
      return;
    }

    const previous = notifications;
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, readAt: new Date().toISOString() } : item))
    );

    try {
      const response = await fetch(`${apiBaseUrl}/notifications.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Key": adminKey },
        body: JSON.stringify({ adminAction: "mark_read", id }),
      });

      if (!response.ok) {
        throw new Error(t.cannotMark);
      }
    } catch (error) {
      setNotifications(previous);
      const message = error instanceof Error ? error.message : t.genericError;
      setStatus({ type: "error", message });
    }
  };

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unreadCount = notifications.filter((item) => !item.readAt).length;

  const filtered = useMemo(
    () => (filter === "unread" ? notifications.filter((item) => !item.readAt) : notifications),
    [filter, notifications]
  );

  const visible = filtered.slice(0, visibleCount);
  const groups = groupByDay(visible);

  const groupLabel = (date: Date | null) => {
    if (!date) {
      return "";
    }

    const diff = daysAgo(date);
    if (diff === 0) return t.today;
    if (diff === 1) return t.yesterday;

    return date.toLocaleDateString("sr-RS", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <AdminShell title={t.title} subtitle={t.subtitleAll}>
      <div className="notif-page">
        <div className="notif-bar">
          <div className="notif-filters" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={filter === "all"}
              className={`notif-chip${filter === "all" ? " is-active" : ""}`}
              onClick={() => {
                setFilter("all");
                setVisibleCount(PAGE_SIZE);
              }}
            >
              {t.filterAll}
              <span className="notif-chip__count">{notifications.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filter === "unread"}
              className={`notif-chip${filter === "unread" ? " is-active" : ""}`}
              onClick={() => {
                setFilter("unread");
                setVisibleCount(PAGE_SIZE);
              }}
            >
              {t.filterUnread}
              {unreadCount > 0 && <span className="notif-chip__count is-alert">{unreadCount}</span>}
            </button>
          </div>

          <div className="notif-bar__actions">
            <button
              type="button"
              className="notif-action"
              onClick={fetchNotifications}
              disabled={status.type === "loading"}
            >
              {t.refresh}
            </button>
            <button
              type="button"
              className="notif-action is-primary"
              onClick={markAllRead}
              disabled={unreadCount === 0}
            >
              {t.markAllRead}
            </button>
          </div>
        </div>

        {status.type === "error" && status.message && (
          <div className="notif-alert">{status.message}</div>
        )}

        {status.type === "loading" && (
          <div className="notif-list">
            {[0, 1, 2].map((index) => (
              <div key={index} className="notif-skeleton" />
            ))}
          </div>
        )}

        {status.type !== "loading" && filtered.length === 0 && (
          <div className="notif-empty">
            <div className="notif-empty__mark">✓</div>
            <p className="notif-empty__title">
              {filter === "unread" ? t.noUnread : t.noItems}
            </p>
            <p className="notif-empty__hint">{t.emptyHint}</p>
          </div>
        )}

        {status.type !== "loading" &&
          groups.map((group) => (
            <section key={group.key} className="notif-group">
              <h2 className="notif-group__title">{groupLabel(group.date)}</h2>

              <div className="notif-list">
                {group.items.map((item) => {
                  const parsed = parseNotificationMessage(item.message);
                  const created = parseSqlDate(item.createdAt);
                  const isUnread = !item.readAt;

                  return (
                    <article
                      key={item.id}
                      className={`notif-card${isUnread ? " is-unread" : ""}`}
                    >
                      <div className="notif-card__head">
                        <span className={`notif-tag notif-tag--${typeTone(item.type)}`}>
                          {typeLabel(item.type)}
                        </span>
                        <span className="notif-card__time">
                          {created
                            ? `${formatRelativeTime(created, relativeLabels)} · ${formatClock(created)}`
                            : ""}
                        </span>
                        {isUnread && <span className="notif-dot" title={t.unreadDot} />}
                      </div>

                      {parsed.clientName ? (
                        <>
                          <p className="notif-card__client">{parsed.clientName}</p>
                          <dl className="notif-facts">
                            {parsed.service && (
                              <div className="notif-fact">
                                <dt>Usluga</dt>
                                <dd>{parsed.service}</dd>
                              </div>
                            )}
                            {parsed.date && (
                              <div className="notif-fact">
                                <dt>Termin</dt>
                                <dd>
                                  {parsed.date}
                                  {parsed.time ? ` u ${parsed.time}` : ""}
                                </dd>
                              </div>
                            )}
                          </dl>
                          {parsed.rest && <p className="notif-card__rest">{parsed.rest}</p>}
                        </>
                      ) : (
                        <p className="notif-card__message">{item.message}</p>
                      )}

                      <div className="notif-card__foot">
                        {parsed.phone && (
                          <a className="notif-link" href={`tel:${parsed.phone}`}>
                            {t.call} {parsed.phone}
                          </a>
                        )}
                        {isUnread && (
                          <button
                            type="button"
                            className="notif-link is-ghost"
                            onClick={() => markRead(String(item.id))}
                          >
                            {t.markRead}
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}

        {filtered.length > visibleCount && (
          <button
            type="button"
            className="notif-more"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
          >
            {t.loadMore} ({filtered.length - visibleCount})
          </button>
        )}
      </div>
    </AdminShell>
  );
}
