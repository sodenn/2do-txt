import { Grow } from "@mui/material";
import { SnackbarProvider } from "notistack";
import { FC, Suspense } from "react";
import { AppTheme } from "./AppThemeContext";
import { CloudStorageProvider } from "./CloudStorageContext";
import { ConfirmationDialogProvider } from "./ConfirmationDialogContext";
import { FileCreateDialogProvider } from "./FileCreateDialogContext";
import { FileManagementDialogProvider } from "./FileManagementDialogContext";
import { FilterProvider } from "./FilterContext";
import { LoadingProvider } from "./LoadingContext";
import { MigrationProvider } from "./MigrationContext";
import { NetworkProvider } from "./NetworkContext";
import { SettingsProvider } from "./SettingsContext";
import { SideSheetProvider } from "./SideSheetContext";
import { TaskProvider } from "./TaskContext";
import { TaskDialogProvider } from "./TaskDialogContext";

const ProviderBundle: FC = ({ children }) => {
  return (
    <Suspense fallback={null}>
      <AppTheme>
        <SnackbarProvider
          maxSnack={3}
          preventDuplicate={true}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          TransitionComponent={Grow as any}
        >
          <LoadingProvider>
            <MigrationProvider>
              <ConfirmationDialogProvider>
                <NetworkProvider>
                  <CloudStorageProvider>
                    <SettingsProvider>
                      <FilterProvider>
                        <SideSheetProvider>
                          <TaskProvider>
                            <FileManagementDialogProvider>
                              <FileCreateDialogProvider>
                                <TaskDialogProvider>
                                  {children}
                                </TaskDialogProvider>
                              </FileCreateDialogProvider>
                            </FileManagementDialogProvider>
                          </TaskProvider>
                        </SideSheetProvider>
                      </FilterProvider>
                    </SettingsProvider>
                  </CloudStorageProvider>
                </NetworkProvider>
              </ConfirmationDialogProvider>
            </MigrationProvider>
          </LoadingProvider>
        </SnackbarProvider>
      </AppTheme>
    </Suspense>
  );
};

export default ProviderBundle;
