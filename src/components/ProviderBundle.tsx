import { AppThemeProvider } from "@/components/AppThemeProvider";
import { SnackbarProvider } from "@/components/Snackbar";
import { LoaderData, StoreProvider } from "@/components/StoreProvider";
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
      <AppThemeProvider>
        <SnackbarProvider>
          <Outlet />
        </SnackbarProvider>
      </AppThemeProvider>
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
