import { getFilenameFromPath } from "../../native-api/filesystem";
import {
  getPreferencesItem,
  setPreferencesItem,
} from "../../native-api/preferences";
import { getDoneFilePath } from "../todo-files";
import {
  CloudDoneFileRef,
  CloudFileRef,
  CloudStorage,
  CloudStorageClientConnected,
  CloudStorageClientDisconnected,
  CloudStorageClients,
  CloudStorageMethods,
  DeleteFileOptions,
  DownloadFileOptions,
  GetCloudDoneFileMetaDataOptions,
  ListCloudFilesOptions,
  ListCloudItemResult,
  RequestAccessTokenOptions,
  SyncFileOptions,
  UnlinkOptions,
  UploadFileOptions,
  WithClient,
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
    cloudFile,
  ];
  await setPreferencesItem("cloud-files", JSON.stringify(newCloudFiles));
}

export async function linkDoneFile(cloudFile: CloudDoneFileRef) {
  const cloudDoneFiles = await getCloudDoneFileRefs();
  const newCloudDoneFiles = [
    ...cloudDoneFiles.filter((c) => c.path !== cloudFile.path),
    { ...cloudFile },
  ];
  await setPreferencesItem(
    "cloud-archive-files",
    JSON.stringify(newCloudDoneFiles)
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

export async function getCloudDoneFileRefs(): Promise<CloudDoneFileRef[]> {
  const cloudDoneFilesStr = await getPreferencesItem("cloud-archive-files");
  try {
    return cloudDoneFilesStr ? JSON.parse(cloudDoneFilesStr) : [];
  } catch (error) {
    await setPreferencesItem("cloud-archive-files", JSON.stringify([]));
    return [];
  }
}

export async function getCloudFileRefByFilePath(filePath: string) {
  const cloudFiles = await getCloudFileRefs();
  return cloudFiles.find((c) => c.localFilePath === filePath);
}

export async function getCloudDoneFileRefByFilePath(filePath: string) {
  const cloudDoneFiles = await getCloudDoneFileRefs();
  return cloudDoneFiles.find((c) => c.localFilePath === filePath);
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
  const { filePath, isDoneFile, client, cloudFileRef, cloudDoneFileRef } = opt;
  const ref = isDoneFile ? cloudDoneFileRef : cloudFileRef;
  if (!ref) {
    return;
  }
  const { cloudStorage } = ref;

  await $(cloudStorage).deleteFile({
    filePath: ref.path,
    client,
    cloudStorage,
  });

  if (!isDoneFile && cloudDoneFileRef) {
    await $(cloudStorage).deleteFile({
      filePath: cloudDoneFileRef.path,
      client,
      cloudStorage,
    });
  }

  if (isDoneFile) {
    await unlinkCloudDoneFile(filePath);
  } else {
    await unlinkCloudFile(filePath);
    if (cloudDoneFileRef) {
      await unlinkCloudDoneFile(filePath);
    }
  }
}

export async function unlinkCloudDoneFile(filePath: string) {
  const doneFile = await getCloudDoneFileRefByFilePath(filePath);
  if (!doneFile) {
    throw new Error(
      `No cloud done file found for local file path "${filePath}"`
    );
  }
  const cloudDoneFiles = await getCloudDoneFileRefs();
  const newCloudDoneFiles = cloudDoneFiles.filter(
    (c) => c.path !== doneFile.path
  );
  await setPreferencesItem(
    "cloud-archive-files",
    JSON.stringify(newCloudDoneFiles)
  );
}

export async function loadClients(): Promise<CloudStorageClients> {
  const refs = await getCloudFileRefs();
  const clients = await Promise.all([
    ...cloudStorages
      .filter((storage) => refs.some((ref) => ref.cloudStorage === storage))
      .map((cloudStorage) =>
        createClient(cloudStorage)
          .then(
            (instance) =>
              ({
                instance,
                cloudStorage,
                status: "connected",
              } as CloudStorageClientConnected)
          )
          .catch(
            (error) =>
              ({
                error,
                cloudStorage,
                status: "disconnected",
              } as CloudStorageClientDisconnected)
          )
      ),
    ...cloudStorages
      .filter((storage) => refs.every((ref) => ref.cloudStorage !== storage))
      .map(
        (cloudStorage) =>
          ({
            cloudStorage,
            status: "disconnected",
          } as CloudStorageClientDisconnected)
      ),
  ]);
  return clients.reduce((prev, curr) => {
    prev[curr.cloudStorage] = curr;
    return prev;
  }, {} as CloudStorageClients);
}

export async function createClient(cloudStorage: CloudStorage): Promise<any> {
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

export async function getDoneFileMetaData(
  opt: GetCloudDoneFileMetaDataOptions
) {
  const { client, cloudFileRef } = opt;
  if (!cloudFileRef) {
    return;
  }

  const { cloudStorage } = cloudFileRef;

  const doneFilePath = await getDoneFilePath(cloudFileRef.path);
  if (!doneFilePath) {
    return;
  }

  return await $(cloudStorage)
    .getFileMetaData({
      path: doneFilePath,
      client,
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
): Promise<CloudFileRef | CloudDoneFileRef> {
  const { filePath, text, cloudStorage, isDoneFile, client } = opt;
  const contentHash = generateContentHash(text);
  if (isDoneFile) {
    const { cloudFilePath } = opt;
    const doneFilePath = getDoneFilePath(cloudFilePath);
    if (!doneFilePath) {
      throw new Error(`Unable to get done file path from "${cloudFilePath}"`);
    }
    const doneFile = await $(opt.cloudStorage).uploadFile({
      filePath: doneFilePath,
      text,
      client,
    });
    const cloudDoneFileRef: CloudDoneFileRef = {
      ...doneFile,
      contentHash,
      localFilePath: filePath,
      cloudStorage,
    };
    await linkDoneFile(cloudDoneFileRef);
    return cloudDoneFileRef;
  } else {
    const cloudFile = await $(opt.cloudStorage).uploadFile({
      filePath: getFilenameFromPath(filePath),
      text,
      client,
    });
    const cloudFileRef: CloudFileRef = {
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
  opt: SyncFileOptions & WithClient
): Promise<string | undefined> {
  const { filePath, text, isDoneFile, client } = opt;
  const cloudFileRef = await getCloudFileRefByFilePath(filePath);
  const cloudDoneFileRef = await getCloudDoneFileRefByFilePath(filePath);

  const _ref = isDoneFile ? cloudDoneFileRef : cloudFileRef;
  if (!_ref) {
    return;
  }

  const { localFilePath, cloudStorage, ...ref } = _ref;

  const syncResult = await $(cloudStorage).syncFile({
    localContent: text,
    localVersion: ref,
    client,
  });

  if (!syncResult) {
    if (cloudFileRef) {
      await linkFile({
        ...cloudFileRef,
        lastSync: new Date().toISOString(),
      });
    }
    return;
  }

  const newCloudFile = !isDoneFile ? syncResult.cloudFile : cloudFileRef;
  const newCloudDoneFile = isDoneFile ? syncResult.cloudFile : cloudDoneFileRef;
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
  } else if (newCloudDoneFile) {
    await linkDoneFile({
      ...newCloudDoneFile,
      contentHash,
      localFilePath: filePath,
      cloudStorage,
    });
  }

  if (syncResult.type === "server") {
    return syncResult.content;
  }
}

export async function syncAllFiles(
  syncOptions: (SyncFileOptions & WithClient)[]
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
