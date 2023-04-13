export function parseDate(date: string | number): Date {
  return new Date(date);
}

export function isDateEqual(date1: Date, date2: Date): boolean {
  return date1.getTime() === date2.getTime();
}

export function isDateBefore(date1: Date, date2: Date): boolean {
  return date1.getTime() < date2.getTime();
}

export function isDateAfter(date1: Date, date2: Date): boolean {
  return date1.getTime() > date2.getTime();
}
