import {
  Client,
  CloudError,
  CloudFile,
  createSyncFileFunction,
  DeleteFile,
  DownloadFile,
  DownloadFileOption,
  GetFileMetaData,
  getFilename,
  handleResponseErrors,
  List,
  UploadFile,
} from "../core";
import { calculateContentLength } from "./content-length";
import { parseXML, prepareFileFromProps } from "./dav";
import {
  encodePath,
  extractURLPath,
  joinPaths,
  normaliseHref,
  normalisePath,
  relativePath,
} from "./path";
import { Headers, WebDAVClientOptions } from "./types";

export const createWebDAVClient = (config: WebDAVClientOptions): Client => {
  const { fetch: fetchFunction = fetch, basicAuth, baseUrl } = config;

  const request = (input: RequestInfo | URL, init?: RequestInit) => {
    const { username, password } = basicAuth;
    const credentials = window.btoa(`${username}:${password}`);
    const Authorization = `Basic ${credentials}`;
    if (typeof input === "string" || input instanceof URL) {
      const headers = { Authorization, ...init?.headers };
      return fetchFunction(input, {
        ...init,
        headers,
      }).then(handleResponseErrors);
    } else {
      input.headers.append("Authorization", Authorization);
      return fetchFunction(input, init).then(handleResponseErrors);
    }
  };

  const getFileMetaData: GetFileMetaData = async ({ path }) => {
    const filename = getFilename(path);
    const dirname = path.substring(0, path.length - filename.length);
    const cloudFiles = await getFileMetaDataList(dirname);
    const cloudFile = cloudFiles.find(
      (i) => i.name === filename && i.type === "file"
    );
    if (!cloudFile) {
      throw new CloudError({ type: "Not Found" });
    }
    const { type, ...metaData } = cloudFile;
    return metaData as CloudFile;
  };

  const getFileMetaDataList = async (path: string) => {
    const encodedPath = encodePath(path);
    const url = joinPaths(baseUrl, encodedPath);
    const opt = {
      method: "PROPFIND",
      headers: {
        Accept: "text/plain,application/xml",
        Depth: "1",
      },
    };
    const response = await request(url, opt);
    const xml = await response.text();
    if (!xml) {
      throw new CloudError({
        cause: "Failed parsing directory contents: Empty response",
      });
    }
    const davResp = await parseXML(xml);
    const serverBasePath = joinPaths(extractURLPath(baseUrl), "/");
    // Extract the response items (directory contents)
    const {
      multistatus: { response: responseItems },
    } = davResp;
    return (
      responseItems
        // Map all items to a consistent output structure (results)
        .map((item) => {
          // HREF is the file path (in full)
          const href = normaliseHref(item.href);
          // Each item should contain a stat object
          const {
            propstat: { prop: props },
          } = item;
          // Process the true full filename (minus the base server path)
          const filename =
            serverBasePath === "/"
              ? decodeURIComponent(normalisePath(href))
              : decodeURIComponent(
                  normalisePath(relativePath(serverBasePath, href))
                );
          return prepareFileFromProps(props, filename);
        })
    );
  };

  const downloadFile: DownloadFile = async ({ path }: DownloadFileOption) => {
    const encodedPath = encodePath(path);
    const url = joinPaths(baseUrl, encodedPath);
    const opt = {
      method: "GET",
    };

    const response = await request(url, opt);
    const cloudFile = await getFileMetaData({ path });

    return { cloudFile, response };
  };

  const uploadFile: UploadFile = async ({ path, content, overwrite }) => {
    if (!overwrite) {
      const existing = await getFileMetaData({ path });
      if (existing) {
        throw new CloudError({ type: "Conflict" });
      }
    }
    const encodedPath = encodePath(path);
    const url = joinPaths(baseUrl, encodedPath);
    const headers: Headers = {
      "Content-Type": "application/octet-stream",
      "Content-Length": `${calculateContentLength(content)}`,
    };
    const opt = {
      method: "PUT",
      headers,
      body: content,
    };
    await request(url, opt);
    return await getFileMetaData({ path });
  };

  const deleteFile: DeleteFile = async ({ path }) => {
    const encodedPath = encodePath(path);
    const url = joinPaths(baseUrl, encodedPath);
    await request(url, { method: "DELETE" });
  };

  const syncFile = createSyncFileFunction({
    getFileMetaData,
    uploadFile,
    downloadFile,
  });

  const list: List = async (options = {}) => {
    const path = options.path || "/";
    const items = await getFileMetaDataList(path);
    return {
      items: items.filter((i) => i.path !== path),
      hasMore: false,
    };
  };

  return {
    provider: "WebDAV",
    getFileMetaData,
    downloadFile,
    uploadFile,
    deleteFile,
    syncFile,
    list,
  };
};
