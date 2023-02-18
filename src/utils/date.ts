import {
  format,
  isAfter,
  isBefore,
  isEqual,
  parseISO,
  startOfDay,
} from "date-fns";

function formatLocaleDate(date: Date, locale?: string) {
  return date.toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatLocalDateTime(date: Date, locale?: string) {
  return date.toLocaleString(locale, {
    day: "numeric",
    month: "numeric",
    year: "2-digit",
    hour: "numeric",
    minute: "numeric",
    second: undefined,
  });
}

function formatDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function parseDate(str: string): Date | undefined {
  const result = parseISO(str);
  if (result.toString() !== "Invalid Date") {
    return result;
  }
}

function todayDate(): Date {
  return startOfDay(new Date());
}

function dateReviver(key: string, value: any) {
  const date = parseDate(value);
  if (date) {
    return date;
  } else {
    return value;
  }
}

function isDateEqual(date1?: Date | null, date2?: Date | null): boolean {
  if (!date1 && !date2) {
    return true;
  }
  if (date1 && date2) {
    return isEqual(date1, date2);
  }
  return false;
}

function isDateBefore(date1?: Date | null, date2?: Date | null): boolean {
  if (date1 && date2) {
    return isBefore(date1, date2);
  }
  return false;
}

function isDateAfter(date1?: Date | null, date2?: Date | null): boolean {
  if (date1 && date2) {
    return isAfter(date1, date2);
  }
  return false;
}

function isDate(date: Date | undefined): date is Date {
  return !!date;
}

export {
  formatLocaleDate,
  formatLocalDateTime,
  formatDate,
  parseDate,
  todayDate,
  dateReviver,
  isDateEqual,
  isDateBefore,
  isDateAfter,
  isDate,
};
