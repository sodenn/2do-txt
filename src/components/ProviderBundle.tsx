import { Grow } from "@mui/material";
import { SnackbarProvider } from "notistack";
import { PropsWithChildren, Suspense } from "react";
import { useLoaderData } from "react-router-dom";
import StoreProvider, { LoaderData } from "@/components/StoreProvider";
import AppThemeProvider from "@/components/AppThemeProvider";

export default function ProviderBundle({ children }: PropsWithChildren) {
  const loaderData = useLoaderData() as LoaderData;
  return (
    <Suspense fallback={null}>
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
          <SnackbarProvider
            maxSnack={3}
            preventDuplicate={true}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            TransitionComponent={Grow}
          >
            {children}
          </SnackbarProvider>
        </AppThemeProvider>
      </StoreProvider>
    </Suspense>
  );
}
