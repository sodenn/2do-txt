import { Grow } from "@mui/material";
import { SnackbarProvider } from "notistack";
import { Suspense } from "react";
import AppThemeProvider from "../components/AppThemeProvider";
import { WithChildren } from "../types/common.types";
import {
  CloudFileDialogProvider,
  CloudStorageProvider,
  WebDAVDialogProvider,
} from "./CloudStorageContext";

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
          <CloudFileDialogProvider>
            <WebDAVDialogProvider>
              <CloudStorageProvider>{children}</CloudStorageProvider>
            </WebDAVDialogProvider>
          </CloudFileDialogProvider>
        </SnackbarProvider>
      </AppThemeProvider>
    </Suspense>
  );
};

export default ProviderBundle;
