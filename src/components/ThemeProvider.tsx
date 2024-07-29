import { setStatusBarStyling } from "@/native-api/status-bar";
import { useThemeStore } from "@/stores/theme-store";
import { PropsWithChildren, useEffect, useState } from "react";

export function ThemeProvider({ children }: PropsWithChildren) {
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);
  const [mounte, setMounte] = useState(false);

  useEffect(() => {
    setMode(mode);
    setMounte(true);
    setStatusBarStyling(mode);

    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    if (mode === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(mode);
    }

    const bodyBgColor = window.getComputedStyle(document.body).backgroundColor;
    const themeColorMetaTag = document.querySelector(
      'meta[name="theme-color"]',
    );
    if (themeColorMetaTag) {
      themeColorMetaTag.setAttribute("content", bodyBgColor);
    }
  }, [mode, setMode]);

  if (!mounte) {
    return null;
  }

  return children;
}
