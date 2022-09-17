import { format, formatRelative, Locale, parseISO, startOfDay } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { Language } from "../data/SettingsContext";

const formatRelativeDe: Record<any, any> = {
  lastWeek: "d. LLL.",
  yesterday: "d. LLL.",
  today: "'Heute'",
  tomorrow: "d. LLL.",
  nextWeek: "d. LLL.",
  other: "d. LLL.",
};

const formatRelativeLocaleEn: Record<any, any> = {
  lastWeek: "d LLL",
  yesterday: "d LLL",
  today: "'Today'",
  tomorrow: "d LLL",
  nextWeek: "d LLL",
  other: "d LLL",
};

const locales: { [key: string]: Locale } = {
  de: {
    ...de,
    formatRelative: (token) => formatRelativeDe[token],
  },
  en: {
    ...enUS,
    formatRelative: (token) => formatRelativeLocaleEn[token],
  },
};

export function formatLocaleDate(date: Date, locale?: string) {
  return date.toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatLocalDateTime(date: Date, locale?: string) {
  return date.toLocaleString(locale, {
    day: "numeric",
    month: "numeric",
    year: "2-digit",
    hour: "numeric",
    minute: "numeric",
    second: undefined,
  });
}

export function formatDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function formatDateRelative(date: Date, lang: Language = "en"): string {
  const now = todayDate();
  return formatRelative(date, now, { locale: locales[lang] });
}

export function parseDate(str: string): Date | undefined {
  const result = parseISO(str);
  if (result.toString() !== "Invalid Date") {
    return result;
  }
}

export function todayDate(): Date {
  return startOfDay(new Date());
}

export function dateReviver(key: string, value: any) {
  const date = parseDate(value);
  if (date) {
    return date;
  } else {
    return value;
  }
}

export const isDate = (date: Date | undefined): date is Date => !!date;
