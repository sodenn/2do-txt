import {
  getArchiveFilePath,
  getFilenameFromPath,
} from "../../utils/filesystem";
import {
  getPreferencesItem,
  setPreferencesItem,
} from "../../utils/preferences";
import {
  CloudArchiveFileRef,
  CloudFile,
  CloudFileRef,
  CloudStorage,
  CloudStorageClient,
  CloudStorageClientConnected,
  CloudStorageClientDisconnected,
  DeleteFileOptions,
  DeleteFileOptionsInternal,
  DownloadFileOptions,
  FileMetaDataOptions,
  GetCloudArchiveFileMetaDataOptions,
  ListCloudFilesOptions,
  ListCloudItemResult,
  RequestAccessTokenOptions,
  SyncFileOptions,
  SyncFileResult,
  UnlinkOptions,
  UploadFileOptions,
} from "./cloud-storage.types";
import * as dropbox from "./dropbox-storage";
import * as webdav from "./webdav-storage";

const cloudStorages: CloudStorage[] = ["Dropbox", "WebDAV"];

export class CloudFileUnauthorizedError extends Error {
  constructor(public cloudStorage: CloudStorage) {
    super("Unauthorized 401");
  }
}

export class CloudFileNotFoundError extends Error {
  constructor() {
    super("Not Found 404");
  }
}

export async function authenticate(cloudStorage: CloudStorage): Promise<void> {
  switch (cloudStorage) {
    case "Dropbox":
      return dropbox.authenticate();
    case "WebDAV":
      return webdav.authenticate();
    default:
      throw new Error(`Unknown cloud storage "${cloudStorage}"`);
  }
}

export async function linkFile(cloudFile: CloudFileRef) {
  const cloudFiles = await getCloudFileRefs();

  const newCloudFiles = [
    ...cloudFiles.filter((c) => c.path !== cloudFile.path),
    { ...cloudFile },
  ];

  await setPreferencesItem("cloud-files", JSON.stringify(newCloudFiles));
}

export async function linkArchiveFile(cloudFile: CloudArchiveFileRef) {
  const cloudArchiveFiles = await getCloudArchiveFileRefs();

  const newArchiveCloudFiles = [
    ...cloudArchiveFiles.filter((c) => c.path !== cloudFile.path),
    { ...cloudFile },
  ];

  await setPreferencesItem(
    "cloud-archive-files",
    JSON.stringify(newArchiveCloudFiles)
  );
}

export async function unlink(opt: UnlinkOptions<any>) {
  const { cloudStorage, client } = opt;

  if (cloudStorage === "Dropbox") {
    await dropbox.unlink(client);
  } else if (cloudStorage === "WebDAV") {
    await webdav.resetTokens();
  } else {
    throw new Error(`Unknown cloud storage "${cloudStorage}"`);
  }

  const cloudFiles = await getCloudFileRefs();
  await setPreferencesItem(
    "cloud-files",
    JSON.stringify(
      cloudFiles.filter((cloudFile) => cloudFile.cloudStorage !== cloudStorage)
    )
  );
}

export async function getCloudFileRefs(): Promise<CloudFileRef[]> {
  const cloudFilesStr = await getPreferencesItem("cloud-files");
  try {
    return cloudFilesStr ? JSON.parse(cloudFilesStr) : [];
  } catch (error) {
    await setPreferencesItem("cloud-files", JSON.stringify([]));
    return [];
  }
}

export async function getCloudArchiveFileRefs(): Promise<
  CloudArchiveFileRef[]
> {
  const cloudArchiveFilesStr = await getPreferencesItem("cloud-archive-files");
  try {
    return cloudArchiveFilesStr ? JSON.parse(cloudArchiveFilesStr) : [];
  } catch (error) {
    await setPreferencesItem("cloud-archive-files", JSON.stringify([]));
    return [];
  }
}

export async function getCloudFileRefByFilePath(filePath: string) {
  const cloudFiles = await getCloudFileRefs();
  return cloudFiles.find((c) => c.localFilePath === filePath);
}

export async function getCloudArchiveFileRefByFilePath(filePath: string) {
  const cloudArchiveFiles = await getCloudArchiveFileRefs();
  return cloudArchiveFiles.find((c) => c.localFilePath === filePath);
}

export async function unlinkCloudFile(filePath: string) {
  const cloudFileRef = await getCloudFileRefByFilePath(filePath);
  if (!cloudFileRef) {
    throw new Error(`No cloud file found for local file path "${filePath}"`);
  }

  const cloudFiles = await getCloudFileRefs();

  const newCloudFiles = cloudFiles.filter((c) => c.path !== cloudFileRef.path);
  await setPreferencesItem("cloud-files", JSON.stringify(newCloudFiles));
}

export async function deleteFile(opt: DeleteFileOptions) {
  const { filePath, archive, cloudStorageClients } = opt;
  const cloudFileRef = await getCloudFileRefByFilePath(filePath);
  const cloudArchiveFileRef = await getCloudArchiveFileRefByFilePath(filePath);
  const ref = archive ? cloudArchiveFileRef : cloudFileRef;
  if (!ref) {
    return;
  }

  const { cloudStorage } = ref;
  const client = cloudStorageClients[cloudStorage];
  const deleteFileImpl:
    | ((opt: DeleteFileOptionsInternal<any>) => Promise<void>)
    | undefined =
    cloudStorage === "Dropbox"
      ? dropbox.deleteFile
      : cloudStorage === "WebDAV"
      ? webdav.deleteFile
      : undefined;

  if (!deleteFileImpl) {
    throw new Error(`Unsupported cloud storage "${cloudStorage}"`);
  }

  if (archive) {
    await deleteFileImpl({ path: ref.path, client, cloudStorage });
  } else {
    await deleteFileImpl({ path: ref.path, client, cloudStorage });
    if (cloudArchiveFileRef) {
      await deleteFileImpl({
        path: cloudArchiveFileRef.path,
        client,
        cloudStorage,
      });
    }
  }

  if (archive) {
    await unlinkCloudArchiveFile(filePath);
  } else {
    await unlinkCloudFile(filePath);
  }
}

export async function unlinkCloudArchiveFile(filePath: string) {
  const archiveFile = await getCloudArchiveFileRefByFilePath(filePath);
  if (!archiveFile) {
    throw new Error(
      `No cloud archive file found for local file path "${filePath}"`
    );
  }

  const cloudArchiveFiles = await getCloudArchiveFileRefs();

  const newCloudArchiveFiles = cloudArchiveFiles.filter(
    (c) => c.path !== archiveFile.path
  );
  await setPreferencesItem(
    "cloud-archive-files",
    JSON.stringify(newCloudArchiveFiles)
  );
}

export async function loadClients(): Promise<
  Record<CloudStorage, CloudStorageClient>
> {
  const promises = cloudStorages.map((cloudStorage) =>
    createClient(cloudStorage)
      .then((instance) =>
        instance
          ? ({
              instance,
              cloudStorage,
              status: "connected",
            } as CloudStorageClientConnected)
          : ({
              cloudStorage,
              status: "disconnected",
            } as CloudStorageClientDisconnected)
      )
      .catch(
        (error) =>
          ({
            error,
            cloudStorage,
            status: "disconnected",
          } as CloudStorageClientDisconnected)
      )
  );
  const clients = await Promise.all(promises);
  return clients.reduce((prev, curr) => {
    prev[curr.cloudStorage] = curr;
    return prev;
  }, {} as Record<CloudStorage, CloudStorageClient>);
}

export async function createClient(
  cloudStorage: CloudStorage
): Promise<unknown> {
  switch (cloudStorage) {
    case "Dropbox":
      return dropbox.createClient();
    case "WebDAV":
      return webdav.createClient();
    default:
      throw new Error(`Unknown cloud storage "${cloudStorage}"`);
  }
}

export async function requestAccessToken(
  options: RequestAccessTokenOptions
): Promise<void> {
  const { cloudStorage, code } = options;
  switch (cloudStorage) {
    case "Dropbox":
      return dropbox.requestAccessToken(code);
    default:
      throw new Error(`Unknown cloud storage "${cloudStorage}"`);
  }
}

export async function listFiles(
  opt: ListCloudFilesOptions<any>
): Promise<ListCloudItemResult> {
  switch (opt.cloudStorage) {
    case "Dropbox":
      return dropbox.listFiles(opt);
    case "WebDAV":
      return webdav.listFiles(opt);
    default:
      throw new Error(`Unknown cloud storage "${opt.cloudStorage}"`);
  }
}

export async function getFileMetaData(
  opt: FileMetaDataOptions<any>
): Promise<CloudFile> {
  switch (opt.cloudStorage) {
    case "Dropbox":
      return dropbox.getFileMetaData(opt);
    case "WebDAV":
      return webdav.getFileMetaData(opt);
    default:
      throw new Error(`Unknown cloud storage "${opt.cloudStorage}"`);
  }
}

export async function getCloudArchiveFileMetaData(
  opt: GetCloudArchiveFileMetaDataOptions
) {
  const { filePath, cloudStorageClients } = opt;
  const cloudFile = await getCloudFileRefByFilePath(filePath);
  if (!cloudFile) {
    return;
  }

  const { cloudStorage } = cloudFile;

  const archiveFilePath = await getArchiveFilePath(cloudFile.path);
  if (!archiveFilePath) {
    return;
  }

  try {
    const client = cloudStorageClients[cloudStorage];
    const metaData = await getFileMetaData({
      path: archiveFilePath,
      cloudStorage,
      client,
    });
    return { ...metaData, cloudStorage };
  } catch (error) {
    if (!(error instanceof CloudFileNotFoundError)) {
      throw error;
    }
  }
}

export async function downloadFile(opt: DownloadFileOptions<any>) {
  switch (opt.cloudStorage) {
    case "Dropbox":
      return dropbox.downloadFile(opt);
    case "WebDAV":
      return webdav.downloadFile(opt);
    default:
      throw new Error(`Unknown cloud storage "${opt.cloudStorage}"`);
  }
}

export async function uploadFile(
  opt: UploadFileOptions
): Promise<CloudFileRef> {
  const { filePath, text, cloudStorage, archive, client } = opt;

  if (archive) {
    const archiveFilePath = getArchiveFilePath(filePath);
    if (!archiveFilePath) {
      throw new Error(`Unable to get archive file path from "${filePath}"`);
    }

    let archiveFile: CloudFile | undefined = undefined;
    if (cloudStorage === "Dropbox") {
      archiveFile = await dropbox.uploadFile({
        path: getFilenameFromPath(archiveFilePath),
        content: text,
        client,
      });
    } else if (cloudStorage === "WebDAV") {
      archiveFile = await webdav.uploadFile({
        path: getFilenameFromPath(archiveFilePath),
        content: text,
        client,
      });
    } else {
      throw new Error(`Unsupported cloud storage "${cloudStorage}"`);
    }

    const cloudArchiveFileRef = {
      ...archiveFile,
      localFilePath: filePath,
      lastSync: new Date().toISOString(),
      cloudStorage,
    };

    await linkArchiveFile(cloudArchiveFileRef);

    return cloudArchiveFileRef;
  } else {
    let cloudFile: CloudFile | undefined = undefined;
    if (cloudStorage === "Dropbox") {
      cloudFile = await dropbox.uploadFile({
        path: getFilenameFromPath(filePath),
        content: text,
        client,
      });
    } else if (cloudStorage === "WebDAV") {
      cloudFile = await webdav.uploadFile({
        path: getFilenameFromPath(filePath),
        content: text,
        client,
      });
    } else {
      throw new Error(`Unsupported cloud storage "${cloudStorage}"`);
    }

    const cloudFileRef = {
      ...cloudFile,
      localFilePath: filePath,
      lastSync: new Date().toISOString(),
      cloudStorage,
    };

    await linkFile(cloudFileRef);

    return cloudFileRef;
  }
}

export async function syncFile(
  opt: SyncFileOptions
): Promise<string | undefined> {
  const { filePath, text, archive, cloudStorageClients } = opt;
  const cloudFileRef = await getCloudFileRefByFilePath(filePath);
  const cloudArchiveFileRef = await getCloudArchiveFileRefByFilePath(filePath);

  const _ref = archive ? cloudArchiveFileRef : cloudFileRef;
  if (!_ref) {
    return;
  }

  const { localFilePath, cloudStorage, ...ref } = _ref;

  const client = cloudStorageClients[cloudStorage];
  if (client.status === "disconnected") {
    throw new Error(`${cloudStorage} client is disconnected`);
  }

  let syncResult: SyncFileResult = undefined;
  if (cloudStorage === "Dropbox") {
    syncResult = await dropbox.syncFile({
      localContent: text,
      localVersion: ref,
      client: client.instance,
    });
  } else if (cloudStorage === "WebDAV") {
    syncResult = await webdav.syncFile({
      localContent: text,
      localVersion: ref,
      client: client.instance,
    });
  } else {
    throw new Error(`Unsupported cloud storage "${cloudStorage}"`);
  }

  if (!syncResult) {
    return;
  }

  const newCloudFile = !archive ? syncResult.cloudFile : cloudFileRef;

  const newCloudArchiveFile = archive
    ? syncResult.cloudFile
    : cloudArchiveFileRef;

  if (syncResult.type === "server" || syncResult.type === "local") {
    if (newCloudFile) {
      await linkFile({
        ...newCloudFile,
        localFilePath: filePath,
        lastSync: new Date().toISOString(),
        cloudStorage,
      });
    } else if (newCloudArchiveFile) {
      await linkArchiveFile({
        ...newCloudArchiveFile,
        localFilePath: filePath,
        cloudStorage,
      });
    }
  }

  if (syncResult.type === "local") {
    return syncResult.content;
  }
}

export async function syncAllFiles(
  opt: SyncFileOptions[]
): Promise<{ text: string; filePath: string }[]> {
  const optFiltered: SyncFileOptions[] = [];
  for (const i of opt) {
    const ref = i.archive
      ? await getCloudArchiveFileRefByFilePath(i.filePath)
      : await getCloudFileRefByFilePath(i.filePath);
    if (ref) {
      optFiltered.push(i);
    }
  }

  if (optFiltered.length === 0) {
    return [];
  }

  const results: { text: string; filePath: string }[] = [];
  await Promise.all(
    optFiltered.map(async (opt) => {
      const text = await syncFile(opt);
      if (text) {
        results.push({ text, filePath: opt.filePath });
      }
    })
  );

  return results;
}
