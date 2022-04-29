import { Box, Container, styled } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { useLoading } from "../data/LoadingContext";
import ArchivedTasksDialog from "./ArchivedTasksDialog";
import CloudFileDialog from "./CloudFileDialog";
import ConfirmationDialog from "./ConfirmationDialog";
import FileCreateDialog from "./FileCreateDialog";
import FileManagementDialog from "./FileManagementDialog";
import FilePicker from "./FilePicker";
import Header from "./Header";
import Onboarding from "./Onboarding";
import SideSheet, { MainContainer } from "./SideSheet";
import TaskDialog from "./TaskDialog";
import TaskLists from "./TaskLists";

const SafeAreaContainer = styled(Container)`
  padding-right: env(safe-area-inset-right);
  padding-left: env(safe-area-inset-left);
  padding-bottom: env(safe-area-inset-bottom);
`;

const Page = () => {
  const { loading } = useLoading();
  const scrollContainer = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    const element = scrollContainer.current;
    if (element) {
      const listener = () => setScrollTop(element.scrollTop);
      element.addEventListener("scroll", listener);
      return () => {
        element.removeEventListener("scroll", listener);
      };
    }
  }, [scrollContainer, loading]);

  if (loading) {
    return null;
  }

  return (
    <FilePicker>
      <Header divider={scrollTop > 12} />
      <Box
        data-testid="page"
        sx={{ display: "flex", overflowY: "auto", flex: "auto" }}
      >
        <SideSheet />
        <MainContainer ref={scrollContainer}>
          <SafeAreaContainer disableGutters>
            <TaskLists />
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
    </FilePicker>
  );
};

export default Page;
