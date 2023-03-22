import { Dropbox, DropboxAuth } from "dropbox";
import { oauth } from "../../native-api/oath";
import { getPlatform } from "../../native-api/platform";
import {
  getPreferencesItem,
  removePreferencesItem,
  setPreferencesItem,
} from "../../native-api/preferences";
import {
  getSecureStorageItem,
  removeSecureStorageItem,
  setSecureStorageItem,
} from "../../native-api/secure-storage";
import { isDateAfter, isDateBefore, isDateEqual, parseDate } from "../date";
import generateContentHash from "./ContentHasher";
import {
  CloudFileNotFoundError,
  CloudFileUnauthorizedError,
} from "./cloud-storage";
import {
  CloudFile,
  CloudStorageClient,
  DeleteFileOptionsInternal,
  DownloadFileOptions,
  FileMetaDataOptions,
  ListCloudFilesOptions,
  ListCloudItemResult,
  SyncFileOptionsInternal,
  SyncFileResult,
  UploadFileOptions,
} from "./cloud-storage.types";

const dropboxClientId = import.meta.env.VITE_DROPBOX_CLIENT_ID;

async function shouldUseInAppBrowser() {
  const platform = getPlatform();
  return ["ios", "android", "desktop"].includes(platform);
}

async function getRedirectUrl() {
  const useInAppBrowser = await shouldUseInAppBrowser();
  return useInAppBrowser
    ? "https://www.dropbox.com/1/oauth2/redirect_receiver"
    : `${window.location.origin}/dropbox`;
}

export async function authenticate(): Promise<void> {
  const dbxAuth = new DropboxAuth({
    clientId: dropboxClientId,
  });
  const useInAppBrowser = await shouldUseInAppBrowser();
  const redirectUrl = await getRedirectUrl();
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
  await setPreferencesItem("Dropbox-code-verifier", codeVerifier);

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
    const authenticationInProgress = await getPreferencesItem(
      "Dropbox-code-verifier"
    );
    if (!authenticationInProgress) {
      await resetTokens();
    }
    throw new CloudFileUnauthorizedError("Dropbox");
  }

  const dbx = new Dropbox({
    clientId: dropboxClientId,
    refreshToken,
  });

  // refresh access token
  await Promise.race([
    dbx.checkUser({ query: "check" }).catch((error) => {
      if (error.status === 401) {
        throw new CloudFileUnauthorizedError("Dropbox");
      }
    }),
    new Promise<CloudStorageClient[]>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error("The connection to Dropbox could not be established.")
          ),
        5000
      )
    ),
  ]);

  return dbx;
}

export async function requestAccessToken(code: string): Promise<void> {
  const codeVerifier = await getPreferencesItem("Dropbox-code-verifier");
  await removePreferencesItem("Dropbox-code-verifier");

  if (!codeVerifier) {
    throw new Error("Missing code verifier");
  }

  const dbxAuth = new DropboxAuth({
    clientId: dropboxClientId,
  });

  dbxAuth.setCodeVerifier(codeVerifier);

  const redirectUrl = await getRedirectUrl();
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
    removePreferencesItem("Dropbox-code-verifier"),
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
            rev: e.server_modified,
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
    rev: item.server_modified,
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
  opt: Omit<UploadFileOptions<Dropbox>, "cloudStorage" | "isDoneFile">
): Promise<CloudFile> {
  const { filePath, text, client } = opt;
  const dropboxPath = filePath.startsWith("/") ? filePath : `/${filePath}`;
  const {
    result: { name, path_lower, server_modified },
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
    rev: server_modified,
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

  const localLastModified = parseDate(localVersion.rev);
  const serverLastModified = parseDate(serverVersion.rev);
  const sameDate = isDateEqual(localLastModified, serverLastModified);
  const localDateBeforeServerDate = isDateBefore(
    localLastModified,
    serverLastModified
  );
  const localDateAfterServerDate = isDateAfter(
    localLastModified,
    serverLastModified
  );
  const sameContent =
    generateContentHash(localContent) === localVersion.contentHash;

  // no action needed
  if (localVersion.rev === serverVersion.rev && sameContent) {
    return;
  }

  // use local file and update server file
  if (
    (sameDate && !sameContent) ||
    // 👇🏽in case there is no date in localVersion.rev prop, this condition will be removed after a while
    (!localLastModified && !sameContent) ||
    localDateAfterServerDate
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
  if (localDateBeforeServerDate || !localLastModified) {
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
