import { Button } from "@mui/material";
import { useSnackbar } from "notistack";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  deleteFile,
  getFilenameFromPath,
  isFile,
  readFile,
  writeFile,
} from "../native-api/filesystem";
import useArchivedTasksDialogStore from "../stores/archived-tasks-dialog-store";
import useSettingsStore from "../stores/settings-store";
import { SyncFileOptions, useCloudStorage } from "./CloudStorage";
import generateContentHash from "./CloudStorage/ContentHasher";
import { Task } from "./task";
import { TaskList, parseTaskList, stringifyTaskList } from "./task-list";
import { getDoneFilePath } from "./todo-files";

interface SyncItem {
  filePath: string;
  text: string;
}

interface ArchiveTasksOptions {
  taskLists: TaskList[];
  onSaveTodoFile: (taskLists: TaskList) => Promise<void>;
}

interface RestoreTaskOptions {
  taskList: TaskList;
  task: Task;
}

interface ArchiveTaskOptions {
  taskList: TaskList;
  task: Task;
}

function useArchivedTask() {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const openArchivedTasksDialog = useArchivedTasksDialogStore(
    (state) => state.openArchivedTasksDialog
  );
  const archiveMode = useSettingsStore((state) => state.archiveMode);
  const setArchiveMode = useSettingsStore((state) => state.setArchiveMode);
  const {
    syncAllFiles,
    syncFile,
    unlinkCloudDoneFile,
    linkCloudDoneFile,
    deleteCloudFile,
    getCloudFileRefByFilePath,
    getCloudDoneFileRefByFilePath,
    getCloudDoneFileMetaData,
    downloadFile,
    uploadFile,
  } = useCloudStorage();
  const { t } = useTranslation();

  const syncDoneFiles = useCallback(
    async (items: SyncItem[]) => {
      const syncOptions: SyncFileOptions[] = [];

      const updateArchiveMode = await Promise.all(
        items.map(async ({ filePath }) => {
          const doneFilePath = getDoneFilePath(filePath);
          const ref = await getCloudDoneFileRefByFilePath(filePath);
          const metaData = await getCloudDoneFileMetaData(filePath);

          if (!doneFilePath) {
            return "do-nothing";
          }

          const addSyncOption = async () => {
            const data = await readFile(doneFilePath).catch((e) => void e);
            if (data) {
              syncOptions.push({
                filePath: doneFilePath,
                text: data,
                isDoneFile: true,
              });
            }
          };

          if (ref && !metaData) {
            // done file was deleted in the cloud, so delete the file reference
            await Promise.all([
              unlinkCloudDoneFile(filePath),
              deleteFile(doneFilePath),
            ]);
            return archiveMode !== "no-archiving" ? "disable" : "do-nothing";
          } else if (ref) {
            // local done file and cloud done file available, add sync options
            await addSyncOption();
            return archiveMode === "no-archiving" ? "enable" : "do-nothing";
          } else if (!metaData) {
            // local done file and cloud done file do not exist, no sync needed
            return "do-nothing";
          }

          // download cloud done file
          if (archiveMode === "no-archiving") {
            const text = await downloadFile({
              cloudFilePath: metaData.path,
              cloudStorage: metaData.cloudStorage,
            });

            await writeFile({
              path: doneFilePath,
              data: text,
            });

            await linkCloudDoneFile({
              localFilePath: filePath,
              contentHash: generateContentHash(text),
              ...metaData,
            });

            return "enable";
          } else {
            await addSyncOption();
            return "do-nothing";
          }
        })
      );

      if (updateArchiveMode.some((i) => i === "enable")) {
        setArchiveMode("manual");
        enqueueSnackbar(
          t("Task archiving was turned on because a done.txt file was found"),
          { variant: "info" }
        );
      }

      if (updateArchiveMode.every((i) => i === "disable")) {
        setArchiveMode("no-archiving");
      }

      syncAllFiles(syncOptions).then((syncResult) =>
        syncResult.map(async (i) => {
          const path = getDoneFilePath(i.filePath);
          if (!path) {
            return;
          }

          const exists = await isFile(path);
          if (!exists) {
            return;
          }

          await writeFile({
            path,
            data: i.text,
          });
        })
      );
    },
    [
      syncAllFiles,
      getCloudDoneFileRefByFilePath,
      getCloudDoneFileMetaData,
      archiveMode,
      unlinkCloudDoneFile,
      downloadFile,
      linkCloudDoneFile,
      setArchiveMode,
      enqueueSnackbar,
      t,
    ]
  );

  const saveDoneFile = useCallback(
    async (filePath: string, text: string) => {
      const doneFilePath = getDoneFilePath(filePath);
      if (!doneFilePath) {
        return;
      }

      await writeFile({
        path: doneFilePath,
        data: text,
      });

      syncFile({
        filePath,
        text,
        showSnackbar: false,
        isDoneFile: true,
      })?.then((result) => {
        if (result) {
          writeFile({
            path: doneFilePath,
            data: result,
          });
        }
      });
    },
    [syncFile]
  );

  const loadDoneFile = useCallback(async (filePath: string) => {
    const doneFilePath = getDoneFilePath(filePath);
    if (!doneFilePath) {
      return;
    }

    const data = await readFile(doneFilePath).catch((e) => void e);
    if (!data) {
      return;
    }

    const parseResult = parseTaskList(data);
    return {
      items: parseResult.items,
      lineEnding: parseResult.lineEnding,
      doneFileName: getFilenameFromPath(doneFilePath),
      doneFilePath,
    };
  }, []);

  const restoreTask = useCallback(
    async ({ taskList, task }: RestoreTaskOptions) => {
      const { filePath, lineEnding, items } = taskList;

      const doneFilePath = getDoneFilePath(filePath);
      if (!doneFilePath) {
        return;
      }

      const completedTaskList = await loadDoneFile(filePath);
      if (!completedTaskList) {
        return;
      }

      const completedTasks = completedTaskList.items.filter(
        (i) => i.raw !== task.raw
      );

      const newItems =
        archiveMode === "automatic"
          ? [...items, { ...task, completed: false, completionDate: undefined }]
          : [...items, task];
      const newTaskList: TaskList = {
        ...taskList,
        items: newItems.map((i, index) => ({
          ...i,
          _order: index,
        })),
      };

      if (completedTasks.length === 0) {
        await deleteFile(doneFilePath);
        deleteCloudFile({ filePath, isDoneFile: true }).catch((e) => void e);
      } else {
        const doneFileText = stringifyTaskList(completedTasks, lineEnding);
        await saveDoneFile(filePath, doneFileText);
      }

      return newTaskList;
    },
    [archiveMode, deleteCloudFile, loadDoneFile, saveDoneFile]
  );

  const archiveTask = useCallback(
    async (opt: ArchiveTaskOptions) => {
      const { task, taskList } = opt;
      const filePath = taskList.filePath;

      const result = await loadDoneFile(filePath);

      const text = stringifyTaskList(
        [...(result ? result.items : []), task],
        result ? result.lineEnding : taskList.lineEnding
      );

      const fileRef = await getCloudFileRefByFilePath(filePath);

      if (fileRef) {
        await uploadFile({
          filePath: filePath,
          text: text,
          cloudStorage: fileRef.cloudStorage,
          isDoneFile: true,
        });
        await saveDoneFile(filePath, text);
      } else {
        await saveDoneFile(filePath, text);
      }

      const key = enqueueSnackbar(
        t("Task archived", {
          fileName: getFilenameFromPath(filePath),
        }),
        {
          variant: "success",
          action: (
            <Button
              color="inherit"
              onClick={() => {
                openArchivedTasksDialog({
                  filePath,
                });
                closeSnackbar(key);
              }}
            >
              {t("Archived tasks")}
            </Button>
          ),
        }
      );
    },
    [
      closeSnackbar,
      enqueueSnackbar,
      getCloudFileRefByFilePath,
      loadDoneFile,
      saveDoneFile,
      openArchivedTasksDialog,
      uploadFile,
      t,
    ]
  );

  const archiveTasks = useCallback(
    async ({ onSaveTodoFile, taskLists }: ArchiveTasksOptions) => {
      return Promise.all(
        taskLists.map(async (taskList) => {
          const { filePath, items, lineEnding } = taskList;

          const newTaskList: TaskList = {
            ...taskList,
            items: taskList.items
              .filter((i) => !i.completed)
              .map((i, index) => ({
                ...i,
                _order: index,
              })),
          };

          const completedTasks = await loadDoneFile(filePath);
          const newCompletedTasks = items.filter((i) => i.completed);
          const allCompletedTasks = [
            ...(completedTasks?.items || []),
            ...newCompletedTasks,
          ];

          const doneFileText = stringifyTaskList(
            allCompletedTasks,
            completedTasks ? completedTasks.lineEnding : lineEnding
          );

          if (allCompletedTasks.length === 0) {
            return;
          }

          const fileRef = await getCloudFileRefByFilePath(filePath);
          if (fileRef) {
            await uploadFile({
              filePath,
              text: doneFileText,
              cloudStorage: fileRef.cloudStorage,
              isDoneFile: true,
            });
          }

          await Promise.all([
            onSaveTodoFile(newTaskList),
            saveDoneFile(filePath, doneFileText),
          ]);

          const doneFilePath = getDoneFilePath(filePath);
          if (doneFilePath && newCompletedTasks.length > 0) {
            enqueueSnackbar(
              t("All completed tasks have been archived", { doneFilePath }),
              { variant: "success" }
            );
          }
        })
      );
    },
    [
      enqueueSnackbar,
      getCloudFileRefByFilePath,
      loadDoneFile,
      saveDoneFile,
      uploadFile,
      t,
    ]
  );

  const restoreArchivedTasks = useCallback(
    ({ onSaveTodoFile, taskLists }: ArchiveTasksOptions) => {
      return Promise.all(
        taskLists.map(async (taskList) => {
          const completedTaskList = await loadDoneFile(taskList.filePath);
          if (!completedTaskList) {
            return;
          }

          const doneFilePath = getDoneFilePath(taskList.filePath);
          if (!doneFilePath) {
            return;
          }

          const newTaskList: TaskList = {
            ...taskList,
            items: [...taskList.items, ...completedTaskList.items].map(
              (i, index) => ({
                ...i,
                _order: index,
              })
            ),
          };

          await Promise.all([
            onSaveTodoFile(newTaskList),
            deleteFile(doneFilePath),
          ]);

          enqueueSnackbar(
            t("All completed tasks have been restored", { doneFilePath }),
            { variant: "success" }
          );

          deleteCloudFile({
            filePath: taskList.filePath,
            isDoneFile: true,
          }).catch((e) => void e);
        })
      );
    },
    [deleteCloudFile, enqueueSnackbar, loadDoneFile, t]
  );

  return {
    syncDoneFiles,
    saveDoneFile,
    loadDoneFile,
    restoreTask,
    archiveTask,
    archiveTasks,
    restoreArchivedTasks,
  };
}

export default useArchivedTask;
