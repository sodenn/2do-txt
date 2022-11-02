import { isEqual } from "lodash";
import { useCallback, useEffect, useState } from "react";
import { useLoaderData, useSearchParams } from "react-router-dom";
import { createContext } from "../utils/Context";
import { setPreferencesItem } from "../utils/preferences";
import { LoaderData } from "./loader";

export type SortKey =
  | "priority"
  | "dueDate"
  | "context"
  | "project"
  | "tag"
  | "";

interface SearchParams {
  term: string;
  projects: string;
  contexts: string;
  tags: string;
  priorities: string;
  active: string;
}

export type FilterType = "AND" | "OR";

const [FilterProvider, useFilter] = createContext(() => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("term") || "");
  const [activeTaskListPath, setActiveTaskListPath] = useState(() => {
    const active = searchParams.get("active");
    return active ? decodeURIComponent(active) : undefined;
  });
  const data = useLoaderData() as LoaderData;
  const [sortBy, _setSortBy] = useState<SortKey>(data.sortBy);
  const [filterType, _setFilterType] = useState<FilterType>(data.filterType);
  const [activePriorities, setActivePriorities] = useState<string[]>(() => {
    const priorities = searchParams.get("priorities");
    return priorities ? priorities.split(",") : [];
  });
  const [activeProjects, setActiveProjects] = useState<string[]>(() => {
    const projects = searchParams.get("projects");
    return projects ? projects.split(",") : [];
  });
  const [activeContexts, setActiveContexts] = useState<string[]>(() => {
    const contexts = searchParams.get("contexts");
    return contexts ? contexts.split(",") : [];
  });
  const [activeTags, setActiveTags] = useState<string[]>(() => {
    const tags = searchParams.get("tags");
    return tags ? tags.split(",") : [];
  });
  const [hideCompletedTasks, _setHideCompletedTasks] = useState(
    data.hideCompletedTasks
  );

  const setSortBy = useCallback((value: SortKey) => {
    _setSortBy(value);
    setPreferencesItem("sort-by", value);
  }, []);

  const setFilterType = useCallback(
    (value: FilterType) => {
      _setFilterType(value);
      setPreferencesItem("filter-type", value);
      if (activePriorities.length > 1 && value === "AND") {
        setActivePriorities([]);
      }
    },
    [activePriorities.length]
  );

  const setHideCompletedTasks = useCallback((value: boolean) => {
    _setHideCompletedTasks(value);
    setPreferencesItem("hide-completed-tasks", value.toString());
  }, []);

  useEffect(() => {
    const params: Partial<SearchParams> = {};
    if (searchTerm) {
      params.term = searchTerm;
    }
    if (activeTaskListPath) {
      params.active = encodeURIComponent(activeTaskListPath);
    }
    if (activePriorities.length > 0) {
      params.priorities = activePriorities.join(",");
    }
    if (activeProjects.length > 0) {
      params.projects = activeProjects.join(",");
    }
    if (activeContexts.length > 0) {
      params.contexts = activeContexts.join(",");
    }
    if (activeTags.length > 0) {
      params.tags = activeTags.join(",");
    }
    const currentParams = Object.fromEntries(searchParams);
    if (!isEqual(params, currentParams)) {
      setSearchParams(params);
    }
  }, [
    searchTerm,
    activeTaskListPath,
    activePriorities,
    activeProjects,
    activeContexts,
    activeTags,
    setSearchParams,
    searchParams,
  ]);

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
