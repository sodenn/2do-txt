import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { createContext } from "../utils/Context";
import { usePreferences } from "../utils/prefereneces";

export type Language = "de" | "en";

export type ArchiveMode = "no-archiving" | "automatic" | "manual";

export type PriorityTransformation = "keep" | "remove" | "archive";

const [SettingsProvider, useSettings] = createContext(() => {
  const { i18n } = useTranslation();
  const [settingsInitialized, setSettingsInitialized] = useState(false);
  const [language, setLanguage] = useState<Language>(
    (i18n.resolvedLanguage as Language) || "en"
  );
  const { getPreferencesItem, setPreferencesItem } = usePreferences();
  const [createCreationDate, setCreateCreationDate] = useState(true);
  const [createCompletionDate, setCreateCompletionDate] = useState(true);
  const [showNotifications, _setShowNotifications] = useState(false);
  const [archiveMode, _setArchiveMode] = useState<ArchiveMode>("no-archiving");
  const [priorityTransformation, _setPriorityTransformation] =
    useState<PriorityTransformation>("keep");

  const changeLanguage = useCallback(
    (language: Language) => {
      if (language && i18n.resolvedLanguage !== language) {
        setLanguage(language);
        i18n.changeLanguage(language);
        setPreferencesItem("language", language);
      }
    },
    [i18n, setPreferencesItem]
  );

  const toggleCreateCompletionDate = useCallback(() => {
    setCreateCompletionDate((value) => {
      const newValue = !value;
      setPreferencesItem("create-completion-date", newValue.toString());
      return newValue;
    });
  }, [setCreateCompletionDate, setPreferencesItem]);

  const toggleCreateCreationDate = useCallback(() => {
    setCreateCreationDate((value) => {
      const newValue = !value;
      setPreferencesItem("create-creation-date", newValue.toString());
      return newValue;
    });
  }, [setCreateCreationDate, setPreferencesItem]);

  const setShowNotifications = useCallback(
    (value: boolean) => {
      setPreferencesItem("show-notifications", value.toString());
      _setShowNotifications(value);
    },
    [setPreferencesItem]
  );

  const setArchiveMode = useCallback(
    (value: ArchiveMode) => {
      setPreferencesItem("archive-mode", value);
      _setArchiveMode(value);
    },
    [setPreferencesItem]
  );

  const setCompletedTaskPriority = useCallback(
    (value: PriorityTransformation) => {
      setPreferencesItem("priority-transformation", value);
      _setPriorityTransformation(value);
    },
    [setPreferencesItem]
  );

  const getTodoFilePaths = useCallback(async () => {
    const pathStr = await getPreferencesItem("todo-txt-paths");
    try {
      const paths: string[] = pathStr ? JSON.parse(pathStr) : [];
      return paths;
    } catch (e) {
      await setPreferencesItem("todo-txt-paths", JSON.stringify([]));
      return [];
    }
  }, [getPreferencesItem, setPreferencesItem]);

  const addTodoFilePath = useCallback(
    async (filePath: string) => {
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
    },
    [getPreferencesItem, setPreferencesItem]
  );

  const removeTodoFilePath = useCallback(
    async (filePath: string) => {
      const filePathsStr = await getPreferencesItem("todo-txt-paths");
      let updatedFilePathsStr = JSON.stringify([]);

      if (filePathsStr) {
        try {
          const filePaths: string[] = JSON.parse(filePathsStr);
          const updatedFilePaths = filePaths.filter(
            (path) => path !== filePath
          );
          updatedFilePathsStr = JSON.stringify(updatedFilePaths);
        } catch (e) {
          //
        }
      }

      await setPreferencesItem("todo-txt-paths", updatedFilePathsStr);
    },
    [getPreferencesItem, setPreferencesItem]
  );

  useEffect(() => {
    Promise.all([
      getPreferencesItem("show-notifications"),
      getPreferencesItem("create-creation-date"),
      getPreferencesItem("create-completion-date"),
      getPreferencesItem<ArchiveMode>("archive-mode"),
      getPreferencesItem<PriorityTransformation>("priority-transformation"),
      getPreferencesItem<Language>("language"),
    ]).then(
      ([
        showNotifications,
        createCreationDate,
        createCompletionDate,
        archiveMode,
        completedTaskPriority,
        language,
      ]) => {
        _setShowNotifications(showNotifications === "true");
        setCreateCreationDate(
          createCreationDate === null ? true : createCreationDate === "true"
        );
        setCreateCompletionDate(
          createCompletionDate === null ? true : createCompletionDate === "true"
        );
        _setArchiveMode(archiveMode || "no-archiving");
        _setPriorityTransformation(completedTaskPriority || "keep");
        changeLanguage(language || "en");
        setSettingsInitialized(true);
      }
    );
  }, [changeLanguage, getPreferencesItem, setArchiveMode]);

  return {
    language,
    changeLanguage,
    createCreationDate,
    createCompletionDate,
    archiveMode,
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
    settingsInitialized,
  };
});

export { SettingsProvider, useSettings };
