import { Filter } from "@/components/Filter";
import { Settings } from "@/components/Settings";
import { usePlatformStore } from "@/stores/platform-store";
import { useScrollingStore } from "@/stores/scrolling-store";
import { useSideSheetStore } from "@/stores/side-sheet-store";
import { transitions } from "@/utils/transitions";
import { useMediaQuery } from "@/utils/useMediaQuery";
import { useTask } from "@/utils/useTask";
import {
  Box,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  TabsProps,
  styled,
  tabClasses,
  useTheme,
} from "@mui/joy";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import { PropsWithChildren, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const drawerWidth = 320;

export const HeaderContainer = styled("div", {
  shouldForwardProp: (prop) => prop !== "open",
})<{ open: boolean }>(({ theme, open }) => ({
  flex: "none",
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

const SaveAreaContent = styled(Box)({
  paddingBottom: "env(safe-area-inset-bottom)",
  paddingLeft: "env(safe-area-inset-left)",
});

export function MainContainer({ children }: PropsWithChildren) {
  const ref = useRef<HTMLDivElement | null>(null);
  const sideSheetOpen = useSideSheetStore((state) => state.open);
  const setTop = useScrollingStore((state) => state.setTop);

  useEffect(() => {
    const element = ref.current;
    if (element) {
      const listener = () => {
        setTop(element.scrollTop);
      };
      element.addEventListener("scroll", listener);
      return () => {
        element.removeEventListener("scroll", listener);
      };
    }
  }, [setTop]);

  return (
    <Main ref={ref} open={sideSheetOpen} id="scroll-container">
      {children}
    </Main>
  );
}

export function SideSheet() {
  const { t } = useTranslation();
  const theme = useTheme();
  const persistent = useMediaQuery(theme.breakpoints.up("lg"));
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
      data-hotkeys-keep-enabled={persistent ? "true" : "m"}
      aria-label="Side Menu"
      anchor="left"
      variant={persistent ? "persistent" : undefined}
      open={sideSheetOpen}
      {...(persistent && {
        role: "presentation",
        "aria-hidden": sideSheetOpen ? "false" : "true",
      })}
      sx={(theme) => ({
        "& .MuiDrawer-paper": {
          backgroundImage: "unset",
          boxSizing: "border-box",
          [theme.breakpoints.down("lg")]: {
            width: drawerWidth,
          },
        },
        [theme.breakpoints.up("lg")]: {
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            borderRight: "1px solid var(--joy-palette-divider)",
          },
        },
      })}
      onOpen={openSideSheet}
      onClose={closeSideSheet}
    >
      <Tabs value={tab} onChange={handleChange} sx={{ height: "100%" }}>
        <TabList
          size="md"
          sx={{
            "--ListItem-minHeight": (theme) =>
              `calc(2.25rem + ${theme.spacing(2)})`,
            flex: "initial",
            paddingTop: "env(safe-area-inset-top)",
            paddingLeft: "env(safe-area-inset-left)",
            [`&& .${tabClasses.root}`]: {
              bgcolor: "transparent",
              "&:hover": {
                bgcolor: "transparent",
              },
              ":first-of-type": {
                ml: 1,
              },
              ":last-of-type": {
                mr: 1,
              },
              [`&.${tabClasses.selected}`]: {
                color: "primary.plainColor",
                "&::after": {
                  height: 2,
                  borderTopLeftRadius: 3,
                  borderTopRightRadius: 3,
                  bgcolor: "primary.500",
                },
              },
            },
          }}
        >
          {!hideFilter && (
            <Tab value="filter" aria-label="Filter">
              {t("Filter")}
            </Tab>
          )}
          <Tab value="settings" aria-label="Settings">
            {t("Settings")}
          </Tab>
        </TabList>
        <SaveAreaContent sx={{ overflowY: "auto", flex: "auto" }}>
          <TabPanel value="filter">
            <Filter />
          </TabPanel>
          <TabPanel value="settings">
            <Settings />
          </TabPanel>
        </SaveAreaContent>
      </Tabs>
    </SwipeableDrawer>
  );
}
