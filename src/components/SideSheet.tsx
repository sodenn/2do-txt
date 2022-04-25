import { TabContext, TabPanel } from "@mui/lab";
import {
  Box,
  styled,
  SwipeableDrawer,
  Tab,
  Tabs,
  Toolbar,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { forwardRef, PropsWithChildren, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSideSheet } from "../data/SideSheetContext";
import { useTask } from "../data/TaskContext";
import Filter from "./Filter";
import Settings from "./Settings";

const drawerWidth = 320;

export const SideSheetHeaderContainer = styled("div", {
  shouldForwardProp: (prop) => prop !== "open",
})<{ open: boolean }>(({ theme, open }) => ({
  [theme.breakpoints.up("lg")]: {
    transition: theme.transitions.create(["margin", "width"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    ...(open && {
      marginLeft: `${drawerWidth}px`,
      transition: theme.transitions.create(["margin", "width"], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
    }),
  },
}));

const SideSheetMain = styled("main", {
  shouldForwardProp: (prop) => prop !== "open",
})<{
  open: boolean;
}>(({ theme, open }) => ({
  overflowY: "auto",
  flex: "auto",
  [theme.breakpoints.up("sm")]: {
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
  },
  [theme.breakpoints.up("lg")]: {
    flexGrow: 1,
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: `-${drawerWidth}px`,
    ...(open && {
      transition: theme.transitions.create("margin", {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0,
    }),
  },
}));

export const SideSheetMainContainer = forwardRef<
  HTMLDivElement,
  PropsWithChildren<{}>
>(({ children }, ref) => {
  const { sideSheetOpen } = useSideSheet();
  return (
    <SideSheetMain ref={ref} open={sideSheetOpen}>
      {children}
    </SideSheetMain>
  );
});

const SaveAreaHeader = styled(Toolbar)`
  padding-top: env(safe-area-inset-top);
  padding-left: env(safe-area-inset-left);
  align-items: flex-end;
`;

const SaveAreaContent = styled("div")`
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
`;

const SideSheet = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.up("lg"));
  const { sideSheetOpen, setSideSheetOpen } = useSideSheet();
  const { taskLists, activeTaskList, ...rest } = useTask();

  const { priorities, projects, contexts, tags } = activeTaskList
    ? activeTaskList
    : rest;

  const completedTasksCount = activeTaskList
    ? activeTaskList.items.filter((task) => task.completed).length
    : taskLists.flatMap((list) => list.items).filter((t) => t.completed).length;

  const hideFilter =
    completedTasksCount === 0 &&
    Object.keys(priorities).length === 0 &&
    Object.keys(projects).length === 0 &&
    Object.keys(contexts).length === 0 &&
    Object.keys(tags).length === 0;

  const [tab, setTab] = useState<string>(hideFilter ? "settings" : "filter");

  const handleChange = (event: any, newValue: string) => {
    setTab(newValue);
  };

  useEffect(() => {
    if (hideFilter) {
      setTab("settings");
    } else {
      setTab("filter");
    }
  }, [hideFilter]);

  return (
    <SwipeableDrawer
      data-shortcuts="m"
      data-testid="Menu"
      aria-label={sideSheetOpen ? "Open menu" : "Closed menu"}
      anchor="left"
      variant={matches ? "persistent" : undefined}
      open={sideSheetOpen}
      sx={{
        "& .MuiDrawer-paper": {
          backgroundImage: "unset",
          boxSizing: "border-box",
          ...(!matches && {
            width: drawerWidth,
          }),
        },
        ...(matches && {
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
          },
        }),
      }}
      onOpen={() => setSideSheetOpen(true)}
      onClose={() => setSideSheetOpen(false)}
    >
      <TabContext value={tab}>
        <Box sx={{ flex: "none", borderBottom: 1, borderColor: "divider" }}>
          <SaveAreaHeader>
            <Tabs value={tab} onChange={handleChange}>
              <Tab
                sx={{ display: hideFilter ? "none" : "inline-flex" }}
                label={t("Filter")}
                value="filter"
              />
              <Tab label={t("Settings")} value="settings" />
            </Tabs>
          </SaveAreaHeader>
        </Box>
        <Box sx={{ overflowY: "auto", flex: "auto" }}>
          <SaveAreaContent>
            <TabPanel value="filter">
              <Filter />
            </TabPanel>
            <TabPanel value="settings">
              <Settings />
            </TabPanel>
          </SaveAreaContent>
        </Box>
      </TabContext>
    </SwipeableDrawer>
  );
};

export default SideSheet;
