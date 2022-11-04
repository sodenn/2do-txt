import { getSecureStorage } from "../../utils/secure-storage";
import {
  CloudFile,
  DeleteFileOptionsInternal,
  DownloadFileOptions,
  FileMetaDataOptions,
  ListCloudFilesOptions,
  ListCloudItemResult,
  SyncFileOptionsInternal,
  SyncFileResult,
  UploadFileOptionsInternal,
} from "./cloud-storage.types";

const { removeSecureStorageItem } = getSecureStorage();

export async function authenticate(): Promise<void> {
  throw new Error("Not yet implemented");
}

export async function createClient() {
  throw new Error("Not yet implemented");
}

export async function resetTokens() {
  await Promise.all([
    removeSecureStorageItem("WebDAV-username"),
    removeSecureStorageItem("WebDAV-password"),
  ]).catch((e) => void e);
}

export async function unlink(_: any) {
  return resetTokens();
}

export async function listFiles(
  opt: ListCloudFilesOptions<any>
): Promise<ListCloudItemResult> {
  throw new Error("Not yet implemented");
}

export async function getFileMetaData(
  opt: FileMetaDataOptions<any>
): Promise<CloudFile> {
  throw new Error("Not yet implemented");
}

export async function downloadFile(
  opt: DownloadFileOptions<any>
): Promise<string> {
  throw new Error("Not yet implemented");
}

export async function uploadFile(
  opt: UploadFileOptionsInternal<any>
): Promise<CloudFile> {
  throw new Error("Not yet implemented");
}

export async function deleteFile(opt: DeleteFileOptionsInternal<any>) {
  throw new Error("Not yet implemented");
}

export async function syncFile(
  opt: SyncFileOptionsInternal<any>
): Promise<SyncFileResult> {
  throw new Error("Not yet implemented");
}
