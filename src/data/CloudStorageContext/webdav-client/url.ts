import { normalisePath } from "./path";

export function normaliseHREF(href: string): string {
  try {
    return href.replace(/^https?:\/\/[^/]+/, "");
  } catch (err) {
    throw new Error("Failed normalising HREF");
  }
}

export function extractURLPath(fullURL: string): string {
  const url = new URL(fullURL);
  let urlPath = url.pathname;
  if (urlPath.length <= 0) {
    urlPath = "/";
  }
  return normalisePath(urlPath);
}
