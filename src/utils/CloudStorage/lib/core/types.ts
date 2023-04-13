/**
 * The cloud storage provider. For example, "Dropbox" or "WebDAV".
 */
export type Provider = "Dropbox" | "WebDAV";

export interface WithProvider {
  /**
   * The cloud storage provider that the file belongs to.
   */
  provider: Provider;
}

export interface WithPath {
  /**
   * Path to the file in the cloud storage.
   */
  path: string;
}

export interface WithIdentifier {
  /**
   * Unique identifier to create a mapping between local and
   * cloud representation of the file.
   */
  identifier: string;
}

export interface CloudFile extends WithPath {
  /**
   * File name.
   */
  name: string;
  /**
   * Date the file was last modified.
   */
  lastModified: string;
}

export interface CloudDirectory extends WithPath {
  /**
   * Directory name.
   */
  name: string;
}

export interface WithFileType {
  /**
   * The cloud item is a file.
   */
  type: "file";
}

export interface WithDirectoryType {
  /**
   * The cloud item is a directory.
   */
  type: "directory";
}

export type CloudItem =
  | (CloudFile & WithFileType)
  | (CloudDirectory & WithDirectoryType);

export interface CloudFileRef extends CloudFile, WithProvider {
  /**
   * Date the file was last synced to cloud storage. Used
   * to automatically synchronize at certain time intervals.
   */
  lastSync: string;
  /**
   * Checksum of the file. Used to determine if the file
   * has changed since the last sync.
   */
  checksum?: string;
}

export interface WithRef {
  /**
   * Reference to the cloud storage file.
   */
  ref: CloudFileRef;
}

export interface WithCloudFile {
  /**
   * Cloud storage file.
   */
  cloudFile: CloudFile;
}

export interface WithContent {
  /**
   * File content.
   */
  content: string | ArrayBuffer;
}

/**
 * Response from the cloud storage provider.
 */
export interface WithResponse {
  response: Response;
}
