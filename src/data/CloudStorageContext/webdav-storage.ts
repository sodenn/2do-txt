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

interface Credentials {
  username: string;
  password: string;
  url: string;
}

const { getSecureStorageItem, setSecureStorageItem, removeSecureStorageItem } =
  getSecureStorage();

export async function saveWebDAVCredentials(
  credentials: Credentials
): Promise<void> {
  const { username, password, url } = credentials;
  await Promise.all([
    setSecureStorageItem("WebDAV-username", username),
    setSecureStorageItem("WebDAV-password", password),
    setSecureStorageItem("WebDAV-url", url),
  ]);
  try {
    const client = await createClient();
    // test connection
    await listFiles({ path: "/", client });
  } catch (error) {
    await resetTokens();
    throw error;
  }
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
  const { client } = opt;
  const path = opt.path || "/";
  const result = (await client.getDirectoryContents(path, {
    details: false,
  })) as FileStat[];
  const items: CloudItem[] = result
    .filter((r) => !r.filename.endsWith("/webdav"))
    .filter((r) => !path || !r.filename.endsWith(path))
    .map((r) =>
      r.type === "file"
        ? {
            name: r.basename,
            path: getPath(r),
            rev: r.lastmod,
            type: "file",
          }
        : { name: r.basename, path: getPath(r), type: "folder" }
    );
  return {
    items,
    hasMore: false,
  };
}

function getPath(fileStat: FileStat) {
  const search = "/webdav";
  const start = fileStat.filename.indexOf(search);
  return fileStat.filename.substring(start + search.length);
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
