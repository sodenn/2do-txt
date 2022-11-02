import StorageOutlinedIcon from "@mui/icons-material/StorageOutlined";
import { Alert, Button, CircularProgress } from "@mui/material";
import { throttle } from "lodash";
import { SnackbarKey, useSnackbar } from "notistack";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useLoaderData,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import DropboxIcon from "../../components/DropboxIcon";
import { createContext } from "../../utils/Context";
import { getPlatform } from "../../utils/platform";
import { LoaderData } from "../loader";
import { useNetwork } from "../NetworkContext";
import * as cloud from "./cloud-storage";
import {
  CloudFileUnauthorizedError,
  getCloudArchiveFileMetaData as _getCloudArchiveFileMetaData,
  getCloudArchiveFileRefByFilePath,
  getCloudFileRefByFilePath,
  getCloudFileRefs,
  getFilteredSyncOptions,
  unlinkCloudArchiveFile,
  unlinkCloudFile,
} from "./cloud-storage";
import {
  CloudArchiveFileRef,
  CloudFileDialogOptions,
  CloudFileRef,
  CloudStorage,
  DeleteFileOptions,
  DownloadFileOptions,
  FileMetaDataOptions,
  ListCloudFilesOptions,
  SyncFileOptions,
  UploadFileOptions,
} from "./cloud-storage.types";
import { useWebDAVDialog } from "./WebDAVDialogContext";

const platform = getPlatform();

export const cloudStorages: CloudStorage[] = ["Dropbox", "WebDAV"];

export const cloudStorageIcons: Record<CloudStorage, ReactNode> = {
  Dropbox: <DropboxIcon />,
  WebDAV: <StorageOutlinedIcon />,
};

export const [CloudStorageProvider, useCloudStorage] = createContext(() => {
  const data = useLoaderData() as LoaderData;
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState(false);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const { connected } = useNetwork();
  const { setWebDAVDialog } = useWebDAVDialog();
  const [cloudStorageClients, setCloudStorageClients] = useState(
    data.cloudStorageClients
  );
  const [cloudFileDialogOptions, setCloudFileDialogOptions] =
    useState<CloudFileDialogOptions>({
      open: false,
    });
  const cloudStorageEnabled =
    ["ios", "android", "electron"].includes(platform) ||
    import.meta.env.VITE_ENABLE_WEB_CLOUD_STORAGE === "true";

  const openStorageConnectedAlert = useCallback(
    (cloudStorage: CloudStorage) => {
      enqueueSnackbar(t("Connected to cloud storage", { cloudStorage }), {
        variant: "success",
      });
    },
    [enqueueSnackbar, t]
  );

  const openSessionExpiredAlert = useCallback(
    (cloudStorage: CloudStorage) => {
      const handleLogin = async (key: SnackbarKey) => {
        closeSnackbar(key);
        await cloud.authenticate(cloudStorage);
      };
      // Don't annoy the user, so only show the message once
      if (!authError) {
        enqueueSnackbar(
          t("Session has expired. Please login again", { cloudStorage }),
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
        setAuthError(true);
      }
    },
    [authError, closeSnackbar, enqueueSnackbar, t]
  );

  const handleError = useCallback(
    (error: any) => {
      if (error instanceof CloudFileUnauthorizedError) {
        const cloudStorage = error.cloudStorage;
        setCloudStorageClients((current) => ({
          ...current,
          [cloudStorage]: { cloudStorage, status: "disconnected" },
        }));
        openSessionExpiredAlert(cloudStorage);
      }
      throw error;
    },
    [openSessionExpiredAlert]
  );

  const getClient = useCallback(
    (cloudStorage: CloudStorage) => {
      if (!connected) {
        throw new Error("Network connection lost");
      }
      const client = data.cloudStorageClients[cloudStorage];
      if (client.status === "disconnected") {
        openSessionExpiredAlert(cloudStorage);
      } else {
        return client.instance;
      }
    },
    [connected, data, openSessionExpiredAlert]
  );

  const createClient = useCallback(async (cloudStorage: CloudStorage) => {
    const client = await cloud.createClient(cloudStorage);
    setCloudStorageClients((current) => ({
      ...current,
      [cloudStorage]: { client, cloudStorage, status: "connected" },
    }));
  }, []);

  const oauth2Authenticate = useCallback(
    async (cloudStorage: CloudStorage) => {
      await cloud.authenticate(cloudStorage).catch((error) => {
        const message = error.message || "";
        if (!message.includes("Browser closed by user")) {
          console.error("Failed to authenticate with cloud storage:", message);
          enqueueSnackbar(
            t("Failed to authenticate with cloud storage", {
              cloudStorage,
            }),
            {
              variant: "error",
            }
          );
        }
        throw error;
      });
      // Note: web platform goes a different way because a redirect is used
      if (["ios", "android", "electron"].includes(platform)) {
        await createClient(cloudStorage);
      }
    },
    [createClient, enqueueSnackbar, t]
  );

  const webDAVAuthenticate = useCallback(() => {
    setWebDAVDialog({ open: true });
  }, [setWebDAVDialog]);

  const authenticate = useCallback(
    async (cloudStorage: CloudStorage) => {
      if (["Dropbox"].includes(cloudStorage)) {
        return oauth2Authenticate(cloudStorage);
      }
      if (cloudStorage === "WebDAV") {
        return webDAVAuthenticate();
      }
    },
    [oauth2Authenticate, webDAVAuthenticate]
  );

  const linkCloudFile = useCallback(async (cloudFile: CloudFileRef) => {
    return cloud.linkFile(cloudFile);
  }, []);

  const linkCloudArchiveFile = useCallback(
    async (cloudFile: CloudArchiveFileRef) => {
      return cloud.linkArchiveFile(cloudFile);
    },
    []
  );

  const unlinkCloudStorage = useCallback(
    async (cloudStorage: CloudStorage) => {
      const client = getClient(cloudStorage);
      await cloud.unlink({
        cloudStorage,
        client,
      });
      setCloudStorageClients((current) => ({
        ...current,
        [cloudStorage]: { cloudStorage, status: "disconnected" },
      }));
    },
    [getClient]
  );

  const requestTokens = useCallback(async () => {
    const code = searchParams.get("code");
    const cloudStorage: CloudStorage | undefined =
      location.pathname === "/dropbox" ? "Dropbox" : undefined;
    if (code && cloudStorage) {
      navigate("/", { replace: true });
      cloud
        .requestAccessToken({ cloudStorage, code })
        .then(() => createClient(cloudStorage))
        .then(() => openStorageConnectedAlert(cloudStorage))
        .catch((error) => {
          if (error instanceof CloudFileUnauthorizedError) {
            openSessionExpiredAlert(cloudStorage);
          }
        });
    }
  }, [
    searchParams,
    location,
    navigate,
    createClient,
    openStorageConnectedAlert,
    openSessionExpiredAlert,
  ]);

  const listCloudFiles = useCallback(
    (opt: Omit<ListCloudFilesOptions<void>, "client">) => {
      const client = getClient(opt.cloudStorage);
      return cloud.listFiles({ ...opt, client });
    },
    [getClient]
  );

  const getFileMetaData = useCallback(
    (opt: Omit<FileMetaDataOptions<void>, "client">) => {
      const client = getClient(opt.cloudStorage);
      return cloud.getFileMetaData({ ...opt, client });
    },
    [getClient]
  );

  const downloadFile = useCallback(
    (opt: Omit<DownloadFileOptions<void>, "client">) => {
      const client = getClient(opt.cloudStorage);
      return cloud.downloadFile({ ...opt, client }).catch(handleError);
    },
    [getClient, handleError]
  );

  const uploadFile = useCallback(
    (opt: Omit<UploadFileOptions, "client">) => {
      const client = getClient(opt.cloudStorage);
      return cloud.uploadFile({ ...opt, client }).catch(handleError);
    },
    [getClient, handleError]
  );

  const deleteCloudFile = useCallback(
    (opt: Omit<DeleteFileOptions, "cloudStorageClients">) => {
      return cloud.deleteFile({ ...opt, cloudStorageClients });
    },
    [cloudStorageClients]
  );

  const syncFile = useCallback(
    async (opt: Omit<SyncFileOptions, "cloudStorageClients">) => {
      const cloudFileRef = await getCloudFileRefByFilePath(opt.filePath);
      const cloudArchiveFileRef = await getCloudArchiveFileRefByFilePath(
        opt.filePath
      );
      if (!cloudFileRef && !cloudArchiveFileRef) {
        return;
      }

      if (!connected) {
        throw new Error("Network connection lost");
      }

      let snackbar: SnackbarKey | undefined;
      if (opt.showSnackbar) {
        snackbar = enqueueSnackbar("", {
          variant: "info",
          persist: true,
          content: (
            <Alert severity="info" icon={<CircularProgress size="1em" />}>
              {t("Syncing with cloud storage")}
            </Alert>
          ),
        });
      }

      return cloud
        .syncFile({
          ...opt,
          cloudStorageClients,
        })
        .catch((error) => {
          console.debug(error);
          handleError(error);
        })
        .finally(() => {
          if (snackbar) {
            closeSnackbar(snackbar);
          }
        });
    },
    [
      closeSnackbar,
      cloudStorageClients,
      connected,
      enqueueSnackbar,
      handleError,
      t,
    ]
  );

  const syncAllFiles = useCallback(
    async (opt: Omit<SyncFileOptions, "cloudStorageClients">[]) => {
      if (!connected) {
        throw new Error("Network connection lost");
      }

      const syncOptions = await getFilteredSyncOptions(
        opt.map((o) => ({ ...o, cloudStorageClients }))
      );

      if (syncOptions.length === 0) {
        return [];
      }

      const snackbar = enqueueSnackbar("", {
        variant: "info",
        persist: true,
        content: (
          <Alert severity="info" icon={<CircularProgress size="1em" />}>
            {t("Syncing with cloud storage")}
          </Alert>
        ),
      });

      const results = await cloud.syncAllFiles(syncOptions).catch(handleError);

      closeSnackbar(snackbar);

      return results;
    },
    [
      closeSnackbar,
      cloudStorageClients,
      connected,
      enqueueSnackbar,
      handleError,
      t,
    ]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const syncFileThrottled = useCallback(throttle(syncFile, 5000), [
    closeSnackbar,
    cloudStorageClients,
    connected,
    enqueueSnackbar,
    handleError,
    t,
  ]);

  const getCloudArchiveFileMetaData = useCallback(
    (filePath: string) => {
      return _getCloudArchiveFileMetaData({ filePath, cloudStorageClients });
    },
    [cloudStorageClients]
  );

  useEffect(() => {
    requestTokens().then();
  }, [requestTokens]);

  return {
    cloudStorageEnabled,
    cloudStorageClients,
    authenticate,
    linkCloudFile,
    linkCloudArchiveFile,
    unlinkCloudStorage,
    listCloudFiles,
    getFileMetaData,
    downloadFile,
    uploadFile,
    deleteCloudFile,
    syncFile,
    syncAllFiles,
    syncFileThrottled,
    unlinkCloudFile,
    unlinkCloudArchiveFile,
    getCloudArchiveFileMetaData,
    cloudFileDialogOptions,
    getCloudFileRefs,
    setCloudFileDialogOptions,
    getCloudFileRefByFilePath,
    getCloudArchiveFileRefByFilePath,
  };
});
