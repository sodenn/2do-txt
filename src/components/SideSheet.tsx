import { TabContext, TabPanel } from "@mui/lab";
import {
  Box,
  SwipeableDrawer,
  Tab,
  Tabs,
  Toolbar,
  styled,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { forwardRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import usePlatformStore from "../stores/platform-store";
import useSideSheetStore from "../stores/side-sheet-store";
import { WithChildren } from "../types/common.types";
import useTask from "../utils/useTask";
import Filter from "./Filter";
import Settings from "./Settings";

const drawerWidth = 320;

export const HeaderContainer = styled("div", {
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

const Main = styled("main", {
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

const SaveAreaHeader = styled("div")({
  paddingTop: "env(safe-area-inset-top)",
  paddingLeft: "env(safe-area-inset-left)",
});

const SaveAreaContent = styled("div")({
  paddingBottom: "env(safe-area-inset-bottom)",
  paddingLeft: "env(safe-area-inset-left)",
});

export const MainContainer = forwardRef<HTMLDivElement, WithChildren>(
  ({ children }, ref) => {
    const sideSheetOpen = useSideSheetStore((state) => state.open);
    return (
      <Main ref={ref} open={sideSheetOpen}>
        {children}
      </Main>
    );
  }
);

const SideSheet = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.up("lg"));
  const platform = usePlatformStore((state) => state.platform);
  const {
    open: sideSheetOpen,
    openSideSheet,
    closeSideSheet,
  } = useSideSheetStore();
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
      disableSwipeToOpen={platform === "web"}
      data-shortcut="m"
      data-shortcut-ignore={!matches}
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
      onOpen={openSideSheet}
      onClose={closeSideSheet}
    >
      <TabContext value={tab}>
        <Box sx={{ flex: "none", borderBottom: 1, borderColor: "divider" }}>
          <Toolbar sx={{ alignItems: "flex-end" }}>
            <SaveAreaHeader>
              {!hideFilter && (
                <Tabs value={tab} onChange={handleChange}>
                  <Tab label={t("Filter")} value="filter" aria-label="Filter" />
                  <Tab
                    label={t("Settings")}
                    value="settings"
                    aria-label="Settings"
                  />
                </Tabs>
              )}
              {hideFilter && (
                <Tabs value="settings">
                  <Tab
                    label={t("Settings")}
                    value="settings"
                    aria-label="Settings"
                  />
                </Tabs>
              )}
            </SaveAreaHeader>
          </Toolbar>
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
