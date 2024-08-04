import { BreakpointProvider } from "@/components/Breakpoint";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Page } from "@/components/Page";
import { loader, LoaderData, StoreProvider } from "@/components/StoreProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";

export function App() {
  const [data, setData] = useState<LoaderData>();
  const [error, setError] = useState(false);

  useEffect(() => {
    loader()
      .then((data) => {
        setData(data);
      })
      .catch((error) => {
        setError(error.message);
      });
  }, []);

  if (error) {
    return <ErrorBoundary message={error} />;
  }

  if (!data) {
    return null;
  }

  return (
    <StoreProvider
      filter={data.filter}
      settings={data.settings}
      theme={data.theme}
      task={data.task}
    >
      <BreakpointProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Page />
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </BreakpointProvider>
    </StoreProvider>
  );
}
