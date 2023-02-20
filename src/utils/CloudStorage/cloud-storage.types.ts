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
  deleteFile: (opt: DeleteFileOptionsInternal<any>) => Promise<void>;
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

export interface UnlinkOptions<T = any> extends WithClient<T> {
  cloudStorage: CloudStorage;
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

export interface ListCloudFilesOptions<T = any> extends WithClient<T> {
  path?: string;
  cursor?: string;
  cloudStorage: CloudStorage;
}

export interface FileMetaDataOptions<T = any> extends WithClient<T> {
  path: string;
  cloudStorage: CloudStorage;
}

export interface WithClient<T = any> {
  client: T;
}

export type GetCloudDoneFileMetaDataOptions<T = any> = WithClient<T> & WithRef;

export interface ListCloudItemResult {
  items: CloudItem[];
  cursor?: string;
  hasMore: boolean;
}

export interface DownloadFileOptions<T = any> extends WithClient<T> {
  filePath: string;
  cloudStorage: CloudStorage;
}

interface UploadNonDoneFileOptions<T = any> extends WithClient<T> {
  text: string;
  filePath: string;
  cloudStorage: CloudStorage;
  isDoneFile: false;
}

interface UploadDoneFileOptions<T = any> extends WithClient<T> {
  text: string;
  cloudFilePath: string;
  filePath: string;
  cloudStorage: CloudStorage;
  isDoneFile: true;
}

export type UploadFileOptions<T = any> =
  | UploadNonDoneFileOptions<T>
  | UploadDoneFileOptions<T>;

export interface DeleteFileOptions<T = any> extends WithClient<T>, WithRef {
  filePath: string;
  isDoneFile: boolean;
}

export interface WithRef {
  cloudFileRef?: CloudFileRef;
  cloudDoneFileRef?: CloudDoneFileRef;
}

export interface DeleteFileOptionsInternal<T> extends WithClient<T> {
  filePath: string;
  cloudStorage: CloudStorage;
}

export interface SyncFileOptions {
  filePath: string;
  text: string;
  isDoneFile: boolean;
  showSnackbar?: boolean;
}

export interface SyncFileOptionsInternal<T> extends WithClient<T> {
  localVersion: CloudFile;
  localContent: string;
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
