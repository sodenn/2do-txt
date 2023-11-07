import { request } from "@/native-api/network";
import {
  createCloudStorage,
  createWebDAVClient,
  WebDAVClientOptions,
} from "./lib";

export function createWebDAVStorage({
  baseUrl,
  basicAuth: { username, password },
}: WebDAVClientOptions) {
  return createCloudStorage({
    client: createWebDAVClient({
      fetch: request as typeof fetch,
      baseUrl,
      basicAuth: {
        username,
        password,
      },
    }),
  });
}
