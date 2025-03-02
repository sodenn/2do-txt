import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type Breakpoint = "sm" | "md" | "lg" | "xl" | "2xl";

interface BreakpointItem {
  name: Breakpoint;
  value: string;
  numValue: number;
}

function getBreakpointItems(): BreakpointItem[] {
  return [
    {
      name: "sm",
      value: "40rem",
      numValue: 40,
    },
    {
      name: "md",
      value: "48rem",
      numValue: 48,
    },
    {
      name: "lg",
      value: "64rem",
      numValue: 64,
    },
    {
      name: "xl",
      value: "80rem",
      numValue: 80,
    },
    {
      name: "2xl",
      value: "96rem",
      numValue: 96,
    },
  ];
}

interface BreakpointContextType {
  currentBreakpoint: Breakpoint | undefined;
  isBreakpointActive: (breakpoint: Breakpoint) => boolean;
}

const BreakpointContext = createContext<BreakpointContextType | undefined>(
  undefined,
);

function getCurrentBreakpoint(breakpoints: BreakpointItem[]) {
  for (const breakpoint of breakpoints.toReversed()) {
    if (window.matchMedia(`(width >= ${breakpoint.value})`).matches) {
      return breakpoint.name;
    }
  }
}

export function BreakpointProvider({ children }: PropsWithChildren) {
  const breakpointItems = useMemo(() => getBreakpointItems(), []);
  const [currentBreakpoint, setCurrentBreakpoint] = useState(
    getCurrentBreakpoint(breakpointItems),
  );

  const isBreakpointActive = (breakpoint: Breakpoint): boolean => {
    if (!currentBreakpoint) {
      return false;
    }

    const breakpointItem = breakpointItems.find((i) => i.name === breakpoint);
    const currentBreakpointItem = breakpointItems.find(
      (i) => i.name === currentBreakpoint,
    );
    if (!breakpointItem || !currentBreakpointItem) {
      return false;
    }

    return breakpointItem.numValue <= currentBreakpointItem.numValue;
  };

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      const newBreakpoint = getCurrentBreakpoint(breakpointItems);
      if (currentBreakpoint !== newBreakpoint) {
        setCurrentBreakpoint(newBreakpoint);
      }
    });
    observer.observe(document.body);
    return () => {
      observer.disconnect();
    };
  }, [breakpointItems, currentBreakpoint]);

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
