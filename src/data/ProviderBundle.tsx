import { Grow } from "@mui/material";
import { SnackbarProvider } from "notistack";
import React, { FC, Suspense } from "react";
import { CloudStorageProvider } from "./CloudStorageContext";
import { ConfirmationDialogProvider } from "./ConfirmationDialogContext";
import { FileManagementProvider } from "./FileManagementContext";
import { FilterProvider } from "./FilterContext";
import { MigrationProvider } from "./MigrationContext";
import { SettingsProvider } from "./SettingsContext";
import { SideSheetProvider } from "./SideSheetContext";
import { TaskProvider } from "./TaskContext";

const ProviderBundle: FC = ({ children }) => {
  return (
    <SnackbarProvider
      maxSnack={3}
      preventDuplicate={true}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      TransitionComponent={Grow as any}
    >
      <Suspense fallback={null}>
        <MigrationProvider>
          <ConfirmationDialogProvider>
            <CloudStorageProvider>
              <SettingsProvider>
                <FilterProvider>
                  <SideSheetProvider>
                    <TaskProvider>
                      <FileManagementProvider>
                        {children}
                      </FileManagementProvider>
                    </TaskProvider>
                  </SideSheetProvider>
                </FilterProvider>
              </SettingsProvider>
            </CloudStorageProvider>
          </ConfirmationDialogProvider>
        </MigrationProvider>
      </Suspense>
    </SnackbarProvider>
  );
};

export default ProviderBundle;
