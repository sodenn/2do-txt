import { ArchivedTasksDialog } from "@/components/ArchivedTasksDialog";
import { CloudFileDialog } from "@/components/CloudFileDialog";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { FileCreateDialog } from "@/components/FileCreateDialog";
import { FileManagementDialog } from "@/components/FileManagementDialog";
import { FilePicker } from "@/components/FilePicker";
import { Header } from "@/components/Header";
import { Onboarding } from "@/components/Onboarding";
import { PageEffect } from "@/components/PageEffect";
import { ShortcutsDialog } from "@/components/ShortcutsDialog";
import { MainContainer, SideSheet } from "@/components/SideSheet";
import { TaskDialog } from "@/components/TaskDialog";
import { TaskView } from "@/components/TaskView";
import { WebDAVDialog } from "@/components/WebDAVDialog";
import { useScrollingStore } from "@/stores/scrolling-store";
import { Box, Container, styled } from "@mui/joy";

const SafeAreaContainer = styled(Container)({
  paddingRight: "env(safe-area-inset-right)",
  paddingLeft: "env(safe-area-inset-left)",
  paddingBottom: "env(safe-area-inset-bottom)",
});

export function Page() {
  const top = useScrollingStore((state) => state.top);
  return (
    <FilePicker>
      <Header divider={!top} />
      <Box
        data-testid="page"
        sx={{ display: "flex", overflowY: "auto", flex: "auto" }}
      >
        <SideSheet />
        <MainContainer>
          <SafeAreaContainer disableGutters id="ptr-container">
            <TaskView />
            <Onboarding />
          </SafeAreaContainer>
        </MainContainer>
      </Box>
      <TaskDialog />
      <FileCreateDialog />
      <CloudFileDialog />
      <FileManagementDialog />
      <ConfirmationDialog />
      <ArchivedTasksDialog />
      <ShortcutsDialog />
      <WebDAVDialog />
      <PageEffect />
    </FilePicker>
  );
}
