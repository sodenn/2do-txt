import { Network } from "@capacitor/network";
import {
  Body,
  getClient,
  HttpOptions,
  ResponseType as _ResponseType,
} from "@tauri-apps/api/http";
import { differenceInSeconds } from "date-fns";
import { useSnackbar } from "notistack";
import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import useNetworkStore from "../stores/network-store";
import { BufferLike } from "./CloudStorage/webdav-client";
import { getPlatform } from "./platform";

interface RequestContext {
  baseUrl: string;
  basicAuth?: {
    username: string;
    password: string;
  };
}

interface RequestOptions {
  path: string;
  method: string;
  headers?: any;
  responseType?: "json" | "text" | "binary";
  data?: string | BufferLike | Record<any, any>;
  context: RequestContext;
}

interface Response {
  status: number;
  json: () => Promise<any>;
  text: () => Promise<string>;
  arrayBuffer: () => Promise<ArrayBuffer>;
}

async function request(opt: RequestOptions): Promise<Response> {
  const platform = getPlatform();
  opt.headers = opt.headers || {};
  if (platform === "desktop") {
    return desktopRequest(opt);
  } else {
    return webRequest(opt);
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

async function webRequest(opt: RequestOptions) {
  const reqOptions: RequestInit = {
    method: opt.method,
    ...headers(opt),
    ...(opt.data && { body: webBody(opt) }),
  };
  return await fetch(url(opt), reqOptions);
}

async function desktopRequest(opt: RequestOptions) {
  const client = await getClient();
  const reqOptions: HttpOptions = {
    url: url(opt),
    ...headers(opt),
    method: opt.method as any,
    ...(opt.responseType && { responseType: responseType(opt) }),
    ...(opt.data && { body: desktopBody(opt) }),
  };
  const response = await client.request(reqOptions);
  const data = response.data;
  return {
    status: response.status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(data as string),
    arrayBuffer: () => Promise.resolve(data as ArrayBuffer),
  };
}

function headers(opt: RequestOptions) {
  const { context } = opt;
  const headers: Record<string, any> = {
    Accept: opt.headers["Accept"] ?? "application/json",
    "Content-Type": opt.headers["Content-Type"] ?? "application/json",
    ...opt.headers,
  };
  if (context.basicAuth) {
    const { username, password } = context.basicAuth;
    const credentials = window.btoa(`${username}:${password}`);
    headers.Authorization = `Basic ${credentials}`;
  }
  return { headers };
}

function url(opt: RequestOptions) {
  return joinURL(opt.context.baseUrl, opt.path);
}

function webBody(opt: RequestOptions) {
  const contentType = opt.headers["Content-Type"];
  if (
    contentType === "application/octet-stream" ||
    contentType === "text/plain"
  ) {
    return opt.data as string | BufferLike;
  } else {
    return JSON.stringify(opt.data as Record<any, any>);
  }
}

function desktopBody(opt: RequestOptions) {
  const contentType = opt.headers["Content-Type"];
  if (contentType === "application/octet-stream") {
    const enc = new TextEncoder();
    return Body.bytes(enc.encode(opt.data as string));
  } else if (contentType === "text/plain") {
    return Body.text(opt.data as string);
  } else {
    return Body.json(opt.data as Record<any, any>);
  }
}

function responseType(opt: RequestOptions) {
  switch (opt.responseType) {
    case "text":
      return _ResponseType.Text;
    case "binary":
      return _ResponseType.Binary;
    case "json":
      return _ResponseType.JSON;
  }
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

function useNetwork() {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const { connected, displayDate, setConnected, setDisplayDate } =
    useNetworkStore();

  const handleNetworkStatusChange = useCallback(
    (connected: boolean) => {
      setConnected(connected);
      // Don't annoy the user, so only show the message once per minute
      const showAlert =
        !displayDate || differenceInSeconds(displayDate, new Date()) > 60;
      if (!connected && showAlert) {
        enqueueSnackbar(t("Unable to connect. Check network connection"), {
          variant: "warning",
        });
        setDisplayDate(new Date());
      }
    },
    [displayDate, enqueueSnackbar, setConnected, setDisplayDate, t]
  );

  useEffect(() => {
    addNetworkStatusChangeListener(handleNetworkStatusChange);
    return () => {
      removeAllNetworkStatusChangeListeners();
    };
  }, [handleNetworkStatusChange]);

  return { connected };
}

export type { RequestContext, RequestOptions, Response };
export {
  request,
  joinURL,
  useNetwork,
  addNetworkStatusChangeListener,
  removeAllNetworkStatusChangeListeners,
};