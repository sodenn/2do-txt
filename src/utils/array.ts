export function uniqueListBy<T>(arr: T[], key: keyof T): T[] {
  const map = new Map(arr.map(item => [(item as any)[key], item]));
  return [...(map.values() as any)];
}
