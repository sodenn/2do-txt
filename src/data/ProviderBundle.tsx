import { Grow } from "@mui/material";
import { SnackbarProvider } from "notistack";
import { Suspense } from "react";
import { WithChildren } from "../types/common.types";
import { AppTheme } from "./AppThemeContext";
import { ArchivedTaskProvider } from "./ArchivedTaskContext";
import { ArchivedTasksDialogProvider } from "./ArchivedTasksDialogContext";
import { CloudStorageProvider } from "./CloudStorageContext";
import { WebDAVDialogProvider } from "./CloudStorageContext/WebDAVDialogContext";
import { ConfirmationDialogProvider } from "./ConfirmationDialogContext";
import { FileCreateDialogProvider } from "./FileCreateDialogContext";
import { FileManagementDialogProvider } from "./FileManagementDialogContext";
import { FilterProvider } from "./FilterContext";
import { NetworkProvider } from "./NetworkContext";
import { SettingsProvider } from "./SettingsContext";
import { ShortcutsDialogProvider } from "./ShortcutsDialogContext";
import { SideSheetProvider } from "./SideSheetContext";
import { TaskProvider } from "./TaskContext";
import { TaskDialogProvider } from "./TaskDialogContext";

const ProviderBundle = ({ children }: WithChildren) => {
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
          <ConfirmationDialogProvider>
            <NetworkProvider>
              <WebDAVDialogProvider>
                <CloudStorageProvider>
                  <SettingsProvider>
                    <FilterProvider>
                      <SideSheetProvider>
                        <ArchivedTasksDialogProvider>
                          <ArchivedTaskProvider>
                            <TaskProvider>
                              <FileManagementDialogProvider>
                                <ShortcutsDialogProvider>
                                  <FileCreateDialogProvider>
                                    <TaskDialogProvider>
                                      {children}
                                    </TaskDialogProvider>
                                  </FileCreateDialogProvider>
                                </ShortcutsDialogProvider>
                              </FileManagementDialogProvider>
                            </TaskProvider>
                          </ArchivedTaskProvider>
                        </ArchivedTasksDialogProvider>
                      </SideSheetProvider>
                    </FilterProvider>
                  </SettingsProvider>
                </CloudStorageProvider>
              </WebDAVDialogProvider>
            </NetworkProvider>
          </ConfirmationDialogProvider>
        </SnackbarProvider>
      </AppTheme>
    </Suspense>
  );
};

export default ProviderBundle;
