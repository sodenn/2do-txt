import { Filter } from "@/components/Filter";
import { Settings } from "@/components/Settings";
import { usePlatformStore } from "@/stores/platform-store";
import { useScrollingStore } from "@/stores/scrolling-store";
import { useSideSheetStore } from "@/stores/side-sheet-store";
import { transitions } from "@/utils/transitions";
import useMediaQuery from "@/utils/useMediaQuery";
import { useTask } from "@/utils/useTask";
import {
  Box,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  TabsProps,
  styled,
  useTheme,
} from "@mui/joy";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import { PropsWithChildren, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const drawerWidth = 320;

export const HeaderContainer = styled("div", {
  shouldForwardProp: (prop) => prop !== "open",
})<{ open: boolean }>(({ theme, open }) => ({
  [theme.breakpoints.up("lg")]: {
    transition: transitions.create(["margin", "width"], {
      easing: transitions.easing.sharp,
      duration: transitions.duration.leavingScreen,
    }),
    ...(open && {
      marginLeft: `${drawerWidth}px`,
      transition: transitions.create(["margin", "width"], {
        easing: transitions.easing.easeOut,
        duration: transitions.duration.enteringScreen,
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
    transition: transitions.create(["margin"], {
      easing: transitions.easing.sharp,
      duration: transitions.duration.leavingScreen,
    }),
    marginLeft: `-${drawerWidth}px`,
    ...(open && {
      transition: transitions.create(["margin"], {
        easing: transitions.easing.easeOut,
        duration: transitions.duration.enteringScreen,
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

const StyledTab = styled(Tab)({
  paddingBlockStart: 11,
  paddingBlockEnd: 10,
});

export function MainContainer({ children }: PropsWithChildren) {
  const ref = useRef<HTMLDivElement | null>(null);
  const sideSheetOpen = useSideSheetStore((state) => state.open);
  const setTop = useScrollingStore((state) => state.setTop);

  useEffect(() => {
    const element = ref.current;
    if (element) {
      const listener = () => {
        setTop(element.scrollTop === 0);
      };
      element.addEventListener("scroll", listener);
      return () => {
        element.removeEventListener("scroll", listener);
      };
    }
  }, [setTop]);

  return (
    <Main ref={ref} open={sideSheetOpen}>
      {children}
    </Main>
  );
}

export function SideSheet() {
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

  const handleChange: TabsProps["onChange"] = (event, newValue) => {
    setTab(newValue as string);
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
      <Tabs value={tab} onChange={handleChange} sx={{ height: "100%" }}>
        <Box sx={{ flex: "none" }}>
          <SaveAreaHeader>
            <TabList sx={{ px: 1 }}>
              {!hideFilter && (
                <StyledTab value="filter" aria-label="Filter">
                  {t("Filter")}
                </StyledTab>
              )}
              <StyledTab value="settings" aria-label="Settings">
                {t("Settings")}
              </StyledTab>
            </TabList>
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
      </Tabs>
    </SwipeableDrawer>
  );
}
