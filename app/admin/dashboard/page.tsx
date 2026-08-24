"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import AdminShell from "@/components/admin/AdminShell";
import { fetchServices, type Service } from "@/lib/services";
import { formatDateTimeDDMMYYYY } from "@/lib/dateTime";
import { useLanguage, type Language } from "@/lib/useLanguage";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const adminKey = process.env.NEXT_PUBLIC_ADMIN_KEY || "";

type Appointment = {
  id: string;
  clientName: string;
  serviceName: string;
  price?: number;
  date: string;
  time: string;
  status?: string;
};

type Client = {
  id: string;
};

type StatusState = {
  type: "idle" | "loading" | "success" | "error";
  message?: string;
};

type DashboardData = {
  appointments: Appointment[];
  clients: Client[];
  services: Service[];
  unreadCount: number;
  todayBlocks: number;
};

const formatDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatTimeInput = (date: Date) => {
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${hour}:${minute}`;
};

const normalizeTime = (value?: string) => (value || "").slice(0, 5);

const isCancelledLike = (status?: string) => status === "cancelled" || status === "no_show";

export default function AdminDashboardPage() {
  const { language } = useLanguage();
  const localeByLanguage: Record<Language, string> = {
    sr: "sr-RS",
    en: "en-GB",
    it: "it-IT",
    de: "de-DE",
  };
  const locale = localeByLanguage[language];

  const text: Record<Language, Record<string, string>> = {
    sr: {
      title: "Dashboard",
      subtitle: "Pregled poslovanja i termina na jednom mestu",
      apiMissing: "API nije podesen. Dodaj NEXT_PUBLIC_API_BASE_URL u .env.",
      adminMissing: "Dodaj NEXT_PUBLIC_ADMIN_KEY u .env da bi CMS radio.",
      cannotLoad: "Ne mogu da preuzmem dashboard podatke.",
      genericError: "Doslo je do greske.",
      refreshed: "Dashboard je osvezen.",
      refresh: "Osvezi",
      totalRevenue: "Ukupna zarada",
      projectedRevenue: "Planirana zarada",
      avgTicket: "Prosecna cena termina",
      todayAppointments: "Danasnji termini",
      todaySchedule: "Danasnji raspored",
      noToday: "Danas nema zakazanih termina.",
      monthRevenue: "Ovaj mesec",
      viewAll: "Vidi sve",
      upcomingAppointments: "Predstojeci termini",
      totalAppointments: "Ukupno termina",
      totalClients: "Ukupno klijenata",
      activeServices: "Aktivne usluge",
      unreadNotifications: "Neprocitane notifikacije",
      todayBlocks: "Blokade danas",
      statusOverview: "Status termina",
      topServices: "Najtrazenije usluge",
      noData: "Nema podataka.",
      noUpcoming: "Nema predstojecih termina.",
      quickActions: "Brze akcije",
      viewCalendar: "Otvori kalendar",
      manageAppointments: "Upravljaj terminima",
      manageClients: "Klijenti",
      manageServices: "Usluge",
      pending: "Na cekanju",
      confirmed: "Potvrdjeno",
      completed: "Zavrseno",
      cancelled: "Otkazano",
      noShow: "Nije dosao",
      countSuffix: "termina",
    },
    en: {
      title: "Dashboard",
      subtitle: "Business and appointment overview in one place",
      apiMissing: "API is not configured. Add NEXT_PUBLIC_API_BASE_URL to .env.",
      adminMissing: "Add NEXT_PUBLIC_ADMIN_KEY to .env so CMS can work.",
      cannotLoad: "Unable to load dashboard data.",
      genericError: "Something went wrong.",
      refreshed: "Dashboard refreshed.",
      refresh: "Refresh",
      totalRevenue: "Total revenue",
      projectedRevenue: "Projected revenue",
      avgTicket: "Average ticket",
      todayAppointments: "Today's appointments",
      todaySchedule: "Today's schedule",
      noToday: "No appointments scheduled today.",
      monthRevenue: "This month",
      viewAll: "View all",
      upcomingAppointments: "Upcoming appointments",
      totalAppointments: "Total appointments",
      totalClients: "Total clients",
      activeServices: "Active services",
      unreadNotifications: "Unread notifications",
      todayBlocks: "Today's blocks",
      statusOverview: "Appointment status",
      topServices: "Top services",
      noData: "No data.",
      noUpcoming: "No upcoming appointments.",
      quickActions: "Quick actions",
      viewCalendar: "Open calendar",
      manageAppointments: "Manage appointments",
      manageClients: "Clients",
      manageServices: "Services",
      pending: "Pending",
      confirmed: "Confirmed",
      completed: "Completed",
      cancelled: "Cancelled",
      noShow: "No show",
      countSuffix: "appointments",
    },
    de: {
      title: "Dashboard",
      subtitle: "Geschäfts- und Terminübersicht an einem Ort",
      apiMissing: "API ist nicht konfiguriert. Füge NEXT_PUBLIC_API_BASE_URL zu .env hinzu.",
      adminMissing: "Füge NEXT_PUBLIC_ADMIN_KEY zu .env hinzu, damit das CMS funktioniert.",
      cannotLoad: "Dashboard-Daten konnten nicht geladen werden.",
      genericError: "Etwas ist schiefgelaufen.",
      refreshed: "Dashboard aktualisiert.",
      refresh: "Aktualisieren",
      totalRevenue: "Gesamtumsatz",
      projectedRevenue: "Erwarteter Umsatz",
      avgTicket: "Durchschnittswert",
      todayAppointments: "Heutige Termine",
      todaySchedule: "Heutiger Zeitplan",
      noToday: "Heute keine Termine.",
      monthRevenue: "Diesen Monat",
      viewAll: "Alle ansehen",
      upcomingAppointments: "Bevorstehende Termine",
      totalAppointments: "Gesamte Termine",
      totalClients: "Gesamte Kunden",
      activeServices: "Aktive Services",
      unreadNotifications: "Ungelesene Benachrichtigungen",
      todayBlocks: "Heutige Sperrzeiten",
      statusOverview: "Terminstatus",
      topServices: "Top-Services",
      noData: "Keine Daten.",
      noUpcoming: "Keine bevorstehenden Termine.",
      quickActions: "Schnellaktionen",
      viewCalendar: "Kalender öffnen",
      manageAppointments: "Termine verwalten",
      manageClients: "Kunden",
      manageServices: "Services",
      pending: "Ausstehend",
      confirmed: "Bestätigt",
      completed: "Abgeschlossen",
      cancelled: "Storniert",
      noShow: "Nicht erschienen",
      countSuffix: "Termine",
    },
    it: {
      title: "Dashboard",
      subtitle: "Panoramica business e appuntamenti in un unico posto",
      apiMissing: "API non configurata. Aggiungi NEXT_PUBLIC_API_BASE_URL in .env.",
      adminMissing: "Aggiungi NEXT_PUBLIC_ADMIN_KEY in .env per usare il CMS.",
      cannotLoad: "Impossibile caricare i dati dashboard.",
      genericError: "Si e verificato un errore.",
      refreshed: "Dashboard aggiornata.",
      refresh: "Aggiorna",
      totalRevenue: "Incasso totale",
      projectedRevenue: "Incasso previsto",
      avgTicket: "Scontrino medio",
      todayAppointments: "Appuntamenti di oggi",
      todaySchedule: "Programma di oggi",
      noToday: "Nessun appuntamento oggi.",
      monthRevenue: "Questo mese",
      viewAll: "Vedi tutti",
      upcomingAppointments: "Prossimi appuntamenti",
      totalAppointments: "Appuntamenti totali",
      totalClients: "Clienti totali",
      activeServices: "Servizi attivi",
      unreadNotifications: "Notifiche non lette",
      todayBlocks: "Blocchi di oggi",
      statusOverview: "Stato appuntamenti",
      topServices: "Servizi piu richiesti",
      noData: "Nessun dato.",
      noUpcoming: "Nessun appuntamento in arrivo.",
      quickActions: "Azioni rapide",
      viewCalendar: "Apri calendario",
      manageAppointments: "Gestisci appuntamenti",
      manageClients: "Clienti",
      manageServices: "Servizi",
      pending: "In attesa",
      confirmed: "Confermato",
      completed: "Completato",
      cancelled: "Annullato",
      noShow: "Assente",
      countSuffix: "appuntamenti",
    },
  };
  const t = text[language];

  const [data, setData] = useState<DashboardData>({
    appointments: [],
    clients: [],
    services: [],
    unreadCount: 0,
    todayBlocks: 0,
  });
  const [status, setStatus] = useState<StatusState>({ type: "idle" });

  const loadDashboard = async () => {
    if (!apiBaseUrl) {
      setStatus({ type: "error", message: t.apiMissing });
      return;
    }
    if (!adminKey) {
      setStatus({ type: "error", message: t.adminMissing });
      return;
    }

    const today = new Date();
    const todayKey = formatDateInput(today);
    setStatus({ type: "loading" });

    try {
      const [appointmentsResponse, clientsResponse, notificationsResponse, blocksResponse, services] =
        await Promise.all([
          fetch(`${apiBaseUrl}/appointments.php`, {
            headers: {
              "X-Admin-Key": adminKey,
            },
          }),
          fetch(`${apiBaseUrl}/clients.php`, {
            headers: {
              "X-Admin-Key": adminKey,
            },
          }),
          fetch(`${apiBaseUrl}/notifications.php?unreadOnly=1&includeUnreadCount=1&limit=1`, {
            headers: {
              "X-Admin-Key": adminKey,
            },
          }),
          fetch(`${apiBaseUrl}/blocks.php?date=${encodeURIComponent(todayKey)}`, {
            headers: {
              "X-Admin-Key": adminKey,
            },
          }),
          fetchServices(apiBaseUrl, {
            adminKey,
            includeInactive: true,
          }),
        ]);

      const [appointmentsData, clientsData, notificationsData, blocksData] = await Promise.all([
        appointmentsResponse.json(),
        clientsResponse.json(),
        notificationsResponse.json(),
        blocksResponse.json(),
      ]);

      if (!appointmentsResponse.ok) {
        throw new Error(appointmentsData?.message || t.cannotLoad);
      }
      if (!clientsResponse.ok) {
        throw new Error(clientsData?.message || t.cannotLoad);
      }
      if (!notificationsResponse.ok) {
        throw new Error(notificationsData?.message || t.cannotLoad);
      }
      if (!blocksResponse.ok) {
        throw new Error(blocksData?.message || t.cannotLoad);
      }

      setData({
        appointments: Array.isArray(appointmentsData?.appointments)
          ? appointmentsData.appointments
          : [],
        clients: Array.isArray(clientsData?.clients) ? clientsData.clients : [],
        services,
        unreadCount: Number(notificationsData?.unreadCount || 0),
        todayBlocks: Array.isArray(blocksData?.blocks) ? blocksData.blocks.length : 0,
      });
      setStatus({ type: "success", message: t.refreshed });
    } catch (error) {
      const message = error instanceof Error ? error.message : t.genericError;
      setStatus({ type: "error", message });
    }
  };

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const statusLabel = (value?: string) => {
    const map: Record<string, string> = {
      pending: t.pending,
      confirmed: t.confirmed,
      completed: t.completed,
      cancelled: t.cancelled,
      no_show: t.noShow,
    };

    return map[value || "pending"] || value || "";
  };

  const summary = useMemo(() => {
    const now = new Date();
    const todayKey = formatDateInput(now);
    const nowTime = formatTimeInput(now);
    const monthKey = todayKey.slice(0, 7);

    const totalAppointments = data.appointments.length;
    const todayList = data.appointments
      .filter((item) => item.date === todayKey && !isCancelledLike(item.status))
      .sort((a, b) => normalizeTime(a.time).localeCompare(normalizeTime(b.time)));
    const todayAppointments = data.appointments.filter((item) => item.date === todayKey).length;
    const activeServices = data.services.filter((item) => item.isActive !== false).length;

    const pendingCount = data.appointments.filter((item) => item.status === "pending").length;
    const confirmedCount = data.appointments.filter((item) => item.status === "confirmed").length;
    const completedCount = data.appointments.filter((item) => item.status === "completed").length;
    const cancelledCount = data.appointments.filter((item) => item.status === "cancelled").length;
    const noShowCount = data.appointments.filter((item) => item.status === "no_show").length;

    const completedRevenue = data.appointments.reduce((sum, item) => {
      if (item.status !== "completed") {
        return sum;
      }
      return sum + (Number(item.price) || 0);
    }, 0);

    const projectedRevenue = data.appointments.reduce((sum, item) => {
      const time = normalizeTime(item.time);
      const isFuture = item.date > todayKey || (item.date === todayKey && time >= nowTime);
      if (!isFuture || isCancelledLike(item.status)) {
        return sum;
      }
      return sum + (Number(item.price) || 0);
    }, 0);

    const monthRevenue = data.appointments.reduce((sum, item) => {
      if (item.date.slice(0, 7) !== monthKey || isCancelledLike(item.status)) {
        return sum;
      }
      return sum + (Number(item.price) || 0);
    }, 0);

    const pricedAppointments = data.appointments.filter((item) => Number(item.price) > 0);
    const averageTicket =
      pricedAppointments.length > 0
        ? Math.round(
            pricedAppointments.reduce((sum, item) => sum + (Number(item.price) || 0), 0) /
              pricedAppointments.length
          )
        : 0;

    const upcoming = data.appointments
      .filter((item) => {
        const time = normalizeTime(item.time);
        const isFuture = item.date > todayKey || (item.date === todayKey && time >= nowTime);
        return isFuture && !isCancelledLike(item.status);
      })
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
      .slice(0, 6);

    const topServices = Object.entries(
      data.appointments.reduce<Record<string, number>>((acc, item) => {
        const key = (item.serviceName || "").trim() || "Nepoznato";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {})
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      totalAppointments,
      totalClients: data.clients.length,
      activeServices,
      todayAppointments,
      todayList,
      pendingCount,
      confirmedCount,
      completedCount,
      cancelledCount,
      noShowCount,
      completedRevenue,
      projectedRevenue,
      monthRevenue,
      averageTicket,
      upcoming,
      topServices,
    };
  }, [data]);

  const rsdFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "RSD",
        maximumFractionDigits: 0,
      }),
    [locale]
  );

  const formatDateTime = (date: string, time: string) =>
    formatDateTimeDDMMYYYY(date, normalizeTime(time));

  return (
    <AdminShell title={t.title} subtitle={t.subtitle}>
      <div className="admin-grid dashboard-grid">
        <div className="admin-toolbar">
          <div className="dashboard-quick-actions">
            <Link className="button small outline" href="/admin/calendar">
              {t.viewCalendar}
            </Link>
            <Link className="button small outline" href="/admin/termini">
              {t.manageAppointments}
            </Link>
            <Link className="button small outline" href="/admin/clients">
              {t.manageClients}
            </Link>
            <Link className="button small outline" href="/admin/usluge">
              {t.manageServices}
            </Link>
          </div>
          <button className="button small" type="button" onClick={loadDashboard}>
            {t.refresh}
          </button>
        </div>

        {status.type !== "idle" && status.message && (
          <div className={`form-status ${status.type}`}>{status.message}</div>
        )}

        <div className="dashboard-overview">
          <article className="overview-card">
            <span>{t.totalRevenue}</span>
            <strong>{rsdFormatter.format(summary.completedRevenue)}</strong>
            <p>{t.completed}</p>
          </article>
          <article className="overview-card">
            <span>{t.projectedRevenue}</span>
            <strong>{rsdFormatter.format(summary.projectedRevenue)}</strong>
            <p>{t.upcomingAppointments}</p>
          </article>
          <article className="overview-card">
            <span>{t.avgTicket}</span>
            <strong>{rsdFormatter.format(summary.averageTicket)}</strong>
            <p>
              {t.monthRevenue}: {rsdFormatter.format(summary.monthRevenue)}
            </p>
          </article>
          <article className="overview-card">
            <span>{t.todayAppointments}</span>
            <strong>{summary.todayAppointments}</strong>
            <p>{t.totalAppointments}</p>
          </article>
          <article className="overview-card">
            <span>{t.totalClients}</span>
            <strong>{summary.totalClients}</strong>
            <p>{t.activeServices}: {summary.activeServices}</p>
          </article>
          <article className="overview-card">
            <span>{t.unreadNotifications}</span>
            <strong>{data.unreadCount}</strong>
            <p>{t.todayBlocks}: {data.todayBlocks}</p>
          </article>
        </div>

        <section className="admin-card dashboard-card dashboard-today">
          <header className="dashboard-today__header">
            <h3>{t.todaySchedule}</h3>
            <Link className="button small outline" href="/admin/termini">
              {t.viewAll}
            </Link>
          </header>

          {summary.todayList.length === 0 ? (
            <p className="dashboard-today__empty">{t.noToday}</p>
          ) : (
            <ol className="dashboard-today__list">
              {summary.todayList.map((appointment) => (
                <li key={appointment.id} className="dashboard-today__item">
                  <span className="dashboard-today__time">
                    {normalizeTime(appointment.time)}
                  </span>
                  <span className="dashboard-today__client">{appointment.clientName}</span>
                  <span className="dashboard-today__service">{appointment.serviceName}</span>
                  <span className={`status-pill ${appointment.status || "pending"}`}>
                    {statusLabel(appointment.status)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <div className="dashboard-main-grid">
          <section className="admin-card dashboard-card">
            <h3>{t.statusOverview}</h3>
            <div className="dashboard-status-grid">
              <div>
                <span className="status-pill pending">{t.pending}</span>
                <strong>{summary.pendingCount}</strong>
              </div>
              <div>
                <span className="status-pill confirmed">{t.confirmed}</span>
                <strong>{summary.confirmedCount}</strong>
              </div>
              <div>
                <span className="status-pill completed">{t.completed}</span>
                <strong>{summary.completedCount}</strong>
              </div>
              <div>
                <span className="status-pill cancelled">{t.cancelled}</span>
                <strong>{summary.cancelledCount}</strong>
              </div>
              <div>
                <span className="status-pill no_show">{t.noShow}</span>
                <strong>{summary.noShowCount}</strong>
              </div>
              <div>
                <span className="status-pill">{t.totalAppointments}</span>
                <strong>{summary.totalAppointments}</strong>
              </div>
            </div>
          </section>

          <section className="admin-card dashboard-card">
            <h3>{t.topServices}</h3>
            <div className="dashboard-list">
              {summary.topServices.length === 0 && <p>{t.noData}</p>}
              {summary.topServices.map(([serviceName, count]) => (
                <div key={serviceName} className="dashboard-list-item">
                  <strong>{serviceName}</strong>
                  <span>
                    {count} {t.countSuffix}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="admin-card dashboard-card">
          <h3>{t.upcomingAppointments}</h3>
          <div className="dashboard-list">
            {summary.upcoming.length === 0 && <p>{t.noUpcoming}</p>}
            {summary.upcoming.map((appointment) => (
              <div key={appointment.id} className="dashboard-list-item">
                <div>
                  <strong>{appointment.clientName}</strong>
                  <span>
                    {appointment.serviceName} | {formatDateTime(appointment.date, appointment.time)}
                  </span>
                </div>
                <span className={`status-pill ${appointment.status || "pending"}`}>
                  {statusLabel(appointment.status)}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
