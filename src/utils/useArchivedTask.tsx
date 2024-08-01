import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { useArchivedTasksDialogStore } from "@/stores/archived-tasks-dialog-store";
import { useSettingsStore } from "@/stores/settings-store";
import { deleteFile, readFile, writeFile } from "@/utils/file-system";
import { Task } from "@/utils/task";
import { parseTaskList, stringifyTaskList, TaskList } from "@/utils/task-list";
import {
  addDoneFileId,
  getDoneFileId,
  removeDoneFileId,
} from "@/utils/todo-files";
import { useFilePicker } from "@/utils/useFilePicker";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

interface RestoreTaskOptions {
  taskList: TaskList;
  task: Task;
}

interface ArchiveTaskOptions {
  taskList: TaskList;
  task: Task;
}

export function useArchivedTask() {
  const { toast } = useToast();
  const openArchivedTasksDialog = useArchivedTasksDialogStore(
    (state) => state.openArchivedTasksDialog,
  );
  const archiveMode = useSettingsStore((state) => state.archiveMode);
  const { t } = useTranslation();
  const { showSaveFilePicker } = useFilePicker();

  const saveDoneFile = useCallback(async (todoFileId: string, text: string) => {
    const doneFileId = await getDoneFileId(todoFileId);
    if (!doneFileId) {
      return;
    }
    return writeFile({
      id: doneFileId,
      content: text,
    });
  }, []);

  const loadDoneFile = useCallback(
    async (todoFileId: string) => {
      let doneFileId = await getDoneFileId(todoFileId);
      if (!doneFileId) {
        const result = await showSaveFilePicker("done.txt");
        if (!result) {
          return;
        }
        doneFileId = result.id;
        await addDoneFileId(todoFileId, doneFileId);
      }

      const data = await readFile(doneFileId).catch((e) => void e);
      if (!data) {
        return;
      }

      const parseResult = parseTaskList(data.content);
      return {
        items: parseResult.items,
        lineEnding: parseResult.lineEnding,
        filename: data.filename,
        id: doneFileId,
      };
    },
    [showSaveFilePicker],
  );

  const restoreTask = useCallback(
    async ({ taskList, task }: RestoreTaskOptions) => {
      const { id, lineEnding, items } = taskList;

      const doneFile = await loadDoneFile(id);
      if (!doneFile) {
        return;
      }

      const completedTasks = doneFile.items.filter((i) => i.raw !== task.raw);

      const newItems =
        archiveMode === "automatic"
          ? [...items, { ...task, completed: false, completionDate: undefined }]
          : [...items, task];
      const newTaskList: TaskList = {
        ...taskList,
        items: newItems.map((i, index) => ({
          ...i,
          order: index,
        })),
      };

      if (completedTasks.length === 0) {
        await Promise.all([
          deleteFile(doneFile.id),
          removeDoneFileId(taskList.id),
        ]);
      } else {
        const text = stringifyTaskList(completedTasks, lineEnding);
        await saveDoneFile(id, text);
      }

      return newTaskList;
    },
    [archiveMode, loadDoneFile, saveDoneFile],
  );

  const archiveTask = useCallback(
    async (opt: ArchiveTaskOptions) => {
      const { task, taskList } = opt;
      const todoFileId = taskList.id;

      const result = await loadDoneFile(todoFileId);

      const text = stringifyTaskList(
        [...(result ? result.items : []), task],
        result ? result.lineEnding : taskList.lineEnding,
      );

      await saveDoneFile(todoFileId, text);

      toast({
        variant: "success",
        description: t("Task archived", {
          filename: result?.filename,
        }),
        action: (
          <ToastAction
            altText="Archived tasks"
            onClick={() => {
              openArchivedTasksDialog(todoFileId);
            }}
          >
            {t("Archived tasks")}
          </ToastAction>
        ),
      });
    },
    [toast, loadDoneFile, saveDoneFile, openArchivedTasksDialog, t],
  );

  const archiveTasks = useCallback(
    async (taskLists: TaskList[]) => {
      return Promise.all(
        taskLists.map(async (taskList) => {
          const { id, items, lineEnding } = taskList;

          const newTaskList: TaskList = {
            ...taskList,
            items: taskList.items
              .filter((i) => !i.completed)
              .map((i, index) => ({
                ...i,
                order: index,
              })),
          };

          const doneFile = await loadDoneFile(id);
          const newCompletedTasks = items.filter((i) => i.completed);
          const allCompletedTasks = [
            ...(doneFile?.items || []),
            ...newCompletedTasks,
          ];

          const text = stringifyTaskList(
            allCompletedTasks,
            doneFile ? doneFile.lineEnding : lineEnding,
          );

          if (allCompletedTasks.length === 0) {
            return;
          }

          const result = await saveDoneFile(id, text);

          if (result && newCompletedTasks.length > 0) {
            toast({
              variant: "success",
              description: t("All completed tasks have been archived", {
                filename: result.filename,
              }),
            });
          }

          return newTaskList;
        }),
      );
    },
    [toast, loadDoneFile, saveDoneFile, t],
  );

  const restoreArchivedTasks = useCallback(
    (taskLists: TaskList[]) => {
      return Promise.all(
        taskLists.map(async (taskList) => {
          const doneFile = await loadDoneFile(taskList.id);
          if (!doneFile) {
            return;
          }

          const newTaskList: TaskList = {
            ...taskList,
            items: [...taskList.items, ...doneFile.items].map((i, index) => ({
              ...i,
              order: index,
            })),
          };

          await Promise.all([
            deleteFile(doneFile.id),
            removeDoneFileId(taskList.id),
          ]);

          toast({
            variant: "success",
            description: t("All completed tasks have been restored", {
              filename: doneFile.filename,
            }),
          });

          return newTaskList;
        }),
      );
    },
    [toast, loadDoneFile, t],
  );

  return {
    saveDoneFile,
    loadDoneFile,
    restoreTask,
    archiveTask,
    archiveTasks,
    restoreArchivedTasks,
  };
}
