import { StatusBar, Style } from "@capacitor/status-bar";
import {
  createTheme,
  PaletteMode,
  ThemeOptions,
  useMediaQuery,
} from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import { createContext } from "../utils/Context";
import { useStorage } from "../utils/storage";

type SelectedMode = PaletteMode | "system";

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

const getMode = (
  selectedMode: SelectedMode,
  prefersDarkMode: boolean
): PaletteMode => {
  if (selectedMode === "light" || selectedMode === "dark") {
    return selectedMode;
  } else {
    return prefersDarkMode ? "dark" : "light";
  }
};

export const [AppThemeProvider, useAppTheme] = createContext(() => {
  const init = useRef(false);
  const { getStorageItem, setStorageItem } = useStorage();
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const [selectedMode, _setSelectedMode] = useState<SelectedMode>("system");
  const mode = getMode(selectedMode, prefersDarkMode);
  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  const setSelectedMode = (mode: SelectedMode) => {
    _setSelectedMode(mode);
    StatusBar.setStyle({
      style:
        mode === "light"
          ? Style.Light
          : mode === "dark"
          ? Style.Dark
          : Style.Default,
    }).catch((error) => console.debug(error));
  };

  useEffect(() => {
    getStorageItem("theme-mode")
      .then((value) => {
        if (value === "light" || value === "dark") {
          return value;
        } else {
          return "system";
        }
      })
      .then((mode) => {
        setSelectedMode(mode);
        init.current = true;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefersDarkMode]);

  useEffect(() => {
    if (init.current) {
      setStorageItem("theme-mode", selectedMode);
    }
  }, [setStorageItem, selectedMode]);

  return {
    mode,
    selectedMode,
    setSelectedMode,
    theme,
    prefersDarkMode,
  };
});
