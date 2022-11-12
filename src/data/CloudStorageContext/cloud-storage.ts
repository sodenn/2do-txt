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
  CloudFileRef,
  CloudStorage,
  CloudStorageClientConnected,
  CloudStorageClientDisconnected,
  CloudStorageClients,
  CloudStorageMethods,
  DeleteFileOptions,
  DeleteFileOptionsInternal,
  DownloadFileOptions,
  GetCloudArchiveFileMetaDataOptions,
  ListCloudFilesOptions,
  ListCloudItemResult,
  RequestAccessTokenOptions,
  SyncFileOptions,
  UnlinkOptions,
  UploadFileOptions,
  WithClients,
} from "./cloud-storage.types";
import generateContentHash from "./ContentHasher";
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

function $(cloudStorage: CloudStorage): CloudStorageMethods {
  switch (cloudStorage) {
    case "Dropbox":
      return dropbox;
    case "WebDAV":
      return webdav;
    default:
      throw new Error(`Unknown cloud storage "${cloudStorage}"`);
  }
}

export async function authenticate(cloudStorage: CloudStorage): Promise<void> {
  return $(cloudStorage).authenticate();
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

export async function unlink(opt: UnlinkOptions) {
  const { cloudStorage, client } = opt;
  await $(cloudStorage).unlink(client);
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
  if (client.status === "disconnected") {
    throw new Error(`${cloudStorage} client is disconnected`);
  }
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

  await deleteFileImpl({
    filePath: ref.path,
    client: client.instance,
    cloudStorage,
  });

  if (!archive && cloudArchiveFileRef) {
    await deleteFileImpl({
      filePath: cloudArchiveFileRef.path,
      client,
      cloudStorage,
    });
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

export async function loadClients(): Promise<CloudStorageClients> {
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
  }, {} as CloudStorageClients);
}

export async function createClient(
  cloudStorage: CloudStorage
): Promise<unknown> {
  return $(cloudStorage).createClient();
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
  opt: ListCloudFilesOptions
): Promise<ListCloudItemResult> {
  return $(opt.cloudStorage).listFiles(opt);
}

export async function getArchiveFileMetaData(
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

  const client = cloudStorageClients[cloudStorage];
  if (client.status === "disconnected") {
    throw new Error(`${cloudStorage} client is disconnected`);
  }

  return await $(cloudStorage)
    .getFileMetaData({
      path: archiveFilePath,
      client: client.instance,
    })
    .then((metaData) => ({ ...metaData, cloudStorage }))
    .catch((error) => {
      if (!(error instanceof CloudFileNotFoundError)) {
        throw error;
      }
    });
}

export async function downloadFile(opt: DownloadFileOptions) {
  return $(opt.cloudStorage).downloadFile(opt);
}

export async function uploadFile(
  opt: UploadFileOptions
): Promise<CloudFileRef> {
  const { filePath, text, cloudStorage, archive, client } = opt;
  const contentHash = generateContentHash(text);
  if (archive) {
    const archiveFilePath = getArchiveFilePath(filePath);
    if (!archiveFilePath) {
      throw new Error(`Unable to get archive file path from "${filePath}"`);
    }
    const archiveFile = await $(opt.cloudStorage).uploadFile({
      filePath: getFilenameFromPath(archiveFilePath),
      text,
      client,
    });
    const cloudArchiveFileRef = {
      ...archiveFile,
      contentHash,
      localFilePath: filePath,
      lastSync: new Date().toISOString(),
      cloudStorage,
    };
    await linkArchiveFile(cloudArchiveFileRef);
    return cloudArchiveFileRef;
  } else {
    const cloudFile = await $(opt.cloudStorage).uploadFile({
      filePath: getFilenameFromPath(filePath),
      text,
      client,
    });
    const cloudFileRef = {
      ...cloudFile,
      contentHash,
      localFilePath: filePath,
      lastSync: new Date().toISOString(),
      cloudStorage,
    };
    await linkFile(cloudFileRef);
    return cloudFileRef;
  }
}

export async function syncFile(
  opt: SyncFileOptions & WithClients
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

  const syncResult = await $(cloudStorage).syncFile({
    localContent: text,
    localVersion: ref,
    client: client.instance,
  });

  if (!syncResult) {
    return;
  }

  const newCloudFile = !archive ? syncResult.cloudFile : cloudFileRef;
  const newCloudArchiveFile = archive
    ? syncResult.cloudFile
    : cloudArchiveFileRef;
  const contentHash =
    syncResult.type === "server"
      ? generateContentHash(syncResult.content)
      : generateContentHash(text);

  if (newCloudFile) {
    await linkFile({
      ...newCloudFile,
      contentHash,
      localFilePath: filePath,
      lastSync: new Date().toISOString(),
      cloudStorage,
    });
  } else if (newCloudArchiveFile) {
    await linkArchiveFile({
      ...newCloudArchiveFile,
      contentHash,
      localFilePath: filePath,
      cloudStorage,
    });
  }

  if (syncResult.type === "server") {
    return syncResult.content;
  }
}

export async function getFilteredSyncOptions(opt: SyncFileOptions[]) {
  const optFiltered: SyncFileOptions[] = [];
  for (const i of opt) {
    const ref = i.archive
      ? await getCloudArchiveFileRefByFilePath(i.filePath)
      : await getCloudFileRefByFilePath(i.filePath);
    if (ref) {
      optFiltered.push(i);
    }
  }
  return optFiltered;
}

export async function syncAllFiles(
  syncOptions: (SyncFileOptions & WithClients)[]
): Promise<{ text: string; filePath: string }[]> {
  const results: { text: string; filePath: string }[] = [];
  await Promise.all(
    syncOptions.map(async (opt) => {
      const text = await syncFile(opt);
      if (text) {
        results.push({ text, filePath: opt.filePath });
      }
    })
  );
  return results;
}
