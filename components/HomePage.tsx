"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Card, CardBody, Button as HeroButton } from "@heroui/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import BookingForm from "@/components/BookingForm";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage, type Language } from "@/lib/useLanguage";
import { siteConfig } from "@/lib/site";

gsap.registerPlugin(ScrollTrigger);

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

const urlBase64ToUint8Array = (base64String: string) => {
  const padded = `${base64String}${"=".repeat((4 - (base64String.length % 4)) % 4)}`
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(padded);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const content: Record<
  Language,
  {
    menu: string;
    navBooking: string;
    navStudio: string;
    navMyAppointments: string;
    login: string;
    register: string;
    logout: string;
    installTitle: string;
    installSubtitle: string;
    close: string;
    installHttpsHint: string;
    bookNow: string;
    installApp: string;
    howTitle: string;
    howSubtitle: string;
    prepTitle: string;
    prepText: string;
    cancelTitle: string;
    cancelText: string;
    studioTitle: string;
    studioSubtitle: string;
    hours: string;
    location: string;
    locationText: string;
    contact: string;
    contactFallback: string;
    openMaps: string;
    galleryTitle: string;
    galleryText: string;
    reviewTitle: string;
    reviewText: string;
    reviewBody: string;
    reviewSeo: string;
    reviewButton: string;
    instagramTitle: string;
    instagramText: string;
    instagramHandle: string;
    instagramButton: string;
    homepageNoticeDefault: string;
  }
> = {
  sr: {
    menu: "Meni",
    navBooking: "Zakazivanje",
    navStudio: "Studio",
    navMyAppointments: "Moji termini",
    login: "Prijava",
    register: "Registracija",
    logout: "Odjava",
    installTitle: "Instaliraj Doctor Barber",
    installSubtitle: "Dodaj aplikaciju na pocetni ekran.",
    close: "Zatvori",
    installHttpsHint: "Instalacija se pojavi samo kada je sajt otvoren preko HTTPS.",
    bookNow: "Zakazi termin",
    installApp: "Instaliraj aplikaciju",
    howTitle: "Kako funkcionise",
    howSubtitle: "Brzo, jasno i bez cekanja. Zakazi, potvrdi, dodji na vreme.",
    prepTitle: "Priprema",
    prepText: "Dodji 5 minuta ranije. Raspored je precizan.",
    cancelTitle: "Politika otkazivanja",
    cancelText: "Otkazivanje obavezno minimum 2 sata ranije. U suprotnom se termin smatra naplatnim.",
    studioTitle: "Studio",
    studioSubtitle: "Mirna atmosfera i ogranicen broj termina.",
    hours: "Radno vreme",
    location: "Lokacija",
    locationText: "Lokacija se salje uz potvrdu.",
    contact: "Kontakt",
    contactFallback: "Kontakt podaci se dodaju nakon aktivacije domena.",
    openMaps: "Otvori u Google Maps",
    galleryTitle: "Galerija / Ambijent",
    galleryText: "Dve scene iz studija koje najbolje opisuju atmosferu.",
    reviewTitle: "Oceni nas na Google",
    reviewText:
      "Ako si zadovoljan uslugom, ostavi kratku ocenu. Hvala na podrsci lokalnom barber studiju u Nisu.",
    reviewBody: "Klasicno sisanje, fade i brada. Tvoja preporuka nam puno znaci.",
    reviewSeo: "Frizer u Nisu za fade sisanje, klasicno sisanje i uredjivanje brade.",
    reviewButton: "Oceni na Google",
    instagramTitle: "Instagram",
    instagramText: "Prati najnovije transformacije, fade radove i dnevni vibe iz studija.",
    instagramHandle: "@doctor__barber",
    instagramButton: "Zapratite nas",
    homepageNoticeDefault: "",
  },
  en: {
    menu: "Menu",
    navBooking: "Booking",
    navStudio: "Studio",
    navMyAppointments: "My appointments",
    login: "Login",
    register: "Register",
    logout: "Logout",
    installTitle: "Install Doctor Barber",
    installSubtitle: "Add the app to your home screen.",
    close: "Close",
    installHttpsHint: "Install prompt appears only when the site is opened via HTTPS.",
    bookNow: "Book now",
    installApp: "Install app",
    howTitle: "How it works",
    howSubtitle: "Fast, clear, and no waiting. Book, confirm, arrive on time.",
    prepTitle: "Preparation",
    prepText: "Arrive 5 minutes earlier. The schedule is precise.",
    cancelTitle: "Cancellation policy",
    cancelText: "Cancellation is required at least 2 hours in advance.",
    studioTitle: "Studio",
    studioSubtitle: "Calm atmosphere and limited appointment slots.",
    hours: "Working hours",
    location: "Location",
    locationText: "Location is shared with the confirmation message.",
    contact: "Contact",
    contactFallback: "Contact details will be added after domain activation.",
    openMaps: "Open in Google Maps",
    galleryTitle: "Gallery / Atmosphere",
    galleryText: "Two scenes from the studio that best describe the vibe.",
    reviewTitle: "Rate us on Google",
    reviewText: "If you liked the service, leave a short review. Thank you for supporting local business.",
    reviewBody: "Classic haircut, fade, and beard service. Your recommendation means a lot.",
    reviewSeo: "Barber in Nis for fade cuts, classic cuts, and beard grooming.",
    reviewButton: "Rate on Google",
    instagramTitle: "Instagram",
    instagramText: "Follow our latest transformations, fade work, and daily studio vibe.",
    instagramHandle: "@doctor__barber",
    instagramButton: "Follow us",
    homepageNoticeDefault: "",
  },
  de: {
    menu: "Menü",
    navBooking: "Buchung",
    navStudio: "Studio",
    navMyAppointments: "Meine Termine",
    login: "Anmelden",
    register: "Registrieren",
    logout: "Abmelden",
    installTitle: "Doctor Barber installieren",
    installSubtitle: "Füge die App deinem Startbildschirm hinzu.",
    close: "Schließen",
    installHttpsHint: "Der Installationshinweis erscheint nur über HTTPS.",
    bookNow: "Jetzt buchen",
    installApp: "App installieren",
    howTitle: "So funktioniert es",
    howSubtitle: "Schnell, klar und ohne Warten. Buchen, bestätigen, pünktlich kommen.",
    prepTitle: "Vorbereitung",
    prepText: "Komme 5 Minuten früher. Der Zeitplan ist präzise.",
    cancelTitle: "Stornierungsrichtlinie",
    cancelText: "Eine Stornierung ist mindestens 2 Stunden vorher erforderlich.",
    studioTitle: "Studio",
    studioSubtitle: "Ruhige Atmosphäre und begrenzte Terminanzahl.",
    hours: "Öffnungszeiten",
    location: "Standort",
    locationText: "Der Standort wird mit der Bestätigung geteilt.",
    contact: "Kontakt",
    contactFallback: "Kontaktdaten werden nach der Domain-Aktivierung hinzugefügt.",
    openMaps: "In Google Maps öffnen",
    galleryTitle: "Galerie / Atmosphäre",
    galleryText: "Zwei Szenen aus dem Studio, die die Stimmung am besten zeigen.",
    reviewTitle: "Bewerte uns auf Google",
    reviewText: "Wenn dir der Service gefallen hat, hinterlasse eine kurze Bewertung.",
    reviewBody: "Klassischer Haarschnitt, Fade und Bartservice. Deine Empfehlung zählt.",
    reviewSeo: "Barber in Nis für Fade, klassische Schnitte und Bartpflege.",
    reviewButton: "Auf Google bewerten",
    instagramTitle: "Instagram",
    instagramText: "Folge unseren neuesten Transformationen, Fade-Arbeiten und dem Studio-Alltag.",
    instagramHandle: "@doctor__barber",
    instagramButton: "Folge uns",
    homepageNoticeDefault: "",
  },
  it: {
    menu: "Menu",
    navBooking: "Prenotazione",
    navStudio: "Studio",
    navMyAppointments: "I miei appuntamenti",
    login: "Accedi",
    register: "Registrati",
    logout: "Esci",
    installTitle: "Installa Doctor Barber",
    installSubtitle: "Aggiungi l'app alla schermata principale.",
    close: "Chiudi",
    installHttpsHint: "L'installazione appare solo quando il sito e aperto in HTTPS.",
    bookNow: "Prenota ora",
    installApp: "Installa app",
    howTitle: "Come funziona",
    howSubtitle: "Veloce, chiaro, senza attese. Prenota, conferma, arriva puntuale.",
    prepTitle: "Preparazione",
    prepText: "Arriva 5 minuti prima. Il programma e preciso.",
    cancelTitle: "Politica di cancellazione",
    cancelText: "La cancellazione e richiesta almeno 2 ore prima.",
    studioTitle: "Studio",
    studioSubtitle: "Atmosfera calma e numero limitato di appuntamenti.",
    hours: "Orari",
    location: "Posizione",
    locationText: "La posizione viene inviata con la conferma.",
    contact: "Contatto",
    contactFallback: "I contatti saranno aggiunti dopo l'attivazione del dominio.",
    openMaps: "Apri in Google Maps",
    galleryTitle: "Galleria / Atmosfera",
    galleryText: "Due scene dello studio che descrivono al meglio l'atmosfera.",
    reviewTitle: "Lascia una recensione su Google",
    reviewText: "Se sei soddisfatto, lascia una recensione breve. Grazie per il supporto.",
    reviewBody: "Taglio classico, fade e barba. Il tuo consiglio e molto importante.",
    reviewSeo: "Barbiere a Nis per fade, taglio classico e cura della barba.",
    reviewButton: "Recensisci su Google",
    instagramTitle: "Instagram",
    instagramText: "Segui trasformazioni recenti, lavori fade e atmosfera quotidiana dello studio.",
    instagramHandle: "@doctor__barber",
    instagramButton: "Seguici",
    homepageNoticeDefault: "",
  },
};

export default function HomePage() {
  const { language } = useLanguage();
  const copy = content[language];
  const [showLoader, setShowLoader] = useState(true);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isNavScrolled, setIsNavScrolled] = useState(false);
  const [isClientLoggedIn, setIsClientLoggedIn] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installModalOpen, setInstallModalOpen] = useState(false);
  const [installPlatform, setInstallPlatform] = useState<"ios" | "android" | "desktop" | "other">("other");
  const [homepageNotice, setHomepageNotice] = useState("");
  const [pushReady, setPushReady] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushMessage, setPushMessage] = useState("");
  const prefersReducedMotion = useReducedMotion();
  const year = new Date().getFullYear();

  // GSAP refs
  const heroRef = useRef<HTMLElement>(null);
  const heroBgRef = useRef<HTMLDivElement>(null);
  const bookingRef = useRef<HTMLElement>(null);
  const howRef = useRef<HTMLElement>(null);
  const studioRef = useRef<HTMLElement>(null);
  const galleryRef = useRef<HTMLElement>(null);
  const instagramRef = useRef<HTMLElement>(null);
  const reviewRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => setShowLoader(false), 1600);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    document.body.style.overflow = showLoader ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showLoader]);

  useEffect(() => {
    const handleScroll = () => setIsNavScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("db_client_token");
    setIsClientLoggedIn(Boolean(token));
  }, []);

  useEffect(() => {
    const nav = navigator as Navigator & { standalone?: boolean };
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches || Boolean(nav.standalone);
    const ua = navigator.userAgent.toLowerCase();
    setIsInstalled(standalone);
    if (/iphone|ipad|ipod/.test(ua)) setInstallPlatform("ios");
    else if (/android/.test(ua)) setInstallPlatform("android");
    else if (ua.includes("windows") || ua.includes("macintosh") || ua.includes("linux")) setInstallPlatform("desktop");
    else setInstallPlatform("other");
  }, []);

  useEffect(() => {
    let active = true;
    const syncPushState = async () => {
      const supported = "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
      if (!supported) { if (active) { setPushReady(false); setPushEnabled(false); } return; }
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (!active) return;
        setPushReady(true);
        setPushEnabled(Boolean(sub) && Notification.permission === "granted");
      } catch { if (active) { setPushReady(false); setPushEnabled(false); } }
    };
    syncPushState();
    return () => { active = false; };
  }, [isClientLoggedIn]);

  useEffect(() => {
    const onBefore = (e: Event) => { e.preventDefault(); setInstallPrompt(e as BeforeInstallPromptEvent); };
    const onInstalled = () => { setInstallPrompt(null); setIsInstalled(true); setInstallModalOpen(false); };
    window.addEventListener("beforeinstallprompt", onBefore);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onBefore); window.removeEventListener("appinstalled", onInstalled); };
  }, []);

  useEffect(() => {
    if (!apiBaseUrl) { setHomepageNotice(copy.homepageNoticeDefault); return; }
    let active = true;
    fetch(`${apiBaseUrl}/settings.php`).then((r) => r.json()).then((data) => {
      if (!active) return;
      const s = data?.settings ?? data ?? {};
      setHomepageNotice(typeof s.homepageNotice === "string" ? s.homepageNotice.trim() : "");
    }).catch(() => { if (active) setHomepageNotice(copy.homepageNoticeDefault); });
    return () => { active = false; };
  }, [copy.homepageNoticeDefault]);

  // ── GSAP: parallax + scroll reveals ──
  useEffect(() => {
    if (prefersReducedMotion || showLoader) return;

    const ctx = gsap.context(() => {
      // Hero parallax
      if (heroBgRef.current && heroRef.current) {
        gsap.to(heroBgRef.current, {
          yPercent: 28,
          ease: "none",
          scrollTrigger: { trigger: heroRef.current, start: "top top", end: "bottom top", scrub: true },
        });
      }

      // Scroll-reveal utility
      const revealAll = (sectionRef: React.RefObject<HTMLElement | null>) => {
        if (!sectionRef.current) return;
        const els = sectionRef.current.querySelectorAll<HTMLElement>(".lux-reveal, .lux-reveal > *");
        gsap.fromTo(els,
          { opacity: 0, y: 56 },
          {
            opacity: 1, y: 0,
            duration: 0.85, ease: "power3.out", stagger: 0.1,
            scrollTrigger: { trigger: sectionRef.current, start: "top 84%", toggleActions: "play none none none" },
          }
        );
      };

      [bookingRef, howRef, studioRef, galleryRef, instagramRef, reviewRef].forEach(revealAll);

      // Gold line animation per section
      const sectionRefs = [bookingRef, howRef, studioRef, galleryRef, instagramRef, reviewRef];
      sectionRefs.forEach((ref) => {
        if (!ref.current) return;
        const line = ref.current.querySelector<HTMLElement>(".lux-line");
        if (!line) return;
        gsap.fromTo(line,
          { scaleX: 0, transformOrigin: "left center" },
          {
            scaleX: 1, duration: 1.2, ease: "power3.out",
            scrollTrigger: { trigger: line, start: "top 88%", toggleActions: "play none none none" },
          }
        );
      });

      // Gallery wipe reveal
      if (galleryRef.current) {
        galleryRef.current.querySelectorAll<HTMLElement>(".gallery-wipe").forEach((wipe) => {
          gsap.fromTo(wipe,
            { scaleX: 1, transformOrigin: "left center" },
            {
              scaleX: 0, duration: 1.2, ease: "power3.inOut",
              scrollTrigger: { trigger: wipe.closest(".lux-gallery__item"), start: "top 80%", toggleActions: "play none none none" },
            }
          );
        });
      }
    });

    return () => ctx.revert();
  }, [prefersReducedMotion, showLoader]);

  const handleNavToggle = () => setIsNavOpen((p) => !p);
  const handleNavClose = () => setIsNavOpen(false);
  const handleClientLogout = () => {
    localStorage.removeItem("db_client_token");
    localStorage.removeItem("db_client_name");
    localStorage.removeItem("db_client_phone");
    localStorage.removeItem("db_client_email");
    setIsClientLoggedIn(false);
    setPushEnabled(false);
    setPushMessage("");
    handleNavClose();
  };

  const handleInstallClick = async () => {
    if (!installPrompt) { setInstallModalOpen(true); return; }
    try { await installPrompt.prompt(); await installPrompt.userChoice; } finally { setInstallPrompt(null); }
  };

  const handleAcceptNotifications = async () => {
    const supported = "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
    if (!supported) { setPushMessage("Notifikacije nisu podrzane na ovom uredjaju."); return; }
    if (!isClientLoggedIn) { setPushMessage("Prijavite se da biste aktivirali obavestenja."); return; }
    if (!apiBaseUrl) { setPushMessage("API nije podesen."); return; }
    if (!vapidPublicKey) { setPushMessage("VAPID kljuc nije podesen."); return; }
    const clientToken = localStorage.getItem("db_client_token") || "";
    if (!clientToken) { setPushMessage("Nedostaje klijentski token."); return; }
    setPushLoading(true);
    setPushMessage("");
    try {
      let permission = Notification.permission;
      if (permission === "default") permission = await Notification.requestPermission();
      if (permission !== "granted") { setPushEnabled(false); setPushMessage("Dozvola za notifikacije nije odobrena."); return; }
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) });
      const res = await fetch(`${apiBaseUrl}/push-subscriptions.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "subscribe", clientToken, subscription: sub.toJSON(), userAgent: navigator.userAgent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Ne mogu da aktiviram obavestenja.");
      setPushReady(true);
      setPushEnabled(true);
      setPushMessage("Obavestenja su ukljucena.");
    } catch (err) {
      setPushEnabled(false);
      setPushMessage(err instanceof Error ? err.message : "Ne mogu da aktiviram obavestenja.");
    } finally {
      setPushLoading(false);
    }
  };

  const showInstallButton = !isInstalled;

  const installSteps = {
    ios: [
      language === "sr" ? { title: "Otvori Share meni", body: "U Safari klikni Share ikonicu." } : language === "en" ? { title: "Open Share menu", body: "In Safari, tap the Share icon." } : language === "it" ? { title: "Apri menu Share", body: "In Safari tocca l'icona Share." } : { title: "Share-Menü öffnen", body: "Tippe in Safari auf das Share-Symbol." },
      language === "sr" ? { title: "Izaberi Add to Home Screen", body: "Skroluj meni i tapni Add to Home Screen." } : language === "en" ? { title: "Choose Add to Home Screen", body: "Scroll and tap Add to Home Screen." } : language === "it" ? { title: "Scegli Add to Home Screen", body: "Scorri il menu e tocca Add to Home Screen." } : { title: "Add to Home Screen wählen", body: "Scrolle und tippe auf Add to Home Screen." },
      language === "sr" ? { title: "Potvrdi instalaciju", body: "Tapni Add i aplikacija ce biti na ekranu." } : language === "en" ? { title: "Confirm install", body: "Tap Add and the app will appear on your screen." } : language === "it" ? { title: "Conferma installazione", body: "Tocca Add e l'app apparira sullo schermo." } : { title: "Installation bestätigen", body: "Tippe auf Add, danach erscheint die App auf deinem Bildschirm." },
    ],
    android: [
      language === "sr" ? { title: "Otvori browser meni", body: "Klikni na tri tacke u Chrome-u." } : language === "en" ? { title: "Open browser menu", body: "Tap the three dots in Chrome." } : language === "it" ? { title: "Apri menu browser", body: "Tocca i tre puntini in Chrome." } : { title: "Browser-Menü öffnen", body: "Tippe in Chrome auf die drei Punkte." },
      language === "sr" ? { title: "Izaberi Install app", body: "Opcija je Install app ili Add to Home screen." } : language === "en" ? { title: "Choose Install app", body: "Option is Install app or Add to Home screen." } : language === "it" ? { title: "Scegli Install app", body: "L'opzione e Install app o Add to Home screen." } : { title: "Install app wählen", body: "Die Option heißt Install app oder Add to Home screen." },
      language === "sr" ? { title: "Potvrdi instalaciju", body: "Potvrdi i aplikacija je na pocetnom ekranu." } : language === "en" ? { title: "Confirm install", body: "Confirm and the app is added to home screen." } : language === "it" ? { title: "Conferma installazione", body: "Conferma e l'app sara nella schermata iniziale." } : { title: "Installation bestätigen", body: "Bestätige und die App wird dem Startbildschirm hinzugefügt." },
    ],
    desktop: [
      language === "sr" ? { title: "Nadji install ikonu", body: "U Chrome/Edge klikni ikonu pored adrese." } : language === "en" ? { title: "Find install icon", body: "In Chrome/Edge click the icon near address bar." } : language === "it" ? { title: "Trova icona installazione", body: "In Chrome/Edge clicca l'icona vicino alla barra indirizzi." } : { title: "Installationssymbol finden", body: "Klicke in Chrome/Edge auf das Symbol neben der Adressleiste." },
      language === "sr" ? { title: "Potvrdi instalaciju", body: "Izaberi Install i aplikacija se otvara kao app." } : language === "en" ? { title: "Confirm install", body: "Click Install and app opens like a desktop app." } : language === "it" ? { title: "Conferma installazione", body: "Scegli Install e l'app si apre come app desktop." } : { title: "Installation bestätigen", body: "Klicke auf Install, danach öffnet sich die App wie eine Desktop-App." },
    ],
    other: [
      language === "sr" ? { title: "Proveri browser meni", body: "Potrazi opciju Install app ili Add to Home screen." } : language === "en" ? { title: "Check browser menu", body: "Find Install app or Add to Home screen option." } : language === "it" ? { title: "Controlla menu browser", body: "Cerca Install app o Add to Home screen." } : { title: "Browser-Menü prüfen", body: "Suche nach Install app oder Add to Home screen." },
      language === "sr" ? { title: "Potvrdi instalaciju", body: "Potvrdi i ikonica se pojavi na ekranu." } : language === "en" ? { title: "Confirm install", body: "Confirm and icon will show on your screen." } : language === "it" ? { title: "Conferma installazione", body: "Conferma e l'icona apparira sullo schermo." } : { title: "Installation bestätigen", body: "Bestätige und das Symbol erscheint auf deinem Bildschirm." },
    ],
  };
  const steps = installSteps[installPlatform];

  return (
    <div className="lux-page">

      {/* ── Cinematic Preloader ── */}
      <AnimatePresence>
        {showLoader && (
          <motion.div
            className="lux-preloader"
            initial={{ y: 0 }}
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { y: "-100%", transition: { duration: 0.95, ease: [0.76, 0, 0.24, 1] } }
            }
          >
            <div className="lux-preloader__noise" aria-hidden="true" />
            <div className="lux-preloader__glow" aria-hidden="true" />
            <motion.div
              className="lux-preloader__body"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                className="lux-preloader__mark"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                <Image src="/logo.png" alt="Doctor Barber" width={46} height={46} />
              </motion.div>
              <motion.div
                className="lux-preloader__title"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.7, delay: 0.45 }}
              >
                <span>Doctor Barber</span>
                <span>Barber Studio</span>
              </motion.div>
              <motion.div
                className="lux-preloader__dots"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5, delay: 0.7 }}
                aria-hidden="true"
              >
                <span /><span /><span />
              </motion.div>
            </motion.div>
            <motion.div
              className="lux-preloader__progress"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 1.4, delay: 0.1, ease: "linear" }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Navigation ── */}
      <header className={`lux-nav${isNavOpen ? " is-open" : ""}${isNavScrolled ? " is-scrolled" : ""}`}>
        <div className="container lux-nav__inner">
          <div className="lux-nav__top">
            <div className="lux-brand">
              <div className="lux-brand__mark">
                <Image src="/logo.png" alt="Doctor Barber" width={34} height={34} priority />
              </div>
              <div className="lux-brand__title">
                <span>Doctor Barber</span>
                <span>Barber Studio</span>
              </div>
            </div>
            <button
              className="lux-nav__toggle"
              type="button"
              aria-expanded={isNavOpen}
              aria-controls="lux-primary-nav"
              onClick={handleNavToggle}
            >
              <span className="lux-nav__toggle-label">{copy.menu}</span>
              <span className="lux-nav__toggle-icon" aria-hidden="true">
                <span /><span /><span />
              </span>
            </button>
          </div>
          <nav id="lux-primary-nav" className={`lux-nav__links${isNavOpen ? " is-open" : ""}`}>
            <LanguageSwitcher compact />
            <a href="#booking" onClick={handleNavClose}>{copy.navBooking}</a>
            <a href="#studio" onClick={handleNavClose}>{copy.navStudio}</a>
            <button
              className="button small outline"
              type="button"
              onClick={handleAcceptNotifications}
              disabled={!pushReady || pushEnabled || pushLoading}
            >
              {pushLoading ? "Aktiviranje..." : "Prihvati obaveštenja"}
            </button>
            {pushEnabled && <span className="lux-nav__msg">Obavestenja su ukljucena.</span>}
            {!pushEnabled && pushMessage && <span className="lux-nav__msg">{pushMessage}</span>}
            {isClientLoggedIn && (
              <Link href="/moji-termini" onClick={handleNavClose}>{copy.navMyAppointments}</Link>
            )}
            {!isClientLoggedIn && (
              <Link href="/login" onClick={handleNavClose}>{copy.login}</Link>
            )}
            {!isClientLoggedIn && (
              <Link className="button small outline" href="/register" onClick={handleNavClose}>{copy.register}</Link>
            )}
            {isClientLoggedIn && (
              <button className="button small ghost" type="button" onClick={handleClientLogout}>{copy.logout}</button>
            )}
          </nav>
        </div>
      </header>

      {/* ── Install Modal ── */}
      {installModalOpen && (
        <div className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="install-title">
          <div className="confirm-modal__backdrop" onClick={() => setInstallModalOpen(false)} />
          <div className="confirm-modal__card install-modal__card">
            <div className="confirm-modal__header">
              <div>
                <h3 id="install-title">{copy.installTitle}</h3>
                <p className="install-modal__subtitle">{copy.installSubtitle}</p>
              </div>
              <button className="confirm-modal__close" type="button" onClick={() => setInstallModalOpen(false)} aria-label={copy.close}>×</button>
            </div>
            <div className="install-modal__body">
              <div className="install-steps">
                {steps.map((step, idx) => (
                  <div key={step.title} className="install-step">
                    <div className="install-step__index">{idx + 1}</div>
                    <div className="install-step__content">
                      <div className="install-step__title">{step.title}</div>
                      <div className="install-step__desc">{step.body}</div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="install-modal__hint">{copy.installHttpsHint}</p>
            </div>
            <div className="confirm-modal__actions">
              <button className="button ghost" type="button" onClick={() => setInstallModalOpen(false)}>{copy.close}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Site Notice ── */}
      {homepageNotice && (
        <motion.div
          className="lux-notice-wrap"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.4 }}
        >
          <div className="container">
            <div className="lux-notice" role="status" aria-live="polite">
              <span className="lux-notice__dot" aria-hidden="true" />
              <p>{homepageNotice}</p>
            </div>
          </div>
        </motion.div>
      )}

      <main>
        {/* ── Hero ── */}
        <section ref={heroRef} className="lux-hero">
          <div ref={heroBgRef} className="lux-hero__bg">
            <Image
              src="/newhero.jpg"
              alt="Doctor Barber studio"
              fill
              priority
              sizes="100vw"
              style={{ objectFit: "cover" }}
            />
          </div>
          <div className="lux-hero__overlay" aria-hidden="true" />
          <div className="lux-hero__noise" aria-hidden="true" />

          {/* Animated particles / orbs */}
          <div className="lux-hero__particles" aria-hidden="true">
            {[...Array(12)].map((_, i) => (
              <span key={i} className={`lux-particle lux-particle--${i + 1}`} />
            ))}
          </div>

          {/* Gold shimmer sweep */}
          <div className="lux-hero__shimmer" aria-hidden="true" />

          {/* Corner vignette accent lines */}
          <div className="lux-hero__corner lux-hero__corner--tl" aria-hidden="true" />
          <div className="lux-hero__corner lux-hero__corner--br" aria-hidden="true" />

          {/* Radial glow behind text */}
          <div className="lux-hero__glow" aria-hidden="true" />

          <div className="container lux-hero__inner">
            <motion.div
              className="lux-hero__eyebrow"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.7, delay: 1.85 }}
            >
              Barber Studio · Niš
            </motion.div>

            <motion.h1
              className="lux-hero__heading"
              initial={{ opacity: 0, y: 48 }}
              animate={{ opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 1.1, delay: 2.05, ease: [0.16, 1, 0.3, 1] }}
            >
              Doctor<br />Barber
            </motion.h1>

            <motion.p
              className="lux-hero__sub"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8, delay: 2.35 }}
            >
              {copy.howSubtitle}
            </motion.p>

            <motion.div
              className="lux-hero__actions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8, delay: 2.6 }}
            >
              <a className="lux-btn lux-btn--gold" href="#booking">{copy.bookNow}</a>
              {showInstallButton && (
                <button className="lux-btn lux-btn--glass" type="button" onClick={handleInstallClick}>
                  {copy.installApp}
                </button>
              )}
              {!isClientLoggedIn && (
                <Link className="lux-btn lux-btn--glass" href="/login">{copy.login}</Link>
              )}
              {!isClientLoggedIn && (
                <Link className="lux-btn lux-btn--outline" href="/register">{copy.register}</Link>
              )}
              {isClientLoggedIn && (
                <Link className="lux-btn lux-btn--glass" href="/moji-termini">{copy.navMyAppointments}</Link>
              )}
              {isClientLoggedIn && (
                <button className="lux-btn lux-btn--glass" type="button" onClick={handleClientLogout}>{copy.logout}</button>
              )}
            </motion.div>
          </div>

          <div className="lux-hero__scroll" aria-hidden="true">
            <div className="lux-hero__scroll-line" />
          </div>
        </section>

        {/* ── Booking ── */}
        <section id="booking" ref={bookingRef} className="lux-section">
          <div className="container">
            <div className="lux-section__header lux-reveal">
              <div className="lux-line" />
              <div className="lux-section__meta">
                <span className="lux-label">01</span>
                <h2>{copy.navBooking}</h2>
              </div>
            </div>
            <div className="lux-booking-frame lux-reveal">
              <BookingForm language={language} />
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section ref={howRef} className="lux-section lux-section--alt">
          <div className="container">
            <div className="lux-section__header lux-reveal">
              <div className="lux-line" />
              <div className="lux-section__meta">
                <span className="lux-label">02</span>
                <h2>{copy.howTitle}</h2>
                <p className="lux-section__sub">{copy.howSubtitle}</p>
              </div>
            </div>
            <div className="lux-cards lux-reveal">
              <div className="lux-card">
                <div className="lux-card__num">01</div>
                <h4>{copy.prepTitle}</h4>
                <p>{copy.prepText}</p>
              </div>
              <div className="lux-card">
                <div className="lux-card__num">02</div>
                <h4>{copy.cancelTitle}</h4>
                <p>{copy.cancelText}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Studio ── */}
        <section id="studio" ref={studioRef} className="lux-section">
          <div className="container">
            <div className="lux-section__header lux-reveal">
              <div className="lux-line" />
              <div className="lux-section__meta">
                <span className="lux-label">03</span>
                <h2>{copy.studioTitle}</h2>
                <p className="lux-section__sub">{copy.studioSubtitle}</p>
              </div>
            </div>
            <div className="lux-cards lux-reveal">
              <div className="lux-card">
                <div className="lux-card__num">—</div>
                <h4>{copy.hours}</h4>
                <p>{siteConfig.hours}</p>
              </div>
              <div className="lux-card">
                <div className="lux-card__num">—</div>
                <h4>{copy.location}</h4>
                <p>{copy.locationText}</p>
              </div>
              <div className="lux-card">
                <div className="lux-card__num">—</div>
                <h4>{copy.contact}</h4>
                <p>
                  {siteConfig.phone && <span>{siteConfig.phone}</span>}
                  {siteConfig.email && <span>{siteConfig.phone ? " | " : ""}{siteConfig.email}</span>}
                  {!siteConfig.phone && !siteConfig.email && <span>{copy.contactFallback}</span>}
                </p>
              </div>
            </div>
            <div className="lux-map lux-reveal">
              <iframe
                title="Doctor Barber lokacija"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2903.2545068929708!2d21.8622563!3d43.3089314!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4755b0b14f921bab%3A0xa0b0730c4935e4ae!2sDoctor%20Barber!5e0!3m2!1sen!2srs!4v1766882078982!5m2!1sen!2srs"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="lux-map__actions">
                <a
                  className="lux-btn lux-btn--outline"
                  href="https://maps.app.goo.gl/V9ZjSA8dCXB2cwbn7"
                  target="_blank"
                  rel="noreferrer"
                >
                  {copy.openMaps}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── Gallery ── */}
        <section ref={galleryRef} className="lux-section lux-section--alt">
          <div className="container">
            <div className="lux-section__header lux-reveal">
              <div className="lux-line" />
              <div className="lux-section__meta">
                <span className="lux-label">04</span>
                <h2>{copy.galleryTitle}</h2>
                <p className="lux-section__sub">{copy.galleryText}</p>
              </div>
            </div>
            <div className="lux-gallery lux-reveal">
              <div className="lux-gallery__item">
                <Image src="/newhero.jpg" alt="Ambijent studija" fill sizes="(max-width: 900px) 100vw, 50vw" style={{ objectFit: "cover" }} />
                <div className="gallery-wipe" aria-hidden="true" />
              </div>
              <div className="lux-gallery__item">
                <Image src="/new1.jpg" alt="Detalji enterijera" fill sizes="(max-width: 900px) 100vw, 50vw" style={{ objectFit: "cover" }} />
                <div className="gallery-wipe" aria-hidden="true" />
              </div>
            </div>
          </div>
        </section>

        {/* ── Instagram ── */}
        <section ref={instagramRef} className="lux-section">
          <div className="container">
            <div className="lux-section__header lux-reveal">
              <div className="lux-line" />
              <div className="lux-section__meta">
                <span className="lux-label">05</span>
                <h2>{copy.instagramTitle}</h2>
                <p className="lux-section__sub">{copy.instagramText}</p>
              </div>
            </div>
            <div className="lux-instagram lux-reveal">
              <motion.div
                className="lux-instagram__orb lux-instagram__orb--a"
                animate={prefersReducedMotion ? {} : { y: [0, -16, 0] }}
                transition={prefersReducedMotion ? {} : { duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="lux-instagram__orb lux-instagram__orb--b"
                animate={prefersReducedMotion ? {} : { y: [0, 12, 0] }}
                transition={prefersReducedMotion ? {} : { duration: 7, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                animate={prefersReducedMotion ? {} : { y: [0, -10, 0] }}
                transition={prefersReducedMotion ? {} : { duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Card className="instagram-card" shadow="lg">
                  <CardBody>
                    <div className="instagram-card__head">
                      <strong>{copy.instagramHandle}</strong>
                      <span>Doctor Barber</span>
                    </div>
                    <div className="instagram-card__grid" aria-hidden="true">
                      <span /><span /><span />
                    </div>
                    <HeroButton
                      as="a"
                      href="https://www.instagram.com/doctor__barber/?hl=en"
                      target="_blank"
                      rel="noreferrer"
                      color="primary"
                      radius="full"
                      className="instagram-card__button"
                    >
                      {copy.instagramButton}
                    </HeroButton>
                  </CardBody>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── Google Review ── */}
        <section ref={reviewRef} className="lux-section lux-section--alt">
          <div className="container">
            <div className="lux-section__header lux-reveal">
              <div className="lux-line" />
              <div className="lux-section__meta">
                <span className="lux-label">06</span>
                <h2>{copy.reviewTitle}</h2>
                <p className="lux-section__sub">{copy.reviewText}</p>
              </div>
            </div>
            <div className="lux-review lux-reveal">
              <div className="lux-review__copy">
                <strong>Doctor Barber Niš</strong>
                <p>{copy.reviewBody}</p>
                <p className="lux-review__seo">{copy.reviewSeo}</p>
              </div>
              <div className="lux-review__action">
                <a
                  className="lux-btn lux-btn--gold"
                  href="https://share.google/hF9NR9UUlcHPwfLcM"
                  target="_blank"
                  rel="noreferrer"
                >
                  {copy.reviewButton}
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="lux-footer">
        <div className="container lux-footer__inner">
          <div className="lux-footer__brand">
            <Image src="/logo.png" alt="Doctor Barber" width={26} height={26} />
            <span>Doctor Barber</span>
          </div>
          <p>© {year} · Barber Studio · Niš</p>
          <a
            className="lux-footer__credit"
            href="https://adspire.rs"
            target="_blank"
            rel="noopener"
          >
            <span>Izrada sajta</span>
            <span className="lux-footer__credit-name">Adspire</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
