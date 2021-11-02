import { Box, Container, styled, useMediaQuery, useTheme } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import Header from "./Header";
import Onboarding from "./Onboarding";
import SideSheet from "./SideSheet";
import TaskDialog from "./TaskDialog";
import TaskList from "./TaskList/TaskList";

export const StyledContainer = styled(Container)`
  padding-right: env(safe-area-inset-right);
  padding-left: env(safe-area-inset-left);
  padding-bottom: env(safe-area-inset-bottom);
`;

const Page = () => {
  const theme = useTheme();
  const xs = useMediaQuery(theme.breakpoints.only("xs"));
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
  }, [scrollContainer]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Header divider={scrollTop > 12} />
      <SideSheet />
      <Box
        ref={scrollContainer}
        sx={{ overflowY: "auto", flex: "auto", px: xs ? 0 : 1 }}
      >
        <StyledContainer disableGutters>
          <TaskList />
          <Onboarding />
        </StyledContainer>
      </Box>
      <TaskDialog />
    </Box>
  );
};

export default Page;
