import { CloudStorage } from "./cloud-storage.types";

export interface DeleteFileOptions {
  filePath: string;
  isDoneFile: boolean;
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
  isDoneFile: boolean;
  showSnackbar?: boolean;
}

export interface UploadFileOptions {
  text: string;
  filePath: string;
  cloudStorage: CloudStorage;
  isDoneFile: boolean;
}
