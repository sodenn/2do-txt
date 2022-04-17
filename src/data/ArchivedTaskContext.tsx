import { Directory, Encoding } from "@capacitor/filesystem";
import { Button } from "@mui/material";
import { useSnackbar } from "notistack";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { createContext } from "../utils/Context";
import {
  getArchivalFilePath,
  getFilenameFromPath,
  useFilesystem,
} from "../utils/filesystem";
import { Task } from "../utils/task";
import {
  parseTaskList,
  stringifyTaskList,
  TaskListParseResult,
} from "../utils/task-list";
import { useArchivedTasksDialog } from "./ArchivedTasksDialogContext";
import { SyncFileOptions, useCloudStorage } from "./CloudStorageContext";
import { useSettings } from "./SettingsContext";

type SaveTodoFile = (filePath: string, text: string) => Promise<void>;

export interface TaskList extends TaskListParseResult {
  filePath: string;
  fileName: string;
}

export interface SyncAllTodoFileWithCloudStorageProps {
  items: { filePath: string; text: string }[];
}

export interface ArchiveAllTaskOptions {
  taskLists: TaskList[];
  onSaveTodoFile: SaveTodoFile;
}

export interface RestoreTaskOptions {
  taskList: TaskList;
  task: Task;
  onSaveTodoFile: SaveTodoFile;
}

const [ArchivedTaskProvider, useArchivedTask] = createContext(() => {
  const { readFile, writeFile, deleteFile, isFile } = useFilesystem();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const { setArchivedTasksDialog } = useArchivedTasksDialog();
  const { archivalMode, setArchivalMode } = useSettings();
  const {
    syncAllFiles,
    syncFileThrottled,
    unlinkCloudArchivalFile,
    linkCloudArchivalFile,
    deleteCloudFile,
    getCloudFileRefByFilePath,
    getCloudArchivalFileRefByFilePath,
    uploadFileAndResolveConflict,
    getCloudArchivalFileMetaData,
    downloadFile,
  } = useCloudStorage();
  const { t } = useTranslation();

  const syncAllDoneFilesWithCloudStorage = useCallback(
    async ({ items }: SyncAllTodoFileWithCloudStorageProps) => {
      const syncOptions: SyncFileOptions[] = [];

      const updateArchivalMode = await Promise.all(
        items.map(async ({ filePath }) => {
          const doneFilePath = getArchivalFilePath(filePath);
          const ref = await getCloudArchivalFileRefByFilePath(filePath);
          const metaData = await getCloudArchivalFileMetaData(filePath);

          if (!doneFilePath) {
            return "do-nothing";
          }

          const addSyncOption = async () => {
            const readResult = await readFile({
              path: doneFilePath,
              directory: Directory.Documents,
              encoding: Encoding.UTF8,
            }).catch((e) => void e);
            if (readResult) {
              syncOptions.push({
                filePath: doneFilePath,
                text: readResult.data,
                archival: true,
              });
            }
          };

          if (ref && !metaData) {
            // archival file was deleted in the cloud, so delete the file reference
            await Promise.all([
              unlinkCloudArchivalFile(filePath),
              deleteFile({
                path: doneFilePath,
                directory: Directory.Documents,
              }),
            ]);
            return archivalMode !== "no-archiving" ? "disable" : "do-nothing";
          } else if (ref) {
            // local archival file and cloud archival file available, add sync options
            await addSyncOption();
            return archivalMode === "no-archiving" ? "enable" : "do-nothing";
          } else if (!metaData) {
            // local archival file and cloud archival file do not exist, no sync needed
            return archivalMode !== "no-archiving" ? "disable" : "do-nothing";
          }

          // download cloud archival file
          if (archivalMode === "no-archiving") {
            const text = await downloadFile({
              cloudFilePath: metaData.path,
              cloudStorage: metaData.cloudStorage,
            });

            await writeFile({
              path: doneFilePath,
              data: text,
              directory: Directory.Documents,
              encoding: Encoding.UTF8,
            });

            await linkCloudArchivalFile({
              localFilePath: filePath,
              ...metaData,
            });

            return "enable";
          } else {
            await addSyncOption();
            return "do-nothing";
          }
        })
      );

      if (updateArchivalMode.some((i) => i === "enable")) {
        setArchivalMode("manual");
        enqueueSnackbar(
          t("Task archiving was turned on because a done.txt file was found"),
          { variant: "info" }
        );
      }

      if (updateArchivalMode.every((i) => i === "disable")) {
        setArchivalMode("no-archiving");
      }

      syncAllFiles(syncOptions).then((syncResult) =>
        syncResult.map(async (i) => {
          const path = getArchivalFilePath(i.filePath);
          if (!path) {
            return;
          }

          const exists = await isFile({
            path,
            directory: Directory.Documents,
          });
          if (!exists) {
            return;
          }

          await writeFile({
            path,
            data: i.text,
            directory: Directory.Documents,
            encoding: Encoding.UTF8,
          });
        })
      );
    },
    [
      syncAllFiles,
      getCloudArchivalFileRefByFilePath,
      getCloudArchivalFileMetaData,
      readFile,
      archivalMode,
      unlinkCloudArchivalFile,
      deleteFile,
      downloadFile,
      writeFile,
      linkCloudArchivalFile,
      setArchivalMode,
      enqueueSnackbar,
      isFile,
      t,
    ]
  );

  const saveDoneFile = useCallback(
    async (filePath: string, text: string) => {
      const doneFilePath = getArchivalFilePath(filePath);
      if (!doneFilePath) {
        return;
      }

      const result = await syncFileThrottled({
        filePath,
        text,
        showSnackbar: false,
        archival: true,
      });

      if (result) {
        await writeFile({
          path: doneFilePath,
          data: result,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });
      } else {
        await writeFile({
          path: doneFilePath,
          data: text,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });
      }
    },
    [syncFileThrottled, writeFile]
  );

  const loadDoneFile = useCallback(
    async (filePath: string) => {
      const doneFilePath = getArchivalFilePath(filePath);
      if (!doneFilePath) {
        return;
      }

      const result = await readFile({
        path: doneFilePath,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      }).catch((e) => void e);

      if (!result) {
        return;
      }

      const parseResult = parseTaskList(result.data);
      return {
        items: parseResult.items,
        lineEnding: parseResult.lineEnding,
      };
    },
    [readFile]
  );

  const restoreTask = useCallback(
    async ({ taskList, task, onSaveTodoFile }: RestoreTaskOptions) => {
      const filePath = taskList.filePath;

      const doneFilePath = getArchivalFilePath(filePath);
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

      const todoFileText = stringifyTaskList(
        [
          ...taskList.items,
          { ...task, completed: false, completionDate: undefined },
        ],
        taskList.lineEnding
      );

      const doneFileText = stringifyTaskList(
        completedTasks,
        taskList.lineEnding
      );

      if (completedTasks.length === 0) {
        await deleteFile({
          path: doneFilePath,
          directory: Directory.Documents,
        });
        deleteCloudFile(filePath, true).catch((e) => void e);
      } else {
        await saveDoneFile(taskList.filePath, doneFileText);
      }

      return onSaveTodoFile(taskList.filePath, todoFileText);
    },
    [deleteCloudFile, deleteFile, loadDoneFile, saveDoneFile]
  );

  const archiveTask = useCallback(
    async (opt: RestoreTaskOptions) => {
      const { task, taskList } = opt;
      const filePath = taskList.filePath;

      const result = await loadDoneFile(filePath);

      const text = stringifyTaskList(
        [...(result ? result.items : []), task],
        result ? result.lineEnding : taskList.lineEnding
      );

      const fileRef = await getCloudFileRefByFilePath(filePath);

      if (fileRef) {
        const result = await uploadFileAndResolveConflict({
          filePath: filePath,
          text: text,
          cloudStorage: fileRef.cloudStorage,
          mode: "update",
          archival: true,
        });
        if (
          result &&
          result.type === "conflict" &&
          result.conflict.option === "cloud"
        ) {
          await saveDoneFile(filePath, result.conflict.text);
        } else {
          await saveDoneFile(filePath, text);
        }
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
            <>
              <Button
                color="inherit"
                onClick={() => {
                  setArchivedTasksDialog({
                    open: true,
                    filePath,
                  });
                  closeSnackbar(key);
                }}
              >
                {t("Archived tasks")}
              </Button>
              <Button
                color="inherit"
                onClick={() => {
                  restoreTask(opt);
                  closeSnackbar(key);
                }}
              >
                {t("Undo")}
              </Button>
            </>
          ),
        }
      );
    },
    [
      closeSnackbar,
      enqueueSnackbar,
      getCloudFileRefByFilePath,
      loadDoneFile,
      restoreTask,
      saveDoneFile,
      setArchivedTasksDialog,
      uploadFileAndResolveConflict,
      t,
    ]
  );

  const archiveAllTask = useCallback(
    async ({ onSaveTodoFile, taskLists }: ArchiveAllTaskOptions) => {
      return Promise.all(
        taskLists.map(async (taskList) => {
          const todoFileText = stringifyTaskList(
            taskList.items.filter((i) => !i.completed),
            taskList.lineEnding
          );

          const completedTasks = taskList.items.filter((i) => i.completed);

          const doneFileText = stringifyTaskList(
            completedTasks,
            taskList.lineEnding
          );

          if (completedTasks.length === 0) {
            return;
          }

          const fileRef = await getCloudFileRefByFilePath(taskList.filePath);
          if (fileRef) {
            const result = await uploadFileAndResolveConflict({
              filePath: taskList.filePath,
              text: doneFileText,
              cloudStorage: fileRef.cloudStorage,
              mode: "create",
              archival: true,
            });
            if (
              result &&
              result.type === "conflict" &&
              result.conflict.option === "cloud"
            ) {
              await Promise.all([
                onSaveTodoFile(taskList.filePath, todoFileText),
                saveDoneFile(taskList.filePath, result.conflict.text),
              ]);
            }
          }

          await Promise.all([
            onSaveTodoFile(taskList.filePath, todoFileText),
            saveDoneFile(taskList.filePath, doneFileText),
          ]);
        })
      );
    },
    [getCloudFileRefByFilePath, saveDoneFile, uploadFileAndResolveConflict]
  );

  const restoreAllArchivedTask = useCallback(
    ({ onSaveTodoFile, taskLists }: ArchiveAllTaskOptions) => {
      return Promise.all(
        taskLists.map(async (taskList) => {
          const completedTaskList = await loadDoneFile(taskList.filePath);
          if (!completedTaskList) {
            return;
          }

          const doneFilePath = getArchivalFilePath(taskList.filePath);
          if (!doneFilePath) {
            return;
          }

          const text = stringifyTaskList(
            [...taskList.items, ...completedTaskList.items].map((i, index) => ({
              ...i,
              _order: index,
            })),
            taskList.lineEnding
          );

          await Promise.all([
            onSaveTodoFile(taskList.filePath, text),
            deleteFile({
              path: doneFilePath,
              directory: Directory.Documents,
            }),
          ]);

          deleteCloudFile(taskList.filePath, true).catch((e) => void e);
        })
      );
    },
    [deleteCloudFile, deleteFile, loadDoneFile]
  );

  return {
    syncAllDoneFilesWithCloudStorage,
    saveDoneFile,
    loadDoneFile,
    restoreTask,
    archiveTask,
    archiveAllTask,
    restoreAllArchivedTask,
  };
});

export { ArchivedTaskProvider, useArchivedTask };
