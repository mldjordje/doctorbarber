"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchServices, getActiveServices, services as fallbackServices, type Service } from "@/lib/services";
import { siteConfig } from "@/lib/site";

const WORKING_DAYS = siteConfig.schedule.workingDays ?? [1, 2, 3, 4, 5];
const BOOKING_DAYS_AHEAD = 14;

const formatDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const isWorkingDay = (d: Date) => WORKING_DAYS.includes(d.getDay());

const addDays = (d: Date, n: number) => {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
};

const timeToMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const minutesToTime = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

const parseDuration = (d?: string | number) => {
  if (typeof d === "number") return d;
  if (!d) return 0;
  const val = String(d).toLowerCase();
  if (val.includes("h")) return Math.round(Number(val.replace(/[^\d.]/g, "")) * 60);
  return Number(val.replace(/\D/g, "")) || 0;
};

type AvailItem = { id?: string; time: string; duration?: string | number };

const buildSlots = (
  date: string,
  durationMinutes: number,
  appointments: AvailItem[],
  blocks: AvailItem[],
  minLeadMinutes: number,
  excludeId?: string
): string[] => {
  const dateObj = new Date(`${date}T00:00:00`);
  if (!isWorkingDay(dateObj)) return [];

  const { open, close, slotMinutes, breaks = [] } = siteConfig.schedule;
  const openMin = timeToMinutes(open);
  const closeMin = timeToMinutes(close);
  const now = Date.now();
  const minAllowed = now + Math.max(0, minLeadMinutes) * 60000;
  const required = durationMinutes || slotMinutes;

  const breakWins = (breaks as Array<{ start: string; end: string }>).map((b) => ({
    start: timeToMinutes(b.start),
    end: timeToMinutes(b.end),
  }));

  const reserved = [...appointments, ...blocks]
    .filter((a) => !excludeId || a.id !== excludeId)
    .map((a) => ({
      start: timeToMinutes(a.time),
      end: timeToMinutes(a.time) + (parseDuration(a.duration) || slotMinutes),
    }));

  const slots: string[] = [];
  for (let min = openMin; min + required <= closeMin; min += slotMinutes) {
    const slotDt = new Date(`${date}T${minutesToTime(min)}:00`).getTime();
    if (slotDt < minAllowed) continue;
    if (breakWins.some((b) => min < b.end && min + required > b.start)) continue;
    if (reserved.some((r) => min < r.end && min + required > r.start)) continue;
    slots.push(minutesToTime(min));
  }
  return slots;
};

export type RescheduleAppointment = {
  id: string;
  serviceName: string;
  serviceId?: string;
  date: string;
  time: string;
  duration?: string;
};

export type RescheduleClient = {
  name: string;
  phone: string;
  email: string;
  token: string;
};

type Props = {
  appointment: RescheduleAppointment;
  client: RescheduleClient;
  apiBaseUrl: string;
  onSuccess: () => void;
  onClose: () => void;
};

type StatusState = {
  type: "idle" | "loading" | "success" | "error";
  message?: string;
};

export default function RescheduleModal({ appointment, client, apiBaseUrl, onSuccess, onClose }: Props) {
  const [serviceItems, setServiceItems] = useState<Service[]>(
    getActiveServices(fallbackServices)
  );
  const [serviceId, setServiceId] = useState(() => {
    const match = getActiveServices(fallbackServices).find((s) => s.name === appointment.serviceName);
    return appointment.serviceId || match?.id || getActiveServices(fallbackServices)[0]?.id || "";
  });
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [availabilityByDate, setAvailabilityByDate] = useState<Record<string, string[]>>({});
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [status, setStatus] = useState<StatusState>({ type: "idle" });

  const workingDays = useMemo(() => {
    const days: Date[] = [];
    const today = new Date();
    let cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    while (days.length < BOOKING_DAYS_AHEAD) {
      if (isWorkingDay(cursor)) days.push(new Date(cursor));
      cursor = addDays(cursor, 1);
    }
    return days;
  }, []);

  const selectedService = useMemo(
    () => serviceItems.find((s) => s.id === serviceId) ?? serviceItems[0],
    [serviceId, serviceItems]
  );

  useEffect(() => {
    if (!apiBaseUrl) return;
    fetchServices(apiBaseUrl)
      .then((items) => {
        const active = getActiveServices(items);
        setServiceItems(active);
        const match =
          active.find((s) => s.id === appointment.serviceId) ||
          active.find((s) => s.name === appointment.serviceName);
        if (match) setServiceId(match.id);
        else if (active.length > 0) setServiceId(active[0].id);
      })
      .catch(() => {});
  }, [apiBaseUrl]);

  useEffect(() => {
    if (!apiBaseUrl || !selectedService) return;

    let cancelled = false;
    setLoadingAvail(true);
    setAvailabilityByDate({});
    setSelectedDate("");
    setSelectedTime("");

    const durationMin = parseDuration(selectedService.duration) || 20;
    const dateStrings = workingDays.map(formatDate);

    Promise.all(
      dateStrings.map((date) =>
        fetch(`${apiBaseUrl}/availability.php?date=${encodeURIComponent(date)}`)
          .then((r) => r.json())
          .then((data) => {
            const appts: AvailItem[] = Array.isArray(data.appointments) ? data.appointments : [];
            const blocks: AvailItem[] = Array.isArray(data.blocks) ? data.blocks : [];
            return [date, buildSlots(date, durationMin, appts, blocks, 60, appointment.id)] as const;
          })
          .catch(() => [date, [] as string[]] as const)
      )
    ).then((entries) => {
      if (cancelled) return;
      const map: Record<string, string[]> = {};
      entries.forEach(([d, slots]) => {
        map[d] = slots;
      });
      setAvailabilityByDate(map);
      const first = entries.find(([, s]) => s.length > 0);
      if (first) setSelectedDate(first[0]);
      setLoadingAvail(false);
    });

    return () => {
      cancelled = true;
    };
  }, [selectedService?.id, apiBaseUrl, workingDays, appointment.id]);

  const availableSlots = useMemo(
    () => (selectedDate ? (availabilityByDate[selectedDate] ?? []) : []),
    [selectedDate, availabilityByDate]
  );

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime || !selectedService) return;

    if (!apiBaseUrl) {
      setStatus({ type: "error", message: "API nije podesen." });
      return;
    }

    setStatus({ type: "loading" });

    try {
      const createRes = await fetch(`${apiBaseUrl}/appointments.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: client.name,
          phone: client.phone,
          email: client.email,
          serviceId: selectedService.id,
          serviceName: selectedService.name,
          duration: selectedService.duration,
          price: selectedService.price,
          date: selectedDate,
          time: selectedTime,
          clientToken: client.token,
          source: "web",
          rescheduledFromId: appointment.id,
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData?.message || "Ne mogu da zakazem novi termin.");

      await fetch(`${apiBaseUrl}/appointments.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cancel",
          id: appointment.id,
          clientToken: client.token,
        }),
      });

      setStatus({ type: "success", message: "Termin je uspesno prezakazan!" });
      window.setTimeout(() => onSuccess(), 1100);
    } catch (err) {
      setStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Doslo je do greske.",
      });
    }
  };

  return (
    <div className="confirm-modal" role="dialog" aria-modal="true">
      <div className="confirm-modal__backdrop" onClick={onClose} />
      <div className="confirm-modal__card reschedule-modal">
        <div className="confirm-modal__header">
          <div>
            <strong>Prezakazi termin</strong>
            <span className="reschedule-modal__current">
              {appointment.serviceName} &middot; {appointment.date.split("-").reverse().join(".")} {appointment.time.slice(0, 5)}
            </span>
          </div>
          <button className="confirm-modal__close" type="button" onClick={onClose} aria-label="Zatvori">
            ×
          </button>
        </div>

        <div className="reschedule-modal__body">
          <div className="form-row">
            <label htmlFor="reschedule-service">Usluga</label>
            <select
              id="reschedule-service"
              className="select"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
            >
              {serviceItems.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.duration})
                </option>
              ))}
            </select>
          </div>

          <div className="reschedule-modal__section">
            <p className="reschedule-modal__label">Izaberi datum</p>
            {loadingAvail ? (
              <p className="reschedule-modal__hint">Ucitavanje dostupnih termina...</p>
            ) : (
              <div className="reschedule-dates">
                {workingDays.map((day) => {
                  const dateStr = formatDate(day);
                  const slots = availabilityByDate[dateStr];
                  const hasSlots = Boolean(slots?.length);
                  const loaded = slots !== undefined;
                  return (
                    <button
                      key={dateStr}
                      type="button"
                      className={`reschedule-date-btn${dateStr === selectedDate ? " is-active" : ""}${loaded && !hasSlots ? " is-empty" : ""}`}
                      disabled={loaded && !hasSlots}
                      onClick={() => {
                        setSelectedDate(dateStr);
                        setSelectedTime("");
                      }}
                    >
                      <span className="reschedule-date-btn__wd">
                        {new Intl.DateTimeFormat("sr-RS", { weekday: "short" }).format(day)}
                      </span>
                      <span className="reschedule-date-btn__d">
                        {day.getDate()}.{day.getMonth() + 1}.
                      </span>
                      {loaded && (
                        <span className="reschedule-date-btn__count">
                          {hasSlots ? slots.length : "—"}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {selectedDate && (
            <div className="reschedule-modal__section">
              <p className="reschedule-modal__label">Slobodni termini</p>
              {availableSlots.length === 0 ? (
                <p className="reschedule-modal__hint">Nema slobodnih termina za ovaj dan.</p>
              ) : (
                <div className="reschedule-slots">
                  {availableSlots.map((time) => (
                    <button
                      key={time}
                      type="button"
                      className={`slot-button${time === selectedTime ? " is-active" : ""}`}
                      onClick={() => setSelectedTime(time)}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {status.type !== "idle" && status.message && (
            <div className={`form-status ${status.type}`}>{status.message}</div>
          )}

          <div className="confirm-modal__actions">
            <button
              className="button outline"
              type="button"
              onClick={onClose}
              disabled={status.type === "loading"}
            >
              Odustani
            </button>
            <button
              className="button"
              type="button"
              onClick={handleSubmit}
              disabled={
                !selectedDate ||
                !selectedTime ||
                !selectedService ||
                status.type === "loading" ||
                status.type === "success"
              }
            >
              {status.type === "loading" ? "Prezakazivanje..." : "Potvrdi"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
