import { Box, Container, styled } from "@mui/material";
import useScrollingStore from "../stores/scrolling-store";
import ArchivedTasksDialog from "./ArchivedTasksDialog";
import CloudFileDialog from "./CloudFileDialog";
import ConfirmationDialog from "./ConfirmationDialog";
import FileCreateDialog from "./FileCreateDialog";
import FileManagementDialog from "./FileManagementDialog";
import FilePicker from "./FilePicker";
import Header from "./Header";
import Onboarding from "./Onboarding";
import PageEffect from "./PageEffect";
import ShortcutsDialog from "./ShortcutsDialog";
import SideSheet, { MainContainer } from "./SideSheet";
import TaskDialog from "./TaskDialog";
import TaskView from "./TaskView";
import WebDAVDialog from "./WebDAVDialog";

const SafeAreaContainer = styled(Container)({
  paddingRight: "env(safe-area-inset-right)",
  paddingLeft: "env(safe-area-inset-left)",
  paddingBottom: "env(safe-area-inset-bottom)",
});

const Page = () => {
  const top = useScrollingStore((state) => state.top);
  return (
    <FilePicker>
      <Header divider={!top} />
      <Box
        id="scroll-container"
        data-testid="page"
        sx={{ display: "flex", overflowY: "auto", flex: "auto" }}
      >
        <SideSheet />
        <MainContainer>
          <SafeAreaContainer disableGutters>
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
};

export default Page;
