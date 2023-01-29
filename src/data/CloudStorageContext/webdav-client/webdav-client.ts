import { RequestContext } from "../../../utils/request";
import { deleteFile } from "./delete-file";
import { getDirectoryContents } from "./directory-contents";
import { getFileContents } from "./file-contents";
import { putFileContents } from "./put-file-contents";
import { BufferLike, WebDAVClient } from "./types";

export function createWebDAVClient(opt: RequestContext): WebDAVClient {
  return {
    getDirectoryContents: (path: string) => getDirectoryContents(opt, path),
    getFileContents: (filename: string, format: "binary" | "text") =>
      getFileContents(opt, filename, format),
    putFileContents: (filePath: string, data: string | BufferLike) =>
      putFileContents(opt, filePath, data),
    deleteFile: (filename: string) => deleteFile(opt, filename),
  };
}
