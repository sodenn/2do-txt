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

export type FilterType = "AND" | "OR";

const [FilterProvider, useFilter] = createContext(() => {
  const { getStorageItem, setStorageItem } = useStorage();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTaskListPath, setActiveTaskListPath] = useState("");
  const [sortBy, _setSortBy] = useState<SortKey>("");
  const [filterType, _setFilterType] = useState<FilterType>("AND");
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

  const setFilterType = useCallback(
    (value: FilterType) => {
      _setFilterType(value);
      setStorageItem("filter-type", value);

      if (activePriorities.length > 1 && value === "AND") {
        setActivePriorities([]);
      }
    },
    [activePriorities.length, setStorageItem]
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
      getStorageItem<SortKey>("sort-by"),
      getStorageItem<FilterType>("filter-type"),
      getStorageItem("hide-completed-tasks"),
    ]).then(([sortBy, filterType, hideCompletedTasks]) => {
      _setSortBy(sortBy || "");
      _setFilterType(filterType || "AND");
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
    filterType,
    setFilterType,
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

export { FilterProvider, useFilter };
