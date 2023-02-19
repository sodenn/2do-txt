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
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import useTheme, { ThemeMode } from "../stores/theme-store";
import { WithChildren } from "../types/common.types";
import { setKeyboardStyle } from "../utils/keyboard";
import { setPreferencesItem } from "../utils/preferences";
import { hideSplashScreen } from "../utils/splash-screen";
import { setStatusBarStyling } from "../utils/status-bar";

const translations: Record<string, Localization> = {
  en: enUS,
  de: deDE,
};

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
    MuiTooltip: {
      defaultProps: {
        enterDelay: 700,
        enterNextDelay: 700,
        disableTouchListener: true,
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

  setStatusBarStyling(mode);
  setKeyboardStyle(mode);
  hideSplashScreen();
}

const AppThemeProvider = ({ children }: WithChildren) => {
  const {
    i18n: { language },
  } = useTranslation();
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const themeMode = useTheme((state) => state.mode);
  const paletteMode = getPaletteMode(themeMode, prefersDarkMode);
  const theme = useMemo(
    () => createTheme(getThemeOptions(paletteMode), translations[language]),
    [language, paletteMode]
  );

  useEffect(() => applyThemeMode(theme, themeMode), [theme, themeMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

export default AppThemeProvider;
