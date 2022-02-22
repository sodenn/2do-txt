import { InAppBrowser } from "@awesome-cordova-plugins/in-app-browser";
import { Network } from "@capacitor/network";
import { Dropbox, DropboxAuth } from "dropbox";
import { useSnackbar } from "notistack";
import { createRef, MutableRefObject, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  CloudFile,
  CloudFileConflictError,
  CloudFileNotFoundError,
  CloudFileUnauthorizedError,
  ListCloudFilesOptions,
  ListCloudFilesResult,
  NetworkError,
  SyncFileOptions,
  SyncFileResult,
  UploadFileOptions,
} from "../../types/cloud-storage.types";
import { createContext } from "../../utils/Context";
import { parseDate } from "../../utils/date";
import { usePlatform } from "../../utils/platform";
import { getBaseUrl } from "../../utils/routing";
import { useSecureStorage } from "../../utils/secure-storage";
import { useStorage } from "../../utils/storage";

const cloudStorage = "Dropbox";
const dropboxClientId = process.env.REACT_APP_DROPBOX_CLIENT_ID;
const redirectUri = "https://www.dropbox.com/1/oauth2/redirect_receiver";

export const [DropboxStorageProvider, useDropboxStorage] = createContext(() => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const {
    setSecureStorageItem,
    getSecureStorageItem,
    removeSecureStorageItem,
  } = useSecureStorage();
  const { removeStorageItem } = useStorage();
  const platform = usePlatform();
  const [connectionIssue, setConnectionIssue] = useState(false);
  const dbxRef: MutableRefObject<Dropbox | null> = createRef();

  const getRedirectUrl = useCallback(() => {
    if (platform === "ios" || platform === "android") {
      return redirectUri;
    } else {
      return getBaseUrl();
    }
  }, [platform]);

  const resetTokens = useCallback(async () => {
    await Promise.all([
      removeSecureStorageItem("Dropbox-code-verifier"),
      removeSecureStorageItem("Dropbox-refresh-token"),
    ]).catch((e) => void e);

    // Don't annoy the user, so only show the message once
    if (!connectionIssue) {
      enqueueSnackbar(
        t("Session has expired. Please login again", { cloudStorage }),
        { variant: "warning" }
      );
      setConnectionIssue(true);
    }

    throw new CloudFileUnauthorizedError();
  }, [enqueueSnackbar, removeSecureStorageItem, t, connectionIssue]);

  const handleError = useCallback(
    (error: any) => {
      if (error.status === 401) {
        return resetTokens();
      } else if (error.status === 404) {
        throw new CloudFileNotFoundError();
      }
      dbxRef.current = null;
      throw error;
    },
    [dbxRef, resetTokens]
  );

  const dropboxRequestTokens = useCallback(
    async (codeVerifier: string, authorizationCode: string) => {
      const dbxAuth = new DropboxAuth({
        clientId: dropboxClientId,
      });

      dbxAuth.setCodeVerifier(codeVerifier);

      const response = await dbxAuth.getAccessTokenFromCode(
        getRedirectUrl(),
        authorizationCode
      );

      if (response.status !== 200) {
        return resetTokens();
      }

      // @ts-ignore
      const refreshToken: string = response.result.refresh_token;
      if (!refreshToken) {
        return resetTokens();
      }

      await setSecureStorageItem("Dropbox-refresh-token", refreshToken);
      return { refreshToken };
    },
    [getRedirectUrl, resetTokens, setSecureStorageItem]
  );

  const getClient = useCallback(async () => {
    // check network connection
    const status = await Network.getStatus();
    if (!status.connected) {
      // Don't annoy the user, so only show the message once
      if (!connectionIssue) {
        enqueueSnackbar(
          t("Unable to connect. Check network connection", {
            cloudStorage,
          }),
          { variant: "warning" }
        );
        setConnectionIssue(true);
      }
      throw new NetworkError();
    }

    if (dbxRef.current) {
      return dbxRef.current;
    }

    const refreshToken = await getSecureStorageItem("Dropbox-refresh-token");
    if (!refreshToken) {
      return resetTokens();
    }

    const dbx = new Dropbox({
      clientId: dropboxClientId,
      refreshToken,
    });

    dbxRef.current = dbx;

    return dbx;
  }, [
    connectionIssue,
    dbxRef,
    enqueueSnackbar,
    getSecureStorageItem,
    resetTokens,
    t,
  ]);

  const dropboxAuthenticate = useCallback(async () => {
    const dbxAuth = new DropboxAuth({
      clientId: dropboxClientId,
    });

    const redirectUrl = getRedirectUrl();

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

    if (platform === "ios" || platform === "android") {
      return new Promise<void>((resolve, reject) => {
        const browser = InAppBrowser.create(authUrl, "_blank", {
          location: "yes",
        });

        const listener = browser
          .on("loadstart")
          .subscribe(async (event: any) => {
            // Ignore the dropbox authorize screen
            if (event && event.url.indexOf("oauth2/authorize") > -1) {
              return;
            }

            listener.unsubscribe();
            browser.close();

            // Check the redirect uri
            if (event.url.indexOf(redirectUrl) > -1) {
              const authorizationCode = event.url.split("=")[1].split("&")[0];
              if (authorizationCode) {
                await dropboxRequestTokens(codeVerifier, authorizationCode);
                resolve();
              } else {
                reject();
              }
            } else {
              reject();
            }
          });
      });
    } else {
      await setSecureStorageItem("Dropbox-code-verifier", codeVerifier);
      window.location.href = authUrl;
    }
  }, [getRedirectUrl, platform, dropboxRequestTokens, setSecureStorageItem]);

  const dropboxUnlink = useCallback(async () => {
    const dbx = await getClient();
    dbx.authTokenRevoke().catch((e) => void e);
    await Promise.all([
      removeStorageItem("Dropbox-files"),
      removeSecureStorageItem("Dropbox-code-verifier"),
      removeSecureStorageItem("Dropbox-refresh-token"),
    ]);
  }, [getClient, removeSecureStorageItem, removeStorageItem]);

  const dropboxListFiles = useCallback(
    async (opt: ListCloudFilesOptions): Promise<ListCloudFilesResult> => {
      const { path, cursor } = opt;

      const hasPath = typeof path === "string";

      if (!hasPath && !cursor) {
        throw new Error("Either path or cursor must be defined");
      }

      const dbx = await getClient();

      const res = hasPath
        ? await dbx
            .filesListFolder({ path, recursive: true })
            .catch(handleError)
        : await dbx
            .filesListFolderContinue({ cursor: cursor! })
            .catch(handleError);

      return {
        items: res.result.entries
          .filter((e) => !!e.path_lower)
          .map((e) => ({
            name: e.name,
            directory: e[".tag"] === "folder",
            path: e.path_lower as string,
            lastModified: (e as any).server_modified,
            rev: (e as any).rev,
          })),
        cursor: res.result.cursor,
        hasMore: res.result.has_more,
      };
    },
    [getClient, handleError]
  );

  const getFileMetaData = useCallback(
    async (path: string): Promise<CloudFile> => {
      const dbx = await getClient();

      const {
        result: { name, path_lower, ...rest },
      } = await dbx.filesGetMetadata({ path }).catch(handleError);

      if (!path_lower) {
        throw new Error("File not mounted");
      }

      return {
        name,
        path: path_lower as string,
        lastModified: (rest as any).server_modified,
        rev: (rest as any).rev,
      };
    },
    [getClient, handleError]
  );

  const dropboxDownloadFile = useCallback(
    async (path: string) => {
      const dbx = await getClient();

      const res = await dbx
        .filesDownload({
          path,
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
    },
    [getClient, handleError]
  );

  const dropboxUploadFile = useCallback(
    async (
      opt: Omit<UploadFileOptions, "cloudStorage">
    ): Promise<CloudFile> => {
      const { path, contents, mode } = opt;
      const dbx = await getClient();
      const dropboxPath = path.startsWith("/") ? path : `/${path}`;
      const {
        result: { name, path_lower, server_modified, rev },
      } = await dbx
        .filesUpload({
          path: dropboxPath,
          contents,
          mode: mode === "create" ? { ".tag": "add" } : { ".tag": "overwrite" },
        })
        .catch(async (error) => {
          if (error.status === 409) {
            const cloudFile = await getFileMetaData(dropboxPath);
            throw new CloudFileConflictError({
              cloudFile,
              contents,
            });
          } else {
            return handleError(error);
          }
        });

      return {
        name,
        path: path_lower!,
        lastModified: server_modified,
        rev,
      };
    },
    [getClient, getFileMetaData, handleError]
  );

  const dropboxSyncFile = useCallback(
    async (opt: SyncFileOptions): Promise<SyncFileResult> => {
      const { localVersion, localContents } = opt;

      const serverVersion = await getFileMetaData(localVersion.path).catch(
        (error) => {
          if (!(error instanceof CloudFileNotFoundError)) {
            throw error;
          }
        }
      );

      // re-create deleted file on Dropbox
      if (!serverVersion) {
        const cloudFile = await dropboxUploadFile({
          path: localVersion.path,
          contents: localContents,
          mode: "create",
        });
        return {
          type: "server",
          cloudFile,
        };
      }

      const localDate = parseDate(localVersion.lastModified);
      const serverDate = parseDate(serverVersion.lastModified);

      // update server revision
      const oldServerVersion =
        localDate && serverDate && localDate > serverDate;
      if (localVersion.rev === serverVersion.rev || oldServerVersion) {
        const cloudFile = await dropboxUploadFile({
          path: localVersion.path,
          contents: localContents,
          mode: "update",
        });
        return {
          type: "server",
          cloudFile,
        };
      }

      // update local revision
      const oldLocalVersion = localDate && serverDate && localDate < serverDate;
      if (oldLocalVersion && connectionIssue) {
        return {
          type: "conflict",
          cloudFile: serverVersion,
          text: localContents,
        };
      } else if (oldLocalVersion) {
        const text = await dropboxDownloadFile(serverVersion.path);
        return {
          type: "local",
          cloudFile: serverVersion,
          text,
        };
      }
    },
    [getFileMetaData, connectionIssue, dropboxUploadFile, dropboxDownloadFile]
  );

  return {
    dropboxAuthenticate,
    dropboxDownloadFile,
    dropboxListFiles,
    dropboxSyncFile,
    dropboxUploadFile,
    dropboxUnlink,
    dropboxRequestTokens,
  };
});
