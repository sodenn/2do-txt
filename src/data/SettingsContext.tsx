import { StatusBar, Style } from "@capacitor/status-bar";
import {
  createTheme,
  PaletteMode,
  ThemeOptions,
  useMediaQuery,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createContext } from "../utils/Context";
import { useStorage } from "../utils/storage";

export type ThemeMode = PaletteMode | "system";

const commonThemeOptions: ThemeOptions = {
  components: {
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true,
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
        style: {
          textTransform: "none",
        },
      },
    },
    MuiButtonGroup: {
      defaultProps: {
        disableElevation: true,
        disableRipple: true,
      },
    },
  },
};

const getDesignTokens = (mode: PaletteMode): ThemeOptions => ({
  ...commonThemeOptions,
  palette: {
    mode,
    ...(mode === "light"
      ? {}
      : {
          background: {
            default: "#0a1726",
            paper: "#0a1726",
          },
        }),
  },
});

const getPaletteMode = (
  selectedMode: ThemeMode,
  prefersDarkMode: boolean
): PaletteMode => {
  if (selectedMode === "light" || selectedMode === "dark") {
    return selectedMode;
  } else {
    return prefersDarkMode ? "dark" : "light";
  }
};

const [SettingsContextProvider, useSettings] = createContext(() => {
  const { getStorageItem, setStorageItem } = useStorage();
  const [createCreationDate, setCreateCreationDate] = useState(false);
  const [createCompletionDate, setCreateCompletionDate] = useState(false);
  const [showNotifications, _setShowNotifications] = useState(false);
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const [themeMode, _setThemeMode] = useState<ThemeMode>("system");
  const paletteMode = getPaletteMode(themeMode, prefersDarkMode);
  const theme = useMemo(
    () => createTheme(getDesignTokens(paletteMode)),
    [paletteMode]
  );

  const setThemeMode = useCallback(
    (mode: ThemeMode) => {
      _setThemeMode(mode);
      setStorageItem("theme-mode", mode);

      const themeColorMetaTag = document.querySelector(
        'meta[name="theme-color"]'
      );
      if (themeColorMetaTag) {
        themeColorMetaTag.setAttribute(
          "content",
          theme.palette.background.default
        );
      }

      StatusBar.setStyle({
        style:
          mode === "light"
            ? Style.Light
            : mode === "dark"
            ? Style.Dark
            : Style.Default,
      }).catch((error) => void error);
    },
    [setStorageItem, theme.palette.background.default]
  );

  const toggleCreateCompletionDate = useCallback(() => {
    setCreateCompletionDate((value) => {
      const newValue = !value;
      setStorageItem("create-completion-date", newValue.toString());
      return newValue;
    });
  }, [setCreateCompletionDate, setStorageItem]);

  const toggleCreateCreationDate = useCallback(() => {
    setCreateCreationDate((value) => {
      const newValue = !value;
      setStorageItem("create-creation-date", newValue.toString());
      return newValue;
    });
  }, [setCreateCreationDate, setStorageItem]);

  const setShowNotifications = useCallback(
    (value: boolean) => {
      setStorageItem("show-notifications", value.toString());
      _setShowNotifications(value);
    },
    [setStorageItem]
  );

  useEffect(() => {
    getStorageItem("theme-mode").then((themeMode) =>
      setThemeMode((themeMode as ThemeMode) || "system")
    );
  }, [getStorageItem, setThemeMode, prefersDarkMode]);

  useEffect(() => {
    Promise.all([
      getStorageItem("show-notifications"),
      getStorageItem("create-creation-date"),
      getStorageItem("create-completion-date"),
    ]).then(([showNotifications, createCreationDate, createCompletionDate]) => {
      _setShowNotifications(showNotifications === "true");
      setCreateCreationDate(
        !createCreationDate ? true : createCreationDate === "true"
      );
      setCreateCompletionDate(createCompletionDate === "true");
    });
  }, [getStorageItem]);

  return {
    createCreationDate,
    createCompletionDate,
    setThemeMode,
    toggleCreateCompletionDate,
    toggleCreateCreationDate,
    showNotifications,
    setShowNotifications,
    themeMode,
    theme,
  };
});

export { SettingsContextProvider, useSettings };
