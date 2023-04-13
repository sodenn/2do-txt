import { useTheme } from "@mui/material";
import { differenceInMinutes } from "date-fns";
import PullToRefresh from "pulltorefreshjs";
import { useCallback, useEffect } from "react";
import {
  CreateFileData,
  DeleteFileData,
  UpdateFileData,
  filesystemEmitter,
} from "../../native-api/filesystem";
import {
  addBecomeActiveListener,
  hasTouchScreen,
  removeAllBecomeActiveListeners,
} from "../../native-api/platform";
import { taskLoader } from "../../stores/task-state";
import { parseDate } from "../date";
import { getTodoFilePathFromDoneFilePath, isDoneFilePath } from "../todo-files";
import useArchivedTask from "../useArchivedTask";
import useTask from "../useTask";
import { cloudStoragePreferences } from "./preferences";
import { useCloudStorage } from "./useCloudStorage";

const ptrStyles = `
.__PREFIX__ptr {
  box-shadow: inset 0 -3px 5px rgba(0, 0, 0, 0.12);
  pointer-events: none;
  font-size: 0.85em;
  font-weight: bold;
  top: 0;
  height: 0;
  transition: height 0.3s, min-height 0.3s;
  text-align: center;
  width: 100%;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
  align-content: stretch;
}

.__PREFIX__box {
  padding: 10px;
  flex-basis: 100%;
}

.__PREFIX__pull {
  transition: none;
}

.__PREFIX__text {
  margin-top: .33em;
  color: rgba(0, 0, 0, 0.3);
}

.__PREFIX__icon {
  color: rgba(0, 0, 0, 0.3);
  transition: transform .3s;
}

/*
When at the top of the page, disable vertical overscroll so passive touch
listeners can take over.
*/
.__PREFIX__top {
  touch-action: pan-x pan-down pinch-zoom;
}

.__PREFIX__release .__PREFIX__icon {
  transform: rotate(180deg);
}
`;

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
  const theme = useTheme();

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
      const isDoneFile = isDoneFilePath(data.path);
      if (!isDoneFile) {
        return;
      }
      const todoFilePath = getTodoFilePathFromDoneFilePath(data.path);
      const todoFileRef = await getCloudFileRef(todoFilePath);
      const provider = todoFileRef.provider;
      uploadFile(provider, data.path, data.content);
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

  // Sync files with cloud storage when pull to refresh
  useEffect(() => {
    const touchScreen = hasTouchScreen();
    if (!touchScreen || cloudStorages.length > 0) {
      return;
    }
    const instance = PullToRefresh.init({
      mainElement: "#scroll-container",
      getStyles() {
        return ptrStyles.replaceAll(
          "color: rgba(0, 0, 0, 0.3);",
          `color: ${theme.palette.text.disabled};`
        );
      },
      onRefresh() {
        return syncAllTodoFiles();
      },
    });
    return () => {
      instance.destroy();
    };
  }, [cloudStorages.length, syncAllTodoFiles, theme.palette.text.disabled]);
}
