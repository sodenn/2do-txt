import { AppThemeProvider } from "@/components/AppThemeProvider";
import { BreakpointProvider } from "@/components/Breakpoint";
import { LoaderData, StoreProvider } from "@/components/StoreProvider";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NonIndexRouteObject, Outlet, useLoaderData } from "react-router-dom";

export { ErrorBoundary } from "@/components/ErrorBoundary";

export function Component() {
  const loaderData = useLoaderData() as LoaderData;
  return (
    <StoreProvider
      filter={loaderData.filter}
      settings={loaderData.settings}
      platform={loaderData.platform}
      theme={loaderData.theme}
      task={loaderData.task}
      cloud={loaderData.cloud}
      network={loaderData.network}
    >
      <BreakpointProvider>
        <AppThemeProvider>
          <TooltipProvider delayDuration={500}>
            <Outlet />
            <Toaster />
          </TooltipProvider>
        </AppThemeProvider>
      </BreakpointProvider>
    </StoreProvider>
  );
}

export const shouldRevalidate: NonIndexRouteObject["shouldRevalidate"] = ({
  currentUrl,
  nextUrl,
}) => {
  // disable revalidation when the search params change
  return currentUrl.search === nextUrl.search;
};
