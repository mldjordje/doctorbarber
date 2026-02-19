const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const SQL_DATE_TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/;
const TIME_PATTERN = /^(\d{1,2}):(\d{2})/;

const pad2 = (value: number) => String(value).padStart(2, "0");

const isValidDateParts = (year: number, month: number, day: number) => {
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

export const parseIsoDate = (value: string): Date | null => {
  const match = value.trim().match(ISO_DATE_PATTERN);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!isValidDateParts(year, month, day)) {
    return null;
  }

  return new Date(year, month - 1, day);
};

export const normalizeTime24 = (value?: string | null) => {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();
  const match = trimmed.match(TIME_PATTERN);
  if (!match) {
    return "";
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return "";
  }
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return "";
  }

  return `${pad2(hours)}:${pad2(minutes)}`;
};

export const formatDateDDMMYYYY = (value: string | Date) => {
  const date = typeof value === "string" ? parseIsoDate(value) : value;
  if (!date || Number.isNaN(date.getTime())) {
    return typeof value === "string" ? value : "";
  }

  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
};

export const formatDateTimeDDMMYYYY = (dateValue: string, timeValue?: string | null) => {
  const dateLabel = formatDateDDMMYYYY(dateValue);
  const timeLabel = normalizeTime24(timeValue);
  return timeLabel ? `${dateLabel} ${timeLabel}` : dateLabel;
};

export const formatWeekdayAndDate = (value: string, locale: string) => {
  const date = parseIsoDate(value);
  if (!date) {
    return value;
  }

  const weekday = new Intl.DateTimeFormat(locale, { weekday: "long" }).format(date);
  return `${weekday}, ${formatDateDDMMYYYY(value)}`;
};

export const parseSqlDateTime = (value: string) => {
  const match = value.trim().match(SQL_DATE_TIME_PATTERN);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hours = Number(match[4]);
  const minutes = Number(match[5]);
  const seconds = Number(match[6] ?? "0");
  if (!isValidDateParts(year, month, day)) {
    return null;
  }
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
    return null;
  }

  return new Date(year, month - 1, day, hours, minutes, seconds);
};

export const formatSqlDateTimeDDMMYYYY = (value: string) => {
  const date = parseSqlDateTime(value);
  if (!date) {
    return value;
  }

  return `${formatDateDDMMYYYY(date)} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
};
