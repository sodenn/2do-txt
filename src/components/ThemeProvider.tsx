import { useThemeStore } from "@/stores/theme-store";
import { PropsWithChildren, useEffect, useState } from "react";

export function ThemeProvider({ children }: PropsWithChildren) {
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);
  const [mounte, setMounte] = useState(false);

  useEffect(() => {
    setMode(mode);
    setMounte(true);

    const docEl = window.document.documentElement;
    docEl.classList.remove("light", "dark");
    if (mode === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      docEl.classList.add(systemTheme);
    } else {
      docEl.classList.add(mode);
    }

    const rootEl = document.querySelector<HTMLDivElement>("#root");
    const bodyBgColor =
      rootEl && window.getComputedStyle(rootEl).backgroundColor;
    const themeColorMetaTag = document.querySelector(
      'meta[name="theme-color"]',
    );
    if (themeColorMetaTag && bodyBgColor) {
      themeColorMetaTag.setAttribute("content", bodyBgColor);
    }
  }, [mode, setMode]);

  if (!mounte) {
    return null;
  }

  return children;
}
