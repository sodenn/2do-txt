export type CloudStorage = "Dropbox";

export const cloudStorages: CloudStorage[] = ["Dropbox"];

export type UpdateMode = "create" | "update";

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

export interface CloudFileRef extends CloudFile {
  localFilePath: string;
  lastSync: string;
  cloudStorage: CloudStorage;
}

export interface ListCloudFilesOptions {
  path?: string;
  cursor?: string;
  cloudStorage: CloudStorage;
}

export interface ListCloudItemResult {
  items: CloudItem[];
  cursor?: string;
  hasMore: boolean;
}

export interface UploadFileOptions {
  mode: UpdateMode;
  path: string;
  content: string;
}

export interface SyncFileOptions {
  localVersion: CloudFileRef;
  localContent: string;
}

interface SyncFileLocalResult {
  type: "server";
  cloudFile: CloudFile;
}

interface SyncFileServerResult {
  type: "local";
  cloudFile: CloudFile;
  content: string;
}

interface SyncFileConflictResult {
  type: "conflict";
  cloudFile: CloudFile;
  content: string;
}

export type SyncFileResult =
  | SyncFileLocalResult
  | SyncFileServerResult
  | SyncFileConflictResult
  | undefined;

interface FileConflictData {
  cloudFile: CloudFile;
  content: string;
}

export class CloudFileConflictError extends Error {
  constructor(public data: FileConflictData) {
    super("Conflict 409");
  }
}

export class CloudFileNotFoundError extends Error {
  constructor() {
    super("Not Found 404");
  }
}

export class CloudFileUnauthorizedError extends Error {
  constructor(public cloudStorage: CloudStorage) {
    super("Unauthorized 401");
  }
}

export class NetworkError extends Error {
  constructor() {
    super("No network connection");
  }
}
