import { useCallback, useEffect, useState } from "react";
import { createContext } from "../utils/Context";
import { useStorage } from "../utils/storage";

export type SortKey =
  | "priority"
  | "dueDate"
  | "context"
  | "project"
  | "tag"
  | "";

const [FilterContextProvider, useFilter] = createContext(() => {
  const { getStorageItem, setStorageItem } = useStorage();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, _setSortBy] = useState<SortKey>("");
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedContexts, setSelectedContexts] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [hideCompletedTasks, _setHideCompletedTasks] = useState(false);

  const setSortBy = useCallback(
    (value: SortKey) => {
      _setSortBy(value);
      setStorageItem("sort-by", value);
    },
    [setStorageItem]
  );

  const setHideCompletedTasks = useCallback(
    (value: boolean) => {
      _setHideCompletedTasks(value);
      setStorageItem("hide-completed-tasks", value.toString());
    },
    [setStorageItem]
  );

  useEffect(() => {
    Promise.all([
      getStorageItem("sort-by"),
      getStorageItem("hide-completed-tasks"),
    ]).then(([sortBy, hideCompletedTasks]) => {
      _setSortBy((sortBy as SortKey) || "");
      _setHideCompletedTasks(hideCompletedTasks === "true");
    });
  }, [getStorageItem]);

  return {
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
  };
});

export { FilterContextProvider, useFilter };
