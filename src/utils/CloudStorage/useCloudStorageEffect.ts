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
import useTask from "../useTask";
import { cloudStoragePreferences } from "./preferences";
import { useCloudStorage } from "./useCloudStorage";

export function useCloudStorageEffect() {
  const {
    syncFile,
    showProgressSnackbar,
    requestTokens,
    getCloudFileRef,
    uploadFile,
  } = useCloudStorage();
  const { syncDoneFiles } = useArchivedTask();
  const { loadTodoFile } = useTask();

  const reloadTodoFile = useCallback(
    async (path: string, content?: string) => {
      if (content) {
        return loadTodoFile(path, content);
      }
    },
    [loadTodoFile]
  );

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
      syncFile(data.path, data.content, showProgress).then((content) =>
        reloadTodoFile(data.path, content)
      );
    },
    [reloadTodoFile, syncFile]
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

      const { files } = await loadTodoFiles();
      const hideProgress = showProgressSnackbar();
      await Promise.all(
        files.map(async ({ filePath, text }) =>
          syncFile(filePath, text).then((content) =>
            reloadTodoFile(filePath, content)
          )
        )
      ).finally(() => hideProgress?.());
      await syncDoneFiles(files.map((f) => f.filePath));
    },
    [reloadTodoFile, showProgressSnackbar, syncDoneFiles, syncFile]
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
