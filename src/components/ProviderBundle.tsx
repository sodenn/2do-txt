import AppThemeProvider from "@/components/AppThemeProvider";
import StoreProvider, { LoaderData } from "@/components/StoreProvider";
import { Grow } from "@mui/material";
import { SnackbarProvider } from "notistack";
import { PropsWithChildren } from "react";
import { useLoaderData } from "react-router-dom";

export default function ProviderBundle({ children }: PropsWithChildren) {
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
  );
}
