import { WithContent, WithPath, WithRef, WithResponse } from "../../types";

export interface UploadFileOptions extends WithPath, WithContent {
  overwrite?: boolean;
}

export type DownloadFileResult = WithRef & WithResponse;

interface SyncFileUploadResult extends WithRef {
  operation: "upload";
}

interface SyncFileDownloadResult extends WithRef, WithResponse {
  operation: "download";
}

export type SyncFileResult =
  | SyncFileUploadResult
  | SyncFileDownloadResult
  | { operation: "none" };
