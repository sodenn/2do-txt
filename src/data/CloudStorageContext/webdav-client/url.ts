import { normalisePath } from "./path";

export function normaliseHREF(href: string): string {
  try {
    return href.replace(/^https?:\/\/[^/]+/, "");
  } catch (err) {
    throw new Error("Failed normalising HREF");
  }
}

export function joinURL(...parts: string[]) {
  return parts
    .map((part, i) => {
      if (i === 0) {
        return part.trim().replace(/\/*$/g, "");
      } else {
        return part.trim().replace(/(^\/*|\/*$)/g, "");
      }
    })
    .filter((x) => x.length)
    .join("/");
}

export function extractURLPath(fullURL: string): string {
  const url = new URL(fullURL);
  let urlPath = url.pathname;
  if (urlPath.length <= 0) {
    urlPath = "/";
  }
  return normalisePath(urlPath);
}
