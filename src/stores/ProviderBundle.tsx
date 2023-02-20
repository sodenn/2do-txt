import { Grow } from "@mui/material";
import { SnackbarProvider } from "notistack";
import { Suspense } from "react";
import AppThemeProvider from "../components/AppThemeProvider";
import { WithChildren } from "../types/common.types";

const ProviderBundle = ({ children }: WithChildren) => {
  return (
    <Suspense fallback={null}>
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
    </Suspense>
  );
};

export default ProviderBundle;
