import { createClient as _createClient, FileStat, WebDAVClient } from "webdav";
import { getSecureStorage } from "../../utils/secure-storage";
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
  const results = (await client
    .getDirectoryContents(path, {
      details: false,
    })
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
  const results = (await client
    .getDirectoryContents(path, {
      details: false,
    })
    .catch(handleError)) as FileStat[];
  if (results.length !== 1) {
    throw new CloudFileNotFoundError();
  }
  return mapToCloudFile(results[0]);
}

export async function downloadFile(
  opt: Omit<DownloadFileOptions<WebDAVClient>, "cloudStorage">
): Promise<string> {
  const { filePath, client } = opt;
  return (await client
    .getFileContents(filePath, {
      format: "text",
    })
    .catch(handleError)) as string;
}

export async function uploadFile(
  opt: Omit<UploadFileOptions<WebDAVClient>, "cloudStorage" | "archive">
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

  const localContentHash = generateContentHash(localContent);

  // no action needed
  if (
    localVersion.rev === serverVersion.rev &&
    localContentHash === serverVersion.contentHash
  ) {
    return;
  }

  // update server file
  if (
    localVersion.rev === serverVersion.rev &&
    localContentHash !== serverVersion.contentHash
  ) {
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
  if (localVersion.rev !== serverVersion.rev) {
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