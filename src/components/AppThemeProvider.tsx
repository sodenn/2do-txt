import { setKeyboardStyle } from "@/native-api/keyboard";
import { setPreferencesItem } from "@/native-api/preferences";
import { hideSplashScreen } from "@/native-api/splash-screen";
import { setStatusBarStyling } from "@/native-api/status-bar";
import { ThemeMode, useThemeStore } from "@/stores/theme-store";
import { extendTheme } from "@mui/joy";
import { CssVarsProvider as JoyCssVarsProvider } from "@mui/joy/styles";
import { PaletteMode, ThemeOptions, useMediaQuery } from "@mui/material";
import { Localization, deDE, enUS } from "@mui/material/locale";
import {
  THEME_ID as MATERIAL_THEME_ID,
  Experimental_CssVarsProvider as MaterialCssVarsProvider,
  experimental_extendTheme as materialExtendTheme,
} from "@mui/material/styles";
import { CssVarsTheme } from "@mui/material/styles/experimental_extendTheme";
import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

const translations: Record<string, Localization> = {
  en: enUS,
  de: deDE,
};

const joyTheme = extendTheme({
  components: {
    JoyAutocomplete: {
      styleOverrides: {
        listbox: ({ theme }) => ({
          zIndex: theme.zIndex.modal,
        }),
      },
    },
    JoyMenu: {
      styleOverrides: {
        root: ({ theme }) => ({
          zIndex: theme.zIndex.modal,
        }),
      },
    },
    JoySelect: {
      styleOverrides: {
        listbox: ({ theme }) => ({
          zIndex: theme.zIndex.modal,
        }),
      },
    },
    JoyTooltip: {
      defaultProps: {
        variant: "soft",
      },
    },
  },
});

function getThemeOptions(mode: PaletteMode): ThemeOptions {
  return {
    // components: {
    //   MuiButtonBase: {
    //     defaultProps: {
    //       disableTouchRipple: true,
    //     },
    //   },
    //   MuiTab: {
    //     defaultProps: {
    //       disableTouchRipple: true,
    //     },
    //   },
    //   MuiTooltip: {
    //     defaultProps: {
    //       enterDelay: 700,
    //       enterNextDelay: 700,
    //       disableTouchListener: true,
    //     },
    //   },
    //   MuiButton: {
    //     defaultProps: {
    //       disableElevation: true,
    //       style: {
    //         textTransform: "none",
    //       },
    //     },
    //   },
    //   MuiTextField: {
    //     defaultProps: {
    //       spellCheck: false,
    //     },
    //   },
    // },
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
  };
}

export function usePaletteMode() {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const getPaletteMode = useCallback(
    (mode: ThemeMode) => {
      if (mode === "light" || mode === "dark") {
        return mode;
      } else {
        return prefersDarkMode ? "dark" : "light";
      }
    },
    [prefersDarkMode],
  );
  return useMemo(() => ({ getPaletteMode }), [getPaletteMode]);
}

function useThemeMode(): { paletteMode: PaletteMode; themeMode: ThemeMode } {
  const { getPaletteMode } = usePaletteMode();
  const themeMode = useThemeStore((state) => state.mode);
  const paletteMode = getPaletteMode(themeMode);
  return {
    themeMode,
    paletteMode,
  };
}

function applyThemeMode(theme: CssVarsTheme, mode: ThemeMode) {
  setPreferencesItem("theme-mode", mode);
  const themeColorMetaTag = document.querySelector('meta[name="theme-color"]');
  if (themeColorMetaTag) {
    themeColorMetaTag.setAttribute(
      "content",
      theme.vars.palette.background.default,
    );
  }
  setStatusBarStyling(mode);
  setKeyboardStyle(mode);
  hideSplashScreen();
}

export function AppThemeProvider({ children }: PropsWithChildren) {
  const {
    i18n: { language },
  } = useTranslation();
  const { paletteMode, themeMode } = useThemeMode();
  const theme = useMemo(
    () =>
      materialExtendTheme(getThemeOptions(paletteMode), translations[language]),
    [language, paletteMode],
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    applyThemeMode(theme, themeMode);
  }, [themeMode, theme]);

  if (!mounted) {
    return null;
  }

  return (
    <MaterialCssVarsProvider
      theme={{ [MATERIAL_THEME_ID]: theme }}
      defaultMode="system"
    >
      <JoyCssVarsProvider theme={joyTheme} defaultMode="system">
        {children}
      </JoyCssVarsProvider>
    </MaterialCssVarsProvider>
  );
}
