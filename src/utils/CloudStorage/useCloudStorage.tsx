import { DropboxIcon } from "@/components/DropboxIcon";
import { SnackbarActionButton, useSnackbar } from "@/components/Snackbar";
import { fileExists, getFilename, writeFile } from "@/native-api/filesystem";
import { oauth } from "@/native-api/oath";
import {
  getPreferencesItem,
  removePreferencesItem,
  setPreferencesItem,
} from "@/native-api/preferences";
import {
  removeSecureStorageItem,
  setSecureStorageItem,
} from "@/native-api/secure-storage";
import { useCloudStore } from "@/stores/cloud-store";
import { usePlatformStore } from "@/stores/platform-store";
import { useWebDAVDialogStore } from "@/stores/webdav-dialog-store";
import { getDoneFilePath } from "@/utils/todo-files";
import StorageOutlinedIcon from "@mui/icons-material/StorageOutlined";
import { ReactNode, useCallback } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
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
  Dropbox: <DropboxIcon className="mr-2 h-4 w-4" />,
  WebDAV: <StorageOutlinedIcon className="mr-2 h-4 w-4" />,
};

export function useCloudStorage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { openSnackbar, closeSnackbar } = useSnackbar();
  const platform = usePlatformStore((state) => state.platform);
  const addWebDAVStorage = useCloudStore((state) => state.addWebDAVStorage);
  const addDropboxStorage = useCloudStore((state) => state.addDropboxStorage);
  const removeStorage = useCloudStore((state) => state.removeStorage);
  const cloudStorages = useCloudStore((state) => state.cloudStorages);
  const authError = useCloudStore((state) => state.authError);
  const setAuthError = useCloudStore((state) => state.setAuthError);
  const openWebDAVDialog = useWebDAVDialogStore(
    (state) => state.openWebDAVDialog,
  );
  const cloudStorageEnabled =
    ["ios", "android", "desktop"].includes(platform) ||
    import.meta.env.VITE_ENABLE_CLOUD_STORAGE === "true";

  const getStorageByLocalPath = useCallback(
    async (path: string) => {
      const ref = await cloudStoragePreferences.getRef(path);
      const storage = cloudStorages.find(
        (storage) => storage.provider === ref.provider,
      );
      if (!storage) {
        throw new CloudStorageError({
          provider: ref.provider,
          cause: `No storage found for provider: ${ref.provider}`,
        });
      }
      return storage;
    },
    [cloudStorages],
  );

  const getStorageByProvider = useCallback(
    function <T extends Client = Client>(provider: Provider) {
      const storage = cloudStorages.find(
        (storage) => storage.provider === provider,
      );
      if (!storage) {
        throw new CloudStorageError({
          provider,
          cause: `No storage found for provider: ${provider}`,
        });
      }
      return storage as CloudStorage<T>;
    },
    [cloudStorages],
  );

  const showConnectionErrorSnackbar = useCallback(
    (error: any) => {
      return openSnackbar({
        color: "warning",
        preventDuplicate: true,
        message: (
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
        ),
      });
    },
    [openSnackbar, t],
  );

  const showSessionExpiredSnackbar = useCallback(
    (provider: Provider) => {
      // Don't annoy the user, so only show the message once
      if (!authError) {
        setAuthError(true);
        return openSnackbar({
          color: "warning",
          preventDuplicate: true,
          message: t("Session has expired. Please login again", { provider }),
          renderAction: (closeSnackbar) => (
            <>
              <SnackbarActionButton
                onClick={async () => {
                  closeSnackbar();
                  await authenticate(provider);
                  setAuthError(false);
                }}
              >
                {t("Login")}
              </SnackbarActionButton>
            </>
          ),
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [authError, closeSnackbar, openSnackbar, setAuthError, t],
  );

  const showConnectedSnackbar = useCallback(
    (provider: Provider) => {
      return openSnackbar({
        color: "success",
        preventDuplicate: true,
        message: t("Connected to cloud storage", { provider }),
      });
    },
    [openSnackbar, t],
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
    [showConnectionErrorSnackbar, showSessionExpiredSnackbar],
  );

  const list = useCallback(
    async (provider: Provider, remotePath = "", cursor?: string) => {
      const storage = getStorageByProvider(provider);
      return await storage
        .list({ path: remotePath, cursor })
        .catch(handleError);
    },
    [getStorageByProvider, handleError],
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
    [addWebDAVStorage, handleError, showConnectedSnackbar],
  );

  const createDropboxStorage = useCallback(
    async (refreshToken: string) => {
      await addDropboxStorage(refreshToken).catch(handleError);
      await setSecureStorageItem("Dropbox-refresh-token", refreshToken);
      showConnectedSnackbar("Dropbox");
    },
    [addDropboxStorage, handleError, showConnectedSnackbar],
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
        const title = t("Login to cloud storage", { provider });
        const result = await oauth({ ...options, title });
        if (provider === "Dropbox") {
          const refreshToken = await requestDropboxRefreshToken(
            options.codeVerifier,
            result.code,
          );
          await createDropboxStorage(refreshToken);
        }
      } else {
        if (provider === "Dropbox") {
          await setPreferencesItem(
            "Dropbox-code-verifier",
            options.codeVerifier,
          );
        }
        window.location.href = options.authUrl;
      }
    },
    [createDropboxStorage, t],
  );

  const authenticate = useCallback(
    async (provider: Provider) => {
      if (["Dropbox"].includes(provider)) {
        authenticateWithOauth(provider).catch(handleError);
      }
      if (provider === "WebDAV") {
        openWebDAVDialog();
      }
    },
    [authenticateWithOauth, handleError, openWebDAVDialog],
  );

  const showProgressSnackbar = useCallback(() => {
    const snackbar = openSnackbar({
      color: "primary",
      persistent: true,
      loading: true,
      close: false,
      message: t("Sync with cloud storage", {
        provider: t("cloud storage"),
      }),
    });
    return () => {
      closeSnackbar(snackbar);
    };
  }, [closeSnackbar, openSnackbar, t]);

  const downloadFile = useCallback(
    async (provider: Provider, localPath: string, remotePath: string) => {
      const storage = getStorageByProvider(provider);
      const { response, ref } = await storage
        .downloadFile({
          path: remotePath,
        })
        .catch(handleError);
      await cloudStoragePreferences.setRef(localPath, ref);
      return response.text();
    },
    [getStorageByProvider, handleError],
  );

  const getMetaData = useCallback(
    async (localPath: string) => {
      const storage = await getStorageByLocalPath(localPath);
      return storage.getMetaData({ path: localPath }).catch(handleError);
    },
    [getStorageByLocalPath, handleError],
  );

  const uploadFile = useCallback(
    async (provider: Provider, localPath: string, content: string) => {
      const storage = getStorageByProvider(provider);
      const remotePath = getFilename(localPath);
      const ref = await storage
        .uploadFile({
          path: remotePath,
          content,
        })
        .catch(handleError);
      return cloudStoragePreferences.setRef(localPath, ref);
    },
    [getStorageByProvider, handleError],
  );

  const deleteFile = useCallback(
    async (localPath: string) => {
      const ref = await cloudStoragePreferences.getRef(localPath);
      const storage = getStorageByProvider(ref.provider);
      await storage.deleteFile({ path: ref.path }).catch(handleError);
      await cloudStoragePreferences.removeRef(localPath);
    },
    [getStorageByProvider, handleError],
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
      await cloudStoragePreferences.setRef(localPath, result.ref);
      if (result.operation === "download") {
        const content = await result.response.text();
        await writeFile({
          path: localPath,
          data: content,
        });
        return content;
      }
    },
    [getStorageByLocalPath, handleError, showProgressSnackbar],
  );

  const unlinkCloudFile = useCallback(async (localPath: string) => {
    const promises: Promise<void>[] = [
      cloudStoragePreferences.removeRef(localPath),
    ];
    const doneFilePath = getDoneFilePath(localPath);
    if (doneFilePath) {
      const doneFileExists = await fileExists(doneFilePath);
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
    [removeStorage],
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
  }, [searchParams, navigate, createDropboxStorage, location.pathname]);

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
