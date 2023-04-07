import { CloudError, CloudStorageError, Provider } from "@cloudstorage/core";
import { WebDAVClientOptions } from "@cloudstorage/webdav";
import StorageOutlinedIcon from "@mui/icons-material/StorageOutlined";
import { Alert, Button, CircularProgress } from "@mui/material";
import { SnackbarKey, useSnackbar } from "notistack";
import { ReactNode, useCallback } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import DropboxIcon from "../../components/DropboxIcon";
import {
  getFilenameFromPath,
  isFile,
  writeFile,
} from "../../native-api/filesystem";
import { setSecureStorageItem } from "../../native-api/secure-storage";
import useCloudStorageStore from "../../stores/cloud-storage-store";
import usePlatformStore from "../../stores/platform-store";
import { getDoneFilePath } from "../todo-files";
import useTask from "../useTask";
import { cloudStoragePreferences } from "./cloud-storage-preferences";

export const cloudStorageIcons: Record<Provider, ReactNode> = {
  Dropbox: <DropboxIcon />,
  WebDAV: <StorageOutlinedIcon />,
};

export function useCloudStorage() {
  const { loadTodoFile, taskLists } = useTask();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const platform = usePlatformStore((state) => state.platform);
  const addWebDAVStorage = useCloudStorageStore(
    (state) => state.addWebDAVStorage
  );
  const addDropboxStorage = useCloudStorageStore(
    (state) => state.addDropboxStorage
  );
  const removeStorage = useCloudStorageStore((state) => state.removeStorage);
  const cloudStorages = useCloudStorageStore((state) => state.cloudStorages);
  const authError = useCloudStorageStore((state) => state.authError);
  const setAuthError = useCloudStorageStore((state) => state.setAuthError);
  const connectionError = useCloudStorageStore(
    (state) => state.connectionError
  );
  const setConnectionError = useCloudStorageStore(
    (state) => state.setConnectionError
  );
  const cloudStorageEnabled =
    ["ios", "android", "desktop"].includes(platform) ||
    import.meta.env.VITE_ENABLE_WEB_CLOUD_STORAGE === "true";

  const getStorageByLocalPath = useCallback(
    async (path: string) => {
      const ref = await cloudStoragePreferences.getRef(path);
      const storage = cloudStorages.find(
        (storage) => storage.provider === ref.provider
      );
      if (!storage) {
        throw new CloudError({
          cause: `No storage found for provider: ${ref.provider}`,
        });
      }
      return storage;
    },
    [cloudStorages]
  );

  const getStorageByProvider = useCallback(
    (provider: Provider) => {
      const storage = cloudStorages.find(
        (storage) => storage.provider === provider
      );
      if (!storage) {
        throw new CloudError({
          cause: `No storage found for provider: ${provider}`,
        });
      }
      return storage;
    },
    [cloudStorages]
  );

  const authenticate = useCallback(async (provider: Provider) => {}, []);

  const showProgressSnackbar = useCallback(() => {
    const syncMessage = t("Sync with cloud storage", {
      cloudStorage: t("cloud storage"),
    });
    const snackbar = enqueueSnackbar("", {
      variant: "info",
      persist: true,
      content: (
        <Alert severity="info" icon={<CircularProgress size="1em" />}>
          {syncMessage}
        </Alert>
      ),
    });
    return () => {
      closeSnackbar(snackbar);
    };
  }, [closeSnackbar, enqueueSnackbar, t]);

  const showSessionExpiredSnackbar = useCallback(
    (provider: Provider) => {
      const handleLogin = async (key: SnackbarKey) => {
        closeSnackbar(key);
        await authenticate(provider);
        setAuthError(false);
      };
      // Don't annoy the user, so only show the message once
      if (!authError) {
        setAuthError(true);
        return enqueueSnackbar(
          t("Session has expired. Please login again", { provider }),
          {
            variant: "warning",
            action: (key) => (
              <>
                <Button color="inherit" onClick={() => closeSnackbar(key)}>
                  {t("Close")}
                </Button>
                <Button color="inherit" onClick={() => handleLogin(key)}>
                  {t("Login")}
                </Button>
              </>
            ),
          }
        );
      }
    },
    [authError, authenticate, closeSnackbar, enqueueSnackbar, setAuthError, t]
  );

  const showConnectionErrorSnackbar = useCallback(
    (error: any) => {
      // Don't annoy the user, so only show the message once
      if (!connectionError) {
        setConnectionError(true);
        return enqueueSnackbar(
          <Trans
            i18nKey="Error connecting with cloud storage"
            values={{
              cloudStorage: t("cloud storage"),
              message: error.message,
            }}
            components={{ code: <code style={{ marginLeft: 5 }} /> }}
          />,
          { variant: "warning" }
        );
      }
    },
    [connectionError, enqueueSnackbar, setConnectionError, t]
  );

  const showConnectedSnackbar = useCallback(
    (provider: Provider) => {
      return enqueueSnackbar(t("Connected to cloud storage", { provider }), {
        variant: "success",
      });
    },
    [enqueueSnackbar, t]
  );

  const handleError = useCallback(
    (error: any) => {
      if (error instanceof CloudStorageError && error.type === "Unauthorized") {
        const provider = error.provider;
        showSessionExpiredSnackbar(provider);
      } else {
        showConnectionErrorSnackbar(error);
      }
      throw error;
    },
    [showConnectionErrorSnackbar, showSessionExpiredSnackbar]
  );

  const downloadFile = useCallback(
    async (localPath: string, remotePath: string, provider: Provider) => {
      const storage = await getStorageByProvider(provider);
      const { content, ref } = await storage
        .downloadFile({
          path: remotePath,
          format: "text",
        })
        .catch(handleError);
      await cloudStoragePreferences.setRef(localPath, ref);
      return content;
    },
    [getStorageByProvider, handleError]
  );

  const getMetaData = useCallback(
    async (localPath: string) => {
      const storage = await getStorageByLocalPath(localPath);
      return storage.getMetaData({ path: localPath });
    },
    [getStorageByLocalPath]
  );

  const uploadFile = async (
    localPath: string,
    content: string,
    provider: Provider
  ) => {
    const storage = getStorageByProvider(provider);
    const remotePath = getFilenameFromPath(localPath);
    const ref = await storage
      .uploadFile({
        path: remotePath,
        content,
      })
      .catch(handleError);
    await cloudStoragePreferences.setRef(localPath, ref);
    return ref;
  };

  const deleteFile = useCallback(
    async (localPath: string) => {
      const storage = await getStorageByLocalPath(localPath);
      await storage.deleteFile({ path: localPath }).catch(handleError);
      await cloudStoragePreferences.removeRef(localPath);
    },
    [getStorageByLocalPath, handleError]
  );

  const syncFile = useCallback(
    async (localPath: string, content = "", showProgress = true) => {
      const ref = await cloudStoragePreferences.getRef(localPath);
      const storage = await getStorageByLocalPath(localPath);
      const hideProgress = showProgress ? showProgressSnackbar() : undefined;
      const result = await storage
        .syncFile({ ref, content, format: "text" })
        .catch(handleError);
      if (result?.ref) {
        await cloudStoragePreferences
          .setRef(localPath, result.ref)
          .finally(() => hideProgress?.());
      }
      if (result?.direction === "download") {
        const content = result.content;
        await writeFile({
          path: localPath,
          data: content,
        });
        return content;
      }
    },
    [getStorageByLocalPath, handleError, showProgressSnackbar]
  );

  const syncTodoFile = useCallback(
    async (localPath: string, content?: string, showProgress = true) => {
      const downloadedContent = await syncFile(
        localPath,
        content,
        showProgress
      );
      if (downloadedContent) {
        return loadTodoFile(localPath, downloadedContent);
      }
    },
    [syncFile]
  );

  const unlinkCloudFile = useCallback(async (localPath: string) => {
    const promises: Promise<void>[] = [
      cloudStoragePreferences.removeRef(localPath),
    ];
    const doneFilePath = getDoneFilePath(localPath);
    if (doneFilePath) {
      const doneFileExists = await isFile(doneFilePath);
      if (doneFileExists) {
        promises.push(cloudStoragePreferences.removeRef(doneFilePath));
      }
    }
    await Promise.all(promises).catch((e) => void e);
  }, []);

  const removeCloudStorage = useCallback(
    async (provider: Provider) => {
      await removeStorage(provider);
      const refs = await cloudStoragePreferences.getRefs();
      refs.forEach((ref) => {
        if (ref.provider === provider) {
          cloudStoragePreferences.removeRef(ref.identifier);
        }
      });
    },
    [removeStorage]
  );

  const list = useCallback(
    async (provider: Provider, remotePath = "", cursor?: string) => {
      const storage = await getStorageByProvider(provider);
      return await storage
        .list({ path: remotePath, cursor })
        .catch(handleError);
    },
    [getStorageByProvider, handleError]
  );

  const createWebDAVStorage = useCallback(
    async (config: WebDAVClientOptions) => {
      await addWebDAVStorage(config);
      // test connection
      await list("WebDAV");
      const {
        baseUrl,
        basicAuth: { username, password },
      } = config;
      await Promise.all([
        setSecureStorageItem("WebDAV-url", baseUrl!),
        setSecureStorageItem("WebDAV-username", username!),
        setSecureStorageItem("WebDAV-password", password!),
      ]);
      await showConnectedSnackbar("WebDAV");
    },
    [addWebDAVStorage, list, showConnectedSnackbar]
  );

  const createDropboxStorage = useCallback(
    async (refreshToken: string) => {
      await addDropboxStorage(refreshToken);
      // test connection
      await list("WebDAV");
      await setSecureStorageItem("Dropbox-refresh-token", refreshToken);
    },
    [addDropboxStorage, list]
  );

  const requestTokens = useCallback(async () => {
    const code = searchParams.get("code");
    const provider: Provider | undefined =
      location.pathname === "/dropbox" ? "Dropbox" : undefined;
    if (code && provider) {
      navigate("/", { replace: true });
      // return cloud
      //   .requestAccessToken({ provider, code })
      //   .then(() => createClient(provider))
      //   .then(() => showConnectedSnackbar(provider))
      //   .catch(handleError);
    }
  }, [searchParams, navigate]);

  return {
    authenticate,
    cloudStorageEnabled,
    cloudStorages,
    downloadFile,
    uploadFile,
    deleteFile,
    syncFile,
    syncTodoFile,
    createWebDAVStorage,
    createDropboxStorage,
    unlinkCloudFile,
    removeCloudStorage,
    getMetaData,
    list,
    requestTokens,
    showProgressSnackbar,
    getCloudFileRef: cloudStoragePreferences.getRef,
    getCloudFileRefs: cloudStoragePreferences.getRefs,
  };
}
