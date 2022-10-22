import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLoaderData } from "react-router-dom";
import { createContext } from "../utils/Context";
import { getPreferencesItem, setPreferencesItem } from "../utils/preferences";
import { LoaderData } from "./loader";

export type Language = "de" | "en";

export type ArchiveMode = "no-archiving" | "automatic" | "manual";

export type TaskView = "list" | "timeline";

export type PriorityTransformation = "keep" | "remove" | "archive";

export async function getTodoFilePaths() {
  const pathStr = await getPreferencesItem("todo-txt-paths");
  try {
    const paths: string[] = pathStr ? JSON.parse(pathStr) : [];
    return paths;
  } catch (e) {
    await setPreferencesItem("todo-txt-paths", JSON.stringify([]));
    return [];
  }
}

const [SettingsProvider, useSettings] = createContext(() => {
  const {
    i18n: { resolvedLanguage, changeLanguage: _changeLanguage },
  } = useTranslation();
  const data = useLoaderData() as LoaderData;
  const [createCreationDate, setCreateCreationDate] = useState(
    data.createCreationDate
  );
  const [createCompletionDate, setCreateCompletionDate] = useState(
    data.createCompletionDate
  );
  const [showNotifications, _setShowNotifications] = useState(
    data.showNotifications
  );
  const [archiveMode, _setArchiveMode] = useState<ArchiveMode>(
    data.archiveMode
  );
  const [taskView, _setTaskView] = useState<TaskView>(data.taskView);
  const [priorityTransformation, _setPriorityTransformation] =
    useState<PriorityTransformation>(data.priorityTransformation);

  const changeLanguage = useCallback(
    (language: Language) => {
      if (language && resolvedLanguage !== language) {
        _changeLanguage(language);
        setPreferencesItem("language", language);
      }
    },
    [_changeLanguage, resolvedLanguage]
  );

  const toggleCreateCompletionDate = useCallback(() => {
    setCreateCompletionDate((value) => {
      const newValue = !value;
      setPreferencesItem("create-completion-date", newValue.toString());
      return newValue;
    });
  }, [setCreateCompletionDate]);

  const toggleCreateCreationDate = useCallback(() => {
    setCreateCreationDate((value) => {
      const newValue = !value;
      setPreferencesItem("create-creation-date", newValue.toString());
      return newValue;
    });
  }, [setCreateCreationDate]);

  const setShowNotifications = useCallback((value: boolean) => {
    setPreferencesItem("show-notifications", value.toString());
    _setShowNotifications(value);
  }, []);

  const setArchiveMode = useCallback((value: ArchiveMode) => {
    setPreferencesItem("archive-mode", value);
    _setArchiveMode(value);
  }, []);

  const setTaskView = useCallback((value: TaskView) => {
    setPreferencesItem("task-view", value);
    _setTaskView(value);
  }, []);

  const setCompletedTaskPriority = useCallback(
    (value: PriorityTransformation) => {
      setPreferencesItem("priority-transformation", value);
      _setPriorityTransformation(value);
    },
    []
  );

  const addTodoFilePath = useCallback(async (filePath: string) => {
    const filePathsStr = await getPreferencesItem("todo-txt-paths");

    let filePaths: string[] = [];
    try {
      if (filePathsStr) {
        filePaths = JSON.parse(filePathsStr);
      }
    } catch (e) {
      //
    }

    const alreadyExists = filePaths.some((p) => p === filePath);

    if (alreadyExists) {
      return;
    }

    await setPreferencesItem(
      "todo-txt-paths",
      JSON.stringify([...filePaths, filePath])
    );
  }, []);

  const removeTodoFilePath = useCallback(async (filePath: string) => {
    const filePathsStr = await getPreferencesItem("todo-txt-paths");
    let updatedFilePathsStr = JSON.stringify([]);

    if (filePathsStr) {
      try {
        const filePaths: string[] = JSON.parse(filePathsStr);
        const updatedFilePaths = filePaths.filter((path) => path !== filePath);
        updatedFilePathsStr = JSON.stringify(updatedFilePaths);
      } catch (e) {
        //
      }
    }

    await setPreferencesItem("todo-txt-paths", updatedFilePathsStr);
  }, []);

  return {
    language: resolvedLanguage as Language,
    changeLanguage,
    createCreationDate,
    createCompletionDate,
    archiveMode,
    taskView,
    setTaskView,
    setArchiveMode,
    priorityTransformation,
    setCompletedTaskPriority,
    toggleCreateCompletionDate,
    toggleCreateCreationDate,
    showNotifications,
    setShowNotifications,
    getTodoFilePaths,
    addTodoFilePath,
    removeTodoFilePath,
  };
});

export { SettingsProvider, useSettings };
