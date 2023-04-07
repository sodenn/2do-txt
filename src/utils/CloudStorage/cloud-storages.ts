import { CloudStorageError, createCloudStorage } from "@cloudstorage/core";
import { createDropboxClient } from "@cloudstorage/dropbox";
import { createWebDAVClient } from "@cloudstorage/webdav";

export interface WebDAVConfig {
  baseUrl: string | null;
  basicAuth: {
    username: string | null;
    password: string | null;
  };
}

export async function createWebDAVStorage({
  baseUrl,
  basicAuth: { username, password },
}: WebDAVConfig) {
  if (!username || !password || !baseUrl) {
    throw new CloudStorageError({
      type: "Unauthorized",
      provider: "WebDAV",
    });
  }
  return createCloudStorage({
    client: createWebDAVClient({
      baseUrl,
      basicAuth: {
        username,
        password,
      },
    }),
  });
}

export async function createDropboxStorage(refreshToken: string | null) {
  if (!refreshToken) {
    throw new CloudStorageError({
      type: "Unauthorized",
      provider: "Dropbox",
    });
  }
  return createCloudStorage({
    client: createDropboxClient({
      refreshToken,
    }),
  });
}
