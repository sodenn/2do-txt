import { isEqual } from "lodash";
import { useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { StoreApi, UseBoundStore, useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import { getPreferencesItem, setPreferencesItem } from "../utils/preferences";

export type SortKey =
  | "priority"
  | "dueDate"
  | "context"
  | "project"
  | "tag"
  | "";

export type FilterType = "AND" | "OR";

interface SearchParams {
  term: string;
  projects: string;
  contexts: string;
  tags: string;
  priorities: string;
  active: string;
}

interface FilterState {
  searchTerm: string;
  sortBy: SortKey;
  filterType: FilterType;
  activePriorities: string[];
  activeProjects: string[];
  activeContexts: string[];
  activeTags: string[];
  hideCompletedTasks: boolean;
  activeTaskListPath?: string;
  setSearchTerm: (searchTerm: string) => void;
  setSortBy: (sortBy: SortKey) => void;
  setFilterType: (filterType: FilterType) => void;
  togglePriority: (priority: string) => void;
  resetActivePriorities: () => void;
  toggleProject: (project: string) => void;
  resetActiveProjects: () => void;
  toggleContext: (context: string) => void;
  resetActiveContexts: () => void;
  toggleTag: (tag: string) => void;
  resetActiveTags: () => void;
  setHideCompletedTasks: (hideCompletedTasks: boolean) => void;
  setActiveTaskListPath: (activeTaskListPath?: string) => void;
  init: () => Promise<void>;
}

const filterStore = createStore<FilterState>((set) => ({
  searchTerm: "",
  sortBy: "",
  filterType: "AND",
  activePriorities: [],
  activeProjects: [],
  activeContexts: [],
  activeTags: [],
  hideCompletedTasks: false,
  activeTaskListPath: undefined,
  setSearchTerm: (searchTerm: string) =>
    set((state) => ({ ...state, searchTerm })),
  setSortBy: (sortBy: SortKey) => {
    set((state) => ({ ...state, sortBy }));
    setPreferencesItem("sort-by", sortBy);
  },
  setFilterType: (filterType: FilterType) => {
    set((state) => ({
      ...state,
      filterType,
      ...(state.activePriorities.length > 1 &&
        filterType === "AND" && { activePriorities: [] }),
    }));
    setPreferencesItem("filter-type", filterType);
  },
  togglePriority: (priority: string) =>
    set(({ activePriorities, ...state }) => ({
      ...state,
      activePriorities: activePriorities.includes(priority)
        ? activePriorities.filter((i) => i !== priority)
        : [...activePriorities, priority],
    })),
  resetActivePriorities: () =>
    set((state) => ({ ...state, activePriorities: [] })),
  toggleProject: (project: string) =>
    set(({ activeProjects, ...state }) => ({
      ...state,
      activeProjects: activeProjects.includes(project)
        ? activeProjects.filter((i) => i !== project)
        : [...activeProjects, project],
    })),
  resetActiveProjects: () => set((state) => ({ ...state, activeProjects: [] })),
  toggleContext: (context: string) =>
    set(({ activeContexts, ...state }) => ({
      ...state,
      activeContexts: activeContexts.includes(context)
        ? activeContexts.filter((i) => i !== context)
        : [...activeContexts, context],
    })),
  resetActiveContexts: () => set((state) => ({ ...state, activeContexts: [] })),
  toggleTag: (tag: string) =>
    set(({ activeTags, ...state }) => ({
      ...state,
      activeTags: activeTags.includes(tag)
        ? activeTags.filter((i) => i !== tag)
        : [...activeTags, tag],
    })),
  resetActiveTags: () => set((state) => ({ ...state, activeTags: [] })),
  setHideCompletedTasks: (hideCompletedTasks: boolean) => {
    set((state) => ({ ...state, hideCompletedTasks }));
    setPreferencesItem("hide-completed-tasks", hideCompletedTasks.toString());
  },
  setActiveTaskListPath: (activeTaskListPath?: string) =>
    set((state) => ({ ...state, activeTaskListPath })),
  init: async () => {
    const searchParams = new URLSearchParams(window.location.search);
    const sortBy = await getPreferencesItem<SortKey>("sort-by");
    const filterType = await getPreferencesItem<FilterType>("filter-type");
    const hideCompletedTasks = await getPreferencesItem<string>(
      "hide-completed-tasks"
    );
    const active = searchParams.get("active");
    const priorities = searchParams.get("priorities");
    const projects = searchParams.get("projects");
    const contexts = searchParams.get("contexts");
    const tags = searchParams.get("tags");
    set((state) => ({
      ...state,
      searchTerm: searchParams.get("term") || "",
      activeTaskListPath: active ? decodeURIComponent(active) : undefined,
      activePriorities: priorities ? priorities.split(",") : [],
      activeProjects: projects ? projects.split(",") : [],
      activeContexts: contexts ? contexts.split(",") : [],
      activeTags: tags ? tags.split(",") : [],
      sortBy: sortBy ?? "",
      filterType: filterType || "AND",
      hideCompletedTasks: hideCompletedTasks === "true",
    }));
  },
}));

const useFilter = ((selector: any) =>
  useStore(filterStore, selector)) as UseBoundStore<StoreApi<FilterState>>;

function useUpdateFilterSearchParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const updateSearchParams = useCallback(
    (state: FilterState) => {
      const {
        searchTerm,
        activeTaskListPath,
        activePriorities,
        activeProjects,
        activeContexts,
        activeTags,
      } = state;
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
    },
    [searchParams, setSearchParams]
  );

  useEffect(() => {
    const unsubscribe = filterStore.subscribe(updateSearchParams);
    return () => {
      unsubscribe();
    };
  }, [updateSearchParams]);
}

export default useFilter;
export { filterStore, useUpdateFilterSearchParams };
