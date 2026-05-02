"use client";

import { useEffect, useMemo, useState } from "react";

import AdminShell from "@/components/admin/AdminShell";
import { formatDateDDMMYYYY } from "@/lib/dateTime";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const adminKey = process.env.NEXT_PUBLIC_ADMIN_KEY || "";

type Appointment = {
  id: string;
  clientName: string;
  phone?: string;
  email?: string;
  serviceName: string;
  price?: number;
  date: string;
  time: string;
  notes?: string;
  status?: string;
};

type StatusState = {
  type: "idle" | "loading" | "success" | "error";
  message?: string;
};

const formatDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const normalizeTime = (value: string) => (value ? value.slice(0, 5) : "");

export default function AdminDugoviPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadStatus, setLoadStatus] = useState<StatusState>({ type: "idle" });
  const [actionStatus, setActionStatus] = useState<Record<string, StatusState>>({});

  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const [dateFrom, setDateFrom] = useState(formatDateInput(firstOfMonth));
  const [dateTo, setDateTo] = useState(formatDateInput(today));
  const [statusFilter, setStatusFilter] = useState<"no_show" | "cancelled" | "all">("all");
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());

  const fetchAppointments = async () => {
    if (!apiBaseUrl || !adminKey) {
      setLoadStatus({ type: "error", message: "API ili admin kljuc nisu podeseni." });
      return;
    }

    setLoadStatus({ type: "loading" });

    try {
      const response = await fetch(`${apiBaseUrl}/appointments.php`, {
        headers: { "X-Admin-Key": adminKey },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Ne mogu da preuzmem termine.");
      }

      const items: Appointment[] = Array.isArray(data.appointments) ? data.appointments : [];
      setAppointments(items);
      setLoadStatus({ type: "idle" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Doslo je do greske.";
      setLoadStatus({ type: "error", message });
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const debtAppointments = useMemo(() => {
    return appointments.filter((a) => {
      const isDebt = a.status === "no_show" || a.status === "cancelled";
      if (!isDebt) return false;
      if (resolvedIds.has(a.id)) return false;

      if (statusFilter !== "all" && a.status !== statusFilter) return false;

      if (dateFrom && a.date < dateFrom) return false;
      if (dateTo && a.date > dateTo) return false;

      return true;
    }).sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  }, [appointments, dateFrom, dateTo, statusFilter, resolvedIds]);

  const totalDebt = useMemo(
    () => debtAppointments.reduce((sum, a) => sum + (a.price ?? 0), 0),
    [debtAppointments]
  );

  const handleResolve = async (appointment: Appointment) => {
    if (!apiBaseUrl || !adminKey) return;

    const confirmed = window.confirm(
      `Obrisati dug za ${appointment.clientName}? Ovo ce trajno obrisati ovaj termin.`
    );
    if (!confirmed) return;

    setActionStatus((prev) => ({ ...prev, [appointment.id]: { type: "loading" } }));

    try {
      const response = await fetch(`${apiBaseUrl}/appointments.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Key": adminKey,
        },
        body: JSON.stringify({ adminAction: "delete", id: appointment.id }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Ne mogu da obrisem termin.");
      }

      setResolvedIds((prev) => new Set([...prev, appointment.id]));
      setActionStatus((prev) => ({ ...prev, [appointment.id]: { type: "success" } }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Doslo je do greske.";
      setActionStatus((prev) => ({ ...prev, [appointment.id]: { type: "error", message } }));
    }
  };

  const statusLabel: Record<string, string> = {
    no_show: "Nije dosao",
    cancelled: "Otkazan",
  };

  return (
    <AdminShell
      title="Evidencija dugova"
      subtitle={
        debtAppointments.length > 0
          ? `${debtAppointments.length} termin${debtAppointments.length === 1 ? "" : "a"} | Ukupno: ${totalDebt.toLocaleString("sr-RS")} RSD`
          : undefined
      }
    >
      <div className="dugovi-page">
        <div className="dugovi-filters">
          <div className="dugovi-filter-row">
            <div className="form-row">
              <label htmlFor="dateFrom">Od datuma</label>
              <input
                id="dateFrom"
                type="date"
                className="input"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="form-row">
              <label htmlFor="dateTo">Do datuma</label>
              <input
                id="dateTo"
                type="date"
                className="input"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="form-row">
              <label htmlFor="statusFilter">Status</label>
              <select
                id="statusFilter"
                className="input"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as "no_show" | "cancelled" | "all")
                }
              >
                <option value="all">Svi</option>
                <option value="no_show">Nije dosao</option>
                <option value="cancelled">Otkazan</option>
              </select>
            </div>
            <button
              className="button outline small"
              type="button"
              onClick={fetchAppointments}
              disabled={loadStatus.type === "loading"}
            >
              {loadStatus.type === "loading" ? "Ucitava..." : "Osvezi"}
            </button>
          </div>
        </div>

        {loadStatus.type === "error" && (
          <div className="form-status error">{loadStatus.message}</div>
        )}

        {debtAppointments.length === 0 && loadStatus.type !== "loading" && (
          <div className="dugovi-empty">
            <p>Nema evidentiranih dugova za izabrani period.</p>
          </div>
        )}

        {debtAppointments.length > 0 && (
          <div className="dugovi-list">
            {debtAppointments.map((appointment) => {
              const action = actionStatus[appointment.id];
              return (
                <div key={appointment.id} className="dugovi-item">
                  <div className="dugovi-item__info">
                    <div className="dugovi-item__header">
                      <strong className="dugovi-item__name">{appointment.clientName}</strong>
                      <span
                        className={`status-pill ${appointment.status}`}
                      >
                        {statusLabel[appointment.status ?? ""] ?? appointment.status}
                      </span>
                    </div>
                    <div className="dugovi-item__details">
                      <span>{formatDateDDMMYYYY(appointment.date)} u {normalizeTime(appointment.time)}</span>
                      <span>{appointment.serviceName}</span>
                      {appointment.phone && (
                        <a href={`tel:${appointment.phone}`} className="dugovi-item__phone">
                          {appointment.phone}
                        </a>
                      )}
                      {appointment.notes && (
                        <span className="dugovi-item__note">{appointment.notes}</span>
                      )}
                    </div>
                  </div>

                  <div className="dugovi-item__right">
                    {appointment.price != null && appointment.price > 0 && (
                      <span className="dugovi-item__price">
                        {appointment.price.toLocaleString("sr-RS")} RSD
                      </span>
                    )}
                    <button
                      className="button small dugovi-item__resolve-btn"
                      type="button"
                      onClick={() => handleResolve(appointment)}
                      disabled={action?.type === "loading"}
                    >
                      {action?.type === "loading" ? "..." : "Platio je / Obrisi dug"}
                    </button>
                    {action?.type === "error" && (
                      <span className="dugovi-item__error">{action.message}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {debtAppointments.length > 0 && totalDebt > 0 && (
          <div className="dugovi-total">
            <span>Ukupno duguje:</span>
            <strong>{totalDebt.toLocaleString("sr-RS")} RSD</strong>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
