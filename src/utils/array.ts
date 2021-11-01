export function uniqueListBy<T>(arr: T[], key: keyof T): T[] {
  const map = new Map(arr.map((item) => [(item as any)[key], item]));
  return [...(map.values() as any)];
}

export function groupBy<T>(arr: T[], getKey: (item: T) => string | number) {
  return arr.reduce<{ [key: string]: T[] }>((map, item) => {
    let mapKey = getKey(item);
    map[mapKey] = [...(map[mapKey] || []), item];
    return map;
  }, {});
}
