import { Grow } from "@mui/material";
import { SnackbarProvider } from "notistack";
import { Suspense } from "react";
import { useLoaderData } from "react-router-dom";
import { WithChildren } from "../types/common.types";
import AppStoreProvider, { AppLoaderData } from "./AppStoreProvider";
import AppThemeProvider from "./AppThemeProvider";

const ProviderBundle = ({ children }: WithChildren) => {
  const loaderData = useLoaderData() as AppLoaderData;
  return (
    <Suspense fallback={null}>
      <AppStoreProvider
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
      </AppStoreProvider>
    </Suspense>
  );
};

export default ProviderBundle;
