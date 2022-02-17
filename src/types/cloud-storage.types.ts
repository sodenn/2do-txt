export type CloudStorage = "Dropbox";

export interface CloudFile {
  name: string;
  path: string;
  rev: string;
  modifiedAt: string;
  directory?: boolean;
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
  mode: "create" | "update";
  path: string;
  contents: any;
}

export interface SyncFileOptions {
  localVersion: CloudFile;
  localContents: any;
}

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
