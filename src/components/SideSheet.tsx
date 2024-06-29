import { Filter } from "@/components/Filter";
import { LayoutContent, LayoutSidebar } from "@/components/Layout";
import { SafeArea } from "@/components/SafeArea";
import { Settings } from "@/components/Settings";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useScrollingStore } from "@/stores/scrolling-store";
import { useSideSheetStore } from "@/stores/side-sheet-store";
import { useTask } from "@/utils/useTask";
import { PropsWithChildren, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

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
  const { open: sideSheetOpen, closeSideSheet } = useSideSheetStore();
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

  useEffect(() => {
    if (hideFilter) {
      setTab("settings");
    } else {
      setTab("filter");
    }
  }, [hideFilter]);

  return (
    <LayoutSidebar open={sideSheetOpen} onClose={closeSideSheet}>
      <Tabs value={tab} onValueChange={setTab} className="h-full flex flex-col">
        <div className="pt-3 px-3">
          <SafeArea top left asChild>
            <TabsList className="grid w-full grid-cols-2">
              {!hideFilter && (
                <TabsTrigger value="filter" aria-label="Filter">
                  {t("Filter")}
                </TabsTrigger>
              )}
              <TabsTrigger value="settings" aria-label="Settings">
                {t("Settings")}
              </TabsTrigger>
            </TabsList>
          </SafeArea>
        </div>
        <SafeArea asChild bottom left>
          <ScrollArea>
            <TabsContent className="px-3 pb-3" value="filter">
              <Filter />
            </TabsContent>
            <TabsContent className="px-3 pb-3" value="settings">
              <Settings />
            </TabsContent>
          </ScrollArea>
        </SafeArea>
      </Tabs>
    </LayoutSidebar>
  );
}
