import { Filter } from "@/components/Filter";
import { SafeArea } from "@/components/SafeArea";
import { Settings } from "@/components/Settings";
import { LayoutContent } from "@/components/SideSheetLayout";
import { usePlatformStore } from "@/stores/platform-store";
import { useScrollingStore } from "@/stores/scrolling-store";
import { useSideSheetStore } from "@/stores/side-sheet-store";
import { useMediaQuery } from "@/utils/useMediaQuery";
import { useTask } from "@/utils/useTask";
import {
  Tab,
  tabClasses,
  TabList,
  TabPanel,
  Tabs,
  TabsProps,
  useTheme,
} from "@mui/joy";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import { PropsWithChildren, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const drawerWidth = 320;

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
    <LayoutContent ref={ref} open={sideSheetOpen} id="scroll-container">
      {children}
    </LayoutContent>
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
      // disableSwipeToOpen={platform === "web"}
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
        <SafeArea className="overflow-y-auto flex-auto" bottom left>
          <TabPanel value="filter">
            <Filter />
          </TabPanel>
          <TabPanel value="settings">
            <Settings />
          </TabPanel>
        </SafeArea>
      </Tabs>
    </SwipeableDrawer>
  );
}
