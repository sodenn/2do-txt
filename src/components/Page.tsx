import { Box, Container, Stack, styled } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { useTask } from "../data/TaskContext";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";
import Header from "./Header";
import Onboarding from "./Onboarding";
import SideSheet from "./SideSheet";
import TaskDialog from "./TaskDialog";
import TaskList from "./TaskList";
import TodoFileCreateDialog from "./TodoFileCreateDialog";

const StyledContainer = styled(Container)`
  padding-right: env(safe-area-inset-right);
  padding-left: env(safe-area-inset-left);
  padding-bottom: env(safe-area-inset-bottom);
`;

const Page = () => {
  const scrollContainer = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const { taskLists, activeTaskList } = useTask();

  useEffect(() => {
    const element = scrollContainer?.current;
    if (element) {
      const listener = () => {
        setScrollTop(element.scrollTop);
      };
      element.addEventListener("scroll", listener);
      return () => {
        element.removeEventListener("scroll", listener);
      };
    }
  }, [scrollContainer]);

  return (
    <>
      <Header divider={scrollTop > 12} />
      <SideSheet />
      <Box
        ref={scrollContainer}
        sx={{ overflowY: "auto", flex: "auto", px: { sm: 1 } }}
      >
        <StyledContainer disableGutters>
          {!activeTaskList && (
            <Stack spacing={1}>
              {taskLists.map((taskList, idx) => (
                <TaskList taskList={taskList} showHeader key={idx} />
              ))}
            </Stack>
          )}
          {activeTaskList && <TaskList taskList={activeTaskList} />}
          <Onboarding />
        </StyledContainer>
      </Box>
      <TaskDialog />
      <TodoFileCreateDialog />
      <DeleteConfirmationDialog />
    </>
  );
};

export default Page;
