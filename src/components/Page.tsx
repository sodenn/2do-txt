import { Box, Container, styled } from "@mui/material";
import { useEffect, useRef, useState } from "react";
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
  const scrollContainer = useRef<HTMLDivElement | null>(null);
  const [divider, setDivider] = useState(false);

  useEffect(() => {
    const element = scrollContainer.current;
    if (element) {
      const listener = () => setDivider(element.scrollTop > 12);
      element.addEventListener("scroll", listener);
      return () => {
        element.removeEventListener("scroll", listener);
      };
    }
  }, [scrollContainer]);

  return (
    <FilePicker>
      <Header divider={divider} />
      <Box
        id="scroll-container"
        data-testid="page"
        sx={{ display: "flex", overflowY: "auto", flex: "auto" }}
      >
        <SideSheet />
        <MainContainer ref={scrollContainer}>
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
