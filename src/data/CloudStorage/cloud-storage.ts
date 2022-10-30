import { CloudStorage } from "./cloud-storage.types";
import * as dropbox from "./dropbox-storage";
import * as webdav from "./webdav-storage";

export async function authenticate(cloudStorage: CloudStorage): Promise<void> {
  switch (cloudStorage) {
    case "Dropbox":
      return dropbox.authenticate();
    case "WebDAV":
      return webdav.authenticate();
    default:
      throw new Error(`Unknown cloud storage "${cloudStorage}"`);
  }
}
