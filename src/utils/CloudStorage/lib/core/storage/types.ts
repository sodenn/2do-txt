import {
  Client,
  DeleteFile,
  DownloadFileOption,
  GetFileMetaData,
  List,
  SyncFileOptions,
} from "../client";
import { CloudFileRef, Provider } from "../types";
import {
  DownloadFileResult,
  SyncFileResult,
  UploadFileOptions,
} from "./internal/types";

export interface CloudStorageConfiguration<T extends Client = Client> {
  client: T;
}

/**
 * The cloud storage interface. This interface is used to
 * interact with the cloud storage. It is linked to a specific
 * cloud storage provider.
 */
export interface CloudStorage<T extends Client = Client> {
  /**
   * The cloud storage client.
   */
  client: T;
  /**
   * The cloud storage provider.
   */
  provider: Provider;
  /**
   * Downloads a file from the cloud storage.
   */
  downloadFile: (options: DownloadFileOption) => Promise<DownloadFileResult>;
  /**
   * Uploads a file to the cloud storage.
   */
  uploadFile: (options: UploadFileOptions) => Promise<CloudFileRef>;
  /**
   * Gets the metadata of a file.
   */
  getMetaData: GetFileMetaData;
  /**
   * Deletes a file from the cloud storage.
   */
  deleteFile: DeleteFile;
  /**
   * Synchronizes a file with the cloud storage.
   */
  syncFile: (opt: SyncFileOptions) => Promise<SyncFileResult>;
  /**
   * Lists the files in a directory.
   */
  list: List;
}
