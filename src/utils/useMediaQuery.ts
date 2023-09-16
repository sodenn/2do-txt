import { getThemeProps, useThemeWithoutDefault as useTheme } from "@mui/system";
import * as React from "react";
import { useSyncExternalStore } from "react";

interface UseMediaQueryOptions {
  defaultMatches?: boolean;
  matchMedia?: typeof window.matchMedia;
  noSsr?: boolean;
  ssrMatchMedia?: (query: string) => { matches: boolean };
}

export function useMediaQuery<Theme = unknown>(
  queryInput: string | ((theme: Theme) => string),
  options: UseMediaQueryOptions = {},
): boolean {
  const theme = useTheme<Theme>();
  const supportMatchMedia =
    typeof window !== "undefined" && typeof window.matchMedia !== "undefined";
  const {
    defaultMatches = false,
    matchMedia = supportMatchMedia ? window.matchMedia : null,
    ssrMatchMedia = null,
    noSsr = false,
  } = getThemeProps({ name: "MuiUseMediaQuery", props: options, theme });

  let query = typeof queryInput === "function" ? queryInput(theme) : queryInput;
  query = query.replace(/^@media( ?)/m, "");

  const getDefaultSnapshot = React.useCallback(
    () => defaultMatches,
    [defaultMatches],
  );

  const getServerSnapshot = React.useMemo(() => {
    if (noSsr && matchMedia) {
      return () => matchMedia!(query).matches;
    }

    if (ssrMatchMedia !== null) {
      const { matches } = ssrMatchMedia(query);
      return () => matches;
    }
    return getDefaultSnapshot;
  }, [getDefaultSnapshot, query, ssrMatchMedia, noSsr, matchMedia]);

  const [getSnapshot, subscribe] = React.useMemo(() => {
    if (matchMedia === null) {
      return [getDefaultSnapshot, () => () => {}];
    }
    const mediaQueryList = matchMedia(query);
    return [
      () => mediaQueryList.matches,
      (notify: () => void) => {
        mediaQueryList.addEventListener("change", notify);
        return () => {
          mediaQueryList.addEventListener("change", notify);
        };
      },
    ];
  }, [getDefaultSnapshot, matchMedia, query]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
