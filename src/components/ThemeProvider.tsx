import { useThemeStore } from "@/stores/theme-store";
import { PropsWithChildren, useEffect, useState } from "react";

export function ThemeProvider({ children }: PropsWithChildren) {
  const mode = useThemeStore((state) => state.mode);
  const [mounte, setMounte] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    setMounte(true);
    if (mode === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
      return;
    }
    root.classList.add(mode);
  }, [mode]);

  if (!mounte) {
    return null;
  }

  return children;
}
