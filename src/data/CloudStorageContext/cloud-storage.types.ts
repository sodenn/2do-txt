export type CloudStorage = "Dropbox" | "WebDAV";

export interface CloudStorageMethods {
  authenticate: () => Promise<void>;
  unlink: (client: any) => Promise<void>;
  createClient: () => Promise<any>;
  listFiles: (
    opt: Omit<ListCloudFilesOptions, "cloudStorage">
  ) => Promise<ListCloudItemResult>;
  getFileMetaData: (
    opt: Omit<FileMetaDataOptions, "cloudStorage">
  ) => Promise<CloudFile>;
  downloadFile: (
    opt: Omit<DownloadFileOptions, "cloudStorage">
  ) => Promise<string>;
  uploadFile: (
    opt: Omit<UploadFileOptions, "cloudStorage" | "isDoneFile">
  ) => Promise<CloudFile>;
  syncFile: (opt: SyncFileOptionsInternal<any>) => Promise<SyncFileResult>;
}

export interface CloudFile {
  name: string;
  path: string;
  rev: string;
  type: "file";
  contentHash?: string;
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

export interface UnlinkOptions<T = any> {
  cloudStorage: CloudStorage;
  client?: T;
}

export interface CloudDoneFileRef extends CloudFile {
  // ⚠️ same path as {@link CloudFileRef.localFilePath}
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

export interface ListCloudFilesOptions<T = any> {
  path?: string;
  cursor?: string;
  cloudStorage: CloudStorage;
  client: T;
}

export interface FileMetaDataOptions<T = any> {
  path: string;
  cloudStorage: CloudStorage;
  client: T;
}

export interface WithClients {
  cloudStorageClients: CloudStorageClients;
}

export interface GetCloudDoneFileMetaDataOptions extends WithClients {
  filePath: string;
}

export interface ListCloudItemResult {
  items: CloudItem[];
  cursor?: string;
  hasMore: boolean;
}

export interface DownloadFileOptions<T = any> {
  filePath: string;
  cloudStorage: CloudStorage;
  client: T;
}

interface UploadNonDoneFileOptions<T = any> {
  text: string;
  filePath: string;
  cloudStorage: CloudStorage;
  isDoneFile: false;
  client: T;
}

interface UploadDoneFileOptions<T = any> {
  text: string;
  cloudFilePath: string;
  filePath: string;
  cloudStorage: CloudStorage;
  isDoneFile: true;
  client: T;
}

export type UploadFileOptions<T = any> =
  | UploadNonDoneFileOptions<T>
  | UploadDoneFileOptions<T>;

export interface DeleteFileOptions extends WithClients {
  filePath: string;
  isDoneFile: boolean;
}

export interface DeleteFileOptionsInternal<T> {
  filePath: string;
  cloudStorage: CloudStorage;
  client: T;
}

export interface SyncFileOptions {
  filePath: string;
  text: string;
  isDoneFile: boolean;
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
