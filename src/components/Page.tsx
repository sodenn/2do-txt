import { Box, Container, styled } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { useTask } from "../data/TaskContext";
import FileCreateDialog from "./FileCreateDialog";
import Header from "./Header";
import Onboarding from "./Onboarding";
import SideSheet from "./SideSheet";
import TaskDialog from "./TaskDialog";
import TaskLists from "./TaskLists";

const StyledContainer = styled(Container)`
  padding-right: env(safe-area-inset-right);
  padding-left: env(safe-area-inset-left);
  padding-bottom: env(safe-area-inset-bottom);
`;

const Page = () => {
  const { init } = useTask();
  const scrollContainer = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);

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
  }, [scrollContainer, init]);

  if (!init) {
    return null;
  }

  return (
    <>
      <Header divider={scrollTop > 12} />
      <SideSheet />
      <Box
        data-testid="page"
        ref={scrollContainer}
        sx={{ overflowY: "auto", flex: "auto", px: { sm: 1 } }}
      >
        <StyledContainer disableGutters>
          <TaskLists />
          <Onboarding />
        </StyledContainer>
      </Box>
      <TaskDialog />
      <FileCreateDialog />
    </>
  );
};

export default Page;
