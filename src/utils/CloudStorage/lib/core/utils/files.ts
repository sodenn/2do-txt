export async function createChecksum(content: string | ArrayBuffer) {
  const encoder = new TextEncoder();
  const data =
    content instanceof Uint8Array
      ? content.buffer
      : content instanceof ArrayBuffer
      ? content
      : encoder.encode(content);
  const subtle = await getSubtle();
  const checksum = await subtle.digest("SHA-1", data);
  return bufferToHex(checksum);
}

export function getFilename(path: string) {
  return path.replace(/^.*[\\/]/, "");
}

export function getDirname(path: string) {
  // Replace any backslashes with forward slashes (for Windows compatibility)
  path = path.replace(/\\/g, "/");

  // Remove any trailing slashes
  path = path.replace(/\/+$/, "");

  // Split the path into an array of directories
  const parts = path.split("/");

  // Remove the last part (i.e. the file or directory name)
  parts.pop();

  // Join the remaining parts back together to form the directory name
  const dirname = parts.length > 0 ? parts.join("/") : "/";

  // If the parent directory is empty, set it to the root directory
  if (dirname === "") {
    return "/";
  }

  return dirname;
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.prototype.map
    .call(new Uint8Array(buffer), (item: number) =>
      ("00" + item.toString(16)).slice(-2)
    )
    .join("");
}

async function getSubtle(): Promise<SubtleCrypto> {
  return typeof window === "undefined" || typeof window.crypto === "undefined"
    ? import("crypto").then((c: any) => c.webcrypto.subtle)
    : window.crypto.subtle;
}
