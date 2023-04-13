import { Button } from "@mui/material";
import { useSnackbar } from "notistack";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  deleteFile,
  getFilename,
  readFile,
  writeFile,
} from "../native-api/filesystem";
import useArchivedTasksDialogStore from "../stores/archived-tasks-dialog-store";
import useSettingsStore from "../stores/settings-store";
import { CloudFileRef, useCloudStorage } from "./CloudStorage";
import { Task } from "./task";
import { TaskList, parseTaskList, stringifyTaskList } from "./task-list";
import { getDoneFilePath } from "./todo-files";

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
    syncFile,
    deleteFile: deleteCloudFile,
    downloadFile,
    getMetaData,
    getCloudFileRef,
  } = useCloudStorage();
  const { t } = useTranslation();

  const syncDoneFiles = useCallback(
    async (filePaths: string[]) => {
      const syncOptions: { localPath: string; content: string }[] = [];

      const updateArchiveMode = await Promise.all(
        filePaths.map(async (filePath) => {
          const doneFilePath = getDoneFilePath(filePath);
          if (!doneFilePath) {
            return "do-nothing";
          }

          const ref = await getCloudFileRef(doneFilePath).catch((e) => void e);
          const cloudFile = await getMetaData(doneFilePath).catch(
            (e) => void e
          );

          const addSyncOption = async (ref: CloudFileRef) => {
            const content = await readFile(doneFilePath).catch((e) => void e);
            if (content) {
              syncOptions.push({
                localPath: doneFilePath,
                content,
              });
            }
          };

          if (ref && !cloudFile) {
            // done file was deleted in the cloud, so delete the local done file as well
            await deleteFile(doneFilePath);
            return archiveMode !== "no-archiving" ? "disable" : "do-nothing";
          } else if (ref) {
            // local done file and cloud done file exist, sync needed
            await addSyncOption(ref);
            return archiveMode === "no-archiving" ? "enable" : "do-nothing";
          } else if (!cloudFile) {
            // local done file and cloud done file don't exist, do nothing
            return "do-nothing";
          }

          // download cloud done file
          if (archiveMode === "no-archiving") {
            const todoFileRef = await getCloudFileRef(filePath).catch(
              (e) => void e
            );
            if (!todoFileRef) {
              return "do-nothing";
            }
            const content = await downloadFile(
              todoFileRef.provider,
              doneFilePath,
              cloudFile.path
            );
            await writeFile({
              path: doneFilePath,
              data: content,
            });
            return "enable";
          } else if (ref) {
            await addSyncOption(ref);
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

      await Promise.all(
        syncOptions.map((options) =>
          syncFile(options.localPath, options.content, false)
        )
      );
    },
    [
      getCloudFileRef,
      getMetaData,
      archiveMode,
      downloadFile,
      setArchiveMode,
      enqueueSnackbar,
      syncFile,
      t,
    ]
  );

  const saveDoneFile = useCallback(async (filePath: string, text: string) => {
    const doneFilePath = getDoneFilePath(filePath);
    if (!doneFilePath) {
      return;
    }
    await writeFile({
      path: doneFilePath,
      data: text,
    });
  }, []);

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
      doneFileName: getFilename(doneFilePath),
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
        deleteCloudFile(doneFilePath).catch((e) => void e);
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

      await saveDoneFile(filePath, text);

      const key = enqueueSnackbar(
        t("Task archived", {
          fileName: getFilename(filePath),
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
      loadDoneFile,
      saveDoneFile,
      openArchivedTasksDialog,
      t,
    ]
  );

  const archiveTasks = useCallback(
    async (taskLists: TaskList[]) => {
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

          await saveDoneFile(filePath, doneFileText);

          const doneFilePath = getDoneFilePath(filePath);
          if (doneFilePath && newCompletedTasks.length > 0) {
            enqueueSnackbar(
              t("All completed tasks have been archived", { doneFilePath }),
              { variant: "success" }
            );
          }

          return newTaskList;
        })
      );
    },
    [enqueueSnackbar, loadDoneFile, saveDoneFile, t]
  );

  const restoreArchivedTasks = useCallback(
    (taskLists: TaskList[]) => {
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

          await deleteFile(doneFilePath);

          enqueueSnackbar(
            t("All completed tasks have been restored", { doneFilePath }),
            { variant: "success" }
          );

          deleteCloudFile(doneFilePath);
          return newTaskList;
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
