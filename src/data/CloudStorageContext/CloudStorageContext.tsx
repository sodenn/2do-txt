import { Alert, CircularProgress } from "@mui/material";
import { throttle } from "lodash";
import { SnackbarKey, useSnackbar } from "notistack";
import { FC, ReactNode, useCallback, useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import DropboxIcon from "../../components/DropboxIcon";
import {
  CloudArchivalFileRef,
  CloudFile,
  CloudFileConflictError,
  CloudFileNotFoundError,
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
import {
  getArchivalFilePath,
  getFilenameFromPath,
} from "../../utils/filesystem";
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
  archival: boolean;
  showSnackbar?: boolean;
}

interface UploadFileOptions {
  filePath: string;
  text: string;
  mode?: UpdateMode;
  cloudStorage: CloudStorage;
  archival: boolean;
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
  cloudArchivalFile?: CloudFile;
}

interface ResolveConflictResult {
  text: string;
  ref: CloudFileRef | CloudArchivalFileRef;
  option: "local" | "cloud";
}

interface UploadFileAndResolveConflict {
  type: "conflict";
  conflict: ResolveConflictResult;
}

interface UploadFileAndResolveNoConflict {
  type: "no-conflict";
  ref: CloudFileRef | CloudArchivalFileRef;
}

interface CloudFileDialogOptions {
  open: boolean;
  cloudStorage?: CloudStorage;
}

type UploadFileAndResolveResult =
  | UploadFileAndResolveConflict
  | UploadFileAndResolveNoConflict
  | undefined;

export const cloudStorageIcons: Record<CloudStorage, ReactNode> = {
  Dropbox: <DropboxIcon />,
};

export const cloudStorageIconsSmall: Record<CloudStorage, ReactNode> = {
  Dropbox: <DropboxIcon fontSize="small" />,
};

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
    getFileMetaData,
    dropboxDeleteFile,
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
      if (platform === "ios" || platform === "android") {
        setConnectedCloudStorages((curr) => ({
          ...curr,
          [cloudStorage]: true,
        }));
      }
    },
    [dropboxAuthenticate, platform]
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

  const getCloudArchivalFileRefs = useCallback(async (): Promise<
    CloudArchivalFileRef[]
  > => {
    const cloudArchivalFilesStr = await getStorageItem("cloud-archival-files");

    if (!cloudArchivalFilesStr) {
      return [];
    }

    try {
      return JSON.parse(cloudArchivalFilesStr);
    } catch (error) {
      await setStorageItem("cloud-archival-files", JSON.stringify([]));
      return [];
    }
  }, [getStorageItem, setStorageItem]);

  const unlinkCloudStorage = useCallback(
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

  const linkCloudFile = useCallback(
    async (cloudFile: CloudFileRef) => {
      const cloudFiles = await getCloudFileRefs();

      const newCloudFiles = [
        ...cloudFiles.filter((c) => c.path !== cloudFile.path),
        { ...cloudFile },
      ];

      await setStorageItem("cloud-files", JSON.stringify(newCloudFiles));
    },
    [getCloudFileRefs, setStorageItem]
  );

  const linkCloudArchivalFile = useCallback(
    async (cloudArchivalFile: CloudArchivalFileRef) => {
      const cloudArchivalFiles = await getCloudArchivalFileRefs();

      const newArchivalCloudFiles = [
        ...cloudArchivalFiles.filter((c) => c.path !== cloudArchivalFile.path),
        { ...cloudArchivalFile },
      ];

      await setStorageItem(
        "cloud-archival-files",
        JSON.stringify(newArchivalCloudFiles)
      );
    },
    [getCloudArchivalFileRefs, setStorageItem]
  );

  const getCloudFileRefByFilePath = useCallback(
    async (filePath: string) => {
      const cloudFiles = await getCloudFileRefs();
      return cloudFiles.find((c) => c.localFilePath === filePath);
    },
    [getCloudFileRefs]
  );

  const getCloudArchivalFileRefByFilePath = useCallback(
    async (filePath: string) => {
      const cloudArchivalFiles = await getCloudArchivalFileRefs();
      return cloudArchivalFiles.find((c) => c.localFilePath === filePath);
    },
    [getCloudArchivalFileRefs]
  );

  const uploadFile = useCallback(
    async (opt: UploadFileOptions) => {
      const { filePath, text, mode = "update", cloudStorage, archival } = opt;

      if (archival) {
        const archivalFilePath = getArchivalFilePath(filePath);
        if (!archivalFilePath) {
          throw new Error(
            `Unable to get archival file path from "${filePath}"`
          );
        }

        let archivalFile: CloudFile | undefined = undefined;
        if (cloudStorage === "Dropbox") {
          archivalFile = await dropboxUploadFile({
            path: getFilenameFromPath(archivalFilePath),
            content: text,
            mode,
          }).catch(handleError);
        } else {
          throw new Error(`Unsupported cloud storage "${cloudStorage}"`);
        }

        const cloudArchivalFileRef = {
          ...archivalFile,
          localFilePath: filePath,
          cloudStorage,
        };

        await linkCloudArchivalFile(cloudArchivalFileRef);

        return cloudArchivalFileRef;
      } else {
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

        const cloudFileRef = {
          ...cloudFile,
          localFilePath: filePath,
          lastSync: new Date().toISOString(),
          cloudStorage,
        };

        await linkCloudFile(cloudFileRef);

        return cloudFileRef;
      }
    },
    [dropboxUploadFile, handleError, linkCloudArchivalFile, linkCloudFile]
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
      const { filePath, cloudFile, cloudArchivalFile, cloudStorage, text } =
        opt;
      return new Promise<ResolveConflictResult | undefined>((resolve) => {
        const buttons = [
          {
            text: t("Cancel"),
            handler: () => resolve(undefined),
          },
          {
            text: cloudStorage!,
            handler: async () => {
              const text = await downloadFile({
                cloudFilePath: !!cloudArchivalFile
                  ? cloudArchivalFile.path
                  : cloudFile.path,
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

              if (!!cloudArchivalFile) {
                const ref: CloudArchivalFileRef = {
                  ...cloudArchivalFile,
                  localFilePath: filePath,
                  cloudStorage,
                };
                await linkCloudArchivalFile(ref);
                resolve({
                  option: "cloud",
                  ref,
                  text: text,
                });
              } else {
                const ref: CloudFileRef = {
                  ...cloudFile,
                  localFilePath: filePath,
                  lastSync: new Date().toISOString(),
                  cloudStorage,
                };
                await linkCloudFile(ref);
                resolve({
                  option: "cloud",
                  ref,
                  text: text,
                });
              }
            },
          },
          {
            text: t("Local"),
            handler: async () => {
              const ref = await uploadFile({
                text,
                filePath,
                cloudStorage,
                archival: !!cloudArchivalFile,
              });
              resolve({
                option: "local",
                ref,
                text,
              });
            },
          },
        ];
        setConfirmationDialog({
          open: true,
          onClose: () => resolve(undefined),
          title: t("Resolve file conflict"),
          content: (
            <Trans
              i18nKey="The file already exists"
              values={{
                cloudStorage,
                fileName: !!cloudArchivalFile
                  ? cloudArchivalFile.name
                  : cloudFile.name,
              }}
            />
          ),
          buttons,
        });
      });
    },
    [
      setConfirmationDialog,
      downloadFile,
      enqueueSnackbar,
      linkCloudArchivalFile,
      linkCloudFile,
      uploadFile,
      t,
    ]
  );

  const uploadFileAndResolveConflict = useCallback(
    async (opt: UploadFileOptions): Promise<UploadFileAndResolveResult> => {
      return uploadFile(opt)
        .then((ref) => {
          const result: UploadFileAndResolveResult = {
            type: "no-conflict",
            ref,
          };
          return result;
        })
        .catch(async (error) => {
          if (error instanceof CloudFileConflictError) {
            const conflict = await openResolveConflictDialog({
              ...opt,
              cloudFile: error.data.cloudFile,
            });
            if (conflict) {
              return {
                type: "conflict",
                conflict,
              };
            }
          }
          throw error;
        });
    },
    [openResolveConflictDialog, uploadFile]
  );

  const syncFile = useCallback(
    async (opt: SyncFileOptions) => {
      const { filePath, text, showSnackbar, archival } = opt;
      const cloudFileRef = await getCloudFileRefByFilePath(filePath);
      const cloudArchivalFileRef = await getCloudArchivalFileRefByFilePath(
        filePath
      );

      const _ref = archival ? cloudArchivalFileRef : cloudFileRef;
      if (!_ref) {
        return;
      }

      const { localFilePath, cloudStorage, ...ref } = _ref;

      await checkNetworkStatus();

      let snackbar: SnackbarKey | undefined;
      if (showSnackbar) {
        snackbar = enqueueSnackbar("", {
          variant: "info",
          preventDuplicate: true,
          persist: true,
          content: (
            <Alert severity="info" icon={<CircularProgress size="1em" />}>
              {t("Syncing with cloud storage")}
            </Alert>
          ),
        });
      }

      try {
        let syncResult: SyncFileResult = undefined;
        if (cloudStorage === "Dropbox") {
          syncResult = await dropboxSyncFile({
            localContent: text,
            localVersion: ref,
          }).catch(handleError);
        }

        if (!syncResult) {
          return;
        }

        const newCloudFile = !archival ? syncResult.cloudFile : cloudFileRef;

        const newCloudArchivalFile = archival
          ? syncResult.cloudFile
          : cloudArchivalFileRef;

        if (syncResult.type === "conflict" && newCloudFile) {
          const result = await openResolveConflictDialog({
            filePath: opt.filePath,
            text: opt.text,
            cloudStorage,
            cloudFile: newCloudFile,
            cloudArchivalFile: newCloudArchivalFile,
          });
          return result?.text;
        }

        if (syncResult.type === "server" || syncResult.type === "local") {
          if (newCloudFile) {
            await linkCloudFile({
              ...newCloudFile,
              localFilePath: filePath,
              lastSync: new Date().toISOString(),
              cloudStorage,
            });
          } else if (newCloudArchivalFile) {
            await linkCloudArchivalFile({
              ...newCloudArchivalFile,
              localFilePath: filePath,
              cloudStorage,
            });
          }
        }

        if (syncResult.type === "local") {
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
      getCloudArchivalFileRefByFilePath,
      checkNetworkStatus,
      enqueueSnackbar,
      dropboxSyncFile,
      handleError,
      openResolveConflictDialog,
      linkCloudFile,
      linkCloudArchivalFile,
      closeSnackbar,
      t,
    ]
  );

  const isAuthenticationInProgress = useCallback(() => {
    if (platform !== "ios" && platform !== "android") {
      return Promise.all(
        cloudStorages.map((cloudStorage) =>
          getSecureStorageItem(`${cloudStorage}-code-verifier`)
        )
      ).then((result) => result.some((code) => !!code));
    } else {
      return false;
    }
  }, [getSecureStorageItem, platform]);

  const syncAllFiles = useCallback(
    async (opt: SyncFileOptions[]) => {
      const optFiltered: SyncFileOptions[] = [];

      for (const i of opt) {
        const ref = i.archival
          ? await getCloudArchivalFileRefByFilePath(i.filePath)
          : await getCloudFileRefByFilePath(i.filePath);
        if (ref) {
          optFiltered.push(i);
        }
      }

      if (optFiltered.length === 0) {
        return [];
      }

      await checkNetworkStatus();

      if (await isAuthenticationInProgress()) {
        return [];
      }

      const snackbar = enqueueSnackbar("", {
        variant: "info",
        preventDuplicate: true,
        persist: true,
        content: (
          <Alert severity="info" icon={<CircularProgress size="1em" />}>
            {t("Syncing with cloud storage")}
          </Alert>
        ),
      });

      const results: { text: string; filePath: string }[] = [];
      for (const i of optFiltered) {
        const text = await syncFile(i);
        if (text) {
          results.push({ text, filePath: i.filePath });
        }
      }

      closeSnackbar(snackbar);

      return results;
    },
    [
      checkNetworkStatus,
      closeSnackbar,
      enqueueSnackbar,
      getCloudArchivalFileRefByFilePath,
      getCloudFileRefByFilePath,
      isAuthenticationInProgress,
      syncFile,
      t,
    ]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const syncFileThrottled = useCallback(throttle(syncFile, 5000), [
    getCloudFileRefByFilePath,
    checkNetworkStatus,
    enqueueSnackbar,
    dropboxSyncFile,
    handleError,
    openResolveConflictDialog,
    linkCloudFile,
    closeSnackbar,
    t,
  ]);

  const unlinkCloudFile = useCallback(
    async (filePath: string) => {
      const cloudFileRef = await getCloudFileRefByFilePath(filePath);
      if (!cloudFileRef) {
        throw new Error(
          `No cloud file found for local file path "${filePath}"`
        );
      }

      const cloudFiles = await getCloudFileRefs();

      const newCloudFiles = cloudFiles.filter(
        (c) => c.path !== cloudFileRef.path
      );
      await setStorageItem("cloud-files", JSON.stringify(newCloudFiles));
    },
    [getCloudFileRefByFilePath, getCloudFileRefs, setStorageItem]
  );

  const unlinkCloudArchivalFile = useCallback(
    async (filePath: string) => {
      const archivalFile = await getCloudArchivalFileRefByFilePath(filePath);
      if (!archivalFile) {
        throw new Error(
          `No cloud archival file found for local file path "${filePath}"`
        );
      }

      const cloudArchivalFiles = await getCloudArchivalFileRefs();

      const newCloudArchivalFiles = cloudArchivalFiles.filter(
        (c) => c.path !== archivalFile.path
      );
      await setStorageItem(
        "cloud-archival-files",
        JSON.stringify(newCloudArchivalFiles)
      );
    },
    [
      getCloudArchivalFileRefByFilePath,
      getCloudArchivalFileRefs,
      setStorageItem,
    ]
  );

  const deleteCloudFile = useCallback(
    async (filePath: string, archival = false) => {
      const cloudFileRef = await getCloudFileRefByFilePath(filePath);
      const cloudArchivalFileRef = await getCloudArchivalFileRefByFilePath(
        filePath
      );
      const ref = archival ? cloudArchivalFileRef : cloudFileRef;

      if (!ref) {
        return;
      }

      const { cloudStorage } = ref;

      if (cloudStorage === "Dropbox") {
        if (archival) {
          await dropboxDeleteFile(ref.path);
        } else {
          await dropboxDeleteFile(ref.path);
          if (cloudArchivalFileRef) {
            await dropboxDeleteFile(cloudArchivalFileRef.path);
          }
        }
      } else {
        throw new Error(`Unsupported cloud storage "${cloudStorage}"`);
      }

      if (archival) {
        await unlinkCloudArchivalFile(filePath);
      } else {
        await unlinkCloudFile(filePath);
      }
    },
    [
      dropboxDeleteFile,
      getCloudArchivalFileRefByFilePath,
      getCloudFileRefByFilePath,
      unlinkCloudArchivalFile,
      unlinkCloudFile,
    ]
  );

  const getCloudArchivalFileMetaData = useCallback(
    async (filePath: string) => {
      const cloudFile = await getCloudFileRefByFilePath(filePath);
      if (!cloudFile) {
        return;
      }

      const { cloudStorage } = cloudFile;

      const archivalFilePath = await getArchivalFilePath(cloudFile.path);
      if (!archivalFilePath) {
        return;
      }

      try {
        if (cloudStorage === "Dropbox") {
          const metaData = await getFileMetaData(archivalFilePath);
          return { ...metaData, cloudStorage };
        }
      } catch (error) {
        if (!(error instanceof CloudFileNotFoundError)) {
          throw error;
        }
      }
    },
    [getFileMetaData, getCloudFileRefByFilePath]
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

  const listCloudFiles = useCallback(
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
    getCloudArchivalFileRefByFilePath,
    cloudStorageEnabled,
    connectedCloudStorages,
    uploadFile,
    unlinkCloudFile,
    unlinkCloudArchivalFile,
    authenticate,
    syncAllFiles,
    syncFileThrottled,
    unlinkCloudStorage,
    listCloudFiles,
    downloadFile,
    deleteCloudFile,
    requestTokens,
    linkCloudFile,
    linkCloudArchivalFile,
    getCloudArchivalFileMetaData,
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
