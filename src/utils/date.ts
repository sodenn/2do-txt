import { format, isEqual, parseISO, startOfDay } from "date-fns";

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

export function parseDate(str: any): Date | undefined {
  if (typeof str !== "string") {
    return undefined;
  }
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

export function isDateEqual(date1?: Date | null, date2?: Date | null): boolean {
  if (!date1 && !date2) {
    return true;
  }
  if (date1 && date2) {
    return isEqual(date1, date2);
  }
  return false;
}
