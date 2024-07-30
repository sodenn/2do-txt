import {
  getPreferencesItem,
  setPreferencesItem,
} from "@/native-api/preferences";
import { createContext, useContext } from "react";
import { useStore as useZustandStore } from "zustand";
import { createStore } from "zustand/vanilla";

export type SortKey =
  | "priority"
  | "dueDate"
  | "context"
  | "project"
  | "tag"
  | "unsorted";

export type FilterType = "AND" | "OR";

export interface SearchParams {
  term: string;
  projects: string;
  contexts: string;
  tags: string;
  priorities: string;
  active: string;
}

export interface FilterStoreData {
  searchTerm: string;
  activePriorities: string[];
  activeProjects: string[];
  activeContexts: string[];
  activeTags: string[];
  sortBy: SortKey;
  filterType: FilterType;
  hideCompletedTasks: boolean;
  activeTaskListId?: string;
}

interface FilterStoreInterface extends FilterStoreData {
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
  setActiveTaskListId: (activeTaskListId?: string) => void;
}

function getDefaultInitialState(): FilterStoreData {
  return {
    searchTerm: "",
    sortBy: "unsorted",
    filterType: "AND",
    activePriorities: [],
    activeProjects: [],
    activeContexts: [],
    activeTags: [],
    hideCompletedTasks: false,
    activeTaskListId: undefined,
  };
}

export type FilterStoreType = ReturnType<typeof initializeFilterStore>;

const zustandContext = createContext<FilterStoreType | null>(null);

export const FilterStoreProvider = zustandContext.Provider;

export async function filterLoader(): Promise<FilterStoreData> {
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
    activeTaskListId: active ? decodeURIComponent(active) : undefined,
    activePriorities: priorities ? priorities.split(",") : [],
    activeProjects: projects ? projects.split(",") : [],
    activeContexts: contexts ? contexts.split(",") : [],
    activeTags: tags ? tags.split(",") : [],
    sortBy: sortBy ?? "unsorted",
    filterType: filterType || "AND",
    hideCompletedTasks: hideCompletedTasks === "true",
  };
}

export function initializeFilterStore(
  preloadedState: Partial<FilterStoreInterface> = {},
) {
  return createStore<FilterStoreInterface>((set) => ({
    ...getDefaultInitialState(),
    ...preloadedState,
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
      set((state) => {
        if (state.filterType === "AND" && state.activePriorities.length > 0) {
          return {
            activePriorities: state.activePriorities.includes(priority)
              ? []
              : [priority],
          };
        } else {
          return {
            activePriorities: state.activePriorities.includes(priority)
              ? state.activePriorities.filter((i) => i !== priority)
              : [...state.activePriorities, priority],
          };
        }
      }),
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
    setActiveTaskListId: (activeTaskListId?: string) =>
      set({ activeTaskListId }),
  }));
}

export function useFilterStore<T = FilterStoreInterface>(
  selector: (state: FilterStoreInterface) => T = (state) => state as T,
) {
  const store = useContext(zustandContext);
  if (!store) throw new Error("Store is missing the provider");
  return useZustandStore(store, selector);
}
