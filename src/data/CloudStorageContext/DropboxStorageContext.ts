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
  ListCloudItemResult,
  NetworkError,
  SyncFileOptions,
  SyncFileResult,
  UploadFileOptions,
} from "../../types/cloud-storage.types";
import { createContext } from "../../utils/Context";
import { usePlatform } from "../../utils/platform";
import { getBaseUrl } from "../../utils/routing";
import { useSecureStorage } from "../../utils/secure-storage";
import DropboxContentHasher from "./DropboxContentHasher";

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

    throw new CloudFileUnauthorizedError("Dropbox");
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

    // reset current dropbox client reference, since the token used will no longer be valid
    dbxRef.current = null;

    if (platform === "ios" || platform === "android") {
      return new Promise<void>((resolve, reject) => {
        // @ts-ignore
        const ref = cordova.InAppBrowser.open(
          authUrl,
          "_blank",
          "location=yes"
        );

        const listener = async (event: any) => {
          // Ignore the dropbox authorize screen
          if (event && event.url.indexOf("oauth2/authorize") > -1) {
            return;
          }

          ref.removeEventListener("loadstart", listener);
          ref.close();

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
        };

        ref.addEventListener("loadstart", listener);
      });
    } else {
      await setSecureStorageItem("Dropbox-code-verifier", codeVerifier);
      window.location.href = authUrl;
    }
  }, [
    getRedirectUrl,
    platform,
    dropboxRequestTokens,
    dbxRef,
    setSecureStorageItem,
  ]);

  const dropboxUnlink = useCallback(async () => {
    const dbx = await getClient();
    dbx.authTokenRevoke().catch((e) => void e);
    dbxRef.current = null;
    await Promise.all([
      removeSecureStorageItem("Dropbox-code-verifier"),
      removeSecureStorageItem("Dropbox-refresh-token"),
    ]);
  }, [dbxRef, getClient, removeSecureStorageItem]);

  const dropboxListFiles = useCallback(
    async (opt: ListCloudFilesOptions): Promise<ListCloudItemResult> => {
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
          .filter(
            (e) =>
              !!e.path_lower &&
              (e[".tag"] === "folder" ||
                (e[".tag"] === "file" && !!e.content_hash))
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
                contentHash: e.content_hash as string,
                rev: e.rev,
                type: "file",
              };
            } else {
              throw new Error(
                `Cannot map cloud item with path "${e.path_lower}"`
              );
            }
          }),
        cursor: res.result.cursor,
        hasMore: res.result.has_more,
      };
    },
    [getClient, handleError]
  );

  const getFileMetaData = useCallback(
    async (path: string): Promise<CloudFile> => {
      const dbx = await getClient();

      const result = await dbx.filesGetMetadata({ path }).catch(handleError);
      const item = result.result;

      if (item[".tag"] !== "file") {
        throw new Error(`Cloud item with path "${path}" is not a file`);
      }

      if (!item.path_lower) {
        throw new Error(`File with path "${path}" not mounted`);
      }

      return {
        name: item.name,
        path: item.path_lower,
        contentHash: item.content_hash!,
        rev: item.rev,
        type: "file",
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

  const generateContentHash = useCallback((text: string) => {
    const hasher = new DropboxContentHasher();
    hasher.update(text);
    return hasher.digest();
  }, []);

  const dropboxUploadFile = useCallback(
    async (
      opt: Omit<UploadFileOptions, "cloudStorage">
    ): Promise<CloudFile> => {
      const { path, content, mode } = opt;
      const dbx = await getClient();
      const dropboxPath = path.startsWith("/") ? path : `/${path}`;
      const {
        result: { name, path_lower, content_hash, rev },
      } = await dbx
        .filesUpload({
          path: dropboxPath,
          contents: content,
          mode: mode === "create" ? { ".tag": "add" } : { ".tag": "overwrite" },
        })
        .catch(async (error) => {
          if (error.status === 409) {
            const cloudFile = await getFileMetaData(dropboxPath);
            throw new CloudFileConflictError({
              cloudFile,
              content,
            });
          } else {
            return handleError(error);
          }
        });

      return {
        name,
        path: path_lower!,
        contentHash: content_hash || generateContentHash(content),
        rev,
        type: "file",
      };
    },
    [generateContentHash, getClient, getFileMetaData, handleError]
  );

  const dropboxSyncFile = useCallback(
    async (opt: SyncFileOptions): Promise<SyncFileResult> => {
      const { localVersion, localContent } = opt;

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
          content: localContent,
          mode: "create",
        });
        return {
          type: "server",
          cloudFile,
        };
      }

      const localContentHash = generateContentHash(localContent);
      const sameLocalContentHash =
        localContentHash === localVersion.contentHash;
      const sameServerContentHash =
        localContentHash === serverVersion.contentHash;

      // no action needed
      if (localVersion.rev === serverVersion.rev && sameServerContentHash) {
        return;
      }

      // update server revision
      if (localVersion.rev === serverVersion.rev && !sameServerContentHash) {
        const cloudFile = await dropboxUploadFile({
          path: localVersion.path,
          content: localContent,
          mode: "update",
        });
        return {
          type: "server",
          cloudFile,
        };
      }

      // resolve conflict or update local revision
      if (localVersion.rev !== serverVersion.rev && !sameLocalContentHash) {
        return {
          type: "conflict",
          cloudFile: serverVersion,
          content: localContent,
        };
      } else if (localVersion.rev !== serverVersion.rev) {
        const content = await dropboxDownloadFile(serverVersion.path);
        return {
          type: "local",
          cloudFile: serverVersion,
          content,
        };
      }
    },
    [
      getFileMetaData,
      generateContentHash,
      dropboxUploadFile,
      dropboxDownloadFile,
    ]
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
