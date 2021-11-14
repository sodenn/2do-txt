import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { createContext } from "../utils/Context";
import { useStorage } from "../utils/storage";

export type Language = "de" | "en";

export type SortKey =
  | "priority"
  | "dueDate"
  | "context"
  | "project"
  | "tag"
  | "";

const [AppContextProvider, useAppContext] = createContext(() => {
  const { i18n } = useTranslation();
  const { getStorageItem, setStorageItem } = useStorage();
  const [sideSheetOpen, setSideSheetOpen] = useState(false);
  const [language, setLanguage] = useState(i18n.resolvedLanguage || "en");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("");
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedContexts, setSelectedContexts] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [hideCompletedTasks, setHideCompletedTasks] = useState(false);
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

  const setShowNotifications = useCallback(
    (value: boolean) => {
      setStorageItem("show-notifications", value.toString());
      _setShowNotifications(value);
    },
    [setStorageItem]
  );

  useEffect(() => {
    getStorageItem("language").then((value) => {
      changeLanguage(value as Language);
    });
  }, [getStorageItem, changeLanguage]);

  useEffect(() => {
    getStorageItem("show-notifications").then((value) => {
      _setShowNotifications(value === "true");
    });
  }, [getStorageItem]);

  return {
    language,
    sideSheetOpen,
    setSideSheetOpen,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    selectedPriorities,
    setSelectedPriorities,
    selectedProjects,
    setSelectedProjects,
    selectedContexts,
    setSelectedContexts,
    selectedTags,
    setSelectedTags,
    hideCompletedTasks,
    setHideCompletedTasks,
    changeLanguage,
    showNotifications,
    setShowNotifications,
  };
});

export { AppContextProvider, useAppContext };
