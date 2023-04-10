import { Network } from "@capacitor/network";
import { Body, getClient, ResponseType } from "@tauri-apps/api/http";
import { getPlatform } from "./platform";

function request(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const platform = getPlatform();
  return platform === "desktop"
    ? desktopFetch(input, init)
    : fetch(input, init);
}

async function desktopFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const client = await getClient();
  const options =
    typeof input === "string" || input instanceof URL
      ? {
          url: input.toString(),
          ...init,
        }
      : {
          ...input,
          ...init,
        };
  const { body, ...other } = options;
  const method = options.method as any;
  const response = await client.request({
    ...other,
    method,
    ...(body && { body: buildDesktopRequestBody(options) }),
    responseType: ResponseType.Binary,
  });
  // @ts-ignore
  const data = String.fromCharCode.apply(null, new Uint16Array(response.data));
  return new Response(data, {
    headers: response.headers,
    status: response.status,
  });
}

function buildDesktopRequestBody(opt: RequestInit) {
  const headers = (opt.headers as any) || {};
  const body = opt.body as any;
  const contentType = headers["Content-Type"];
  if (contentType === "application/json") {
    return Body.json(body);
  } else if (contentType === "application/octet-stream") {
    const enc = new TextEncoder();
    return Body.bytes(enc.encode(body));
  } else {
    return Body.text(body);
  }
}

function joinURL(...parts: string[]) {
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

async function isConnected() {
  return Network.getStatus().then(({ connected }) => connected);
}

function addNetworkStatusChangeListener(
  listener: (connected: boolean) => void
) {
  Network.addListener("networkStatusChange", ({ connected }) =>
    listener(connected)
  );
}

async function removeAllNetworkStatusChangeListeners() {
  Network.removeAllListeners().then((r) => void r);
}

export {
  request,
  joinURL,
  isConnected,
  addNetworkStatusChangeListener,
  removeAllNetworkStatusChangeListeners,
};
