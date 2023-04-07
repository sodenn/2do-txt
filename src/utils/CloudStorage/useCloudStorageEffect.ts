import { differenceInMinutes } from "date-fns";
import { useCallback, useEffect } from "react";
import {
  CreateFileData,
  DeleteFileData,
  UpdateFileData,
  filesystemEmitter,
} from "../../native-api/filesystem";
import {
  addBecomeActiveListener,
  removeAllBecomeActiveListeners,
} from "../../native-api/platform";
import { loadTodoFiles } from "../../stores/task-state";
import { parseDate } from "../date";
import { getDoneFilePath } from "../todo-files";
import useArchivedTask from "../useArchivedTask";
import { cloudStoragePreferences } from "./cloud-storage-preferences";
import { useCloudStorage } from "./useCloudStorage";

export function useCloudStorageEffect() {
  const {
    syncTodoFile,
    showProgressSnackbar,
    requestTokens,
    getCloudFileRef,
    uploadFile,
  } = useCloudStorage();
  const { syncDoneFiles } = useArchivedTask();

  const handleCreateFile = useCallback(
    async (data: CreateFileData) => {
      const isDoneFile = data.path.endsWith("done.txt");
      if (!isDoneFile) {
        return;
      }
      const todoPath = data.path.replace(/done.txt$/, ".txt");
      const todoFileRef = await getCloudFileRef(todoPath);
      const provider = todoFileRef?.provider;
      uploadFile(data.path, data.content, provider);
    },
    [getCloudFileRef, uploadFile]
  );

  const handleUpdateFile = useCallback(
    async (data: UpdateFileData) => {
      const showProgress = !data.path.endsWith("done.txt");
      syncTodoFile(data.path, data.content, showProgress);
    },
    [syncTodoFile]
  );

  const handleDeleteFile = useCallback(async (data: DeleteFileData) => {
    await cloudStoragePreferences.removeRef(data.path);
    const donePath = getDoneFilePath(data.path);
    if (donePath) {
      await cloudStoragePreferences.removeRef(donePath);
    }
  }, []);

  const syncAllTodoFiles = useCallback(
    async (onlyWhenOutdated = false) => {
      const refs = await cloudStoragePreferences.getRefs();

      const outdated = refs.every((r) => {
        const date = parseDate(r.lastSync);
        return date && differenceInMinutes(new Date(), date) >= 2;
      });

      if (onlyWhenOutdated && !outdated) {
        return;
      }

      const { files } = await loadTodoFiles();
      const hideProgress = showProgressSnackbar();
      await Promise.all(
        files.map(async ({ filePath, text }) => syncTodoFile(filePath, text))
      ).finally(() => hideProgress?.());
      await syncDoneFiles(files.map((f) => f.filePath));
    },
    [showProgressSnackbar, syncDoneFiles, syncTodoFile]
  );

  const handleActive = useCallback(() => {
    syncAllTodoFiles(true);
  }, [syncAllTodoFiles]);

  useEffect(() => {
    syncAllTodoFiles();
    addBecomeActiveListener(handleActive);
    return () => {
      removeAllBecomeActiveListeners([handleActive]);
    };
  }, [handleActive, syncAllTodoFiles]);

  useEffect(() => {
    filesystemEmitter.on("create", handleCreateFile);
    filesystemEmitter.on("update", handleUpdateFile);
    filesystemEmitter.on("delete", handleDeleteFile);
    return () => {
      filesystemEmitter.off("create", handleCreateFile);
      filesystemEmitter.off("update", handleUpdateFile);
      filesystemEmitter.off("delete", handleDeleteFile);
    };
  }, [handleUpdateFile, handleDeleteFile, handleCreateFile]);

  useEffect(() => {
    requestTokens();
  });
}
