import { KeyboardStyle } from "@capacitor/keyboard";
import { StatusBar, Style } from "@capacitor/status-bar";
import {
  createTheme,
  CssBaseline,
  PaletteMode,
  Theme,
  ThemeOptions,
  ThemeProvider,
  useMediaQuery,
} from "@mui/material";
import { deDE, enUS, Localization } from "@mui/material/locale";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLoaderData } from "react-router-dom";
import { WithChildren } from "../types/common.types";
import { createContext } from "../utils/Context";
import { setKeyboardStyle } from "../utils/keyboard";
import { setPreferencesItem } from "../utils/preferences";
import { LoaderData } from "./loader";

const translations: Record<string, Localization> = {
  en: enUS,
  de: deDE,
};

export type ThemeMode = PaletteMode | "system";

const getThemeOptions = (mode: PaletteMode): ThemeOptions => ({
  components: {
    MuiButtonBase: {
      defaultProps: {
        disableTouchRipple: true,
      },
    },
    MuiTab: {
      defaultProps: {
        disableTouchRipple: true,
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
  },
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
  themeMode: ThemeMode,
  prefersDarkMode: boolean
): PaletteMode => {
  if (themeMode === "light" || themeMode === "dark") {
    return themeMode;
  } else {
    return prefersDarkMode ? "dark" : "light";
  }
};

function applyThemeMode(theme: Theme, mode: ThemeMode) {
  setPreferencesItem("theme-mode", mode);

  const themeColorMetaTag = document.querySelector('meta[name="theme-color"]');
  if (themeColorMetaTag) {
    themeColorMetaTag.setAttribute("content", theme.palette.background.default);
  }

  StatusBar.setStyle({
    style:
      mode === "light"
        ? Style.Light
        : mode === "dark"
        ? Style.Dark
        : Style.Default,
  }).catch((error) => void error);

  setKeyboardStyle({
    style:
      mode === "light"
        ? KeyboardStyle.Light
        : mode === "dark"
        ? KeyboardStyle.Dark
        : KeyboardStyle.Default,
  });
}

const [AppThemeProvider, useAppTheme] = createContext(() => {
  const {
    i18n: { language },
  } = useTranslation();
  const data = useLoaderData() as LoaderData;
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const [themeMode, setThemeMode] = useState<ThemeMode>(data.themeMode);
  const paletteMode = getPaletteMode(themeMode, prefersDarkMode);
  const theme = useMemo(
    () => createTheme(getThemeOptions(paletteMode), translations[language]),
    [language, paletteMode]
  );

  useEffect(() => applyThemeMode(theme, themeMode), [theme, themeMode]);

  return {
    setThemeMode,
    themeMode,
    theme,
  };
});

const AppTheme = ({ children }: WithChildren) => {
  return (
    <AppThemeProvider>
      <AppThemeInternal>{children}</AppThemeInternal>
    </AppThemeProvider>
  );
};

const AppThemeInternal = ({ children }: WithChildren) => {
  const { theme } = useAppTheme();
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

export { AppTheme, useAppTheme };
