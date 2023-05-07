export function equal(x: any, y: any): boolean {
  const ok = Object.keys;
  const tx = typeof x;
  const ty = typeof y;
  if (x && y && tx === "object" && tx === ty) {
    return (
      ok(x).length === ok(y).length &&
      ok(x).every((key) => equal(x[key], y[key]))
    );
  }
  return x === y;
}
