import { AppThemeProvider } from "@/components/AppThemeProvider";
import { SnackbarProvider } from "@/components/Snackbar";
import { LoaderData, StoreProvider } from "@/components/StoreProvider";
import { PropsWithChildren } from "react";
import { useLoaderData } from "react-router-dom";

export function ProviderBundle({ children }: PropsWithChildren) {
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
        <SnackbarProvider>{children}</SnackbarProvider>
      </AppThemeProvider>
    </StoreProvider>
  );
}
