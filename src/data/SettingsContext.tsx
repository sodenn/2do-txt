import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { createContext } from "../utils/Context";
import { useStorage } from "../utils/storage";

export type Language = "de" | "en";

const [SettingsProvider, useSettings] = createContext(() => {
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState<Language>(
    (i18n.resolvedLanguage as Language) || "en"
  );
  const { getStorageItem, setStorageItem } = useStorage();
  const [createCreationDate, setCreateCreationDate] = useState(true);
  const [createCompletionDate, setCreateCompletionDate] = useState(true);
  const [showNotifications, _setShowNotifications] = useState(false);

  const changeLanguage = useCallback(
    (language: Language) => {
      if (language && i18n.resolvedLanguage !== language) {
        setLanguage(language);
        i18n.changeLanguage(language);
        setStorageItem("language", language);
      }
    },
    [i18n, setStorageItem]
  );

  const toggleCreateCompletionDate = useCallback(() => {
    setCreateCompletionDate((value) => {
      const newValue = !value;
      setStorageItem("create-completion-date", newValue.toString());
      return newValue;
    });
  }, [setCreateCompletionDate, setStorageItem]);

  const toggleCreateCreationDate = useCallback(() => {
    setCreateCreationDate((value) => {
      const newValue = !value;
      setStorageItem("create-creation-date", newValue.toString());
      return newValue;
    });
  }, [setCreateCreationDate, setStorageItem]);

  const setShowNotifications = useCallback(
    (value: boolean) => {
      setStorageItem("show-notifications", value.toString());
      _setShowNotifications(value);
    },
    [setStorageItem]
  );

  const getTodoFilePaths = useCallback(async () => {
    const pathStr = await getStorageItem("todo-txt-paths");
    try {
      const paths: string[] = pathStr ? JSON.parse(pathStr) : [];
      return paths;
    } catch (e) {
      await setStorageItem("todo-txt-paths", JSON.stringify([]));
      return [];
    }
  }, [getStorageItem, setStorageItem]);

  const addTodoFilePath = useCallback(
    async (filePath: string) => {
      const filePathsStr = await getStorageItem("todo-txt-paths");

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

      await setStorageItem(
        "todo-txt-paths",
        JSON.stringify([...filePaths, filePath])
      );
    },
    [getStorageItem, setStorageItem]
  );

  const removeTodoFilePath = useCallback(
    async (filePath: string) => {
      const filePathsStr = await getStorageItem("todo-txt-paths");
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

      await setStorageItem("todo-txt-paths", updatedFilePathsStr);
    },
    [getStorageItem, setStorageItem]
  );

  useEffect(() => {
    Promise.all([
      getStorageItem("show-notifications"),
      getStorageItem("create-creation-date"),
      getStorageItem("create-completion-date"),
      getStorageItem("language"),
    ]).then(
      ([
        showNotifications,
        createCreationDate,
        createCompletionDate,
        language,
      ]) => {
        _setShowNotifications(showNotifications === "true");
        setCreateCreationDate(
          createCreationDate === null ? true : createCreationDate === "true"
        );
        setCreateCompletionDate(
          createCompletionDate === null ? true : createCompletionDate === "true"
        );
        changeLanguage(language as Language);
      }
    );
  }, [changeLanguage, getStorageItem]);

  return {
    language,
    changeLanguage,
    createCreationDate,
    createCompletionDate,
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
