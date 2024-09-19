import { getPreferencesItem, setPreferencesItem } from "@/utils/preferences";
import { getTodoFileIds } from "@/utils/todo-files";
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

export interface FilterFields {
  searchTerm: string;
  selectedPriorities: string[];
  selectedProjects: string[];
  selectedContexts: string[];
  selectedTags: string[];
  sortBy: SortKey;
  filterType: FilterType;
  hideCompletedTasks: boolean;
  selectedTaskListIds: number[];
}

interface FilterState extends FilterFields {
  setSearchTerm: (searchTerm: string) => void;
  setSortBy: (sortBy: SortKey) => void;
  setFilterType: (filterType: FilterType) => void;
  togglePriority: (priority: string) => void;
  setSelectedPriorities: (priories: string[]) => void;
  toggleProject: (project: string) => void;
  setSelectedProjects: (projects: string[]) => void;
  toggleContext: (context: string) => void;
  setSelectedContexts: (contexts: string[]) => void;
  toggleTag: (tag: string) => void;
  setSelectedTags: (tags: string[]) => void;
  setHideCompletedTasks: (hideCompletedTasks: boolean) => void;
  setSelectedTaskListIds: (selectedTaskListIds: number[]) => void;
}

export type FilterStore = ReturnType<typeof initializeFilterStore>;

const zustandContext = createContext<FilterStore | null>(null);

export const FilterStoreProvider = zustandContext.Provider;

export async function filterLoader(): Promise<FilterFields> {
  const searchParams = new URLSearchParams(window.location.search);
  const [
    selectedTaskListIdsStr,
    selectedPriorities,
    selectedProjects,
    selectedContexts,
    selectedTags,
    sortBy,
    filterType,
    hideCompletedTasks,
  ] = await Promise.all([
    getPreferencesItem<string>("selected-task-list-ids"),
    getPreferencesItem<string>("selected-priorities"),
    getPreferencesItem<string>("selected-projects"),
    getPreferencesItem<string>("selected-contexts"),
    getPreferencesItem<SortKey>("selected-tags"),
    getPreferencesItem<SortKey>("sort-by"),
    getPreferencesItem<FilterType>("filter-type"),
    getPreferencesItem<string>("hide-completed-tasks"),
  ]);

  // removes any selected task list ids that no longer exist
  const todoListIds = await getTodoFileIds();
  const selectedTaskListIds = selectedTaskListIdsStr
    ? selectedTaskListIdsStr.split(",").map((i) => parseInt(i))
    : [];
  const filteredSelectedTaskListIds = todoListIds
    .map(({ todoFileId }) => todoFileId)
    .filter((id) => selectedTaskListIds.includes(id));
  if (todoListIds.length !== filteredSelectedTaskListIds.length) {
    await setPreferencesItem(
      "selected-task-list-ids",
      filteredSelectedTaskListIds.join(","),
    );
  }

  return {
    searchTerm: searchParams.get("term") || "",
    selectedTaskListIds: filteredSelectedTaskListIds,
    selectedPriorities: selectedPriorities ? selectedPriorities.split(",") : [],
    selectedProjects: selectedProjects ? selectedProjects.split(",") : [],
    selectedContexts: selectedContexts ? selectedContexts.split(",") : [],
    selectedTags: selectedTags ? selectedTags.split(",") : [],
    sortBy: sortBy ?? "unsorted",
    filterType: filterType || "AND",
    hideCompletedTasks: hideCompletedTasks === "true",
  };
}

export function initializeFilterStore(
  preloadedState: Partial<FilterState> = {},
) {
  return createStore<FilterState>((set) => ({
    searchTerm: "",
    sortBy: "unsorted",
    filterType: "AND",
    selectedPriorities: [],
    selectedProjects: [],
    selectedContexts: [],
    selectedTags: [],
    hideCompletedTasks: false,
    selectedTaskListIds: [],
    ...preloadedState,
    setSearchTerm: (searchTerm: string) => set({ searchTerm }),
    setSortBy: (sortBy: SortKey) => {
      set({ sortBy });
      setPreferencesItem("sort-by", sortBy);
    },
    setFilterType: (filterType: FilterType) => {
      set((state) => ({
        filterType,
        ...(state.selectedPriorities.length > 1 &&
          filterType === "AND" && { selectedPriorities: [] }),
      }));
      setPreferencesItem("filter-type", filterType);
    },
    togglePriority: (priority: string) =>
      set((state) => {
        const newSelectedPriorities =
          state.filterType === "AND" && state.selectedPriorities.length > 0
            ? state.selectedPriorities.includes(priority)
              ? []
              : [priority]
            : state.selectedPriorities.includes(priority)
              ? state.selectedPriorities.filter((i) => i !== priority)
              : [...state.selectedPriorities, priority];
        setPreferencesItem(
          "selected-priorities",
          newSelectedPriorities.join(","),
        );
        return {
          selectedPriorities: newSelectedPriorities,
        };
      }),
    setSelectedPriorities: (selectedPriorities: string[]) => {
      set({ selectedPriorities });
      setPreferencesItem("selected-priorities", selectedPriorities.join(","));
    },
    toggleProject: (project: string) =>
      set((state) => {
        const newSelectedProjects = state.selectedProjects.includes(project)
          ? state.selectedProjects.filter((i) => i !== project)
          : [...state.selectedProjects, project];
        setPreferencesItem("selected-projects", newSelectedProjects.join(","));
        return {
          selectedProjects: newSelectedProjects,
        };
      }),
    setSelectedProjects: (selectedProjects: string[]) => {
      set({ selectedProjects });
      setPreferencesItem("selected-projects", selectedProjects.join(","));
    },
    toggleContext: (context: string) =>
      set((state) => {
        const newSelectedContexts = state.selectedContexts.includes(context)
          ? state.selectedContexts.filter((i) => i !== context)
          : [...state.selectedContexts, context];
        setPreferencesItem("selected-contexts", newSelectedContexts.join(","));
        return {
          selectedContexts: newSelectedContexts,
        };
      }),
    setSelectedContexts: (selectedContexts: string[]) => {
      set({ selectedContexts });
      setPreferencesItem("selected-contexts", selectedContexts.join(","));
    },
    toggleTag: (tag: string) =>
      set((state) => {
        const newSelectedTags = state.selectedTags.includes(tag)
          ? state.selectedTags.filter((i) => i !== tag)
          : [...state.selectedTags, tag];
        setPreferencesItem("selected-tags", newSelectedTags.join(","));
        return {
          selectedTags: newSelectedTags,
        };
      }),
    setSelectedTags: (selectedTags: string[]) => {
      set({ selectedTags });
      setPreferencesItem("selected-tags", selectedTags.join(","));
    },
    setHideCompletedTasks: (hideCompletedTasks: boolean) => {
      set({ hideCompletedTasks });
      setPreferencesItem("hide-completed-tasks", hideCompletedTasks.toString());
    },
    setSelectedTaskListIds: (selectedTaskListIds: number[]) => {
      set({ selectedTaskListIds });
      setPreferencesItem(
        "selected-task-list-ids",
        selectedTaskListIds.join(","),
      );
    },
  }));
}

export function useFilterStore<T = FilterState>(
  selector: (state: FilterState) => T = (state) => state as T,
) {
  const store = useContext(zustandContext);
  if (!store) throw new Error("Store is missing the provider");
  return useZustandStore(store, selector);
}
