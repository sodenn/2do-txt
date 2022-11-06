import { Encoding } from "@capacitor/filesystem";
import { Button } from "@mui/material";
import { useSnackbar } from "notistack";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { createContext } from "../utils/Context";
import {
  getArchiveFilePath,
  getFilenameFromPath,
  getFilesystem,
} from "../utils/filesystem";
import { Task } from "../utils/task";
import { parseTaskList, stringifyTaskList, TaskList } from "../utils/task-list";
import { useArchivedTasksDialog } from "./ArchivedTasksDialogContext";
import { SyncFileOptions, useCloudStorage } from "./CloudStorageContext";
import generateContentHash from "./CloudStorageContext/ContentHasher";
import { useSettings } from "./SettingsContext";

interface SyncItem {
  filePath: string;
  text: string;
}

interface ArchiveAllTaskOptions {
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

const [ArchivedTaskProvider, useArchivedTask] = createContext(() => {
  const { readFile, writeFile, deleteFile, isFile } = getFilesystem();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const { setArchivedTasksDialog } = useArchivedTasksDialog();
  const { archiveMode, setArchiveMode } = useSettings();
  const {
    syncAllFiles,
    syncFileThrottled,
    unlinkCloudArchiveFile,
    linkCloudArchiveFile,
    deleteCloudFile,
    getCloudFileRefByFilePath,
    getCloudArchiveFileRefByFilePath,
    getCloudArchiveFileMetaData,
    downloadFile,
    uploadFile,
  } = useCloudStorage();
  const { t } = useTranslation();

  const syncAllDoneFilesWithCloudStorage = useCallback(
    async (items: SyncItem[]) => {
      const syncOptions: SyncFileOptions[] = [];

      const updateArchiveMode = await Promise.all(
        items.map(async ({ filePath }) => {
          const doneFilePath = getArchiveFilePath(filePath);
          const ref = await getCloudArchiveFileRefByFilePath(filePath);
          const metaData = await getCloudArchiveFileMetaData(filePath);

          if (!doneFilePath) {
            return "do-nothing";
          }

          const addSyncOption = async () => {
            const readResult = await readFile({
              path: doneFilePath,
            }).catch((e) => void e);
            if (readResult) {
              syncOptions.push({
                filePath: doneFilePath,
                text: readResult.data,
                archive: true,
              });
            }
          };

          if (ref && !metaData) {
            // archive file was deleted in the cloud, so delete the file reference
            await Promise.all([
              unlinkCloudArchiveFile(filePath),
              deleteFile({
                path: doneFilePath,
              }),
            ]);
            return archiveMode !== "no-archiving" ? "disable" : "do-nothing";
          } else if (ref) {
            // local archive file and cloud archive file available, add sync options
            await addSyncOption();
            return archiveMode === "no-archiving" ? "enable" : "do-nothing";
          } else if (!metaData) {
            // local archive file and cloud archive file do not exist, no sync needed
            return "do-nothing";
          }

          // download cloud archive file
          if (archiveMode === "no-archiving") {
            const text = await downloadFile({
              cloudFilePath: metaData.path,
              cloudStorage: metaData.cloudStorage,
            });

            await writeFile({
              path: doneFilePath,
              data: text,
              encoding: Encoding.UTF8,
            });

            await linkCloudArchiveFile({
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
          const path = getArchiveFilePath(i.filePath);
          if (!path) {
            return;
          }

          const exists = await isFile({
            path,
          });
          if (!exists) {
            return;
          }

          await writeFile({
            path,
            data: i.text,
            encoding: Encoding.UTF8,
          });
        })
      );
    },
    [
      syncAllFiles,
      getCloudArchiveFileRefByFilePath,
      getCloudArchiveFileMetaData,
      readFile,
      archiveMode,
      unlinkCloudArchiveFile,
      deleteFile,
      downloadFile,
      writeFile,
      linkCloudArchiveFile,
      setArchiveMode,
      enqueueSnackbar,
      isFile,
      t,
    ]
  );

  const saveDoneFile = useCallback(
    async (filePath: string, text: string) => {
      const doneFilePath = getArchiveFilePath(filePath);
      if (!doneFilePath) {
        return;
      }

      await writeFile({
        path: doneFilePath,
        data: text,
        encoding: Encoding.UTF8,
      });

      syncFileThrottled({
        filePath,
        text,
        showSnackbar: false,
        archive: true,
      })?.then((result) => {
        if (result) {
          writeFile({
            path: doneFilePath,
            data: result,
            encoding: Encoding.UTF8,
          });
        }
      });
    },
    [syncFileThrottled, writeFile]
  );

  const loadDoneFile = useCallback(
    async (filePath: string) => {
      const doneFilePath = getArchiveFilePath(filePath);
      if (!doneFilePath) {
        return;
      }

      const result = await readFile({
        path: doneFilePath,
      }).catch((e) => void e);

      if (!result) {
        return;
      }

      const parseResult = parseTaskList(result.data);
      return {
        items: parseResult.items,
        lineEnding: parseResult.lineEnding,
        doneFileName: getFilenameFromPath(doneFilePath),
        doneFilePath,
      };
    },
    [readFile]
  );

  const restoreTask = useCallback(
    async ({ taskList, task }: RestoreTaskOptions) => {
      const { filePath, lineEnding, items } = taskList;

      const doneFilePath = getArchiveFilePath(filePath);
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

      const doneFileText = stringifyTaskList(completedTasks, lineEnding);

      if (completedTasks.length === 0) {
        await deleteFile({
          path: doneFilePath,
        });
        deleteCloudFile({ filePath, archive: true }).catch((e) => void e);
      } else {
        await saveDoneFile(filePath, doneFileText);
      }

      return newTaskList;
    },
    [archiveMode, deleteCloudFile, deleteFile, loadDoneFile, saveDoneFile]
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
          archive: true,
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
      uploadFile,
      t,
    ]
  );

  const archiveAllTask = useCallback(
    async ({ onSaveTodoFile, taskLists }: ArchiveAllTaskOptions) => {
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
              archive: true,
            });
          }

          await Promise.all([
            onSaveTodoFile(newTaskList),
            saveDoneFile(filePath, doneFileText),
          ]);

          const doneFilePath = getArchiveFilePath(filePath);
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

  const restoreAllArchivedTask = useCallback(
    ({ onSaveTodoFile, taskLists }: ArchiveAllTaskOptions) => {
      return Promise.all(
        taskLists.map(async (taskList) => {
          const completedTaskList = await loadDoneFile(taskList.filePath);
          if (!completedTaskList) {
            return;
          }

          const doneFilePath = getArchiveFilePath(taskList.filePath);
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
            deleteFile({
              path: doneFilePath,
            }),
          ]);

          enqueueSnackbar(
            t("All completed tasks have been restored", { doneFilePath }),
            { variant: "success" }
          );

          deleteCloudFile({ filePath: taskList.filePath, archive: true }).catch(
            (e) => void e
          );
        })
      );
    },
    [deleteCloudFile, deleteFile, enqueueSnackbar, loadDoneFile, t]
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
