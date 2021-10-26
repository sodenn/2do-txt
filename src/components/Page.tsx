import { Box, Container, useMediaQuery, useTheme } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { useTask } from "../data/TaskContext";
import { useAddShortcutListener } from "../utils/shortcuts";
import Header from "./Header";
import Onboarding from "./Onboarding";
import SideSheet from "./SideSheet";
import TaskDialog from "./TaskDialog";
import TaskList from "./TaskList/TaskList";

const Page = () => {
  const theme = useTheme();
  const xs = useMediaQuery(theme.breakpoints.only("xs"));
  const scrollContainer = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const { openTaskDialog } = useTask();

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

  useAddShortcutListener(() => {
    openTaskDialog(true);
  }, ["c", "n"]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Header divider={scrollTop > 12} />
      <SideSheet />
      <Container
        disableGutters={xs}
        ref={scrollContainer}
        sx={{ overflowY: "auto", flex: "auto" }}
      >
        <TaskList />
        <Onboarding />
      </Container>
      <TaskDialog />
    </Box>
  );
};

export default Page;
