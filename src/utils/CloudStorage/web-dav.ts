import { request } from "../../native-api/network";
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
      fetch: request,
      baseUrl,
      basicAuth: {
        username,
        password,
      },
    }),
  });
}
