import { StoreApi, UseBoundStore, useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import {
  getPreferencesItem,
  setPreferencesItem,
} from "../native-api/preferences";

export type SortKey =
  | "priority"
  | "dueDate"
  | "context"
  | "project"
  | "tag"
  | "";

export type FilterType = "AND" | "OR";

export interface SearchParams {
  term: string;
  projects: string;
  contexts: string;
  tags: string;
  priorities: string;
  active: string;
}

interface FilterLoaderData {
  searchTerm: string;
  activePriorities: string[];
  activeProjects: string[];
  activeContexts: string[];
  activeTags: string[];
  sortBy: SortKey;
  filterType: FilterType;
  hideCompletedTasks: boolean;
  activeTaskListPath?: string;
}

export interface FilterState extends FilterLoaderData {
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
  init: (data: FilterLoaderData) => void;
}

export async function filterLoader(): Promise<FilterLoaderData> {
  const searchParams = new URLSearchParams(window.location.search);
  const [sortBy, filterType, hideCompletedTasks] = await Promise.all([
    getPreferencesItem<SortKey>("sort-by"),
    getPreferencesItem<FilterType>("filter-type"),
    getPreferencesItem<string>("hide-completed-tasks"),
  ]);
  const active = searchParams.get("active");
  const priorities = searchParams.get("priorities");
  const projects = searchParams.get("projects");
  const contexts = searchParams.get("contexts");
  const tags = searchParams.get("tags");
  return {
    searchTerm: searchParams.get("term") || "",
    activeTaskListPath: active ? decodeURIComponent(active) : undefined,
    activePriorities: priorities ? priorities.split(",") : [],
    activeProjects: projects ? projects.split(",") : [],
    activeContexts: contexts ? contexts.split(",") : [],
    activeTags: tags ? tags.split(",") : [],
    sortBy: sortBy ?? "",
    filterType: filterType || "AND",
    hideCompletedTasks: hideCompletedTasks === "true",
  };
}

export const filterStore = createStore<FilterState>((set) => ({
  searchTerm: "",
  sortBy: "",
  filterType: "AND",
  activePriorities: [],
  activeProjects: [],
  activeContexts: [],
  activeTags: [],
  hideCompletedTasks: false,
  activeTaskListPath: undefined,
  setSearchTerm: (searchTerm: string) => set({ searchTerm }),
  setSortBy: (sortBy: SortKey) => {
    set({ sortBy });
    setPreferencesItem("sort-by", sortBy);
  },
  setFilterType: (filterType: FilterType) => {
    set((state) => ({
      filterType,
      ...(state.activePriorities.length > 1 &&
        filterType === "AND" && { activePriorities: [] }),
    }));
    setPreferencesItem("filter-type", filterType);
  },
  togglePriority: (priority: string) =>
    set((state) => ({
      activePriorities: state.activePriorities.includes(priority)
        ? state.activePriorities.filter((i) => i !== priority)
        : [...state.activePriorities, priority],
    })),
  resetActivePriorities: () => set({ activePriorities: [] }),
  toggleProject: (project: string) =>
    set((state) => ({
      activeProjects: state.activeProjects.includes(project)
        ? state.activeProjects.filter((i) => i !== project)
        : [...state.activeProjects, project],
    })),
  resetActiveProjects: () => set({ activeProjects: [] }),
  toggleContext: (context: string) =>
    set((state) => ({
      activeContexts: state.activeContexts.includes(context)
        ? state.activeContexts.filter((i) => i !== context)
        : [...state.activeContexts, context],
    })),
  resetActiveContexts: () => set({ activeContexts: [] }),
  toggleTag: (tag: string) =>
    set((state) => ({
      activeTags: state.activeTags.includes(tag)
        ? state.activeTags.filter((i) => i !== tag)
        : [...state.activeTags, tag],
    })),
  resetActiveTags: () => set({ activeTags: [] }),
  setHideCompletedTasks: (hideCompletedTasks: boolean) => {
    set({ hideCompletedTasks });
    setPreferencesItem("hide-completed-tasks", hideCompletedTasks.toString());
  },
  setActiveTaskListPath: (activeTaskListPath?: string) =>
    set({ activeTaskListPath }),
  init: (data: FilterLoaderData) => set(data),
}));

const useFilterStore = ((selector: any) =>
  useStore(filterStore, selector)) as UseBoundStore<StoreApi<FilterState>>;

export default useFilterStore;
