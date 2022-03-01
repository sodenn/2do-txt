import { Alert, CircularProgress } from "@mui/material";
import { throttle } from "lodash";
import { SnackbarKey, useSnackbar } from "notistack";
import { FC, useCallback, useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  CloudFile,
  CloudFileConflictError,
  CloudFileRef,
  CloudFileUnauthorizedError,
  CloudStorage,
  cloudStorages,
  ListCloudFilesOptions,
  ListCloudItemResult,
  SyncFileResult,
  UpdateMode,
} from "../../types/cloud-storage.types";
import { createContext } from "../../utils/Context";
import { getFilenameFromPath } from "../../utils/filesystem";
import { usePlatform } from "../../utils/platform";
import { useSecureStorage } from "../../utils/secure-storage";
import { useStorage } from "../../utils/storage";
import { useConfirmationDialog } from "../ConfirmationDialogContext";
import { useNetwork } from "../NetworkContext";
import {
  DropboxStorageProvider,
  useDropboxStorage,
} from "./DropboxStorageContext";

export interface SyncFileOptions {
  filePath: string;
  text: string;
  showSnackbar?: boolean;
}

interface UploadFileOptions {
  filePath: string;
  text: string;
  mode?: UpdateMode;
  cloudStorage: CloudStorage;
}

interface DownloadFileOptions {
  cloudFilePath: string;
  cloudStorage: CloudStorage;
}

interface RequestTokenOptions {
  authorizationCode: string;
  cloudStorage: CloudStorage;
}

interface ResolveConflictOptions {
  filePath: string;
  text: string;
  cloudFile: CloudFile;
  cloudStorage: CloudStorage;
}

interface ResolveConflictResult {
  text: string;
  cloudFile: CloudFileRef;
  option: "local" | "cloud";
}

interface UploadFileAndResolveConflict {
  type: "conflict";
  conflict: ResolveConflictResult | undefined;
}

interface UploadFileAndResolveNoConflict {
  type: "no-conflict";
  cloudFile: CloudFileRef;
}

interface CloudFileDialogOpen {
  open: true;
  cloudStorage: CloudStorage;
}

interface CloudFileDialogClosed {
  open: false;
}

type CloudFileDialogOptions = CloudFileDialogOpen | CloudFileDialogClosed;

type UploadFileAndResolveResult =
  | UploadFileAndResolveConflict
  | UploadFileAndResolveNoConflict;

const [CloudStorageProviderInternal, useCloudStorage] = createContext(() => {
  const platform = usePlatform();
  const { t } = useTranslation();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const {
    dropboxAuthenticate,
    dropboxSyncFile,
    dropboxUnlink,
    dropboxUploadFile,
    dropboxDownloadFile,
    dropboxRequestTokens,
    dropboxListFiles,
  } = useDropboxStorage();
  const [cloudFileDialogOptions, setCloudFileDialogOptions] =
    useState<CloudFileDialogOptions>({
      open: false,
    });
  const { getSecureStorageItem, removeSecureStorageItem } = useSecureStorage();
  const { setConfirmationDialog } = useConfirmationDialog();
  const { getStorageItem, setStorageItem } = useStorage();
  const { checkNetworkStatus } = useNetwork();
  const [connectedCloudStorages, setConnectedCloudStorages] = useState<
    Record<CloudStorage, boolean>
  >({ Dropbox: false });
  const cloudStorageEnabled =
    platform === "ios" ||
    platform === "android" ||
    process.env.REACT_APP_ENABLE_WEB_CLOUD_STORAGE === "true";

  const handleError = useCallback((error) => {
    if (error instanceof CloudFileUnauthorizedError) {
      setConnectedCloudStorages((curr) => ({
        ...curr,
        [error.cloudStorage]: false,
      }));
    }
    throw error;
  }, []);

  const authenticate = useCallback(
    async (cloudStorage: CloudStorage) => {
      if (cloudStorage === "Dropbox") {
        await dropboxAuthenticate();
      } else {
        throw new Error(`Unknown cloud storage "${cloudStorage}"`);
      }
      setConnectedCloudStorages((curr) => ({
        ...curr,
        [cloudStorage]: true,
      }));
    },
    [dropboxAuthenticate]
  );

  const getCloudFileRefs = useCallback(async (): Promise<CloudFileRef[]> => {
    const cloudFilesStr = await getStorageItem("cloud-files");

    if (!cloudFilesStr) {
      return [];
    }

    try {
      return JSON.parse(cloudFilesStr);
    } catch (error) {
      await setStorageItem("cloud-files", JSON.stringify([]));
      return [];
    }
  }, [getStorageItem, setStorageItem]);

  const unlink = useCallback(
    async (cloudStorage: CloudStorage) => {
      if (cloudStorage === "Dropbox") {
        await dropboxUnlink();
      }

      setConnectedCloudStorages((curr) => ({
        ...curr,
        [cloudStorage]: false,
      }));

      const cloudFiles = await getCloudFileRefs();
      await setStorageItem(
        "cloud-files",
        JSON.stringify(
          cloudFiles.filter(
            (cloudFile) => cloudFile.cloudStorage !== cloudStorage
          )
        )
      );
    },
    [dropboxUnlink, getCloudFileRefs, setStorageItem]
  );

  const linkFile = useCallback(
    async (cloudFile: CloudFileRef) => {
      const currentCloudFiles = await getCloudFileRefs();

      const newCloudFiles = [
        ...currentCloudFiles.filter((c) => c.path !== cloudFile.path),
        { ...cloudFile },
      ];

      await setStorageItem("cloud-files", JSON.stringify(newCloudFiles));
    },
    [getCloudFileRefs, setStorageItem]
  );

  const uploadFile = useCallback(
    async (opt: UploadFileOptions) => {
      const { filePath, text, mode = "update", cloudStorage } = opt;

      let cloudFile: CloudFile | undefined = undefined;
      if (cloudStorage === "Dropbox") {
        cloudFile = await dropboxUploadFile({
          path: getFilenameFromPath(filePath),
          content: text,
          mode,
        }).catch(handleError);
      } else {
        throw new Error(`Unsupported cloud storage "${cloudStorage}"`);
      }

      const cloudFileRef: CloudFileRef = {
        ...cloudFile,
        localFilePath: filePath,
        lastSync: new Date().toISOString(),
        cloudStorage,
      };

      await linkFile(cloudFileRef);

      return cloudFileRef;
    },
    [dropboxUploadFile, handleError, linkFile]
  );

  const getCloudFileRefByFilePath = useCallback(
    async (filePath: string) => {
      const cloudFiles = await getCloudFileRefs();
      return cloudFiles.find((c) => c.localFilePath === filePath);
    },
    [getCloudFileRefs]
  );

  const downloadFile = useCallback(
    async (opt: DownloadFileOptions) => {
      const { cloudStorage, cloudFilePath } = opt;
      let text: string | undefined = undefined;
      if (cloudStorage === "Dropbox") {
        text = await dropboxDownloadFile(cloudFilePath).catch(handleError);
      } else {
        throw new Error(`Unsupported cloud storage "${cloudStorage}"`);
      }

      return text;
    },
    [dropboxDownloadFile, handleError]
  );

  const openResolveConflictDialog = useCallback(
    async (opt: ResolveConflictOptions) => {
      const { filePath, cloudFile, cloudStorage, text } = opt;
      return new Promise<ResolveConflictResult | undefined>((resolve) => {
        setConfirmationDialog({
          onClose: () => resolve(undefined),
          title: t("Resolve file conflict"),
          content: (
            <Trans
              i18nKey="The file already exists"
              values={{ cloudStorage }}
            />
          ),
          buttons: [
            {
              text: t("Cancel"),
              handler: () => resolve(undefined),
            },
            {
              text: cloudStorage!,
              handler: async () => {
                const text = await downloadFile({
                  cloudFilePath: cloudFile.path,
                  cloudStorage,
                }).catch((error) => {
                  enqueueSnackbar(
                    t(`The file could not be downloaded`, { cloudStorage }),
                    {
                      variant: "warning",
                    }
                  );
                  resolve(undefined);
                  throw error;
                });

                const value: CloudFileRef = {
                  ...cloudFile,
                  localFilePath: filePath,
                  lastSync: new Date().toISOString(),
                  cloudStorage,
                };

                await linkFile(value);

                resolve({
                  option: "cloud",
                  cloudFile: value,
                  text: text,
                });
              },
            },
            {
              text: t("Local"),
              handler: async () => {
                const value = await uploadFile({
                  text,
                  filePath,
                  cloudStorage,
                });
                resolve({
                  option: "local",
                  cloudFile: value,
                  text,
                });
              },
            },
          ],
        });
      });
    },
    [
      setConfirmationDialog,
      t,
      downloadFile,
      linkFile,
      enqueueSnackbar,
      uploadFile,
    ]
  );

  const uploadFileAndResolveConflict = useCallback(
    async (opt: UploadFileOptions): Promise<UploadFileAndResolveResult> => {
      return uploadFile(opt)
        .then((cloudFile) => {
          const result: UploadFileAndResolveResult = {
            type: "no-conflict",
            cloudFile,
          };
          return result;
        })
        .catch(async (error) => {
          if (error instanceof CloudFileConflictError) {
            const conflict = await openResolveConflictDialog({
              ...opt,
              cloudFile: error.data.cloudFile,
            });
            return {
              type: "conflict",
              conflict,
            };
          }
          throw error;
        });
    },
    [openResolveConflictDialog, uploadFile]
  );

  const syncFile = useCallback(
    async (opt: SyncFileOptions) => {
      const { filePath, text, showSnackbar } = opt;

      const cloudFile = await getCloudFileRefByFilePath(filePath);
      if (!cloudFile) {
        return;
      }

      const { cloudStorage } = cloudFile;

      await checkNetworkStatus(cloudStorage);

      let snackbar: SnackbarKey | undefined;
      if (showSnackbar) {
        snackbar = enqueueSnackbar("", {
          variant: "info",
          preventDuplicate: true,
          persist: true,
          content: (
            <Alert severity="info" icon={<CircularProgress size="1em" />}>
              {t("Sync with cloud storage")}
            </Alert>
          ),
        });
      }

      try {
        let syncResult: SyncFileResult = undefined;
        if (cloudStorage === "Dropbox") {
          syncResult = await dropboxSyncFile({
            localContent: text,
            localVersion: cloudFile,
          }).catch(handleError);
        }

        if (!syncResult) {
          return;
        }

        if (syncResult.type === "conflict") {
          const result = await openResolveConflictDialog({
            filePath: opt.filePath,
            text: opt.text,
            cloudFile: syncResult.cloudFile,
            cloudStorage,
          });
          return result?.text;
        }

        if (syncResult.type === "server") {
          await linkFile({
            ...syncResult.cloudFile,
            localFilePath: filePath,
            lastSync: new Date().toISOString(),
            cloudStorage,
          });
        }

        if (syncResult.type === "local") {
          await linkFile({
            ...syncResult.cloudFile,
            localFilePath: filePath,
            lastSync: new Date().toISOString(),
            cloudStorage,
          });
          return syncResult.content;
        }
      } catch (error) {
        console.debug(error);
      } finally {
        if (snackbar) {
          closeSnackbar(snackbar);
        }
      }
    },
    [
      getCloudFileRefByFilePath,
      checkNetworkStatus,
      enqueueSnackbar,
      dropboxSyncFile,
      handleError,
      openResolveConflictDialog,
      linkFile,
      closeSnackbar,
      t,
    ]
  );

  const syncAllFile = useCallback(
    async (opt: SyncFileOptions[]) => {
      const snackbar = enqueueSnackbar("", {
        variant: "info",
        preventDuplicate: true,
        persist: true,
        content: (
          <Alert severity="info" icon={<CircularProgress size="1em" />}>
            {t("Sync with cloud storage")}
          </Alert>
        ),
      });

      const results: { text: string; filePath: string }[] = [];
      for (const i of opt) {
        const text = await syncFile(i);
        if (text) {
          results.push({ text, filePath: i.filePath });
        }
      }

      closeSnackbar(snackbar);

      return results;
    },
    [closeSnackbar, enqueueSnackbar, syncFile, t]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const syncFileThrottled = useCallback(throttle(syncFile, 5000), [
    getCloudFileRefByFilePath,
    checkNetworkStatus,
    enqueueSnackbar,
    dropboxSyncFile,
    handleError,
    openResolveConflictDialog,
    linkFile,
    closeSnackbar,
    t,
  ]);

  const unlinkFile = useCallback(
    async (filePath: string) => {
      const cloudFile = await getCloudFileRefByFilePath(filePath);
      if (!cloudFile) {
        throw new Error(
          `No cloud file found for the local file path ${filePath}`
        );
      }

      const cloudFiles = await getCloudFileRefs();

      const newCloudFiles = cloudFiles.filter((c) => c.path !== cloudFile.path);
      await setStorageItem("cloud-files", JSON.stringify(newCloudFiles));
    },
    [getCloudFileRefByFilePath, getCloudFileRefs, setStorageItem]
  );

  const requestTokens = useCallback(
    async (opt: RequestTokenOptions) => {
      const { cloudStorage, authorizationCode } = opt;

      const codeVerifier = await getSecureStorageItem(
        `${cloudStorage}-code-verifier`
      );

      if (cloudStorage === "Dropbox" && codeVerifier) {
        await dropboxRequestTokens(codeVerifier, authorizationCode);
        setConnectedCloudStorages((curr) => ({
          ...curr,
          [cloudStorage]: true,
        }));
      }

      await removeSecureStorageItem(`${cloudStorage}-code-verifier`);
    },
    [dropboxRequestTokens, getSecureStorageItem, removeSecureStorageItem]
  );

  const listFiles = useCallback(
    async (opt: ListCloudFilesOptions): Promise<ListCloudItemResult> => {
      const { cloudStorage } = opt;
      if (cloudStorage === "Dropbox") {
        return dropboxListFiles(opt);
      } else {
        throw new Error(`Unsupported cloud storage "${cloudStorage}"`);
      }
    },
    [dropboxListFiles]
  );

  useEffect(() => {
    Promise.all(
      cloudStorages.map((cloudStorage) =>
        getSecureStorageItem(`${cloudStorage}-refresh-token`).then(
          (refreshToken) => ({ cloudStorage, connected: !!refreshToken })
        )
      )
    ).then((result) => {
      const value = result.reduce((prev, curr) => {
        prev[curr.cloudStorage] = curr.connected;
        return prev;
      }, {} as Record<CloudStorage, boolean>);
      setConnectedCloudStorages(value);
    });
  }, [getSecureStorageItem]);

  return {
    getCloudFileRefByFilePath,
    cloudStorageEnabled,
    connectedCloudStorages,
    uploadFile,
    unlinkFile,
    authenticate,
    syncAllFile,
    syncFileThrottled,
    unlink,
    listFiles,
    downloadFile,
    requestTokens,
    linkFile,
    getCloudFileRefs,
    uploadFileAndResolveConflict,
    cloudFileDialogOptions,
    setCloudFileDialogOptions,
  };
});

const CloudStorageProvider: FC = ({ children }) => {
  return (
    <DropboxStorageProvider>
      <CloudStorageProviderInternal>{children}</CloudStorageProviderInternal>
    </DropboxStorageProvider>
  );
};

export { CloudStorageProvider, useCloudStorage };
