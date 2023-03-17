import { getFilenameFromPath } from "../../native-api/filesystem";
import {
  getSecureStorageItem,
  removeSecureStorageItem,
  setSecureStorageItem,
} from "../../native-api/secure-storage";
import { isDateAfter, isDateBefore, isDateEqual } from "../date";
import {
  CloudFileNotFoundError,
  CloudFileUnauthorizedError,
} from "./cloud-storage";
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
import generateContentHash from "./ContentHasher";
import { createWebDAVClient, FileStat, WebDAVClient } from "./webdav-client";

interface Credentials {
  username: string;
  password: string;
  url: string;
}

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
  return createWebDAVClient({
    baseUrl: url,
    basicAuth: { username, password },
  });
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
  const results = (await client
    .getDirectoryContents(path)
    .catch(handleError)) as FileStat[];
  const items: CloudItem[] = results
    .filter((r) => !r.filename.endsWith("/webdav"))
    .filter((r) => !path || !r.filename.endsWith(path))
    .map((r) =>
      r.type === "file"
        ? mapToCloudFile(r)
        : { name: r.basename, path: r.filename, type: "folder" }
    );
  return {
    items,
    hasMore: false,
  };
}

function mapToCloudFile(fileStat: FileStat): CloudFile {
  return {
    name: fileStat.basename,
    path: fileStat.filename,
    rev: fileStat.lastmod,
    type: "file",
  };
}

export async function getFileMetaData(
  opt: Omit<FileMetaDataOptions<WebDAVClient>, "cloudStorage">
): Promise<CloudFile> {
  const { path, client } = opt;
  const filename = getFilenameFromPath(path);
  const dirname = path.substring(0, path.length - filename.length);
  const results = (await client
    .getDirectoryContents(dirname)
    .catch(handleError)) as FileStat[];
  const metaData = results.find((i) => i.filename === path);
  if (!metaData) {
    throw new CloudFileNotFoundError();
  }
  return mapToCloudFile(metaData);
}

export async function downloadFile(
  opt: Omit<DownloadFileOptions<WebDAVClient>, "cloudStorage">
): Promise<string> {
  const { filePath, client } = opt;
  return (await client
    .getFileContents(filePath, "text")
    .catch(handleError)) as string;
}

export async function uploadFile(
  opt: Omit<UploadFileOptions<WebDAVClient>, "cloudStorage" | "isDoneFile">
): Promise<CloudFile> {
  const { filePath, text, client } = opt;
  const uploaded = await client
    .putFileContents(filePath, text)
    .catch(handleError);
  if (!uploaded) {
    throw new Error("Unable to upload file");
  }
  return getFileMetaData({ path: filePath, client }).catch(handleError);
}

export async function deleteFile(opt: DeleteFileOptionsInternal<WebDAVClient>) {
  const { filePath, client } = opt;
  return client.deleteFile(filePath);
}

export async function syncFile(
  opt: SyncFileOptionsInternal<WebDAVClient>
): Promise<SyncFileResult> {
  const { localVersion, localContent, client } = opt;

  const serverVersion = await getFileMetaData({
    path: localVersion.path,
    client,
  }).catch((error) => {
    if (!(error instanceof CloudFileNotFoundError)) {
      throw error;
    }
  });

  // create file
  if (!serverVersion) {
    const cloudFile = await uploadFile({
      filePath: localVersion.path,
      text: localContent,
      client,
    });
    return {
      type: "local",
      cloudFile,
    };
  }

  const sameContent =
    generateContentHash(localContent) === localVersion.contentHash;
  const localLastModified = parseDate(localVersion.rev);
  const serverLastModified = parseDate(serverVersion.rev);
  const sameDate = isDateEqual(localLastModified, serverLastModified);
  const localDateBeforeServerDate = isDateBefore(
    localLastModified,
    serverLastModified
  );
  const localDateAfterServerDate = isDateAfter(
    localLastModified,
    serverLastModified
  );

  // no action needed
  if (sameDate && sameContent) {
    return;
  }

  // use local file and update server file
  if ((sameDate && !sameContent) || localDateAfterServerDate) {
    const cloudFile = await uploadFile({
      filePath: localVersion.path,
      text: localContent,
      client,
    });
    return {
      type: "local",
      cloudFile,
    };
  }

  // use server file
  if (localDateBeforeServerDate) {
    const content = await downloadFile({
      filePath: serverVersion.path,
      client,
    });
    return {
      type: "server",
      cloudFile: serverVersion,
      content,
    };
  }
}

async function handleError(error: any): Promise<never> {
  if (error.status === 401) {
    await resetTokens();
    throw new CloudFileUnauthorizedError("Dropbox");
  } else if (error.status === 404) {
    throw new CloudFileNotFoundError();
  }
  throw error;
}

function parseDate(str: string) {
  return str ? new Date(str) : undefined;
}
