export type CloudStorage = "Dropbox" | "WebDAV";

export interface CloudFile {
  name: string;
  path: string;
  rev: string;
  contentHash: string;
  type: "file";
}

export interface CloudFolder {
  name: string;
  path: string;
  type: "folder";
}

export type CloudItem = CloudFile | CloudFolder;

export type CloudStorageClients = Record<CloudStorage, CloudStorageClient>;

export interface CloudFileRef extends CloudFile {
  localFilePath: string;
  lastSync: string;
  cloudStorage: CloudStorage;
}

export interface CloudFileDialogOptions {
  open: boolean;
  cloudStorage?: CloudStorage;
}

export interface UnlinkOptions<T> {
  cloudStorage: CloudStorage;
  client?: T;
}

export interface CloudArchiveFileRef extends CloudFile {
  localFilePath: string;
  cloudStorage: CloudStorage;
}

export interface RequestAccessTokenOptions {
  code: string;
  cloudStorage: CloudStorage;
}

export interface CloudStorageClientConnected {
  instance: any;
  cloudStorage: CloudStorage;
  status: "connected";
}

export interface CloudStorageClientDisconnected {
  error?: any;
  cloudStorage: CloudStorage;
  status: "disconnected";
}

export type CloudStorageClient =
  | CloudStorageClientConnected
  | CloudStorageClientDisconnected;

export interface ListCloudFilesOptions<T> {
  path?: string;
  cursor?: string;
  cloudStorage: CloudStorage;
  client: T;
}

export interface FileMetaDataOptions<T> {
  path: string;
  cloudStorage: CloudStorage;
  client: T;
}

export interface GetCloudArchiveFileMetaDataOptions {
  filePath: string;
  cloudStorageClients: CloudStorageClients;
}

export interface ListCloudItemResult {
  items: CloudItem[];
  cursor?: string;
  hasMore: boolean;
}

export interface DownloadFileOptions<T> {
  cloudFilePath: string;
  cloudStorage: CloudStorage;
  client: T;
}

export interface UploadFileOptions {
  text: string;
  filePath: string;
  cloudStorage: CloudStorage;
  archive: boolean;
  client: any;
}

export interface UploadFileOptionsInternal<T> {
  path: string;
  content: string;
  client: T;
}

export interface DeleteFileOptions {
  filePath: string;
  archive: boolean;
  cloudStorageClients: CloudStorageClients;
}

export interface DeleteFileOptionsInternal<T> {
  path: string;
  cloudStorage: CloudStorage;
  client: T;
}

export interface SyncFileOptions {
  filePath: string;
  text: string;
  archive: boolean;
  cloudStorageClients: CloudStorageClients;
  showSnackbar?: boolean;
}

export interface SyncFileOptionsInternal<T> {
  localVersion: CloudFile;
  localContent: string;
  client: T;
}

interface SyncFileLocalResult {
  type: "local";
  cloudFile: CloudFile;
}

interface SyncFileServerResult {
  type: "server";
  cloudFile: CloudFile;
  content: string;
}

export type SyncFileResult =
  | SyncFileLocalResult
  | SyncFileServerResult
  | undefined;
