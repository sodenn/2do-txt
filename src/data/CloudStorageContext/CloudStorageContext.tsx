import StorageOutlinedIcon from "@mui/icons-material/StorageOutlined";
import { Alert, Button, CircularProgress } from "@mui/material";
import { throttle } from "lodash";
import { SnackbarKey, useSnackbar } from "notistack";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
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
  getCloudDoneFileRefByFilePath,
  getCloudFileRefByFilePath,
  getCloudFileRefs,
  getDoneFileMetaData,
  unlinkCloudDoneFile,
  unlinkCloudFile,
} from "./cloud-storage";
import {
  CloudDoneFileRef,
  CloudFileRef,
  CloudStorage,
  WithClient,
} from "./cloud-storage.types";
import {
  DeleteFileOptions,
  DownloadFileOptions,
  ExtendOptions,
  ListCloudFilesOptions,
  SyncFileOptions,
  UploadFileOptions,
} from "./CloudStorageContext.types";
import { useWebDAVDialog } from "./WebDAVDialogContext";

const platform = getPlatform();

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
  const [connectionError, setConnectionError] = useState(false);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const { connected } = useNetwork();
  const { setWebDAVDialogOpen } = useWebDAVDialog();
  const [cloudStorageClients, setCloudStorageClients] = useState(
    data.cloudStorageClients
  );
  const cloudStorageEnabled =
    ["ios", "android", "desktop"].includes(platform) ||
    import.meta.env.VITE_ENABLE_WEB_CLOUD_STORAGE === "true";
  const syncMessage = t("Sync with cloud storage", {
    cloudStorage: t("cloud storage"),
  });

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
        setAuthError(false);
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

  const openConnectionErrorAlert = useCallback(
    (error: any) => {
      // Don't annoy the user, so only show the message once
      if (!connectionError) {
        enqueueSnackbar(
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
        setConnectionError(true);
      }
    },
    [connectionError, enqueueSnackbar, t]
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
      } else {
        openConnectionErrorAlert(error);
      }
      throw error;
    },
    [openConnectionErrorAlert, openSessionExpiredAlert]
  );

  const getClient = useCallback(
    (cloudStorage: CloudStorage) => {
      if (!connected) {
        throw new Error("Network connection lost");
      }
      const client = cloudStorageClients[cloudStorage];
      if (client.status === "disconnected") {
        openSessionExpiredAlert(cloudStorage);
      } else if (client.instance) {
        return client.instance;
      } else {
        throw new Error("Client not initialized");
      }
    },
    [cloudStorageClients, connected, openSessionExpiredAlert]
  );

  const createClient = useCallback(async (cloudStorage: CloudStorage) => {
    const client = await cloud.createClient(cloudStorage);
    setCloudStorageClients((current) => ({
      ...current,
      [cloudStorage]: { instance: client, cloudStorage, status: "connected" },
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
      if (["ios", "android", "desktop"].includes(platform)) {
        await createClient(cloudStorage);
      }
    },
    [createClient, enqueueSnackbar, t]
  );

  const webDAVAuthenticate = useCallback(() => {
    setWebDAVDialogOpen(true);
  }, [setWebDAVDialogOpen]);

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

  const linkCloudFile = useCallback(
    async (cloudFile: Required<CloudFileRef>) => {
      return cloud.linkFile(cloudFile);
    },
    []
  );

  const linkCloudDoneFile = useCallback(
    async (cloudFile: Required<CloudDoneFileRef>) => {
      return cloud.linkDoneFile(cloudFile);
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
      return cloud
        .requestAccessToken({ cloudStorage, code })
        .then(() => createClient(cloudStorage))
        .then(() => openStorageConnectedAlert(cloudStorage))
        .then(() => cloudStorage)
        .catch((error) => {
          if (error instanceof CloudFileUnauthorizedError) {
            openSessionExpiredAlert(cloudStorage);
          } else {
            throw error;
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
    (opt: ListCloudFilesOptions) => {
      const client = getClient(opt.cloudStorage);
      return cloud.listFiles({ ...opt, client });
    },
    [getClient]
  );

  const downloadFile = useCallback(
    (opt: DownloadFileOptions) => {
      const { cloudStorage, cloudFilePath } = opt;
      const client = getClient(opt.cloudStorage);
      return cloud
        .downloadFile({ filePath: cloudFilePath, cloudStorage, client })
        .catch(handleError);
    },
    [getClient, handleError]
  );

  const uploadFile = useCallback(
    async ({ isDoneFile, ...opt }: UploadFileOptions) => {
      const client = getClient(opt.cloudStorage);
      if (isDoneFile) {
        const ref = await getCloudFileRefByFilePath(opt.filePath);
        if (!ref) {
          throw new Error("Missing cloud file");
        }
        return cloud
          .uploadFile({
            ...opt,
            isDoneFile,
            client,
            cloudFilePath: ref.path,
          })
          .catch(handleError);
      } else {
        return cloud
          .uploadFile({ ...opt, isDoneFile, client })
          .catch(handleError);
      }
    },
    [getClient, handleError]
  );

  const extendOptions = useCallback(
    async (opt: ExtendOptions) => {
      const { filePath, isDoneFile } = opt;
      const cloudFileRef = await getCloudFileRefByFilePath(filePath);
      const cloudDoneFileRef = await getCloudDoneFileRefByFilePath(filePath);
      const ref = isDoneFile ? cloudDoneFileRef : cloudFileRef;
      if (!ref) {
        throw new Error("No cloud file reference found");
      }
      const { cloudStorage } = ref;
      const client = cloudStorageClients[cloudStorage];
      if (client.status === "disconnected") {
        throw new Error(`${cloudStorage} client is disconnected`);
      }
      return {
        ...opt,
        client: client.instance,
        cloudFileRef,
        cloudDoneFileRef,
      };
    },
    [cloudStorageClients]
  );

  const deleteCloudFile = useCallback(
    async (opt: DeleteFileOptions) => {
      const optExt = await extendOptions(opt);
      return cloud.deleteFile(optExt);
    },
    [extendOptions]
  );

  const getFilteredSyncOptions = useCallback(
    async (optList: SyncFileOptions[]) => {
      const optFiltered: (SyncFileOptions & WithClient)[] = [];
      for (const opt of optList) {
        const ref = opt.isDoneFile
          ? await getCloudDoneFileRefByFilePath(opt.filePath)
          : await getCloudFileRefByFilePath(opt.filePath);
        if (ref) {
          const client = cloudStorageClients[ref.cloudStorage];
          if (client.status === "connected") {
            optFiltered.push({ ...opt, client: client.instance });
          }
        }
      }
      return optFiltered;
    },
    [cloudStorageClients]
  );

  const syncFile = useCallback(
    async (opt: SyncFileOptions) => {
      if (!connected) {
        throw new Error("Network connection lost");
      }

      const syncOptions = await getFilteredSyncOptions([opt]);
      if (syncOptions.length !== 1) {
        return;
      }

      let snackbar: SnackbarKey | undefined;
      if (opt.showSnackbar) {
        snackbar = enqueueSnackbar("", {
          variant: "info",
          persist: true,
          content: (
            <Alert severity="info" icon={<CircularProgress size="1em" />}>
              {syncMessage}
            </Alert>
          ),
        });
      }

      return cloud
        .syncFile(syncOptions[0])
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
      connected,
      enqueueSnackbar,
      getFilteredSyncOptions,
      handleError,
      syncMessage,
    ]
  );

  const syncAllFiles = useCallback(
    async (opt: SyncFileOptions[]) => {
      if (!connected) {
        throw new Error("Network connection lost");
      }

      const syncOptions = await getFilteredSyncOptions(opt);
      if (syncOptions.length === 0) {
        return [];
      }

      const snackbar = enqueueSnackbar("", {
        variant: "info",
        persist: true,
        content: (
          <Alert severity="info" icon={<CircularProgress size="1em" />}>
            {syncMessage}
          </Alert>
        ),
      });

      return cloud
        .syncAllFiles(syncOptions)
        .catch(handleError)
        .finally(() => closeSnackbar(snackbar));
    },
    [
      closeSnackbar,
      connected,
      enqueueSnackbar,
      getFilteredSyncOptions,
      handleError,
      syncMessage,
    ]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const syncFileThrottled = useCallback(throttle(syncFile, 5000), [
    closeSnackbar,
    connected,
    enqueueSnackbar,
    getFilteredSyncOptions,
    handleError,
    syncMessage,
  ]);

  const getCloudDoneFileMetaData = useCallback(
    async (filePath: string) => {
      const { client, cloudFileRef } = await extendOptions({
        filePath: filePath,
        isDoneFile: false,
      });
      return getDoneFileMetaData({ client, cloudFileRef });
    },
    [extendOptions]
  );

  const cloudStoragesConnectionStatus = useMemo(
    () =>
      Object.values(cloudStorageClients).reduce((prev, curr) => {
        prev[curr.cloudStorage] = curr.status === "connected";
        return prev;
      }, {} as Record<CloudStorage, boolean>),
    [cloudStorageClients]
  );

  const connectedCloudStorages = useMemo(
    () =>
      Object.entries(cloudStoragesConnectionStatus)
        .filter(([_, connected]) => connected)
        .map(([cloudStorage]) => cloudStorage as CloudStorage),
    [cloudStoragesConnectionStatus]
  );

  useEffect(() => {
    requestTokens();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    openStorageConnectedAlert,
    createClient,
    cloudStorageEnabled,
    cloudStoragesConnectionStatus,
    connectedCloudStorages,
    authenticate,
    linkCloudFile,
    linkCloudDoneFile,
    unlinkCloudStorage,
    listCloudFiles,
    downloadFile,
    uploadFile,
    deleteCloudFile,
    syncFile,
    syncAllFiles,
    syncFileThrottled,
    unlinkCloudFile,
    unlinkCloudDoneFile,
    getCloudDoneFileMetaData,
    getCloudFileRefs,
    getCloudFileRefByFilePath,
    getCloudDoneFileRefByFilePath,
  };
});
