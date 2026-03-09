"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage, type Language } from "@/lib/useLanguage";

type AdminShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  hideHeader?: boolean;
  fullWidth?: boolean;
};

type NavLabelKey =
  | "dashboard"
  | "appointments"
  | "calendar"
  | "clients"
  | "services"
  | "notifications"
  | "settings";

type NavItem = {
  href: string;
  key: NavLabelKey;
  badge?: boolean;
};

const navItems: NavItem[] = [
  { href: "/admin/dashboard", key: "dashboard" },
  { href: "/admin/termini", key: "appointments" },
  { href: "/admin/calendar", key: "calendar" },
  { href: "/admin/clients", key: "clients" },
  { href: "/admin/usluge", key: "services" },
  { href: "/admin/notifications", key: "notifications", badge: true },
  { href: "/admin/settings", key: "settings" },
];

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const adminKey = process.env.NEXT_PUBLIC_ADMIN_KEY || "";

export default function AdminShell({
  title,
  subtitle,
  children,
  hideHeader = false,
  fullWidth = false,
}: AdminShellProps) {
  const { language } = useLanguage();
  const copy: Record<
    Language,
    {
      cmsPanel: string;
      menu: string;
      home: string;
      book: string;
      dashboard: string;
      appointments: string;
      calendar: string;
      clients: string;
      services: string;
      notifications: string;
      settings: string;
      refresh: string;
      logout: string;
    }
  > = {
    sr: {
      cmsPanel: "CMS Panel",
      menu: "Meni",
      home: "Pocetna",
      book: "Zakazi termin",
      dashboard: "Dashboard",
      appointments: "Termini",
      calendar: "Kalendar",
      clients: "Klijenti",
      services: "Usluge",
      notifications: "Notifikacije",
      settings: "Podesavanja",
      refresh: "Osvezi",
      logout: "Odjava",
    },
    en: {
      cmsPanel: "CMS Panel",
      menu: "Menu",
      home: "Home",
      book: "Book appointment",
      dashboard: "Dashboard",
      appointments: "Appointments",
      calendar: "Calendar",
      clients: "Clients",
      services: "Services",
      notifications: "Notifications",
      settings: "Settings",
      refresh: "Refresh",
      logout: "Logout",
    },
    de: {
      cmsPanel: "CMS-Panel",
      menu: "Menü",
      home: "Startseite",
      book: "Termin buchen",
      dashboard: "Dashboard",
      appointments: "Termine",
      calendar: "Kalender",
      clients: "Kunden",
      services: "Services",
      notifications: "Benachrichtigungen",
      settings: "Einstellungen",
      refresh: "Aktualisieren",
      logout: "Abmelden",
    },
    it: {
      cmsPanel: "Pannello CMS",
      menu: "Menu",
      home: "Home",
      book: "Prenota",
      dashboard: "Dashboard",
      appointments: "Appuntamenti",
      calendar: "Calendario",
      clients: "Clienti",
      services: "Servizi",
      notifications: "Notifiche",
      settings: "Impostazioni",
      refresh: "Aggiorna",
      logout: "Esci",
    },
  };
  const t = copy[language];
  const localizeAdminText = (value?: string) => {
    if (!value || language === "sr") {
      return value;
    }

    const directMap: Record<string, { en: string; it: string; de: string }> = {
      Termini: { en: "Appointments", it: "Appuntamenti", de: "Termine" },
      Dashboard: { en: "Dashboard", it: "Dashboard", de: "Dashboard" },
      Kalendar: { en: "Calendar", it: "Calendario", de: "Kalender" },
      Klijenti: { en: "Clients", it: "Clienti", de: "Kunden" },
      Usluge: { en: "Services", it: "Servizi", de: "Services" },
      Notifikacije: { en: "Notifications", it: "Notifiche", de: "Benachrichtigungen" },
      Podesavanja: { en: "Settings", it: "Impostazioni", de: "Einstellungen" },
      "Upravljanje dostupnoscu termina": {
        en: "Manage appointment availability",
        it: "Gestione disponibilita appuntamenti",
        de: "Terminverfügbarkeit verwalten",
      },
      "Upravljanje pravilima zakazivanja i otkazivanja": {
        en: "Manage booking and cancellation rules",
        it: "Gestione regole di prenotazione e cancellazione",
        de: "Buchungs- und Stornierungsregeln verwalten",
      },
    };

    if (directMap[value]) {
      return directMap[value][language];
    }

    return value
      .replace(
        /^Ukupno klijenata:/,
        language === "en" ? "Total clients:" : language === "it" ? "Clienti totali:" : "Gesamte Kunden:"
      )
      .replace(
        /^Ukupno usluga:/,
        language === "en" ? "Total services:" : language === "it" ? "Servizi totali:" : "Gesamte Services:"
      )
      .replace(/^Ukupno:/, language === "en" ? "Total:" : language === "it" ? "Totale:" : "Gesamt:")
      .replace(/Neprocitano:/, language === "en" ? "Unread:" : language === "it" ? "Non lette:" : "Ungelesen:")
      .replace(
        /ukupno termina/gi,
        language === "en" ? "total appointments" : language === "it" ? "appuntamenti totali" : "gesamte termine"
      )
      .replace(
        /ukupno blokada/gi,
        language === "en" ? "total blocks" : language === "it" ? "blocchi totali" : "gesamte sperrzeiten"
      );
  };
  const localizedTitle = localizeAdminText(title) ?? title;
  const localizedSubtitle = localizeAdminText(subtitle);
  const router = useRouter();
  const pathname = usePathname();
  const [ready] = useState(() =>
    typeof window !== "undefined" && localStorage.getItem("db_admin_auth") === "true"
  );
  const [notificationCount, setNotificationCount] = useState(0);
  const [isNavOpen, setIsNavOpen] = useState(false);

  useEffect(() => {
    if (!ready) {
      router.replace("/admin");
    }
  }, [ready, router]);

  useEffect(() => {
    if (!ready || !apiBaseUrl || !adminKey) {
      return;
    }

    let active = true;
    fetch(`${apiBaseUrl}/notifications.php?unreadOnly=1&includeUnreadCount=1&limit=1`, {
      headers: {
        "X-Admin-Key": adminKey,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (!active) {
          return;
        }
        const count = Number(data?.unreadCount ?? data?.notifications?.length ?? 0);
        setNotificationCount(Number.isFinite(count) ? count : 0);
      })
      .catch(() => {
        if (active) {
          setNotificationCount(0);
        }
      });

    return () => {
      active = false;
    };
  }, [ready]);

  useEffect(() => {
    if (language === "sr") {
      return;
    }

    const exactMapByLanguage: Record<Exclude<Language, "sr">, Record<string, string>> = {
      en: {
        "Osvezi listu": "Refresh list",
        "Oznaci sve kao procitano": "Mark all as read",
        "Oznaci procitano": "Mark as read",
        "Nema novih notifikacija.": "No new notifications.",
        "Nema registrovanih klijenata.": "No registered clients.",
        "Nema usluga za prikaz.": "No services to show.",
        "Nema termina za prikaz.": "No appointments to show.",
        "Nema blokada za izabrani datum.": "No blocks for selected date.",
        "Izmeni": "Edit",
        "Obrisi": "Delete",
        "Otkazi": "Cancel",
        "Otkazi izmenu": "Cancel edit",
        "Sacuvaj izmene": "Save changes",
        "Sacuvaj uslugu": "Save service",
        "Nova usluga": "New service",
        "Izmeni uslugu": "Edit service",
        "Aktiviraj": "Activate",
        "Deaktiviraj": "Deactivate",
        "Aktivna": "Active",
        "Neaktivna": "Inactive",
        "Pravila za termine": "Appointment rules",
        "Minimalno minuta pre zakazivanja": "Minimum minutes before booking",
        "Minimalno minuta pre otkazivanja": "Minimum minutes before cancellation",
        "Cuvanje...": "Saving...",
        "Sacuvaj podesavanja": "Save settings",
        "Sacuvaj termin": "Save appointment",
        "Dodaj blokadu": "Add block",
        "Izmeni blokadu": "Edit block",
        "Sacuvaj blokadu": "Save block",
        "Nema rezultata": "No results",
        "Rucno": "Manual",
        "Na cekanju": "Pending",
        "Potvrdjen": "Confirmed",
        "Zavrsen": "Completed",
        "Otkazan": "Cancelled",
        "Nije dosao": "No show",
        "Ime i prezime": "Full name",
        "Telefon": "Phone",
        "Adresa": "Address",
        "Opis": "Description",
        "Opis klijenta": "Client notes",
        "Usluga": "Service",
        "Trajanje": "Duration",
        "Trajanje (min)": "Duration (min)",
        "Cena": "Price",
        "Status": "Status",
      },
      de: {
        "Osvezi listu": "Liste aktualisieren",
        "Oznaci sve kao procitano": "Alle als gelesen markieren",
        "Oznaci procitano": "Als gelesen markieren",
        "Nema novih notifikacija.": "Keine neuen Benachrichtigungen.",
        "Nema registrovanih klijenata.": "Keine registrierten Kunden.",
        "Nema usluga za prikaz.": "Keine Services zum Anzeigen.",
        "Nema termina za prikaz.": "Keine Termine zum Anzeigen.",
        "Nema blokada za izabrani datum.": "Keine Sperrzeiten für das gewählte Datum.",
        "Izmeni": "Bearbeiten",
        "Obrisi": "Löschen",
        "Otkazi": "Abbrechen",
        "Otkazi izmenu": "Bearbeitung abbrechen",
        "Sacuvaj izmene": "Änderungen speichern",
        "Sacuvaj uslugu": "Service speichern",
        "Nova usluga": "Neuer Service",
        "Izmeni uslugu": "Service bearbeiten",
        "Aktiviraj": "Aktivieren",
        "Deaktiviraj": "Deaktivieren",
        "Aktivna": "Aktiv",
        "Neaktivna": "Inaktiv",
        "Pravila za termine": "Terminregeln",
        "Minimalno minuta pre zakazivanja": "Mindestminuten vor Buchung",
        "Minimalno minuta pre otkazivanja": "Mindestminuten vor Stornierung",
        "Cuvanje...": "Speichern...",
        "Sacuvaj podesavanja": "Einstellungen speichern",
        "Sacuvaj termin": "Termin speichern",
        "Dodaj blokadu": "Sperrzeit hinzufügen",
        "Izmeni blokadu": "Sperrzeit bearbeiten",
        "Sacuvaj blokadu": "Sperrzeit speichern",
        "Nema rezultata": "Keine Ergebnisse",
        "Rucno": "Manuell",
        "Na cekanju": "Ausstehend",
        "Potvrdjen": "Bestätigt",
        "Zavrsen": "Abgeschlossen",
        "Otkazan": "Storniert",
        "Nije dosao": "Nicht erschienen",
        "Ime i prezime": "Vollständiger Name",
        "Telefon": "Telefon",
        "Adresa": "Adresse",
        "Opis": "Beschreibung",
        "Opis klijenta": "Kundennotizen",
        "Usluga": "Service",
        "Trajanje": "Dauer",
        "Trajanje (min)": "Dauer (Min)",
        "Cena": "Preis",
        "Status": "Status",
      },
      it: {
        "Osvezi listu": "Aggiorna elenco",
        "Oznaci sve kao procitano": "Segna tutto come letto",
        "Oznaci procitano": "Segna come letto",
        "Nema novih notifikacija.": "Nessuna nuova notifica.",
        "Nema registrovanih klijenata.": "Nessun cliente registrato.",
        "Nema usluga za prikaz.": "Nessun servizio da mostrare.",
        "Nema termina za prikaz.": "Nessun appuntamento da mostrare.",
        "Nema blokada za izabrani datum.": "Nessun blocco per la data selezionata.",
        "Izmeni": "Modifica",
        "Obrisi": "Elimina",
        "Otkazi": "Annulla",
        "Otkazi izmenu": "Annulla modifica",
        "Sacuvaj izmene": "Salva modifiche",
        "Sacuvaj uslugu": "Salva servizio",
        "Nova usluga": "Nuovo servizio",
        "Izmeni uslugu": "Modifica servizio",
        "Aktiviraj": "Attiva",
        "Deaktiviraj": "Disattiva",
        "Aktivna": "Attiva",
        "Neaktivna": "Non attiva",
        "Pravila za termine": "Regole appuntamenti",
        "Minimalno minuta pre zakazivanja": "Minuti minimi prima della prenotazione",
        "Minimalno minuta pre otkazivanja": "Minuti minimi prima della cancellazione",
        "Cuvanje...": "Salvataggio...",
        "Sacuvaj podesavanja": "Salva impostazioni",
        "Sacuvaj termin": "Salva appuntamento",
        "Dodaj blokadu": "Aggiungi blocco",
        "Izmeni blokadu": "Modifica blocco",
        "Sacuvaj blokadu": "Salva blocco",
        "Nema rezultata": "Nessun risultato",
        "Rucno": "Manuale",
        "Na cekanju": "In attesa",
        "Potvrdjen": "Confermato",
        "Zavrsen": "Completato",
        "Otkazan": "Annullato",
        "Nije dosao": "Assente",
        "Ime i prezime": "Nome e cognome",
        "Telefon": "Telefono",
        "Adresa": "Indirizzo",
        "Opis": "Descrizione",
        "Opis klijenta": "Note cliente",
        "Usluga": "Servizio",
        "Trajanje": "Durata",
        "Trajanje (min)": "Durata (min)",
        "Cena": "Prezzo",
        "Status": "Stato",
      },
    };

    const exactMap = exactMapByLanguage[language];
    const replaceByLanguage: Record<Exclude<Language, "sr">, Array<[RegExp, string]>> = {
      en: [
        [/^Ukupno:\s*/i, "Total: "],
        [/^Neprocitano:\s*/i, "Unread: "],
        [/^Broj termina:\s*/i, "Appointments: "],
        [/^Poslednji termin:\s*/i, "Last appointment: "],
        [/^Registracija:\s*/i, "Registered: "],
        [/^Adresa:\s*/i, "Address: "],
        [/^Opis:\s*/i, "Description: "],
        [/^Trajanje:\s*/i, "Duration: "],
        [/^Cena:\s*RSD\s*/i, "Price: RSD "],
        [/^Status:\s*/i, "Status: "],
        [/^Termin ID:\s*/i, "Appointment ID: "],
      ],
      de: [
        [/^Ukupno:\s*/i, "Gesamt: "],
        [/^Neprocitano:\s*/i, "Ungelesen: "],
        [/^Broj termina:\s*/i, "Termine: "],
        [/^Poslednji termin:\s*/i, "Letzter Termin: "],
        [/^Registracija:\s*/i, "Registrierung: "],
        [/^Adresa:\s*/i, "Adresse: "],
        [/^Opis:\s*/i, "Beschreibung: "],
        [/^Trajanje:\s*/i, "Dauer: "],
        [/^Cena:\s*RSD\s*/i, "Preis: RSD "],
        [/^Status:\s*/i, "Status: "],
        [/^Termin ID:\s*/i, "Termin-ID: "],
      ],
      it: [
        [/^Ukupno:\s*/i, "Totale: "],
        [/^Neprocitano:\s*/i, "Non lette: "],
        [/^Broj termina:\s*/i, "Numero appuntamenti: "],
        [/^Poslednji termin:\s*/i, "Ultimo appuntamento: "],
        [/^Registracija:\s*/i, "Registrazione: "],
        [/^Adresa:\s*/i, "Indirizzo: "],
        [/^Opis:\s*/i, "Descrizione: "],
        [/^Trajanje:\s*/i, "Durata: "],
        [/^Cena:\s*RSD\s*/i, "Prezzo: RSD "],
        [/^Status:\s*/i, "Stato: "],
        [/^Termin ID:\s*/i, "ID appuntamento: "],
      ],
    };

    const translateText = (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) {
        return value;
      }

      let translated = exactMap[trimmed] ?? value;
      for (const [pattern, replacement] of replaceByLanguage[language]) {
        translated = translated.replace(pattern, replacement);
      }
      return translated;
    };

    const applyTranslation = (root: Node) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let current = walker.nextNode();
      while (current) {
        const textNode = current as Text;
        const parentTag = textNode.parentElement?.tagName;
        if (parentTag !== "SCRIPT" && parentTag !== "STYLE") {
          const translated = translateText(textNode.textContent ?? "");
          if (translated !== textNode.textContent) {
            textNode.textContent = translated;
          }
        }
        current = walker.nextNode();
      }
    };

    const root = document.querySelector(".page");
    if (!root) {
      return;
    }

    applyTranslation(root);
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "characterData" && mutation.target) {
          applyTranslation(mutation.target);
          return;
        }
        mutation.addedNodes.forEach((node) => applyTranslation(node));
      });
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, [language, pathname]);

  const handleLogout = () => {
    setIsNavOpen(false);
    localStorage.removeItem("db_admin_auth");
    router.replace("/admin");
  };

  const handleRefresh = () => {
    setIsNavOpen(false);
    window.location.reload();
  };

  const handleNavToggle = () => setIsNavOpen((prev) => !prev);
  const handleNavClose = () => setIsNavOpen(false);

  if (!ready) {
    return null;
  }

  return (
    <div className="page">
      <header className={`nav nav--has-toggle nav--dropdown${isNavOpen ? " is-open" : ""}`}>
        <div className="container nav-inner">
          <div className="nav-top">
            <Link className="brand" href="/">
              <div className="brand-mark">
                <Image
                  src="/logo.png"
                  alt="Doctor Barber"
                  width={36}
                  height={36}
                />
              </div>
              <div className="brand-title">
                <span>Doctor Barber</span>
                <span>{t.cmsPanel}</span>
              </div>
            </Link>
            <button
              className="nav-toggle"
              type="button"
              aria-expanded={isNavOpen}
              aria-controls="admin-navigation"
              onClick={handleNavToggle}
            >
              <span className="nav-toggle__label">{t.menu}</span>
              <span className="nav-toggle__icon" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </button>
          </div>
          <nav
            id="admin-navigation"
            className={`nav-links${isNavOpen ? " is-open" : ""}`}
          >
            <LanguageSwitcher compact />
            <Link href="/" onClick={handleNavClose}>
              {t.home}
            </Link>
            <Link href="/#booking" onClick={handleNavClose}>
              {t.book}
            </Link>
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href === "/admin/termini" && pathname === "/admin/appointments");
              const showBadge = item.badge && notificationCount > 0;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleNavClose}
                  className={`admin-link ${isActive ? "is-active" : ""}`}
                >
                  <span>{t[item.key]}</span>
                  {showBadge && <span className="nav-badge">{notificationCount}</span>}
                </Link>
              );
            })}
            <button className="button small ghost" type="button" onClick={handleRefresh}>
              {t.refresh}
            </button>
            <button className="button small ghost" type="button" onClick={handleLogout}>
              {t.logout}
            </button>
          </nav>
        </div>
      </header>

      <main className={`admin-shell${fullWidth ? " admin-shell--full" : " container"}`}>
        {!hideHeader && (
          <div className="admin-shell__header">
            <div className="admin-shell__title">
              <h1>{localizedTitle}</h1>
              {localizedSubtitle && <p>{localizedSubtitle}</p>}
            </div>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
