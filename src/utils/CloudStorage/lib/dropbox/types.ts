import { Dropbox, DropboxOptions } from "dropbox";
import { Client } from "../core";

export interface DropboxClient extends Client {
  dbx: Dropbox;
}

export interface DropboxClientConfiguration {
  dropboxOptions?: DropboxOptions;
  redirectUrl?: string;
}
