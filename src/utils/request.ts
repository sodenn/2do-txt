import {
  Body,
  getClient,
  HttpOptions,
  ResponseType as _ResponseType,
} from "@tauri-apps/api/http";
import { BufferLike } from "../data/CloudStorageContext/webdav-client";
import { getPlatform } from "./platform";

export interface RequestContext {
  baseUrl: string;
  basicAuth?: {
    username: string;
    password: string;
  };
}

export interface RequestOptions {
  path: string;
  method: string;
  headers?: any;
  responseType?: "json" | "text" | "binary";
  data?: string | BufferLike | Record<any, any>;
  context: RequestContext;
}

export interface Response {
  status: number;
  json: () => Promise<any>;
  text: () => Promise<string>;
  arrayBuffer: () => Promise<ArrayBuffer>;
}

export async function request(opt: RequestOptions): Promise<Response> {
  const platform = getPlatform();
  if (platform === "desktop") {
    return desktopRequest(opt);
  } else {
    return webRequest(opt);
  }
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
  return headers;
}

function url(opt: RequestOptions) {
  return (
    opt.context.baseUrl +
    (opt.context.baseUrl.endsWith("/") ? "" : "/") +
    opt.path
  );
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
    return Body.bytes(opt.data as BufferLike);
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
