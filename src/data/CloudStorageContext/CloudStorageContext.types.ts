import { CloudStorage } from "./cloud-storage.types";

export interface DeleteFileOptions {
  filePath: string;
  archive: boolean;
}

export interface DownloadFileOptions {
  cloudFilePath: string;
  cloudStorage: CloudStorage;
}

export interface ListCloudFilesOptions {
  path?: string;
  cursor?: string;
  cloudStorage: CloudStorage;
}

export interface SyncFileOptions {
  filePath: string;
  text: string;
  archive: boolean;
  showSnackbar?: boolean;
}

export interface UploadFileOptions {
  text: string;
  filePath: string;
  cloudStorage: CloudStorage;
  archive: boolean;
}
