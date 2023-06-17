function groupBy<T>(arr: T[], getKey: (item: T) => string | string[]) {
  return arr.reduce<{ [key: string]: T[] }>((map, item) => {
    const key = getKey(item);
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

function arrayMove<T>(arr: T[], fromIndex: number, toIndex: number) {
  const element = arr[fromIndex];
  arr.splice(fromIndex, 1);
  arr.splice(toIndex, 0, element);
}

export { arrayMove, groupBy };
