import { createCloudStorage } from "@cloudstorage/core";
import { createWebDAVClient, WebDAVClientOptions } from "@cloudstorage/webdav";
import { request } from "../../native-api/network";

export function createWebDAVStorage({
  baseUrl,
  basicAuth: { username, password },
}: WebDAVClientOptions) {
  return createCloudStorage({
    client: createWebDAVClient({
      fetch: request,
      baseUrl,
      basicAuth: {
        username,
        password,
      },
    }),
  });
}
