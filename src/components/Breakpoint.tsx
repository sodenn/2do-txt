import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import resolveConfig from "tailwindcss/resolveConfig";
import tailwindConfig from "../../tailwind.config";

const config = resolveConfig(tailwindConfig);
const screens = config.theme.screens;

type Breakpoint = keyof typeof config.theme.screens;

interface BreakpointContextType {
  currentBreakpoint: Breakpoint | undefined;
  isBreakpointActive: (breakpoint: Breakpoint) => boolean;
}

const BreakpointContext = createContext<BreakpointContextType | undefined>(
  undefined,
);

function getCurrentBreakpoint() {
  const width = typeof window !== "undefined" ? window.innerWidth : 0;
  return (Object.keys(screens) as Breakpoint[]).reverse().find((breakpoint) => {
    return width >= parseInt(screens[breakpoint]);
  });
}

export function BreakpointProvider({ children }: PropsWithChildren) {
  const [currentBreakpoint, setCurrentBreakpoint] = useState(
    getCurrentBreakpoint(),
  );

  const isBreakpointActive = (breakpoint: Breakpoint): boolean => {
    if (!currentBreakpoint) {
      return false;
    }
    const breakpointValue = screens[breakpoint];
    const currentBreakpointValue = screens[currentBreakpoint];
    return parseInt(breakpointValue) <= parseInt(currentBreakpointValue);
  };

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      const newBreakpoint = getCurrentBreakpoint();
      if (currentBreakpoint !== newBreakpoint) {
        setCurrentBreakpoint(newBreakpoint);
      }
    });
    observer.observe(document.body);
    return () => {
      observer.disconnect();
    };
  }, [currentBreakpoint]);

  return (
    <BreakpointContext.Provider
      value={{ currentBreakpoint, isBreakpointActive }}
    >
      {children}
    </BreakpointContext.Provider>
  );
}

export const useBreakpoint = () => {
  const context = useContext(BreakpointContext);
  if (!context) {
    throw new Error("useBreakpoint must be used within a BreakpointProvider");
  }
  return context;
};
