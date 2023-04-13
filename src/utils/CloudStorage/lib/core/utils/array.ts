import { equal } from "./equal";

export function uniqueArray<T>(arr: T[]) {
  return arr.filter((value, index) => {
    return index === arr.findIndex((obj) => equal(obj, value));
  });
}
