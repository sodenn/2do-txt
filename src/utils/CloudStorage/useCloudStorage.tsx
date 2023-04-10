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
import { oauth } from "../../native-api/oath";
import {
  getPreferencesItem,
  removePreferencesItem,
  setPreferencesItem,
} from "../../native-api/preferences";
import {
  removeSecureStorageItem,
  setSecureStorageItem,
} from "../../native-api/secure-storage";
import useCloudStorageStore from "../../stores/cloud-storage-store";
import usePlatformStore from "../../stores/platform-store";
import useWebDAVDialogStore from "../../stores/webdav-dialog-store";
import { getDoneFilePath } from "../todo-files";
import { shouldUseInAppBrowser } from "./auth";
import { getDropboxOathOptions, requestDropboxRefreshToken } from "./dropbox";
import {
  Client,
  CloudError,
  CloudStorage,
  CloudStorageError,
  Provider,
  WebDAVClientOptions,
} from "./lib";
import { cloudStoragePreferences } from "./preferences";

export const cloudStorageIcons: Record<Provider, ReactNode> = {
  Dropbox: <DropboxIcon />,
  WebDAV: <StorageOutlinedIcon />,
};

export function useCloudStorage() {
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
  const openWebDAVDialog = useWebDAVDialogStore(
    (state) => state.openWebDAVDialog
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
        throw new CloudStorageError({
          provider: ref.provider,
          cause: `No storage found for provider: ${ref.provider}`,
        });
      }
      return storage;
    },
    [cloudStorages]
  );

  const getStorageByProvider = useCallback(
    function <T extends Client = Client>(provider: Provider) {
      const storage = cloudStorages.find(
        (storage) => storage.provider === provider
      );
      if (!storage) {
        throw new CloudStorageError({
          provider,
          cause: `No storage found for provider: ${provider}`,
        });
      }
      return storage as CloudStorage<T>;
    },
    [cloudStorages]
  );

  const showConnectionErrorSnackbar = useCallback(
    (error: any) => {
      // Don't annoy the user, so only show the message once
      if (!connectionError) {
        setConnectionError(true);
        return enqueueSnackbar(
          <span>
            <Trans
              i18nKey="Error connecting with cloud storage"
              values={{
                provider: t("cloud storage"),
                message: error.message,
              }}
              components={{
                code: <code style={{ marginLeft: 5 }} />,
              }}
            />
          </span>,
          { variant: "warning" }
        );
      }
    },
    [connectionError, enqueueSnackbar, setConnectionError, t]
  );

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [authError, closeSnackbar, enqueueSnackbar, setAuthError, t]
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
      } else if (error instanceof CloudError) {
        showConnectionErrorSnackbar(error);
      }
      throw new Error(error.message);
    },
    [showConnectionErrorSnackbar, showSessionExpiredSnackbar]
  );

  const list = useCallback(
    async (provider: Provider, remotePath = "", cursor?: string) => {
      const storage = getStorageByProvider(provider);
      return await storage
        .list({ path: remotePath, cursor })
        .catch(handleError);
    },
    [getStorageByProvider, handleError]
  );

  const createWebDAVStorage = useCallback(
    async (config: WebDAVClientOptions) => {
      await addWebDAVStorage(config).catch(handleError);
      const {
        baseUrl,
        basicAuth: { username, password },
      } = config;
      await Promise.all([
        setSecureStorageItem("WebDAV-url", baseUrl!),
        setSecureStorageItem("WebDAV-username", username!),
        setSecureStorageItem("WebDAV-password", password!),
      ]);
      showConnectedSnackbar("WebDAV");
    },
    [addWebDAVStorage, handleError, showConnectedSnackbar]
  );

  const createDropboxStorage = useCallback(
    async (refreshToken: string) => {
      await addDropboxStorage(refreshToken).catch(handleError);
      await setSecureStorageItem("Dropbox-refresh-token", refreshToken);
      showConnectedSnackbar("Dropbox");
    },
    [addDropboxStorage, handleError, showConnectedSnackbar]
  );

  const authenticateWithOauth = useCallback(
    async (provider: Provider) => {
      const useInAppBrowser = shouldUseInAppBrowser();
      const options =
        provider === "Dropbox" ? await getDropboxOathOptions() : undefined;

      if (!options) {
        return;
      }

      if (useInAppBrowser) {
        const params = await oauth(options);
        if (provider === "Dropbox") {
          const refreshToken = await requestDropboxRefreshToken(
            options.codeVerifier,
            params.code
          );
          await createDropboxStorage(refreshToken);
        }
      } else {
        if (provider === "Dropbox") {
          await setPreferencesItem(
            "Dropbox-code-verifier",
            options.codeVerifier
          );
        }
        window.location.href = options.authUrl;
      }
    },
    [createDropboxStorage]
  );

  const authenticate = useCallback(
    async (provider: Provider) => {
      if (["Dropbox"].includes(provider)) {
        authenticateWithOauth(provider);
      }
      if (provider === "WebDAV") {
        openWebDAVDialog();
      }
    },
    [authenticateWithOauth, openWebDAVDialog]
  );

  const showProgressSnackbar = useCallback(() => {
    const syncMessage = t("Sync with cloud storage", {
      provider: t("cloud storage"),
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

  const downloadFile = useCallback(
    async (localPath: string, remotePath: string, provider: Provider) => {
      const storage = getStorageByProvider(provider);
      const { response, ref } = await storage
        .downloadFile({
          path: remotePath,
        })
        .catch(handleError);
      await cloudStoragePreferences.setRef(localPath, ref);
      return response.text();
    },
    [getStorageByProvider, handleError]
  );

  const getMetaData = useCallback(
    async (localPath: string) => {
      const storage = await getStorageByLocalPath(localPath);
      return storage.getMetaData({ path: localPath }).catch(handleError);
    },
    [getStorageByLocalPath, handleError]
  );

  const uploadFile = useCallback(
    async (localPath: string, content: string, provider: Provider) => {
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
    },
    [getStorageByProvider, handleError]
  );

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
        .syncFile({ ref, content })
        .catch(handleError)
        .finally(() => hideProgress?.());
      if (result.operation !== "none") {
        await cloudStoragePreferences.setRef(localPath, result.ref);
      }
      if (result.operation === "download") {
        const content = await result.response.text();
        await writeFile({
          path: localPath,
          data: content,
        });
        return content;
      }
    },
    [getStorageByLocalPath, handleError, showProgressSnackbar]
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
      if (provider === "Dropbox") {
        await removeSecureStorageItem("Dropbox-refresh-token");
      }
      if (provider === "WebDAV") {
        await Promise.all([
          removeSecureStorageItem("WebDAV-username"),
          removeSecureStorageItem("WebDAV-password"),
          removeSecureStorageItem("WebDAV-url"),
        ]);
      }
      await cloudStoragePreferences.removeRefs(provider);
    },
    [removeStorage]
  );

  const requestTokens = useCallback(async () => {
    const code = searchParams.get("code");
    const provider: Provider | undefined =
      location.pathname === "/dropbox" ? "Dropbox" : undefined;

    if (!code || !provider) {
      return;
    }

    navigate("/", { replace: true });

    if (provider === "Dropbox") {
      const codeVerifier = await getPreferencesItem("Dropbox-code-verifier");
      if (!codeVerifier) {
        throw new CloudStorageError({
          provider: "Dropbox",
          cause: "Missing code verifier",
        });
      }
      await removePreferencesItem("Dropbox-code-verifier");
      const refreshToken = await requestDropboxRefreshToken(codeVerifier, code);
      await createDropboxStorage(refreshToken);
    }
  }, [searchParams, navigate, createDropboxStorage]);

  return {
    authenticate,
    cloudStorageEnabled,
    cloudStorages,
    downloadFile,
    uploadFile,
    deleteFile,
    syncFile,
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
