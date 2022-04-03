import { StatusBar, Style } from "@capacitor/status-bar";
import {
  alpha,
  createTheme,
  CssBaseline,
  PaletteMode,
  Theme,
  ThemeOptions,
  ThemeProvider,
  useMediaQuery,
} from "@mui/material";
import { deDE, enUS, Localization } from "@mui/material/locale";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { createContext } from "../utils/Context";
import { useStorage } from "../utils/storage";

const translations: Record<string, Localization> = {
  en: enUS,
  de: deDE,
};

export type ThemeMode = PaletteMode | "system";

const buttonFocusStyle = (theme: Theme) => ({
  backgroundColor: alpha(
    theme.palette.text.primary,
    theme.palette.action.hoverOpacity
  ),
});

const getThemeOptions = (mode: PaletteMode): ThemeOptions => ({
  components: {
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true,
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          "&:focus": buttonFocusStyle(theme),
        }),
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: ({ theme }) => ({
          "&.Mui-focusVisible": buttonFocusStyle(theme),
        }),
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
        style: {
          textTransform: "none",
        },
      },
      styleOverrides: {
        outlined: ({ theme }) => ({
          "&:focus": buttonFocusStyle(theme),
        }),
        text: ({ theme }) => ({
          "&:focus": buttonFocusStyle(theme),
        }),
      },
    },
    MuiButtonGroup: {
      defaultProps: {
        disableElevation: true,
        disableRipple: true,
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

const [AppThemeProvider, useAppTheme] = createContext(() => {
  const { getStorageItem, setStorageItem } = useStorage();
  const {
    i18n: { language },
  } = useTranslation();
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const [themeMode, _setThemeMode] = useState<ThemeMode>("system");
  const paletteMode = getPaletteMode(themeMode, prefersDarkMode);
  const theme = useMemo(
    () => createTheme(getThemeOptions(paletteMode), translations[language]),
    [language, paletteMode]
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

  useEffect(() => {
    getStorageItem("theme-mode").then((themeMode) =>
      setThemeMode((themeMode as ThemeMode) || "system")
    );
  }, [getStorageItem, setThemeMode, prefersDarkMode]);

  return {
    setThemeMode,
    themeMode,
    theme,
  };
});

const AppTheme: FC = ({ children }) => {
  return (
    <AppThemeProvider>
      <AppThemeChild>{children}</AppThemeChild>
    </AppThemeProvider>
  );
};

const AppThemeChild: FC = ({ children }) => {
  const { theme } = useAppTheme();
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

export { AppTheme, useAppTheme };
