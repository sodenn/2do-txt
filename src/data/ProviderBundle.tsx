import { Grow } from "@mui/material";
import { SnackbarProvider } from "notistack";
import { Suspense } from "react";
import { WithChildren } from "../types/common.types";
import { AppTheme } from "./AppThemeContext";
import { ArchivedTaskProvider } from "./ArchivedTaskContext";
import { ArchivedTasksDialogProvider } from "./ArchivedTasksDialogContext";
import {
  CloudFileDialogProvider,
  CloudStorageProvider,
  WebDAVDialogProvider,
} from "./CloudStorageContext";
import { ConfirmationDialogProvider } from "./ConfirmationDialogContext";
import { FileCreateDialogProvider } from "./FileCreateDialogContext";
import { FileManagementDialogProvider } from "./FileManagementDialogContext";
import { FilePickerProvider } from "./FilePickerContext";
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
          TransitionComponent={Grow}
        >
          <ConfirmationDialogProvider>
            <NetworkProvider>
              <CloudFileDialogProvider>
                <WebDAVDialogProvider>
                  <CloudStorageProvider>
                    <SettingsProvider>
                      <FilterProvider>
                        <SideSheetProvider>
                          <FilePickerProvider>
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
                          </FilePickerProvider>
                        </SideSheetProvider>
                      </FilterProvider>
                    </SettingsProvider>
                  </CloudStorageProvider>
                </WebDAVDialogProvider>
              </CloudFileDialogProvider>
            </NetworkProvider>
          </ConfirmationDialogProvider>
        </SnackbarProvider>
      </AppTheme>
    </Suspense>
  );
};

export default ProviderBundle;
