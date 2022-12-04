import { Dropbox, DropboxAuth } from "dropbox";
import { oauth } from "../../utils/oath";
import { getPlatform } from "../../utils/platform";
import { getSecureStorage } from "../../utils/secure-storage";
import {
  CloudFileNotFoundError,
  CloudFileUnauthorizedError,
} from "./cloud-storage";
import {
  CloudFile,
  DeleteFileOptionsInternal,
  DownloadFileOptions,
  FileMetaDataOptions,
  ListCloudFilesOptions,
  ListCloudItemResult,
  SyncFileOptionsInternal,
  SyncFileResult,
  UploadFileOptions,
} from "./cloud-storage.types";
import generateContentHash from "./ContentHasher";

const { getSecureStorageItem, setSecureStorageItem, removeSecureStorageItem } =
  getSecureStorage();
const dropboxClientId = import.meta.env.VITE_DROPBOX_CLIENT_ID;
const platform = getPlatform();
const useInAppBrowser = ["ios", "android", "electron"].includes(platform);
const redirectUrl = useInAppBrowser
  ? "https://www.dropbox.com/1/oauth2/redirect_receiver"
  : `${window.location.origin}/dropbox`;

export async function authenticate(): Promise<void> {
  const dbxAuth = new DropboxAuth({
    clientId: dropboxClientId,
  });

  const authUrl = (await dbxAuth.getAuthenticationUrl(
    redirectUrl,
    undefined,
    "code",
    "offline",
    undefined,
    undefined,
    true
  )) as string;

  const codeVerifier = dbxAuth.getCodeVerifier();
  await setSecureStorageItem("Dropbox-code-verifier", codeVerifier);

  if (useInAppBrowser) {
    const params = await oauth({
      authUrl,
      redirectUrl,
    });
    await requestAccessToken(params.code);
  } else {
    window.location.href = authUrl;
  }
}

export async function createClient(): Promise<Dropbox | unknown> {
  const refreshToken = await getSecureStorageItem("Dropbox-refresh-token");
  if (!refreshToken) {
    const authenticationInProgress = await getSecureStorageItem(
      "Dropbox-code-verifier"
    );
    if (!authenticationInProgress) {
      await resetTokens();
    }
    return;
  }

  const dbx = new Dropbox({
    clientId: dropboxClientId,
    refreshToken,
  });

  // refresh access token
  await dbx.checkUser({ query: "check" }).catch((error) => {
    if (error.status === 401) {
      throw new CloudFileUnauthorizedError("Dropbox");
    }
  });

  return dbx;
}

export async function requestAccessToken(code: string): Promise<void> {
  const { getSecureStorageItem, removeSecureStorageItem } = getSecureStorage();
  const codeVerifier = await getSecureStorageItem("Dropbox-code-verifier");
  await removeSecureStorageItem("Dropbox-code-verifier");

  if (!codeVerifier) {
    throw new Error("Missing code verifier");
  }

  const dbxAuth = new DropboxAuth({
    clientId: dropboxClientId,
  });

  dbxAuth.setCodeVerifier(codeVerifier);

  const response = await dbxAuth.getAccessTokenFromCode(redirectUrl, code);

  if (response.status !== 200) {
    await resetTokens();
    throw new CloudFileUnauthorizedError("Dropbox");
  }

  // @ts-ignore
  const refreshToken: string = response.result.refresh_token;
  if (!refreshToken) {
    await resetTokens();
    throw new CloudFileUnauthorizedError("Dropbox");
  }

  await setSecureStorageItem("Dropbox-refresh-token", refreshToken);
}

export async function resetTokens(): Promise<void> {
  await Promise.all([
    removeSecureStorageItem("Dropbox-code-verifier"),
    removeSecureStorageItem("Dropbox-refresh-token"),
  ]).catch((e) => void e);
}

export async function unlink(client?: Dropbox): Promise<void> {
  await Promise.all([
    client ? client.authTokenRevoke().catch((e) => void e) : Promise.resolve(),
    resetTokens(),
  ]);
}

export async function listFiles(
  opt: Omit<ListCloudFilesOptions<Dropbox>, "cloudStorage">
): Promise<ListCloudItemResult> {
  const { path, cursor, client } = opt;

  const hasPath = typeof path === "string";

  if (!hasPath && !cursor) {
    throw new Error("Either path or cursor must be defined");
  }

  const { result } = hasPath
    ? await client.filesListFolder({ path, recursive: true }).catch(handleError)
    : await client
        .filesListFolderContinue({ cursor: cursor! })
        .catch(handleError);

  return {
    items: result.entries
      .filter(
        (e) =>
          !!e.path_lower && (e[".tag"] === "folder" || e[".tag"] === "file")
      )
      .map((e) => {
        if (e[".tag"] === "folder") {
          return {
            name: e.name,
            path: e.path_lower as string,
            type: "folder",
          };
        } else if (e[".tag"] === "file") {
          return {
            name: e.name,
            path: e.path_lower as string,
            rev: e.rev,
            type: "file",
          };
        } else {
          throw new Error(`Cannot map cloud item with path "${e.path_lower}"`);
        }
      }),
    cursor: result.cursor,
    hasMore: result.has_more,
  };
}

export async function getFileMetaData(
  opt: Omit<FileMetaDataOptions<Dropbox>, "cloudStorage">
): Promise<CloudFile> {
  const { path, client } = opt;

  const { result: item } = await client
    .filesGetMetadata({ path })
    .catch(handleError);

  if (item[".tag"] !== "file") {
    throw new Error(`Cloud item with path "${path}" is not a file`);
  }

  if (!item.path_lower) {
    throw new Error(`File with path "${path}" not mounted`);
  }

  return {
    name: item.name,
    path: item.path_lower,
    rev: item.rev,
    type: "file",
  };
}

export async function downloadFile(
  opt: Omit<DownloadFileOptions<Dropbox>, "cloudStorage">
): Promise<string> {
  const { filePath, client } = opt;

  const res = await client
    .filesDownload({
      path: filePath,
    })
    .catch(handleError);

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.onabort = reject;
    // @ts-ignore
    reader.readAsText(res.result.fileBlob);
  });
}

export async function uploadFile(
  opt: Omit<UploadFileOptions<Dropbox>, "cloudStorage" | "archive">
): Promise<CloudFile> {
  const { filePath, text, client } = opt;
  const dropboxPath = filePath.startsWith("/") ? filePath : `/${filePath}`;
  const {
    result: { name, path_lower, rev },
  } = await client
    .filesUpload({
      path: dropboxPath,
      contents: text,
      mode: { ".tag": "overwrite" },
    })
    .catch(handleError);
  return {
    name,
    path: path_lower!,
    rev: rev,
    type: "file",
  };
}

export async function deleteFile(opt: DeleteFileOptionsInternal<Dropbox>) {
  const { filePath, client } = opt;
  await client.filesDeleteV2({ path: filePath }).catch(handleError);
}

export async function syncFile(
  opt: SyncFileOptionsInternal<Dropbox>
): Promise<SyncFileResult> {
  const { localVersion, localContent, client } = opt;

  const serverVersion = await getFileMetaData({
    path: localVersion.path,
    client,
  }).catch((error) => {
    if (!(error instanceof CloudFileNotFoundError)) {
      throw error;
    }
  });

  // create file on Dropbox
  if (!serverVersion) {
    const cloudFile = await uploadFile({
      filePath: localVersion.path,
      text: localContent,
      client,
    });
    return {
      type: "local",
      cloudFile,
    };
  }

  const localContentHash = generateContentHash(localContent);

  // no action needed
  if (
    localVersion.rev === serverVersion.rev &&
    localContentHash === serverVersion.contentHash
  ) {
    return;
  }

  // update server file
  if (
    localVersion.rev === serverVersion.rev &&
    localContentHash !== serverVersion.contentHash
  ) {
    const cloudFile = await uploadFile({
      filePath: localVersion.path,
      text: localContent,
      client,
    });
    return {
      type: "local",
      cloudFile,
    };
  }

  // use server file
  if (localVersion.rev !== serverVersion.rev) {
    const content = await downloadFile({
      filePath: serverVersion.path,
      client,
    });
    return {
      type: "server",
      cloudFile: serverVersion,
      content,
    };
  }
}

async function handleError(error: any): Promise<never> {
  if (error.status === 401) {
    await resetTokens();
    throw new CloudFileUnauthorizedError("Dropbox");
  } else if (
    error.status === 404 ||
    error.error?.error_summary?.includes("path/not_found")
  ) {
    throw new CloudFileNotFoundError();
  }
  throw error;
}
