import { useThemeStore } from "@/stores/theme-store";
import { PropsWithChildren, useEffect, useState } from "react";

const themeColors = {
  light: "#f9fbfd",
  dark: "#101823",
} as const;

export function ThemeProvider({ children }: PropsWithChildren) {
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);
  const [mounte, setMounte] = useState(false);

  useEffect(() => {
    setMode(mode);
    setMounte(true);

    let themeColor: string;
    const docEl = window.document.documentElement;
    docEl.classList.remove("light", "dark");
    if (mode === "system") {
      const colorShema = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      docEl.classList.add(colorShema);
      themeColor = themeColors[colorShema];
    } else {
      themeColor = themeColors[mode];
      docEl.classList.add(mode);
    }

    const themeColorMetaTag = document.querySelector(
      'meta[name="theme-color"]',
    );
    if (themeColorMetaTag) {
      themeColorMetaTag.setAttribute("content", themeColor);
    }
  }, [mode, setMode]);

  if (!mounte) {
    return null;
  }

  return children;
}
