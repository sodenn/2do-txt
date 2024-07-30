import {
  FilterStoreData,
  SearchParams,
  useFilterStore,
} from "@/stores/filter-store";
import { isEqual } from "lodash";
import { useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export function useSearchParamsEffect() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filterStore = useFilterStore((state) => state);

  const updateSearchParams = useCallback(
    (state: FilterStoreData) => {
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
        setSearchParams(params);
      }
    },
    [searchParams, setSearchParams],
  );

  useEffect(() => {
    updateSearchParams(filterStore);
  }, [updateSearchParams, filterStore]);
}
