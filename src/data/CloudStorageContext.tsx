import { throttle } from "lodash";
import { useCallback, useEffect, useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  CloudFile,
  CloudFileConflictError,
  CloudStorage,
  ListCloudFilesOptions,
} from "../types/cloud-storage.types";
import { createContext } from "../utils/Context";
import { useDropboxStorage } from "./CloudStorageContext/dropbox-storage";
import { getFilenameFromPath } from "../utils/filesystem";
import { usePlatform } from "../utils/platform";
import { useSecureStorage } from "../utils/secure-storage";
import { useStorage } from "../utils/storage";
import { useConfirmationDialog } from "./ConfirmationDialogContext";

interface SyncFileOptions {
  filePath: string;
  text: string;
}

interface UploadFileOptions {
  fileName: string;
  filePath: string;
  text: string;
}

export interface CloudFileRef extends CloudFile {
  localFilePath: string;
}

const [CloudStorageProvider, useCloudStorage] = createContext(() => {
  const platform = usePlatform();
  const { t } = useTranslation();
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
  const { getStorageItem, setStorageItem } = useStorage();
  const [cloudStorage, setCloudStorage] = useState<CloudStorage>();
  const [cloudStorageConnected, setCloudStorageConnected] = useState(false);
  const cloudStorageEnabled =
    platform === "ios" ||
    platform === "android" ||
    process.env.REACT_APP_ENABLE_WEB_CLOUD_STORAGE === "true";

  const getCloudStorage = useCallback(async () => {
    const cloudStorage = await getStorageItem("cloud-storage");
    return cloudStorage as CloudStorage | null;
  }, [getStorageItem]);

  const authenticate = useCallback(
    async (cloudStorage: CloudStorage) => {
      if (cloudStorage === "Dropbox") {
        await dropboxAuthenticate();
      } else {
        throw new Error(`Unknown cloud storage "${cloudStorage}"`);
      }
    },
    [dropboxAuthenticate]
  );

  const getCloudFiles = useCallback(async (): Promise<CloudFileRef[]> => {
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
  }, [dropboxUnlink, getCloudStorage]);

  const setCloudFile = useCallback(
    async (cloudFile: CloudFileRef) => {
      const cloudStorage = await getCloudStorage();
      if (!cloudStorage) {
        return;
      }

      const currentCloudFiles = await getCloudFiles();

      const newCloudFiles = [
        ...currentCloudFiles.filter((c) => c.path !== cloudFile.path),
        { ...cloudFile },
      ];

      await setStorageItem(
        `${cloudStorage}-files`,
        JSON.stringify(newCloudFiles)
      );
    },
    [getCloudFiles, getCloudStorage, setStorageItem]
  );

  const uploadFile = useCallback(
    async (opt: UploadFileOptions) => {
      const cloudStorage = await getCloudStorage();
      if (!cloudStorage) {
        return;
      }

      let cloudFile: CloudFile | undefined = undefined;
      if (cloudStorage === "Dropbox") {
        cloudFile = await dropboxUploadFile({
          path: opt.fileName,
          contents: opt.text,
          mode: "update",
        });
      }

      if (!cloudFile) {
        return;
      }

      await setCloudFile({ ...cloudFile, localFilePath: opt.filePath });

      return cloudFile;
    },
    [dropboxUploadFile, getCloudStorage, setCloudFile]
  );

  const handleSyncError = useCallback(
    async (opt: SyncFileOptions, error: any) => {
      const cloudStorage = await getCloudStorage();
      if (error instanceof CloudFileConflictError) {
        return new Promise<string | undefined>((resolve) => {
          setConfirmationDialog({
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
                  const text = await dropboxDownloadFile(
                    error.data.cloudFile.path
                  );
                  await setCloudFile({
                    ...error.data.cloudFile,
                    localFilePath: opt.filePath,
                  });
                  resolve(text);
                },
              },
              {
                text: t("Local"),
                handler: async () => {
                  await uploadFile({
                    ...opt,
                    fileName: getFilenameFromPath(opt.filePath),
                  });
                  resolve(undefined);
                },
              },
            ],
          });
        });
      }
      throw error;
    },
    [
      getCloudStorage,
      setConfirmationDialog,
      dropboxDownloadFile,
      setCloudFile,
      uploadFile,
      t,
    ]
  );

  const getCloudFileByLocalFilePath = useCallback(
    async (filePath: string) => {
      const cloudFiles = await getCloudFiles();
      return cloudFiles.find((c) => c.localFilePath === filePath);
    },
    [getCloudFiles]
  );

  const _syncFile = useCallback(
    async (opt: SyncFileOptions) => {
      const { filePath, text } = opt;
      const cloudStorage = await getCloudStorage();
      try {
        const cloudFile = await getCloudFileByLocalFilePath(filePath);
        if (!cloudFile) {
          return;
        }

        let syncResult: CloudFile | string | undefined = undefined;
        if (cloudStorage === "Dropbox") {
          syncResult = await dropboxSyncFile({
            localContents: text,
            localVersion: cloudFile,
          }).catch((error) => handleSyncError(opt, error));
        }

        if (!syncResult || typeof syncResult === "string") {
          return syncResult;
        }

        if (syncResult) {
          await setCloudFile({ ...syncResult, localFilePath: filePath });
        }
      } catch (error) {
        console.debug(error);
      }
    },
    [
      dropboxSyncFile,
      getCloudFileByLocalFilePath,
      getCloudStorage,
      handleSyncError,
      setCloudFile,
    ]
  );

  const syncFile = useRef(throttle(_syncFile)).current;

  const removeCloudFile = useCallback(
    async (filePath: string) => {
      const cloudFile = await getCloudFileByLocalFilePath(filePath);
      if (!cloudFile) {
        return;
      }

      if (cloudStorage) {
        const cloudFiles = await getCloudFiles();
        const newCloudFiles = cloudFiles.filter(
          (c) => c.path !== cloudFile.path
        );
        await setStorageItem(
          `${cloudStorage}-files`,
          JSON.stringify(newCloudFiles)
        );
      }
    },
    [cloudStorage, getCloudFileByLocalFilePath, getCloudFiles, setStorageItem]
  );

  const requestTokens = useCallback(
    async (authorizationCode: string) => {
      const cloudStorage = await getCloudStorage();
      if (!cloudStorage) {
        return;
      }

      const codeVerifier = await getSecureStorageItem(
        `${cloudStorage}-code-verifier`
      );

      if (cloudStorage === "Dropbox" && codeVerifier) {
        await dropboxRequestTokens(codeVerifier, authorizationCode);
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
    async (opt: ListCloudFilesOptions) => {
      const cloudStorage = await getCloudStorage();
      if (!cloudStorage) {
        return;
      }

      if (cloudStorage === "Dropbox") {
        return dropboxListFiles(opt);
      }
    },
    [dropboxListFiles, getCloudStorage]
  );

  const downloadFile = useCallback(
    async (path: string) => {
      const cloudStorage = await getCloudStorage();
      if (!cloudStorage) {
        return;
      }

      if (cloudStorage === "Dropbox") {
        return dropboxDownloadFile(path);
      }
    },
    [dropboxDownloadFile, getCloudStorage]
  );

  useEffect(() => {
    getStorageItem("cloud-storage").then((value) => {
      if (value) {
        const cloudStorage = value as CloudStorage;
        setCloudStorage(cloudStorage);
        getSecureStorageItem(`${cloudStorage}-refresh-token`).then(
          (refreshToken) => {
            setCloudStorageConnected(!!refreshToken);
          }
        );
      } else {
        setCloudStorage(undefined);
        setCloudStorageConnected(false);
      }
    });
  }, [getSecureStorageItem, getStorageItem]);

  return {
    getCloudFileByLocalFilePath,
    cloudStorage,
    cloudStorageEnabled,
    cloudStorageConnected,
    uploadFile,
    removeCloudFile,
    authenticate,
    syncFile,
    unlink,
    listFiles,
    downloadFile,
    requestTokens,
    setCloudFile,
    cloudStorageFileDialogOpen,
    setCloudStorageFileDialogOpen,
  };
});

export { CloudStorageProvider, useCloudStorage };
