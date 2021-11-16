export function uniqueListBy<T>(arr: T[], key: keyof T): T[] {
  const map = new Map(arr.map((item) => [(item as any)[key], item]));
  return [...(map.values() as any)];
}

export function groupBy<T>(arr: T[], getKey: (item: T) => string | string[]) {
  return arr.reduce<{ [key: string]: T[] }>((map, item) => {
    let key = getKey(item);
    let formattedKey: string;
    if (Array.isArray(key)) {
      formattedKey = key.join(", ");
    } else {
      formattedKey = key;
    }
    map[formattedKey] = [...(map[formattedKey] || []), item];
    return map;
  }, {});
}

export function arrayMove<T>(arr: T[], fromIndex: number, toIndex: number) {
  const element = arr[fromIndex];
  arr.splice(fromIndex, 1);
  arr.splice(toIndex, 0, element);
}
