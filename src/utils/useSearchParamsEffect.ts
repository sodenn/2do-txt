import { isEqual } from "lodash";
import { useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { FilterState, SearchParams, filterStore } from "../stores/filter-store";

function useSearchParamsEffect() {
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

export default useSearchParamsEffect;
