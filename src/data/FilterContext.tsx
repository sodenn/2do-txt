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
  const [activeTaskListPath, setActiveTaskListPath] = useState("");
  const [sortBy, _setSortBy] = useState<SortKey>("");
  const [activePriorities, setActivePriorities] = useState<string[]>([]);
  const [activeProjects, setActiveProjects] = useState<string[]>([]);
  const [activeContexts, setActiveContexts] = useState<string[]>([]);
  const [activeTags, setActiveTags] = useState<string[]>([]);
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
    activeTaskListPath,
    setActiveTaskListPath,
    sortBy,
    setSortBy,
    activePriorities,
    setActivePriorities,
    activeProjects,
    setActiveProjects,
    activeContexts,
    setActiveContexts,
    activeTags,
    setActiveTags,
    hideCompletedTasks,
    setHideCompletedTasks,
  };
});

export { FilterContextProvider, useFilter };
