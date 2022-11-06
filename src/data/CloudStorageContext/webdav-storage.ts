import { createClient as _createClient, FileStat, WebDAVClient } from "webdav";
import { getSecureStorage } from "../../utils/secure-storage";
import { CloudFileUnauthorizedError } from "./cloud-storage";
import {
  CloudFile,
  CloudItem,
  DeleteFileOptionsInternal,
  DownloadFileOptions,
  FileMetaDataOptions,
  ListCloudFilesOptions,
  ListCloudItemResult,
  SyncFileOptionsInternal,
  SyncFileResult,
  UploadFileOptions,
} from "./cloud-storage.types";

const { getSecureStorageItem, setSecureStorageItem, removeSecureStorageItem } =
  getSecureStorage();

export async function saveWebDAVCredentials(): Promise<void> {
  await Promise.all([
    setSecureStorageItem("WebDAV-username", ""),
    setSecureStorageItem("WebDAV-password", ""),
    setSecureStorageItem("WebDAV-url", ""),
  ]);
  // test connection
  const client = await createClient().catch(async (error) => {
    await resetTokens();
    throw error;
  });
  await listFiles({ path: "/", client });
}

export async function authenticate(): Promise<void> {
  //
}

export async function createClient(): Promise<WebDAVClient> {
  const [username, password, url] = await Promise.all([
    getSecureStorageItem("WebDAV-username"),
    getSecureStorageItem("WebDAV-password"),
    getSecureStorageItem("WebDAV-url"),
  ]);
  if (!username || !password || !url) {
    throw new CloudFileUnauthorizedError("WebDAV");
  }
  return _createClient(url, { username, password });
}

export async function resetTokens() {
  await Promise.all([
    removeSecureStorageItem("WebDAV-username"),
    removeSecureStorageItem("WebDAV-password"),
    removeSecureStorageItem("WebDAV-url"),
  ]).catch((e) => void e);
}

export async function unlink(_: any) {
  return resetTokens();
}

export async function listFiles(
  opt: Omit<ListCloudFilesOptions<WebDAVClient>, "cloudStorage">
): Promise<ListCloudItemResult> {
  const { path, client } = opt;
  if (!path) {
    throw new Error("WebDAV listFiles: path is undefined");
  }
  const result = (await client.getDirectoryContents(path, {
    details: false,
  })) as FileStat[];
  const items: CloudItem[] = result.map((r) =>
    r.type === "file"
      ? {
          name: r.filename,
          path: r.basename,
          rev: r.lastmod,
          type: "file",
        }
      : { name: r.filename, path: r.basename, type: "folder" }
  );
  return {
    items,
    hasMore: false,
  };
}

export async function getFileMetaData(
  opt: Omit<FileMetaDataOptions<WebDAVClient>, "cloudStorage">
): Promise<CloudFile> {
  throw new Error("Not yet implemented");
}

export async function downloadFile(
  opt: Omit<DownloadFileOptions, "cloudStorage">
): Promise<string> {
  throw new Error("Not yet implemented");
}

export async function uploadFile(
  opt: Omit<UploadFileOptions<WebDAVClient>, "cloudStorage" | "archive">
): Promise<CloudFile> {
  throw new Error("Not yet implemented");
}

export async function deleteFile(opt: DeleteFileOptionsInternal<WebDAVClient>) {
  throw new Error("Not yet implemented");
}

export async function syncFile(
  opt: SyncFileOptionsInternal<WebDAVClient>
): Promise<SyncFileResult> {
  throw new Error("Not yet implemented");
}
