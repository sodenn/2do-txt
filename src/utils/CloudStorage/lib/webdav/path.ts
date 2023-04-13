import { CloudError } from "../core";

const SEP_PATH_POSIX = "__PATH_SEPARATOR_POSIX__";
const SEP_PATH_WINDOWS = "__PATH_SEPARATOR_WINDOWS__";
const splitPathRe =
  /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^/]+?|)(\.[^./]*|))(?:[/]*)$/;

export function joinPaths(...parts: string[]) {
  return parts
    .map((part, i) => {
      if (i === 0) {
        // remove trailing slashes (keep the leading slash on the first part)
        return part.trim().replace(/\/*$/g, "");
      } else if (i === parts.length - 1) {
        // remove leading slash (keep the trailing slash on the last part)
        return part.trim().replace(/^\/*/g, "");
      } else {
        // remove leading + trailing slashes
        return part.trim().replace(/(^\/*|\/*$)/g, "");
      }
    })
    .join("/");
}

export function encodePath(filePath: string): string {
  const replaced = filePath
    .replace(/\//g, SEP_PATH_POSIX)
    .replace(/\\\\/g, SEP_PATH_WINDOWS);
  const formatted = encodeURIComponent(replaced);
  return formatted
    .split(SEP_PATH_WINDOWS)
    .join("\\\\")
    .split(SEP_PATH_POSIX)
    .join("/");
}

export function normalisePath(pathStr: string): string {
  let normalisedPath = pathStr;
  if (normalisedPath[0] !== "/") {
    normalisedPath = "/" + normalisedPath;
  }
  if (/^.+\/$/.test(normalisedPath)) {
    normalisedPath = normalisedPath.substring(0, normalisedPath.length - 1);
  }
  return normalisedPath;
}

export function relativePath(from: string, to: string): string {
  from = resolvePath(from).substring(1);
  to = resolvePath(to).substring(1);

  function trim(arr: string[]) {
    let start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== "") break;
    }

    let end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== "") break;
    }

    if (start > end) return [];
    return arr.slice(start, end + 1);
  }

  const fromParts = trim(from.split("/"));
  const toParts = trim(to.split("/"));

  const length = Math.min(fromParts.length, toParts.length);
  let samePartsLength = length;
  for (let i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  let outputParts = [];
  for (let i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push("..");
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join("/");
}

export function basename(path: string) {
  const result = posixSplitPath(path);
  if (!result) {
    throw Error();
  }
  return result[2];
}

export function normaliseHref(href: string): string {
  try {
    return href.replace(/^https?:\/\/[^/]+/, "");
  } catch (err) {
    throw new CloudError({ cause: "Failed normalising HREF" });
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

function resolvePath(...parts: string[]) {
  let resolvedPath = "",
    resolvedAbsolute = false;

  for (let i = parts.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    // eslint-disable-next-line prefer-rest-params
    const path = i >= 0 ? parts[i] : location.pathname;

    // Skip empty and invalid entries
    if (!path) {
      continue;
    }

    resolvedPath = path + "/" + resolvedPath;
    resolvedAbsolute = path.charAt(0) === "/";
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(
    resolvedPath.split("/"),
    !resolvedAbsolute
  ).join("/");

  return (resolvedAbsolute ? "/" : "") + resolvedPath || ".";
}

function posixSplitPath(filename: string) {
  return splitPathRe.exec(filename)?.slice(1);
}

function normalizeArray(parts: string[], allowAboveRoot: boolean) {
  const res = [];
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    // ignore empty parts
    if (!p || p === ".") continue;
    if (p === "..") {
      if (res.length && res[res.length - 1] !== "..") {
        res.pop();
      } else if (allowAboveRoot) {
        res.push("..");
      }
    } else {
      res.push(p);
    }
  }
  return res;
}
