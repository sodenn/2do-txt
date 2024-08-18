import {
  FilterFields,
  SearchParams,
  useFilterStore,
} from "@/stores/filter-store";
import { isEqual } from "lodash";
import { useCallback, useEffect } from "react";

export function useSearchParamsEffect() {
  const filterStore = useFilterStore((state) => state);

  const updateSearchParams = useCallback((state: FilterFields) => {
    const searchParams = new URLSearchParams(window.location.search);
    const {
      searchTerm,
      activeTaskListId,
      activePriorities,
      activeProjects,
      activeContexts,
      activeTags,
    } = state;
    const params: Partial<SearchParams> = {};
    if (searchTerm) {
      params.term = searchTerm;
    }
    if (activeTaskListId) {
      params.active = encodeURIComponent(activeTaskListId);
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
      const options = Object.keys(params).reduce(
        (memo, key) => {
          // @ts-ignore
          const value = params[key];
          return memo.concat(
            Array.isArray(value) ? value.map((v) => [key, v]) : [[key, value]],
          );
        },
        [] as [string, string][],
      );
      const urlParams = new URLSearchParams(options);
      if (urlParams.size) {
        window.history.replaceState(
          {},
          "",
          `${window.location.pathname}?${urlParams}`,
        );
      } else {
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, []);

  useEffect(() => {
    updateSearchParams(filterStore);
  }, [updateSearchParams, filterStore]);
}
