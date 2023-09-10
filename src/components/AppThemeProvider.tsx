import { setKeyboardStyle } from "@/native-api/keyboard";
import { setPreferencesItem } from "@/native-api/preferences";
import { hideSplashScreen } from "@/native-api/splash-screen";
import { setStatusBarStyling } from "@/native-api/status-bar";
import { useThemeStore } from "@/stores/theme-store";
import { CssBaseline, extendTheme } from "@mui/joy";
import type { PaletteRange } from "@mui/joy/styles";
import { CssVarsProvider } from "@mui/joy/styles";
import { useColorScheme } from "@mui/joy/styles/CssVarsProvider";
import { PropsWithChildren, useEffect, useState } from "react";

declare module "@mui/joy/styles" {
  interface ColorPalettePropOverrides {
    // apply to all Joy UI components that support `color` prop
    secondary: true;
    priority: true;
    completed: true;
  }
  interface Palette {
    // this will make the node `secondary` configurable in `extendTheme`
    // and add `secondary` to the theme's palette.
    secondary: PaletteRange;
    priority: PaletteRange;
    completed: PaletteRange;
  }
}

const theme = extendTheme({
  shadow: {
    xs: "unset",
  },
  colorSchemes: {
    light: {
      palette: {
        background: {
          body: "rgb(255, 255, 255)", // because hover bg color is the same as the default body bg color in light mode
          surface: "rgb(255, 255, 255)",
        },
        priority: {
          // Credit:
          // https://github.com/tailwindlabs/tailwindcss/blob/master/src/public/colors.js
          50: "#fdf2f8",
          100: "#fce7f3",
          200: "#fbcfe8",
          300: "#f9a8d4",
          400: "#f472b6",
          500: "#ec4899",
          600: "#db2777",
          700: "#be185d",
          800: "#9d174d",
          900: "#831843",
          // Adjust the global variant tokens as you'd like.
          // The tokens should be the same for all color schemes.
          solidBg: "var(--joy-palette-priority-500)",
          solidColor: "var(--joy-palette-common-white)",
          solidActiveBg: "var(--joy-palette-priority-500)",
          outlinedBorder: "var(--joy-palette-priority-500)",
          outlinedColor: "var(--joy-palette-priority-700)",
          outlinedActiveBg: "var(--joy-palette-priority-100)",
          softColor: "var(--joy-palette-priority-800)",
          softBg: "var(--joy-palette-priority-200)",
          softActiveBg: "var(--joy-palette-priority-300)",
          plainColor: "var(--joy-palette-priority-700)",
          plainActiveBg: "var(--joy-palette-priority-100)",
        },
        completed: {
          50: "#f9fafb",
          100: "#f3f4f6",
          200: "#e5e7eb",
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
          600: "#4b5563",
          700: "#374151",
          800: "#1f2937",
          900: "#111827",
          solidBg: "var(--joy-palette-completed-400)",
          solidActiveBg: "var(--joy-palette-completed-500)",
          outlinedBorder: "var(--joy-palette-completed-500)",
          outlinedColor: "var(--joy-palette-completed-700)",
          outlinedActiveBg: "var(--joy-palette-completed-100)",
          softColor: "var(--joy-palette-completed-800)",
          softBg: "var(--joy-palette-completed-200)",
          softActiveBg: "var(--joy-palette-completed-300)",
          plainColor: "var(--joy-palette-completed-400)",
          plainActiveBg: "var(--joy-palette-completed-100)",
        },
      },
    },
    dark: {
      palette: {
        priority: {
          50: "#fdf2f8",
          100: "#fce7f3",
          200: "#fbcfe8",
          300: "#f9a8d4",
          400: "#f472b6",
          500: "#ec4899",
          600: "#db2777",
          700: "#be185d",
          800: "#9d174d",
          900: "#831843",
          solidBg: "var(--joy-palette-priority-900)",
          solidColor: "var(--joy-palette-common-white)",
          solidActiveBg: "var(--joy-palette-priority-900)",
          outlinedBorder: "var(--joy-palette-priority-900)",
          outlinedColor: "var(--joy-palette-priority-200)",
          outlinedActiveBg: "var(--joy-palette-priority-900)",
          softColor: "var(--joy-palette-priority-500)",
          softBg: "var(--joy-palette-priority-900)",
          softActiveBg: "var(--joy-palette-priority-800)",
          plainColor: "var(--joy-palette-priority-500)",
          plainActiveBg: "var(--joy-palette-priority-900)",
          mainChannel: "var(--joy-palette-priority-mainChannel)",
          lightChannel: "var(--joy-palette-priority-lightChannel)",
          darkChannel: "var(--joy-palette-priority-darkChannel)",
        },
        completed: {
          50: "#f9fafb",
          100: "#f3f4f6",
          200: "#e5e7eb",
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
          600: "#4b5563",
          700: "#374151",
          800: "#1f2937",
          900: "#111827",
          solidBg: "var(--joy-palette-completed-400)",
          solidActiveBg: "var(--joy-palette-completed-500)",
          outlinedBorder: "var(--joy-palette-completed-500)",
          outlinedColor: "var(--joy-palette-completed-700)",
          outlinedActiveBg: "var(--joy-palette-completed-100)",
          softColor: "var(--joy-palette-completed-800)",
          softBg: "var(--joy-palette-completed-200)",
          softActiveBg: "var(--joy-palette-completed-300)",
          plainColor: "var(--joy-palette-completed-500)",
          plainActiveBg: "var(--joy-palette-completed-100)",
        },
      },
    },
  },
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
    JoyInput: {
      defaultProps: {
        spellCheck: false,
      },
    },
  },
});

function ApplyTheme() {
  const mode = useThemeStore((state) => state.mode);
  const { setMode } = useColorScheme();

  useEffect(() => {
    requestAnimationFrame(() => {
      const bodyBgColor = window.getComputedStyle(
        document.body,
      ).backgroundColor;
      const themeColorMetaTag = document.querySelector(
        'meta[name="theme-color"]',
      );
      if (themeColorMetaTag) {
        themeColorMetaTag.setAttribute("content", bodyBgColor);
      }
    });
    setMode(mode);
    setPreferencesItem("theme-mode", mode);
    setStatusBarStyling(mode);
    setKeyboardStyle(mode);
    hideSplashScreen();
  }, [mode, setMode]);

  return null;
}

export function AppThemeProvider({ children }: PropsWithChildren) {
  const [mounted, setMounted] = useState(false);
  const mode = useThemeStore((state) => state.mode);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <CssVarsProvider theme={theme} defaultMode={mode} disableNestedContext>
      <CssBaseline />
      <ApplyTheme />
      {children}
    </CssVarsProvider>
  );
}
