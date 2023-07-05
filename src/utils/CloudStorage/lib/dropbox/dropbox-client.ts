import { Dropbox } from "dropbox";
import {
  CloudError,
  CloudFile,
  CloudItem,
  createSyncFileFunction,
  DeleteFile,
  DownloadFile,
  DownloadFileOption,
  GetFileMetaData,
  List,
  UploadFile,
} from "../core";
import { DropboxClient, DropboxClientConfiguration } from "./types";

function handleError(error: any): Promise<never> {
  if (error.error?.error_summary?.includes("path/not_found")) {
    error.status = 404;
  }
  throw error;
}

export const createDropboxClient = (
  config: DropboxClientConfiguration = {},
): DropboxClient => {
  const { dropboxOptions = {} } = config;
  const dbx = new Dropbox(dropboxOptions);

  const list: List = async (options = {}) => {
    const { path, cursor } = options;

    const hasPath = typeof path === "string";

    if (!hasPath && !cursor) {
      throw new CloudError({
        cause: "Either path or cursor must be defined",
      });
    }

    const { result } = hasPath
      ? await dbx.filesListFolder({ path, recursive: true }).catch(handleError)
      : await dbx
          .filesListFolderContinue({ cursor: cursor! })
          .catch(handleError);

    return {
      items: result.entries
        .filter(
          (e) =>
            !!e.path_lower && (e[".tag"] === "folder" || e[".tag"] === "file"),
        )
        .map((e) => {
          if (e[".tag"] === "folder") {
            return {
              name: e.name,
              path: e.path_lower as string,
              type: "directory",
            };
          } else if (e[".tag"] === "file") {
            return {
              name: e.name,
              path: e.path_lower as string,
              lastModified: e.server_modified,
              type: "file",
            };
          } else {
            throw new CloudError({
              cause: `Cannot map cloud item with path "${e.path_lower}"`,
            });
          }
        }) as CloudItem[],
      cursor: result.cursor,
      hasMore: result.has_more,
    };
  };

  const getFileMetaData: GetFileMetaData = async ({ path }) => {
    const { result: item } = await dbx
      .filesGetMetadata({ path })
      .catch(handleError);

    if (item[".tag"] !== "file") {
      throw new CloudError({
        cause: `Resource with path "${path}" is not a file`,
      });
    }

    if (!item.path_lower) {
      throw new CloudError({
        cause: `File with path "${path}" not mounted`,
      });
    }

    return {
      name: item.name,
      path: item.path_lower,
      lastModified: item.server_modified,
    };
  };

  const downloadFile: DownloadFile = async (options: DownloadFileOption) => {
    const { path } = options;

    const { result, status, headers } = await dbx
      .filesDownload({ path })
      .catch(handleError);

    const response = await new Promise<Response>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(new Response(reader.result, { status, headers }));
      };
      reader.onerror = reject;
      reader.onabort = reject;
      // @ts-ignore
      reader.readAsArrayBuffer(result.fileBlob || result.fileBinary);
    });

    const cloudFile: CloudFile = {
      name: result.name,
      path: result.path_lower!,
      lastModified: result.server_modified,
    };

    return { cloudFile, response };
  };

  const uploadFile: UploadFile = async (options) => {
    const { path, content, overwrite } = options;
    const dropboxPath = path.startsWith("/") ? path : `/${path}`;
    const {
      result: { name, path_lower, server_modified },
    } = await dbx
      .filesUpload({
        path: dropboxPath,
        contents: content,
        ...(overwrite && { mode: { ".tag": "overwrite" } }),
      })
      .catch(handleError);
    return {
      name,
      path: path_lower!,
      lastModified: server_modified,
    };
  };

  const deleteFile: DeleteFile = async (options) => {
    await dbx.filesDeleteV2(options).catch(handleError);
  };

  const syncFile = createSyncFileFunction({
    getFileMetaData,
    uploadFile,
    downloadFile,
  });

  return {
    provider: "Dropbox",
    dbx,
    list,
    getFileMetaData,
    downloadFile,
    uploadFile,
    deleteFile,
    syncFile,
  };
};
