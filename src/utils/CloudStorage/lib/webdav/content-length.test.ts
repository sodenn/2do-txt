import { describe, expect, it } from "vitest";
import { calculateContentLength } from "./content-length";

describe("calculateDataLength", () => {
  it("should return the length of a string", () => {
    const data = "Hello, world!";
    expect(calculateContentLength(data)).toBe(13);
  });

  it("should return the length of a Buffer", () => {
    const data = Buffer.from("Hello, world!");
    expect(calculateContentLength(data)).toBe(13);
  });

  it("should return the byte length of an ArrayBuffer", () => {
    const data = new ArrayBuffer(13);
    expect(calculateContentLength(data)).toBe(13);
  });

  it("should throw an error for an invalid data type", () => {
    const data = { foo: "bar" };
    expect(() => calculateContentLength(data as any)).toThrow(Error);
  });
});
