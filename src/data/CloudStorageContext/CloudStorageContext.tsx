import { Alert, CircularProgress } from "@mui/material";
import { throttle } from "lodash";
import { SnackbarKey, useSnackbar } from "notistack";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  useLoaderData,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import DropboxIcon from "../../components/DropboxIcon";
import {
  CloudArchiveFileRef,
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
import { WithChildren } from "../../types/common.types";
import { createContext } from "../../utils/Context";
import {
  getArchiveFilePath,
  getFilenameFromPath,
} from "../../utils/filesystem";
import { getPlatform } from "../../utils/platform";
import {
  getPreferencesItem,
  setPreferencesItem,
} from "../../utils/preferences";
import { getSecureStorage } from "../../utils/secure-storage";
import { useConfirmationDialog } from "../ConfirmationDialogContext";
import { LoaderData } from "../loader";
import { useNetwork } from "../NetworkContext";
import {
  DropboxStorageProvider,
  useDropboxStorage,
} from "./DropboxStorageContext";

export interface SyncFileOptions {
  filePath: string;
  text: string;
  archive: boolean;
  showSnackbar?: boolean;
}

interface UploadFileOptions {
  filePath: string;
  text: string;
  mode?: UpdateMode;
  cloudStorage: CloudStorage;
  archive: boolean;
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
  cloudArchiveFile?: CloudFile;
}

interface ResolveConflictResult {
  text: string;
  ref: CloudFileRef | CloudArchiveFileRef;
  option: "local" | "cloud";
}

interface UploadFileAndResolveConflict {
  type: "conflict";
  conflict: ResolveConflictResult;
}

interface UploadFileAndResolveNoConflict {
  type: "no-conflict";
  ref: CloudFileRef | CloudArchiveFileRef;
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

const [BaseCloudStorageProvider, useCloudStorage] = createContext(() => {
  const platform = getPlatform();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const {
    dropboxInit,
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
  const { getSecureStorageItem, removeSecureStorageItem } = getSecureStorage();
  const { setConfirmationDialog } = useConfirmationDialog();
  const { checkNetworkStatus } = useNetwork();
  const initRef = useRef<Promise<void> | null>(null);
  const data = useLoaderData() as LoaderData;
  const [connectedCloudStorages, setConnectedCloudStorages] = useState<
    Record<CloudStorage, boolean>
  >(data.connectedCloudStorages);
  const cloudStorageEnabled =
    ["ios", "android", "electron"].includes(platform) ||
    import.meta.env.VITE_ENABLE_WEB_CLOUD_STORAGE === "true";

  const handleError = useCallback((error: any) => {
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
      if (["ios", "android", "electron"].includes(platform)) {
        setConnectedCloudStorages((curr) => ({
          ...curr,
          [cloudStorage]: true,
        }));
      }
    },
    [dropboxAuthenticate, platform]
  );

  const getCloudFileRefs = useCallback(async (): Promise<CloudFileRef[]> => {
    const cloudFilesStr = await getPreferencesItem("cloud-files");

    if (!cloudFilesStr) {
      return [];
    }

    try {
      return JSON.parse(cloudFilesStr);
    } catch (error) {
      await setPreferencesItem("cloud-files", JSON.stringify([]));
      return [];
    }
  }, []);

  const getCloudArchiveFileRefs = useCallback(async (): Promise<
    CloudArchiveFileRef[]
  > => {
    const cloudArchiveFilesStr = await getPreferencesItem(
      "cloud-archive-files"
    );

    if (!cloudArchiveFilesStr) {
      return [];
    }

    try {
      return JSON.parse(cloudArchiveFilesStr);
    } catch (error) {
      await setPreferencesItem("cloud-archive-files", JSON.stringify([]));
      return [];
    }
  }, []);

  const initializeCloudStorages = useCallback(async () => {
    const cloudFiles = await getCloudFileRefs();
    if (initRef.current) {
      return initRef.current;
    } else {
      const cloudStorages = cloudFiles.map((c) => c.cloudStorage);
      initRef.current = Promise.all(
        cloudStorages.map((cloudStorage) => {
          if (cloudStorage === "Dropbox") {
            return dropboxInit();
          } else {
            throw new Error(`Unknown cloud storage "${cloudStorage}"`);
          }
        })
      ).then(() => undefined);
      return initRef.current;
    }
  }, [dropboxInit, getCloudFileRefs, initRef]);

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
      await setPreferencesItem(
        "cloud-files",
        JSON.stringify(
          cloudFiles.filter(
            (cloudFile) => cloudFile.cloudStorage !== cloudStorage
          )
        )
      );
    },
    [dropboxUnlink, getCloudFileRefs]
  );

  const linkCloudFile = useCallback(
    async (cloudFile: CloudFileRef) => {
      const cloudFiles = await getCloudFileRefs();

      const newCloudFiles = [
        ...cloudFiles.filter((c) => c.path !== cloudFile.path),
        { ...cloudFile },
      ];

      await setPreferencesItem("cloud-files", JSON.stringify(newCloudFiles));
    },
    [getCloudFileRefs]
  );

  const linkCloudArchiveFile = useCallback(
    async (cloudArchiveFile: CloudArchiveFileRef) => {
      const cloudArchiveFiles = await getCloudArchiveFileRefs();

      const newArchiveCloudFiles = [
        ...cloudArchiveFiles.filter((c) => c.path !== cloudArchiveFile.path),
        { ...cloudArchiveFile },
      ];

      await setPreferencesItem(
        "cloud-archive-files",
        JSON.stringify(newArchiveCloudFiles)
      );
    },
    [getCloudArchiveFileRefs]
  );

  const getCloudFileRefByFilePath = useCallback(
    async (filePath: string) => {
      const cloudFiles = await getCloudFileRefs();
      return cloudFiles.find((c) => c.localFilePath === filePath);
    },
    [getCloudFileRefs]
  );

  const getCloudArchiveFileRefByFilePath = useCallback(
    async (filePath: string) => {
      const cloudArchiveFiles = await getCloudArchiveFileRefs();
      return cloudArchiveFiles.find((c) => c.localFilePath === filePath);
    },
    [getCloudArchiveFileRefs]
  );

  const uploadFile = useCallback(
    async (opt: UploadFileOptions) => {
      const { filePath, text, mode = "update", cloudStorage, archive } = opt;

      await initializeCloudStorages();

      if (archive) {
        const archiveFilePath = getArchiveFilePath(filePath);
        if (!archiveFilePath) {
          throw new Error(`Unable to get archive file path from "${filePath}"`);
        }

        let archiveFile: CloudFile | undefined = undefined;
        if (cloudStorage === "Dropbox") {
          archiveFile = await dropboxUploadFile({
            path: getFilenameFromPath(archiveFilePath),
            content: text,
            mode,
          }).catch(handleError);
        } else {
          throw new Error(`Unsupported cloud storage "${cloudStorage}"`);
        }

        const cloudArchiveFileRef = {
          ...archiveFile,
          localFilePath: filePath,
          cloudStorage,
        };

        await linkCloudArchiveFile(cloudArchiveFileRef);

        return cloudArchiveFileRef;
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
    [
      dropboxUploadFile,
      handleError,
      linkCloudArchiveFile,
      linkCloudFile,
      initializeCloudStorages,
    ]
  );

  const downloadFile = useCallback(
    async (opt: DownloadFileOptions) => {
      const { cloudStorage, cloudFilePath } = opt;
      await initializeCloudStorages();
      let text: string | undefined = undefined;
      if (cloudStorage === "Dropbox") {
        text = await dropboxDownloadFile(cloudFilePath).catch(handleError);
      } else {
        throw new Error(`Unsupported cloud storage "${cloudStorage}"`);
      }

      return text;
    },
    [dropboxDownloadFile, handleError, initializeCloudStorages]
  );

  const openResolveConflictDialog = useCallback(
    async (opt: ResolveConflictOptions) => {
      const { filePath, cloudFile, cloudArchiveFile, cloudStorage, text } = opt;
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
                cloudFilePath: !!cloudArchiveFile
                  ? cloudArchiveFile.path
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

              if (!!cloudArchiveFile) {
                const ref: CloudArchiveFileRef = {
                  ...cloudArchiveFile,
                  localFilePath: filePath,
                  cloudStorage,
                };
                await linkCloudArchiveFile(ref);
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
                archive: !!cloudArchiveFile,
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
                fileName: !!cloudArchiveFile
                  ? cloudArchiveFile.name
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
      linkCloudArchiveFile,
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
      const { filePath, text, showSnackbar, archive } = opt;
      const cloudFileRef = await getCloudFileRefByFilePath(filePath);
      const cloudArchiveFileRef = await getCloudArchiveFileRefByFilePath(
        filePath
      );

      const _ref = archive ? cloudArchiveFileRef : cloudFileRef;
      if (!_ref) {
        return;
      }

      const { localFilePath, cloudStorage, ...ref } = _ref;

      await checkNetworkStatus();

      await initializeCloudStorages();

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

        const newCloudFile = !archive ? syncResult.cloudFile : cloudFileRef;

        const newCloudArchiveFile = archive
          ? syncResult.cloudFile
          : cloudArchiveFileRef;

        if (syncResult.type === "conflict" && newCloudFile) {
          const result = await openResolveConflictDialog({
            filePath: opt.filePath,
            text: opt.text,
            cloudStorage,
            cloudFile: newCloudFile,
            cloudArchiveFile: newCloudArchiveFile,
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
          } else if (newCloudArchiveFile) {
            await linkCloudArchiveFile({
              ...newCloudArchiveFile,
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
      getCloudArchiveFileRefByFilePath,
      checkNetworkStatus,
      enqueueSnackbar,
      dropboxSyncFile,
      handleError,
      openResolveConflictDialog,
      linkCloudFile,
      linkCloudArchiveFile,
      closeSnackbar,
      initializeCloudStorages,
      t,
    ]
  );

  const isAuthenticationInProgress = useCallback(() => {
    if (!["ios", "android", "electron"].includes(platform)) {
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
        const ref = i.archive
          ? await getCloudArchiveFileRefByFilePath(i.filePath)
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

      await initializeCloudStorages();

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
      await Promise.all(
        optFiltered.map(async (opt) => {
          const text = await syncFile(opt);
          if (text) {
            results.push({ text, filePath: opt.filePath });
          }
        })
      );

      closeSnackbar(snackbar);

      return results;
    },
    [
      checkNetworkStatus,
      closeSnackbar,
      enqueueSnackbar,
      getCloudArchiveFileRefByFilePath,
      getCloudFileRefByFilePath,
      isAuthenticationInProgress,
      syncFile,
      initializeCloudStorages,
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
      await setPreferencesItem("cloud-files", JSON.stringify(newCloudFiles));
    },
    [getCloudFileRefByFilePath, getCloudFileRefs]
  );

  const unlinkCloudArchiveFile = useCallback(
    async (filePath: string) => {
      const archiveFile = await getCloudArchiveFileRefByFilePath(filePath);
      if (!archiveFile) {
        throw new Error(
          `No cloud archive file found for local file path "${filePath}"`
        );
      }

      const cloudArchiveFiles = await getCloudArchiveFileRefs();

      const newCloudArchiveFiles = cloudArchiveFiles.filter(
        (c) => c.path !== archiveFile.path
      );
      await setPreferencesItem(
        "cloud-archive-files",
        JSON.stringify(newCloudArchiveFiles)
      );
    },
    [getCloudArchiveFileRefByFilePath, getCloudArchiveFileRefs]
  );

  const deleteCloudFile = useCallback(
    async (filePath: string, archive = false) => {
      const cloudFileRef = await getCloudFileRefByFilePath(filePath);
      const cloudArchiveFileRef = await getCloudArchiveFileRefByFilePath(
        filePath
      );
      const ref = archive ? cloudArchiveFileRef : cloudFileRef;
      if (!ref) {
        return;
      }

      const { cloudStorage } = ref;

      await initializeCloudStorages();

      if (cloudStorage === "Dropbox") {
        if (archive) {
          await dropboxDeleteFile(ref.path);
        } else {
          await dropboxDeleteFile(ref.path);
          if (cloudArchiveFileRef) {
            await dropboxDeleteFile(cloudArchiveFileRef.path);
          }
        }
      } else {
        throw new Error(`Unsupported cloud storage "${cloudStorage}"`);
      }

      if (archive) {
        await unlinkCloudArchiveFile(filePath);
      } else {
        await unlinkCloudFile(filePath);
      }
    },
    [
      dropboxDeleteFile,
      getCloudArchiveFileRefByFilePath,
      getCloudFileRefByFilePath,
      unlinkCloudArchiveFile,
      unlinkCloudFile,
      initializeCloudStorages,
    ]
  );

  const getCloudArchiveFileMetaData = useCallback(
    async (filePath: string) => {
      const cloudFile = await getCloudFileRefByFilePath(filePath);
      if (!cloudFile) {
        return;
      }

      const { cloudStorage } = cloudFile;

      const archiveFilePath = await getArchiveFilePath(cloudFile.path);
      if (!archiveFilePath) {
        return;
      }

      await initializeCloudStorages();

      try {
        if (cloudStorage === "Dropbox") {
          const metaData = await getFileMetaData(archiveFilePath);
          return { ...metaData, cloudStorage };
        }
      } catch (error) {
        if (!(error instanceof CloudFileNotFoundError)) {
          throw error;
        }
      }
    },
    [getFileMetaData, getCloudFileRefByFilePath, initializeCloudStorages]
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
      await initializeCloudStorages();
      if (cloudStorage === "Dropbox") {
        return dropboxListFiles(opt);
      } else {
        throw new Error(`Unsupported cloud storage "${cloudStorage}"`);
      }
    },
    [dropboxListFiles, initializeCloudStorages]
  );

  useEffect(() => {
    const code = searchParams.get("code");
    const pathname = location.pathname;
    if (code && pathname === "/dropbox") {
      navigate("/", { replace: true });
      requestTokens({ cloudStorage: "Dropbox", authorizationCode: code });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    initializeCloudStorages,
    requestTokens,
    getCloudFileRefByFilePath,
    getCloudArchiveFileRefByFilePath,
    cloudStorageEnabled,
    connectedCloudStorages,
    uploadFile,
    unlinkCloudFile,
    unlinkCloudArchiveFile,
    authenticate,
    syncAllFiles,
    syncFileThrottled,
    unlinkCloudStorage,
    listCloudFiles,
    downloadFile,
    deleteCloudFile,
    linkCloudFile,
    linkCloudArchiveFile,
    getCloudArchiveFileMetaData,
    getCloudFileRefs,
    uploadFileAndResolveConflict,
    cloudFileDialogOptions,
    setCloudFileDialogOptions,
  };
});

const CloudStorageProvider = ({ children }: WithChildren) => {
  return (
    <DropboxStorageProvider>
      <BaseCloudStorageProvider>{children}</BaseCloudStorageProvider>
    </DropboxStorageProvider>
  );
};

export { CloudStorageProvider, useCloudStorage };
