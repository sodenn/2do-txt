export type CloudStorage = "Dropbox" | "WebDAV";

export interface CloudFile {
  name: string;
  path: string;
  // rev: string;
  contentHash: string;
  type: "file";
}

export interface CloudFolder {
  name: string;
  path: string;
  type: "folder";
}

export type CloudItem = CloudFile | CloudFolder;

export interface CloudItemPage {
  items: CloudItem[];
  cursor?: string;
  hasMore: boolean;
}

export interface ListItemsOptions {
  path?: string;
  cursor?: string;
}

export interface SyncFileOptions {
  localVersion: CloudFile;
  localContent: string;
}

export interface UploadFileOptions {
  path: string;
  content: string;
}

export interface RequestTokensOptions {
  codeVerifier: string;
  authorizationCode: string;
}

export interface CloudFileRef extends CloudFile {
  localFilePath: string;
  lastSync: string;
  cloudStorage: CloudStorage;
}
