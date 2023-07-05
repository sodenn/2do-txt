import {
  CloudFile,
  CloudItem,
  Provider,
  WithCloudFile,
  WithContent,
  WithPath,
  WithRef,
  WithResponse,
} from "../types";

export type DownloadFileOption = WithPath;

export type DownloadFileResult = WithResponse & WithCloudFile;

export type DownloadFile = (
  options: DownloadFileOption,
) => Promise<DownloadFileResult>;

export interface UploadFileOptions extends WithPath, WithContent {
  overwrite: boolean;
}

export type UploadFile = (options: UploadFileOptions) => Promise<CloudFile>;

export type DeleteFileOptions = WithPath;

export type DeleteFile = (options: DeleteFileOptions) => Promise<void>;

export type GetFileMetaDataOptions = WithPath;

export type GetFileMetaData = (
  options: GetFileMetaDataOptions,
) => Promise<CloudFile>;

export type SyncFileOptions = WithRef & Partial<WithContent>;

export interface SyncFileUploadResult extends WithCloudFile {
  operation: "upload";
}

export interface SyncFileDownloadResult extends WithCloudFile, WithResponse {
  operation: "download";
}

export type SyncFileResult =
  | SyncFileUploadResult
  | SyncFileDownloadResult
  | { operation: "none" };

export type SyncFile = (options: SyncFileOptions) => Promise<SyncFileResult>;

export interface ListOptions extends Partial<WithPath> {
  cursor?: string;
}

export interface ListResult {
  items: CloudItem[];
  cursor?: string;
  hasMore: boolean;
}

export type List = (options?: ListOptions) => Promise<ListResult>;

export interface Client {
  provider: Provider;
  downloadFile: DownloadFile;
  uploadFile: UploadFile;
  deleteFile: DeleteFile;
  getFileMetaData: GetFileMetaData;
  syncFile: SyncFile;
  list: List;
}
