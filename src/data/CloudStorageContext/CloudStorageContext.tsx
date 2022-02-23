import { throttle } from "lodash";
import { useSnackbar } from "notistack";
import { FC, useCallback, useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  CloudFile,
  CloudFileConflictError,
  CloudFileRef,
  CloudStorage,
  ListCloudFilesOptions,
  ListCloudFilesResult,
  SyncFileResult,
  UpdateMode,
} from "../../types/cloud-storage.types";
import { createContext } from "../../utils/Context";
import { getFilenameFromPath } from "../../utils/filesystem";
import { usePlatform } from "../../utils/platform";
import { useSecureStorage } from "../../utils/secure-storage";
import { useStorage } from "../../utils/storage";
import { useConfirmationDialog } from "../ConfirmationDialogContext";
import {
  DropboxStorageProvider,
  useDropboxStorage,
} from "./DropboxStorageContext";

export interface SyncFileOptions {
  filePath: string;
  text: string;
  fromFile?: boolean;
}

interface UploadFileOptions {
  filePath: string;
  text: string;
  mode?: UpdateMode;
}

interface ResolveConflictOptions {
  filePath: string;
  text: string;
  cloudFile: CloudFile;
}

interface ResolveConflictResult {
  text: string;
  cloudFile: CloudFileRef;
  option: "local" | "cloud";
}

const [CloudStorageProviderInternal, useCloudStorage] = createContext(() => {
  const platform = usePlatform();
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const {
    dropboxAuthenticate,
    dropboxSyncFile,
    dropboxUnlink,
    dropboxUploadFile,
    dropboxDownloadFile,
    dropboxRequestTokens,
    dropboxListFiles,
  } = useDropboxStorage();
  const [cloudStorageFileDialogOpen, setCloudStorageFileDialogOpen] =
    useState(false);
  const { getSecureStorageItem, removeSecureStorageItem } = useSecureStorage();
  const { setConfirmationDialog } = useConfirmationDialog();
  const { getStorageItem, setStorageItem, removeStorageItem } = useStorage();
  const [cloudStorage, _setCloudStorage] = useState<CloudStorage | null>(null);
  const [cloudStorageConnected, setCloudStorageConnected] = useState(false);
  const cloudStorageEnabled =
    platform === "ios" ||
    platform === "android" ||
    process.env.REACT_APP_ENABLE_WEB_CLOUD_STORAGE === "true";

  const getCloudStorage = useCallback(async () => {
    const cloudStorage = await getStorageItem("cloud-storage");
    return cloudStorage as CloudStorage | null;
  }, [getStorageItem]);

  const setCloudStorage = useCallback(
    async (value: CloudStorage | null) => {
      _setCloudStorage(value);
      if (value) {
        await setStorageItem("cloud-storage", value);
      } else {
        await removeStorageItem("cloud-storage");
      }
    },
    [removeStorageItem, setStorageItem]
  );

  const authenticate = useCallback(
    async (cloudStorage: CloudStorage) => {
      await setCloudStorage(cloudStorage);
      if (cloudStorage === "Dropbox") {
        await dropboxAuthenticate().catch(() => setCloudStorage(null));
      } else {
        await setCloudStorage(null);
        throw new Error(`Unknown cloud storage "${cloudStorage}"`);
      }
    },
    [dropboxAuthenticate, setCloudStorage]
  );

  const getCloudFileRefs = useCallback(async (): Promise<CloudFileRef[]> => {
    const cloudStorage = await getCloudStorage();
    if (!cloudStorage) {
      return [];
    }

    const cloudFilesStr = await getStorageItem(`${cloudStorage}-files`);

    if (!cloudFilesStr) {
      return [];
    }

    try {
      return JSON.parse(cloudFilesStr);
    } catch (error) {
      await setStorageItem(`${cloudStorage}-files`, JSON.stringify([]));
      return [];
    }
  }, [getCloudStorage, getStorageItem, setStorageItem]);

  const unlink = useCallback(async () => {
    const cloudStorage = await getCloudStorage();
    if (cloudStorage === "Dropbox") {
      await dropboxUnlink();
    }
    await setCloudStorage(null);
  }, [dropboxUnlink, getCloudStorage, setCloudStorage]);

  const linkFile = useCallback(
    async (cloudFile: CloudFileRef) => {
      const cloudStorage = await getCloudStorage();
      if (!cloudStorage) {
        return;
      }

      const currentCloudFiles = await getCloudFileRefs();

      const newCloudFiles = [
        ...currentCloudFiles.filter((c) => c.path !== cloudFile.path),
        { ...cloudFile },
      ];

      await setStorageItem(
        `${cloudStorage}-files`,
        JSON.stringify(newCloudFiles)
      );
    },
    [getCloudFileRefs, getCloudStorage, setStorageItem]
  );

  const uploadFile = useCallback(
    async (opt: UploadFileOptions) => {
      const { filePath, text, mode = "update" } = opt;

      const cloudStorage = await getCloudStorage();
      if (!cloudStorage) {
        throw new Error("Cloud storage is undefined");
      }

      let cloudFile: CloudFile | undefined = undefined;
      if (cloudStorage === "Dropbox") {
        cloudFile = await dropboxUploadFile({
          path: getFilenameFromPath(filePath),
          content: text,
          mode,
        });
      } else {
        throw new Error(`Unsupported cloud storage "${cloudStorage}"`);
      }

      const cloudFileRef: CloudFileRef = {
        ...cloudFile,
        localFilePath: filePath,
        lastSync: new Date().toISOString(),
      };

      await linkFile(cloudFileRef);

      return cloudFileRef;
    },
    [dropboxUploadFile, getCloudStorage, linkFile]
  );

  const getCloudFileRefByFilePath = useCallback(
    async (filePath: string) => {
      const cloudFiles = await getCloudFileRefs();
      return cloudFiles.find((c) => c.localFilePath === filePath);
    },
    [getCloudFileRefs]
  );

  const downloadFile = useCallback(
    async (cloudFilePath: string) => {
      const cloudStorage = await getCloudStorage();
      if (!cloudStorage) {
        throw new Error("Cloud storage is undefined");
      }

      let text: string | undefined = undefined;
      if (cloudStorage === "Dropbox") {
        text = await dropboxDownloadFile(cloudFilePath);
      } else {
        throw new Error(`Unsupported cloud storage "${cloudStorage}"`);
      }

      return text;
    },
    [dropboxDownloadFile, getCloudStorage]
  );

  const openResolveConflictDialog = useCallback(
    async (opt: ResolveConflictOptions) => {
      const { filePath, cloudFile } = opt;
      const cloudStorage = await getCloudStorage();
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
                const text = await downloadFile(cloudFile.path).catch(
                  (error) => {
                    enqueueSnackbar(
                      t(`The file could not be downloaded`, { cloudStorage }),
                      {
                        variant: "warning",
                      }
                    );
                    resolve(undefined);
                    throw error;
                  }
                );

                const value: CloudFileRef = {
                  ...cloudFile,
                  localFilePath: filePath,
                  lastSync: new Date().toISOString(),
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
                  text: opt.text,
                  filePath,
                });
                resolve({
                  option: "local",
                  cloudFile: value,
                  text: opt.text,
                });
              },
            },
          ],
        });
      });
    },
    [
      getCloudStorage,
      setConfirmationDialog,
      t,
      downloadFile,
      linkFile,
      enqueueSnackbar,
      uploadFile,
    ]
  );

  const uploadFileAndResolveConflict = useCallback(
    async (opt: UploadFileOptions) => {
      return uploadFile(opt).catch(async (error) => {
        if (error instanceof CloudFileConflictError) {
          const res = await openResolveConflictDialog({
            ...opt,
            cloudFile: error.data.cloudFile,
          });
          if (res) {
            return res.cloudFile;
          }
        }
      });
    },
    [openResolveConflictDialog, uploadFile]
  );

  const _syncFile = useCallback(
    async (opt: SyncFileOptions) => {
      const { filePath, text, fromFile } = opt;
      const cloudStorage = await getCloudStorage();
      try {
        const cloudFile = await getCloudFileRefByFilePath(filePath);
        if (!cloudFile) {
          return;
        }

        let syncResult: SyncFileResult = undefined;

        if (cloudStorage === "Dropbox") {
          syncResult = await dropboxSyncFile({
            localContent: text,
            localVersion: cloudFile,
            fromFile,
          });
        }

        if (!syncResult) {
          return;
        }

        if (syncResult.type === "conflict") {
          const result = await openResolveConflictDialog({
            filePath: opt.filePath,
            text: opt.text,
            cloudFile: syncResult.cloudFile,
          });
          return result?.text;
        }

        if (syncResult.type === "server") {
          await linkFile({
            ...syncResult.cloudFile,
            localFilePath: filePath,
            lastSync: new Date().toISOString(),
          });
        }

        if (syncResult.type === "local") {
          await linkFile({
            ...syncResult.cloudFile,
            localFilePath: filePath,
            lastSync: new Date().toISOString(),
          });
          return syncResult.content;
        }
      } catch (error) {
        console.debug(error);
      }
    },
    [
      dropboxSyncFile,
      getCloudFileRefByFilePath,
      getCloudStorage,
      openResolveConflictDialog,
      linkFile,
    ]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const syncFile = useCallback(throttle(_syncFile, 5000), [
    dropboxSyncFile,
    getCloudFileRefByFilePath,
    getCloudStorage,
    openResolveConflictDialog,
    linkFile,
  ]);

  const unlinkFile = useCallback(
    async (filePath: string) => {
      const cloudStorage = await getCloudStorage();
      if (!cloudStorage) {
        throw new Error("Cloud storage is undefined");
      }

      const cloudFile = await getCloudFileRefByFilePath(filePath);
      if (!cloudFile) {
        throw new Error(
          `No cloud file found for the local file path ${filePath}`
        );
      }

      const cloudFiles = await getCloudFileRefs();

      const newCloudFiles = cloudFiles.filter((c) => c.path !== cloudFile.path);
      await setStorageItem(
        `${cloudStorage}-files`,
        JSON.stringify(newCloudFiles)
      );
    },
    [
      getCloudFileRefByFilePath,
      getCloudFileRefs,
      getCloudStorage,
      setStorageItem,
    ]
  );

  const requestTokens = useCallback(
    async (authorizationCode: string) => {
      const cloudStorage = await getCloudStorage();
      if (!cloudStorage) {
        throw new Error("Cloud storage is undefined");
      }

      const codeVerifier = await getSecureStorageItem(
        `${cloudStorage}-code-verifier`
      );

      if (cloudStorage === "Dropbox" && codeVerifier) {
        await dropboxRequestTokens(codeVerifier, authorizationCode);
        setCloudStorageConnected(true);
      }

      await removeSecureStorageItem(`${cloudStorage}-code-verifier`);
    },
    [
      dropboxRequestTokens,
      getCloudStorage,
      getSecureStorageItem,
      removeSecureStorageItem,
    ]
  );

  const listFiles = useCallback(
    async (opt: ListCloudFilesOptions): Promise<ListCloudFilesResult> => {
      const cloudStorage = await getCloudStorage();
      if (!cloudStorage) {
        return { hasMore: false, items: [] };
      }

      if (cloudStorage === "Dropbox") {
        return dropboxListFiles(opt);
      } else {
        throw new Error(`Unsupported cloud storage "${cloudStorage}"`);
      }
    },
    [dropboxListFiles, getCloudStorage]
  );

  useEffect(() => {
    getStorageItem<CloudStorage>("cloud-storage").then(setCloudStorage);
  }, [getStorageItem, setCloudStorage]);

  useEffect(() => {
    if (cloudStorage) {
      getSecureStorageItem(`${cloudStorage}-refresh-token`).then(
        (refreshToken) => {
          setCloudStorageConnected(!!refreshToken);
        }
      );
    } else {
      setCloudStorageConnected(false);
    }
  }, [cloudStorage, getSecureStorageItem]);

  return {
    getCloudFileRefByFilePath,
    cloudStorage,
    cloudStorageEnabled,
    cloudStorageConnected,
    uploadFile,
    unlinkFile,
    authenticate,
    syncFile,
    unlink,
    listFiles,
    downloadFile,
    requestTokens,
    linkFile,
    getCloudFileRefs,
    uploadFileAndResolveConflict,
    cloudStorageFileDialogOpen,
    setCloudStorageFileDialogOpen,
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
