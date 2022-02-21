export type CloudStorage = "Dropbox";

export type UpdateMode = "create" | "update";

export interface CloudFile {
  name: string;
  path: string;
  rev: string;
  modifiedAt: string;
  directory?: boolean;
}

export interface CloudFileRef extends CloudFile {
  localFilePath: string;
}

export interface ListCloudFilesOptions {
  path?: string;
  cursor?: string;
}

export interface ListCloudFilesResult {
  items: CloudFile[];
  cursor?: string;
  hasMore: boolean;
}

export interface UploadFileOptions {
  mode: UpdateMode;
  path: string;
  contents: any;
}

export interface SyncFileOptions {
  localVersion: CloudFileRef;
  localContents: any;
}

interface SyncFileLocalResult {
  type: "server";
  cloudFile: CloudFile;
}

interface SyncFileServerResult {
  type: "local";
  cloudFile: CloudFile;
  text: string;
}

interface SyncFileConflictResult {
  type: "conflict";
  cloudFile: CloudFile;
  text: string;
}

export type SyncFileResult =
  | SyncFileLocalResult
  | SyncFileServerResult
  | SyncFileConflictResult
  | undefined;

interface FileConflictData {
  cloudFile: CloudFile;
  contents: any;
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
  constructor() {
    super("Unauthorized 401");
  }
}

export class NetworkError extends Error {
  constructor() {
    super("No network connection");
  }
}
