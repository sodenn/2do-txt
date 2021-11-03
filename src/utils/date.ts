const ISO_8601_FULL =
  /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?(([+-]\d\d:\d\d)|Z)?$/i;

export function formatLocaleDate(date: Date, locale?: string) {
  return date.toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDate(date: Date): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];
}

export function parseDate(str: string): Date | undefined {
  if (/\d{4}-\d{2}-\d{2}/.test(str)) {
    return new Date(str);
  }
}

export function today(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

export function dateReviver(key: string, value: any) {
  if (typeof value === "string" && ISO_8601_FULL.test(value)) {
    return new Date(value);
  }
  return value;
}

export const isDate = (date: Date | undefined): date is Date => !!date;
