import { CloudError } from "../core";
import { BufferLike } from "./types";

const hasArrayBuffer = typeof ArrayBuffer === "function";
const { toString: objToString } = Object.prototype;

export function calculateContentLength(data: string | BufferLike): number {
  if (isArrayBuffer(data)) {
    return (<ArrayBuffer>data).byteLength;
  } else if (isBuffer(data)) {
    return (<Buffer>data).length;
  } else if (typeof data === "string") {
    return byteLength(<string>data);
  }
  throw new CloudError({
    cause: "Cannot calculate data length: Invalid type",
  });
}

// Taken from: https://github.com/fengyuanchen/is-array-buffer/blob/master/src/index.js
function isArrayBuffer(value: any): boolean {
  return (
    hasArrayBuffer &&
    (value instanceof ArrayBuffer ||
      objToString.call(value) === "[object ArrayBuffer]")
  );
}

function isBuffer(value: any): boolean {
  return (
    value != null &&
    value.constructor != null &&
    typeof value.constructor.isBuffer === "function" &&
    value.constructor.isBuffer(value)
  );
}

function byteLength(
  str: string | { toString(): string; [x: string]: any }
): number {
  if (!str) {
    return 0;
  }

  str = str.toString();
  let len = str.length;

  for (let i = str.length; i--; ) {
    const code = str.charCodeAt(i);
    if (0xdc00 <= code && code <= 0xdfff) {
      i--;
    }

    if (0x7f < code && code <= 0x7ff) {
      len++;
    } else if (0x7ff < code && code <= 0xffff) {
      len += 2;
    }
  }

  return len;
}
