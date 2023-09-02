import {
  CreateFileData,
  DeleteFileData,
  UpdateFileData,
  filesystemEmitter,
} from "@/native-api/filesystem";
import {
  addBecomeActiveListener,
  removeAllBecomeActiveListeners,
} from "@/native-api/platform";
import { useScrollingStore } from "@/stores/scrolling-store";
import { taskLoader } from "@/stores/task-state";
import { parseDate } from "@/utils/date";
import {
  getTodoFilePathFromDoneFilePath,
  isDoneFilePath,
} from "@/utils/todo-files";
import { useArchivedTask } from "@/utils/useArchivedTask";
import { usePullToRefresh } from "@/utils/usePullToRefresh";
import { useTask } from "@/utils/useTask";
import { differenceInMinutes } from "date-fns";
import { useCallback, useEffect } from "react";
import { cloudStoragePreferences } from "./preferences";
import { useCloudStorage } from "./useCloudStorage";

export function useCloudStorageEffect() {
  const {
    syncFile,
    showProgressSnackbar,
    requestTokens,
    getCloudFileRef,
    uploadFile,
    cloudStorages,
  } = useCloudStorage();
  const { syncDoneFiles } = useArchivedTask();
  const { loadTodoFile } = useTask();
  const top = useScrollingStore((state) => state.top);

  const reloadTodoFile = useCallback(
    async (path: string, content?: string) => {
      if (content) {
        return loadTodoFile(path, content);
      }
    },
    [loadTodoFile],
  );

  const handleCreateFile = useCallback(
    async (data: CreateFileData) => {
      const isDoneFile = isDoneFilePath(data.path);
      if (!isDoneFile) {
        return;
      }
      const todoFilePath = getTodoFilePathFromDoneFilePath(data.path);
      const todoFileRef = await getCloudFileRef(todoFilePath);
      const provider = todoFileRef.provider;
      uploadFile(provider, data.path, data.content);
    },
    [getCloudFileRef, uploadFile],
  );

  const handleUpdateFile = useCallback(
    async (data: UpdateFileData) => {
      const showProgress = !data.path.endsWith("done.txt");
      syncFile(data.path, data.content, showProgress).then((content) =>
        reloadTodoFile(data.path, content),
      );
    },
    [reloadTodoFile, syncFile],
  );

  const handleDeleteFile = useCallback(async (data: DeleteFileData) => {
    const isDoneFile = isDoneFilePath(data.path);
    if (!isDoneFile) {
      await cloudStoragePreferences.removeRef(data.path);
    }
  }, []);

  const syncAllTodoFiles = useCallback(
    async (onlyWhenOutdated = false) => {
      const refs = await cloudStoragePreferences.getRefs();
      if (refs.length === 0) {
        return;
      }

      if (onlyWhenOutdated) {
        const outdated = refs.every((r) => {
          const date = parseDate(r.lastSync);
          return date && differenceInMinutes(new Date(), date) >= 2;
        });
        if (!outdated) {
          return;
        }
      }

      const {
        todoFiles: { files },
      } = await taskLoader();
      const hideProgress = showProgressSnackbar();
      await Promise.all(
        files.map(async ({ filePath, text }) =>
          syncFile(filePath, text).then((content) =>
            reloadTodoFile(filePath, content),
          ),
        ),
      ).finally(() => hideProgress?.());
      await syncDoneFiles(files.map((f) => f.filePath));
    },
    [reloadTodoFile, showProgressSnackbar, syncDoneFiles, syncFile],
  );

  const handleActive = useCallback(() => {
    syncAllTodoFiles(true);
  }, [syncAllTodoFiles]);

  // Sync files with cloud storage when the app becomes active
  useEffect(() => {
    addBecomeActiveListener(handleActive);
    return () => {
      removeAllBecomeActiveListeners([handleActive]);
    };
  }, [handleActive]);

  // Automatically sync files with cloud storage after file changes
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

  // Sync files with cloud storage on app start
  useEffect(() => {
    syncAllTodoFiles();
    requestTokens();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  usePullToRefresh(
    syncAllTodoFiles,
    "#scroll-container",
    cloudStorages.length === 0 || !top,
  );
}
